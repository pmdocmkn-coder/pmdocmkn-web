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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

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
  const [noJobErp, setNoJobErp] = useState("");
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
      noJobErp: noJobErp.trim() || undefined,
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
    <div className="flex flex-col max-h-[94vh]">
      {/* Step indicator - mobile optimized */}
      <div className="flex gap-1 overflow-x-auto pb-2 no-scrollbar shrink-0">
        {STEPS.map((label, i) => (
          <span
            key={label}
            className={`text-[10px] sm:text-xs px-2 py-1 rounded-full whitespace-nowrap shrink-0 ${
              i === step ? "bg-violet-600 text-white font-medium" : i < step ? "bg-violet-100 text-violet-700" : "bg-gray-100 text-gray-400"
            }`}
          >
            {i + 1}. {label}
          </span>
        ))}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto space-y-3 py-3 -mx-4 px-4 sm:-mx-6 sm:px-6 custom-scrollbar">
        {step === 0 && (
          <div className="space-y-3">
            <p className="text-sm text-gray-700 leading-relaxed">
              Pilih jenis tag fisik untuk serah terima ke teknisi/workshop.
            </p>
            
            {/* Tag selection cards - mobile optimized */}
            <div className="space-y-3">
              {/* Yellow Tag */}
              <button
                type="button"
                onClick={() => setTagType("Damaged")}
                className={`relative w-full p-4 rounded-xl border-2 text-left transition-colors ${
                  tagType === "Damaged" 
                    ? "border-amber-500 bg-amber-50" 
                    : "border-gray-200 bg-white hover:border-amber-300 hover:bg-amber-50/30"
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Icon/Indicator */}
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                    tagType === "Damaged" ? "bg-amber-400" : "bg-gray-200"
                  }`}>
                    <div className="w-6 h-6 rounded-full border-2 border-gray-900" />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0 pr-8">
                    <p className="font-bold text-base text-amber-900 mb-1">Tag kuning</p>
                    <p className="text-xs text-amber-800 leading-relaxed">
                      PERALATAN RUSAK — radio masuk perbaikan
                    </p>
                  </div>
                  
                  {/* Checkmark */}
                  <div className="flex items-center self-center shrink-0 w-6 h-6">
                    {tagType === "Damaged" ? (
                      <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center shadow-sm">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full border-2 border-gray-200" />
                    )}
                  </div>
                </div>
              </button>

              {/* Green Tag */}
              <button
                type="button"
                onClick={() => setTagType("Good")}
                className={`relative w-full p-4 rounded-xl border-2 text-left transition-colors ${
                  tagType === "Good" 
                    ? "border-emerald-500 bg-emerald-50" 
                    : "border-gray-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/30"
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Icon/Indicator */}
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                    tagType === "Good" ? "bg-emerald-400" : "bg-gray-200"
                  }`}>
                    <div className="w-6 h-6 rounded-full border-2 border-gray-900" />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0 pr-8">
                    <p className="font-bold text-base text-emerald-900 mb-1">Tag hijau</p>
                    <p className="text-xs text-emerald-800 leading-relaxed">
                      PERALATAN BAIK — kondisi baik / inspeksi
                    </p>
                  </div>
                  
                  {/* Checkmark */}
                  <div className="flex items-center self-center shrink-0 w-6 h-6">
                    {tagType === "Good" ? (
                      <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shadow-sm">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full border-2 border-gray-200" />
                    )}
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

        {step === 1 && (
          <HandoverRadioEntryStep
            ticket={ticket}
            onTicketChange={setTicket}
            noJobErp={noJobErp}
            onNoJobErpChange={setNoJobErp}
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
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900">Keterangan kerusakan *</label>
                <textarea
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors"
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
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-600">
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
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Teknisi penerima *</label>
              <Select value={techId} onValueChange={setTechId}>
                <SelectTrigger className="w-full h-11 border-gray-300 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 bg-white">
                  <SelectValue placeholder="Pilih teknisi" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {technicians.map((t) => (
                    <SelectItem key={t.userId} value={t.userId.toString()}>
                      <span className="font-medium">{t.fullName}</span>{" "}
                      <span className="text-xs text-gray-500">(@{t.username})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            <SignaturePadField ref={sigHdRef} label="TTD Penyerah" required value={sigHandover} onChange={setSigHandover} />
            <SignaturePadField ref={sigTekRef} label="TTD Penerima (opsional)" value={sigReceiver} onChange={setSigReceiver} />
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors"
              placeholder="Catatan opsional"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </>
        )}
      </div>

      {/* Footer buttons - Outside scrollable area */}
      <div className="flex justify-between gap-2 pt-4 border-t bg-white shrink-0 -mx-4 px-4 sm:-mx-6 sm:px-6 pb-4 sm:pb-0">
        <button 
          type="button" 
          className="px-4 py-2.5 border rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors min-w-[90px]" 
          onClick={step === 0 ? onCancel : () => setStep((s) => s - 1)}
        >
          {step === 0 ? "Batal" : (
            <span className="flex items-center justify-center gap-1">
              <ChevronLeft className="w-4 h-4" /> Kembali
            </span>
          )}
        </button>
        {step < STEPS.length - 1 ? (
          <button 
            type="button" 
            className="px-4 py-2.5 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 transition-colors flex items-center gap-1 min-w-[90px] justify-center" 
            onClick={next}
          >
            Lanjut <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            disabled={submitting}
            className="px-4 py-2.5 bg-violet-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-violet-700 transition-colors min-w-[140px]"
            onClick={submit}
          >
            {submitting ? "Menyimpan..." : "Simpan serah terima"}
          </button>
        )}
      </div>
    </div>
  );
}
