import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import SignaturePadField, { type SignaturePadHandle } from "../common/SignaturePadField";
import { radioHandoverApi } from "../../services/radioHandoverApi";
import type { HandoverAccessoryItem, UserOption } from "../../types/radioHandover";
import type { EquipmentTagType, GreenTagFields } from "../../types/equipmentTag";
import { EMPTY_GREEN_TAG } from "../../types/equipmentTag";
import { useToast } from "../../hooks/use-toast";
import { isValidSignature } from "../../utils/signatureUtils";
import { buildAccessoriesPayload } from "../../utils/handoverFormUtils";
import { type RadioSerialLine } from "./MultiRadioSerialList";
import { mergeLineWithDefaults, type SharedRadioDefaults } from "./SharedRadioDefaultsFields";
import HandoverRadioEntryStep, { type EntryMode } from "./HandoverRadioEntryStep";
import GreenTagFieldsForm from "./GreenTagFieldsForm";
import HandoverAccessoryList from "./HandoverAccessoryList";
import MultiPhotoUpload from "./MultiPhotoUpload";
import HandoverWizardTagCarousel from "./HandoverWizardTagCarousel";
import { defaultOriginFrom, mergedLines } from "../../utils/handoverLineTagUtils";

type Props = {
  onSuccess: () => void;
  onCancel: () => void;
};

const STEPS = ["Jenis tag", "Tiket & radio", "Detail tag", "TTD & simpan"] as const;

const initialLine = (): RadioSerialLine => ({
  id: `${Date.now()}-init`,
  serial: "",
  radioId: null,
  lookup: null,
  equipmentName: "",
  unitNumber: "",
  radioOwnerLabel: "",
  ownerDivision: "",
  ownerDepartment: "",
});

const emptyDefaults = (): SharedRadioDefaults => ({
  equipmentName: "",
  radioOwnerLabel: "",
  ownerDivision: "",
  ownerDepartment: "",
  unitNumber: "",
});

export default function HelpdeskToTechnicianWizard({ onSuccess, onCancel }: Props) {
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [tagType, setTagType] = useState<EquipmentTagType>("Damaged");
  const [technicians, setTechnicians] = useState<UserOption[]>([]);
  const [ticket, setTicket] = useState("");
  const [sharedDefaults, setSharedDefaults] = useState<SharedRadioDefaults>(emptyDefaults());
  const [entryMode, setEntryMode] = useState<EntryMode>("single");
  const [radioLines, setRadioLines] = useState<RadioSerialLine[]>([initialLine()]);
  const [damage, setDamage] = useState("");
  const [greenFields, setGreenFields] = useState<GreenTagFields>({ ...EMPTY_GREEN_TAG });
  const [techId, setTechId] = useState("");
  const [accessories, setAccessories] = useState<HandoverAccessoryItem[]>([]);
  const [remarks, setRemarks] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [photosByLineId, setPhotosByLineId] = useState<Record<string, string[]>>({});
  const [useSharedPhotos, setUseSharedPhotos] = useState(true);
  const [sigHandover, setSigHandover] = useState<string | null>(null);
  const [sigReceiver, setSigReceiver] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const sigHdRef = useRef<SignaturePadHandle>(null);
  const sigTekRef = useRef<SignaturePadHandle>(null);

  useEffect(() => {
    radioHandoverApi.getTechnicians().then(setTechnicians).catch(() => setTechnicians([]));
  }, []);

  useEffect(() => {
    if (step !== 2 || tagType !== "Good") return;
    const origin = defaultOriginFrom(radioLines, sharedDefaults);
    if (!origin) return;
    setGreenFields((g) => ({
      ...g,
      originFrom: g.originFrom?.trim() ? g.originFrom : origin,
    }));
  }, [step, tagType, radioLines, sharedDefaults]);

  const validateStep = (s: number): string[] => {
    const missing: string[] = [];
    if (s === 1) {
      if (!ticket.trim()) missing.push("No tiket helpdesk");
      const filled = radioLines.filter((r) => r.serial.trim());
      if (filled.length === 0) missing.push("Minimal satu SN");
    }
    if (s === 2) {
      if (tagType === "Damaged" && !damage.trim()) missing.push("Keterangan kerusakan");
    }
    if (s === 3) {
      if (!techId) missing.push("Teknisi penerima");
      const lines = mergedLines(radioLines, sharedDefaults);
      if (lines.length <= 1) {
        if (photos.length === 0) missing.push("Foto radio");
      } else if (useSharedPhotos) {
        if (photos.length === 0) missing.push("Foto radio (bersama)");
      } else {
        for (const line of lines) {
          if ((photosByLineId[line.id] ?? []).length === 0) {
            missing.push(`Foto SN ${line.serial}`);
          }
        }
      }
    }
    return missing;
  };

  const next = () => {
    const missing = validateStep(step);
    if (missing.length) {
      toast({ title: "Lengkapi dulu", description: missing.join(" • "), variant: "destructive" });
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const submit = async () => {
    const missing = [...validateStep(1), ...validateStep(2), ...validateStep(3)];
    const hdSig = (await sigHdRef.current?.exportNow()) ?? sigHandover;
    const tekSig = (await sigTekRef.current?.exportNow()) ?? sigReceiver;
    if (!isValidSignature(hdSig)) missing.push("TTD Helpdesk");

    let lines = radioLines.map((r) => mergeLineWithDefaults(r, sharedDefaults)).filter((r) => r.serial.trim());
    for (const r of lines) {
      if (!r.radioId && !r.equipmentName.trim() && !sharedDefaults.equipmentName.trim()) {
        missing.push(`Tipe alat untuk SN ${r.serial}`);
      }
    }

    if (missing.length) {
      toast({ title: "Belum lengkap", description: missing.join(" • "), variant: "destructive" });
      return;
    }

    const { accessories: acc, batterySerialNumber } = buildAccessoriesPayload(accessories);
    const receiverOk = isValidSignature(tekSig);
    const base = {
      handoverType: "HelpdeskToTechnician" as const,
      helpdeskTicketNumber: ticket.trim(),
      equipmentTagType: tagType,
      batterySerialNumber,
      damageDescription: tagType === "Damaged" ? damage.trim() : damage.trim() || undefined,
      originFrom: greenFields.originFrom?.trim() || sharedDefaults.radioOwnerLabel || undefined,
      repairDataDescription: greenFields.repairDataDescription?.trim() || undefined,
      repairedByName: greenFields.repairedByName?.trim() || undefined,
      frequencyError: greenFields.frequencyError?.trim() || undefined,
      afReading: greenFields.afReading?.trim() || undefined,
      powerReading: greenFields.powerReading?.trim() || undefined,
      voltageOutNoLoad: greenFields.voltageOutNoLoad?.trim() || undefined,
      voltageOutWithLoad: greenFields.voltageOutWithLoad?.trim() || undefined,
      physicalCondition: greenFields.physicalCondition?.trim() || undefined,
      displayCondition: greenFields.displayCondition?.trim() || undefined,
      receivedByUserId: Number(techId),
      radioPhotos: photos,
      handedOverSignatureBase64: hdSig!,
      receiverSignatureBase64: receiverOk ? tekSig! : undefined,
      accessories: acc,
      remarks: remarks.trim() || undefined,
    };

    setSubmitting(true);
    const failed: { sn: string; message: string }[] = [];
    let ok = 0;
    try {
      const multi = lines.length > 1;
      for (const line of lines) {
        const linePhotos =
          multi && !useSharedPhotos ? (photosByLineId[line.id] ?? []) : photos;
        try {
          await radioHandoverApi.create({
            ...base,
            radioId: line.radioId,
            radioSerialNumber: line.serial.trim(),
            equipmentName: line.equipmentName.trim() || line.lookup?.type?.trim() || sharedDefaults.equipmentName || undefined,
            unitNumber: line.unitNumber.trim() || sharedDefaults.unitNumber || undefined,
            radioOwnerLabel: line.radioOwnerLabel.trim() || sharedDefaults.radioOwnerLabel || undefined,
            ownerDivision: line.ownerDivision.trim() || sharedDefaults.ownerDivision || undefined,
            ownerDepartment: line.ownerDepartment.trim() || sharedDefaults.ownerDepartment || undefined,
            radioPhotos: linePhotos,
          });
          ok += 1;
        } catch (err: unknown) {
          const ax = err as { response?: { data?: { message?: string } } };
          failed.push({
            sn: line.serial,
            message: ax.response?.data?.message ?? (err instanceof Error ? err.message : "Gagal"),
          });
        }
      }
      if (ok === 0) {
        toast({
          title: "Gagal",
          description: failed.map((f) => `${f.sn}: ${f.message}`).join(" • "),
          variant: "destructive",
        });
        return;
      }
      toast({
        title: ok > 1 ? `${ok} radio tersimpan` : "Serah terima tersimpan",
        description:
          failed.length > 0
            ? failed.map((f) => f.sn).join(", ") + " gagal"
            : `Tag ${tagType === "Good" ? "hijau" : "kuning"} · tiket ${ticket.trim()}`,
      });
      onSuccess();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 max-h-[75vh] flex flex-col">
      <div className="flex gap-1 flex-wrap">
        {STEPS.map((label, i) => (
          <span
            key={label}
            className={`text-xs px-2 py-1 rounded-full ${
              i === step ? "bg-violet-600 text-white" : i < step ? "bg-violet-100 text-violet-700" : "bg-gray-100 text-gray-400"
            }`}
          >
            {i + 1}. {label}
          </span>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto pr-1 space-y-4 min-h-0">
        {step === 0 && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">Pilih jenis tag fisik untuk serah terima ke teknisi/workshop.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTagType("Damaged")}
                className={`p-4 rounded-xl border-2 text-left transition-colors ${
                  tagType === "Damaged" ? "border-amber-500 bg-amber-50" : "border-gray-200 hover:border-amber-300"
                }`}
              >
                <p className="font-bold text-amber-900">Tag kuning</p>
                <p className="text-xs text-amber-800 mt-1">PERALATAN RUSAK — radio masuk perbaikan</p>
              </button>
              <button
                type="button"
                onClick={() => setTagType("Good")}
                className={`p-4 rounded-xl border-2 text-left transition-colors ${
                  tagType === "Good" ? "border-emerald-500 bg-emerald-50" : "border-gray-200 hover:border-emerald-300"
                }`}
              >
                <p className="font-bold text-emerald-900">Tag hijau</p>
                <p className="text-xs text-emerald-800 mt-1">PERALATAN BAIK — kondisi baik / inspeksi</p>
              </button>
            </div>
          </div>
        )}

        {step === 1 && (
          <HandoverRadioEntryStep
            ticket={ticket}
            onTicketChange={setTicket}
            entryMode={entryMode}
            onEntryModeChange={setEntryMode}
            radioLines={radioLines}
            onRadioLinesChange={setRadioLines}
            sharedDefaults={sharedDefaults}
            onSharedDefaultsChange={setSharedDefaults}
          />
        )}

        {step === 2 && (
          <>
            {tagType === "Damaged" && (
              <div>
                <label className="text-sm font-medium">Keterangan kerusakan *</label>
                <textarea
                  className="w-full border rounded-lg px-3 py-2 mt-1"
                  rows={3}
                  value={damage}
                  onChange={(e) => setDamage(e.target.value)}
                  placeholder="Contoh: tidak ada suara, LCD mati, …"
                />
              </div>
            )}
            {tagType === "Good" && (
              <GreenTagFieldsForm
                value={greenFields}
                onChange={setGreenFields}
                originPrefilled={defaultOriginFrom(radioLines, sharedDefaults)}
              />
            )}
            <div>
              <p className="text-xs font-medium text-gray-600 mb-2">
                Pratinjau tag {mergedLines(radioLines, sharedDefaults).length > 1 ? "(per SN)" : ""}
              </p>
              <HandoverWizardTagCarousel
                tagType={tagType}
                radioLines={radioLines}
                sharedDefaults={sharedDefaults}
                ticket={ticket}
                damage={damage}
                greenFields={greenFields}
                accessories={accessories}
              />
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div>
              <label className="text-sm font-medium">Teknisi penerima *</label>
              <select className="w-full border rounded-lg px-3 py-2 mt-1" value={techId} onChange={(e) => setTechId(e.target.value)}>
                <option value="">Pilih teknisi</option>
                {technicians.map((t) => (
                  <option key={t.userId} value={t.userId}>
                    {t.fullName} ({t.username})
                  </option>
                ))}
              </select>
            </div>
            {mergedLines(radioLines, sharedDefaults).length > 1 ? (
              <div className="space-y-3 rounded-xl border border-violet-100 bg-violet-50/30 p-3">
                <p className="text-sm font-medium text-violet-900">Foto radio (beberapa SN)</p>
                <label className="flex items-start gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={useSharedPhotos}
                    onChange={(e) => setUseSharedPhotos(e.target.checked)}
                  />
                  <span>
                    <span className="font-medium">Satu set foto untuk semua SN</span>
                    <span className="block text-xs text-gray-600 mt-0.5">
                      Foto yang sama dilampirkan ke setiap radio dalam tiket ini.
                    </span>
                  </span>
                </label>
                {useSharedPhotos ? (
                  <MultiPhotoUpload
                    photos={photos}
                    onChange={setPhotos}
                    label="Foto bersama (semua SN)"
                    required
                  />
                ) : (
                  <div className="space-y-4">
                    {mergedLines(radioLines, sharedDefaults).map((line) => (
                      <MultiPhotoUpload
                        key={line.id}
                        photos={photosByLineId[line.id] ?? []}
                        onChange={(p) =>
                          setPhotosByLineId((prev) => ({ ...prev, [line.id]: p }))
                        }
                        label={`Foto — SN ${line.serial}`}
                        required
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <MultiPhotoUpload photos={photos} onChange={setPhotos} required />
            )}
            <HandoverAccessoryList items={accessories} onChange={setAccessories} />
            <SignaturePadField ref={sigHdRef} label="TTD Helpdesk" required value={sigHandover} onChange={setSigHandover} />
            <SignaturePadField ref={sigTekRef} label="TTD Teknisi (opsional)" value={sigReceiver} onChange={setSigReceiver} />
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm"
              placeholder="Catatan opsional"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </>
        )}
      </div>

      <div className="flex justify-between gap-2 pt-2 border-t shrink-0">
        <button type="button" className="px-4 py-2 border rounded-lg text-sm" onClick={step === 0 ? onCancel : () => setStep((s) => s - 1)}>
          {step === 0 ? "Batal" : (
            <span className="flex items-center gap-1">
              <ChevronLeft className="w-4 h-4" /> Kembali
            </span>
          )}
        </button>
        {step < STEPS.length - 1 ? (
          <button type="button" className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm flex items-center gap-1" onClick={next}>
            Lanjut <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            disabled={submitting}
            className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm disabled:opacity-50"
            onClick={submit}
          >
            {submitting ? "Menyimpan..." : "Simpan serah terima"}
          </button>
        )}
      </div>
    </div>
  );
}
