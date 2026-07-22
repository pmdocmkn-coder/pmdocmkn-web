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
import { workshopTechnicianApi, WorkshopTechnicianDto } from "../../services/workshopTechnicianApi";

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
  const [damageByLineId, setDamageByLineId] = useState<Record<string, string>>({});
  const [useSharedDamage, setUseSharedDamage] = useState(true);
  const [greenFields, setGreenFields] = useState<GreenTagFields>({ ...EMPTY_GREEN_TAG });
  const [techId, setTechId] = useState("");
  const [workshopTechId, setWorkshopTechId] = useState("");
  const [workshopTechnicians, setWorkshopTechnicians] = useState<WorkshopTechnicianDto[]>([]);
  const [accessories, setAccessories] = useState<HandoverAccessoryItem[]>([]);
  const [accessoriesByLineId, setAccessoriesByLineId] = useState<Record<string, HandoverAccessoryItem[]>>({});
  const [useSharedAccessories, setUseSharedAccessories] = useState(true);
  const [remarks, setRemarks] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [photosByLineId, setPhotosByLineId] = useState<Record<string, string[]>>({});
  const [useSharedPhotos, setUseSharedPhotos] = useState(true);
  const [sigHandover, setSigHandover] = useState<string | null>(null);
  const [sigReceiver, setSigReceiver] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const sigHdRef = useRef<SignaturePadHandle>(null);
  const sigTekRef = useRef<SignaturePadHandle>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Reset the wizard's own scrollable area
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    // Walk up ALL ancestors and reset their scroll — guarantees the
    // dialog wrapper (which holds the title + step indicators) also
    // scrolls back to the very top.
    requestAnimationFrame(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = 0;
      let el: HTMLElement | null = scrollRef.current?.parentElement ?? null;
      while (el) {
        el.scrollTop = 0;
        el = el.parentElement;
      }
    });
  }, [step]);

  useEffect(() => {
    radioHandoverApi.getTechnicians().then(setTechnicians).catch(() => setTechnicians([]));
    workshopTechnicianApi.getAllActive("Teknisi WKS").then(res => setWorkshopTechnicians(res.data.data)).catch(() => setWorkshopTechnicians([]));
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
      if (!ticket.trim()) missing.push("No. Job ERP");
      const filled = radioLines.filter((r) => r.serial.trim());
      if (filled.length === 0) missing.push("Minimal satu SN");
    }
    if (s === 2) {
      if (tagType === "Damaged") {
        const lines = mergedLines(radioLines, sharedDefaults);
        if (lines.length <= 1 || useSharedDamage) {
          if (!damage.trim()) missing.push("Keterangan kerusakan (bersama)");
        } else {
          for (const line of lines) {
            if (!(damageByLineId[line.id] ?? "").trim()) {
              missing.push(`Kerusakan SN ${line.serial}`);
            }
          }
        }
      }
    }
    if (s === 3) {
      if (!techId) missing.push("Akun sistem penerima");
      if (!workshopTechId) missing.push("Teknisi workshop");
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

    const receiverOk = isValidSignature(tekSig);
    const base = {
      handoverType: "HelpdeskToTechnician" as const,
      helpdeskTicketNumber: ticket.trim(),
      noJobErp: noJobErp.trim() || undefined,
      equipmentTagType: tagType,
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
      workshopTechnicianId: Number(workshopTechId),
      radioPhotos: photos,
      handedOverSignatureBase64: hdSig!,
      receiverSignatureBase64: receiverOk ? tekSig! : undefined,
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
        const lineAccessories =
          multi && !useSharedAccessories ? (accessoriesByLineId[line.id] ?? []) : accessories;
        const { accessories: acc, batterySerialNumber } = buildAccessoriesPayload(lineAccessories);

        const lineDamage = multi && !useSharedDamage ? (damageByLineId[line.id] ?? "") : damage;

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
            damageDescription: tagType === "Damaged" ? lineDamage.trim() : lineDamage.trim() || undefined,
            radioPhotos: linePhotos,
            accessories: acc,
            batterySerialNumber,
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
      <div className="flex gap-2 overflow-x-auto pb-3 no-scrollbar shrink-0 px-1">
        {STEPS.map((label, i) => (
          <span
            key={label}
            className={`text-[11px] sm:text-xs px-3 py-1.5 rounded-full whitespace-nowrap shrink-0 transition-colors flex items-center gap-1.5 border ${i === step
                ? "bg-[#1B3A6B] text-white font-semibold border-[#1B3A6B]"
                : i < step
                  ? "bg-[#EBF4FF] text-[#2B6CB0] font-medium border-[#2B6CB0]/20"
                  : "bg-white text-[#718096] border-[#E2E8F0]"
              }`}
          >
            <span className={`flex items-center justify-center w-4 h-4 rounded-full text-[9px] ${i === step ? "bg-white text-[#1B3A6B]" : i < step ? "bg-[#2B6CB0] text-white" : "bg-[#F7F8FA] text-[#718096]"
              }`}>
              {i + 1}
            </span>
            {label}
          </span>
        ))}
      </div>

      {/* Scrollable Content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 py-3 -mx-4 px-4 sm:-mx-6 sm:px-6 custom-scrollbar">
        <div ref={topRef} />
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
                className={`relative w-full p-4 rounded-xl border-2 text-left transition-colors ${tagType === "Damaged"
                    ? "border-amber-500 bg-amber-50"
                    : "border-gray-200 bg-white hover:border-amber-300 hover:bg-amber-50/30"
                  }`}
              >
                <div className="flex items-start gap-3">
                  {/* Icon/Indicator */}
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${tagType === "Damaged" ? "bg-amber-400" : "bg-gray-200"
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
                className={`relative w-full p-4 rounded-xl border-2 text-left transition-colors ${tagType === "Good"
                    ? "border-emerald-500 bg-emerald-50"
                    : "border-gray-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/30"
                  }`}
              >
                <div className="flex items-start gap-3">
                  {/* Icon/Indicator */}
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${tagType === "Good" ? "bg-emerald-400" : "bg-gray-200"
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
          <div className="space-y-6">
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
          </div>
        )}

        {step === 2 && (
          <>
            {tagType === "Damaged" && (
              <div className="space-y-2">
                {mergedLines(radioLines, sharedDefaults).length > 1 ? (
                  <div className="space-y-3 rounded-[10px] border border-[#2B6CB0]/20 bg-[#EBF4FF]/40 p-4">
                    <p className="text-sm font-semibold text-[#1B3A6B]">Keterangan kerusakan (beberapa SN)</p>
                    <label className="flex items-start gap-3 text-sm cursor-pointer p-2 hover:bg-white/50 rounded-lg transition-colors">
                      <input
                        type="checkbox"
                        className="mt-1 w-4 h-4 text-[#2B6CB0] border-[#E2E8F0] rounded focus:ring-[#2B6CB0]"
                        checked={useSharedDamage}
                        onChange={(e) => setUseSharedDamage(e.target.checked)}
                      />
                      <span>
                        <span className="font-semibold text-gray-900">Satu keterangan untuk semua SN</span>
                        <span className="block text-xs text-[#718096] mt-1 leading-relaxed">
                          Keterangan kerusakan yang sama akan berlaku untuk setiap radio dalam tiket ini.
                        </span>
                      </span>
                    </label>
                    {useSharedDamage ? (
                      <textarea
                        className="w-full border border-[#E2E8F0] rounded-[10px] px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#2B6CB0] focus:border-[#2B6CB0] transition-colors"
                        rows={3}
                        value={damage}
                        onChange={(e) => setDamage(e.target.value)}
                        placeholder="Contoh: tidak ada suara, LCD mati, …"
                      />
                    ) : (
                      <div className="space-y-4">
                        {mergedLines(radioLines, sharedDefaults).map((line) => (
                          <div key={line.id}>
                            <label className="text-sm font-medium text-gray-900 mb-1 block">Kerusakan — SN {line.serial} *</label>
                            <textarea
                              className="w-full border border-[#E2E8F0] rounded-[10px] px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#2B6CB0] focus:border-[#2B6CB0] transition-colors"
                              rows={2}
                              value={damageByLineId[line.id] ?? ""}
                              onChange={(e) => setDamageByLineId((prev) => ({ ...prev, [line.id]: e.target.value }))}
                              placeholder="Contoh: tidak ada suara, LCD mati, …"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <label className="text-sm font-medium text-gray-900">Keterangan kerusakan *</label>
                    <textarea
                      className="w-full border border-[#E2E8F0] rounded-[10px] px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#2B6CB0] focus:border-[#2B6CB0] transition-colors"
                      rows={3}
                      value={damage}
                      onChange={(e) => setDamage(e.target.value)}
                      placeholder="Contoh: tidak ada suara, LCD mati, …"
                    />
                  </>
                )}
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
                damageByLineId={damageByLineId}
                useSharedDamage={useSharedDamage}
                accessoriesByLineId={accessoriesByLineId}
                useSharedAccessories={useSharedAccessories}
              />
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Akun Sistem Penerima *</label>
              <Select value={techId} onValueChange={setTechId}>
                <SelectTrigger className="w-full h-11 border-[#E2E8F0] rounded-[10px] focus:ring-2 focus:ring-[#2B6CB0] focus:border-[#2B6CB0] bg-white">
                  <SelectValue placeholder="Pilih akun sistem" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {technicians.map((t) => (
                    <SelectItem key={t.userId} value={t.userId.toString()}>
                      <span className="font-medium">{t.fullName}</span>{" "}
                      <span className="text-xs text-[#718096]">(@{t.username})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Teknisi Penerima *</label>
              <Select value={workshopTechId} onValueChange={setWorkshopTechId}>
                <SelectTrigger className="w-full h-11 border-[#E2E8F0] rounded-[10px] focus:ring-2 focus:ring-[#2B6CB0] focus:border-[#2B6CB0] bg-white">
                  <SelectValue placeholder="Pilih teknisi fisik" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {workshopTechnicians.map((t) => (
                    <SelectItem key={t.id} value={t.id.toString()}>
                      <span className="font-medium">{t.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {mergedLines(radioLines, sharedDefaults).length > 1 ? (
              <div className="space-y-3 rounded-[10px] border border-[#2B6CB0]/20 bg-[#EBF4FF]/40 p-4">
                <p className="text-sm font-semibold text-[#1B3A6B]">Foto radio (beberapa SN)</p>
                <label className="flex items-start gap-3 text-sm cursor-pointer p-2 hover:bg-white/50 rounded-lg transition-colors">
                  <input
                    type="checkbox"
                    className="mt-1 w-4 h-4 text-[#2B6CB0] border-[#E2E8F0] rounded focus:ring-[#2B6CB0]"
                    checked={useSharedPhotos}
                    onChange={(e) => setUseSharedPhotos(e.target.checked)}
                  />
                  <span>
                    <span className="font-semibold text-gray-900">Satu set foto untuk semua SN</span>
                    <span className="block text-xs text-[#718096] mt-1 leading-relaxed">
                      Foto yang sama akan dilampirkan ke setiap radio dalam tiket ini.
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

            {mergedLines(radioLines, sharedDefaults).length > 1 ? (
              <div className="space-y-3 rounded-[10px] border border-[#2B6CB0]/20 bg-[#EBF4FF]/40 p-4">
                <p className="text-sm font-semibold text-[#1B3A6B]">Aksesoris radio (beberapa SN)</p>
                <label className="flex items-start gap-3 text-sm cursor-pointer p-2 hover:bg-white/50 rounded-lg transition-colors">
                  <input
                    type="checkbox"
                    className="mt-1 w-4 h-4 text-[#2B6CB0] border-[#E2E8F0] rounded focus:ring-[#2B6CB0]"
                    checked={useSharedAccessories}
                    onChange={(e) => setUseSharedAccessories(e.target.checked)}
                  />
                  <span>
                    <span className="font-semibold text-gray-900">Satu set aksesoris untuk semua SN</span>
                    <span className="block text-xs text-[#718096] mt-1 leading-relaxed">
                      Aksesoris yang sama akan dilampirkan ke setiap radio dalam tiket ini.
                    </span>
                  </span>
                </label>
                {useSharedAccessories ? (
                  <HandoverAccessoryList items={accessories} onChange={setAccessories} />
                ) : (
                  <div className="space-y-4">
                    {mergedLines(radioLines, sharedDefaults).map((line) => (
                      <div key={line.id} className="pt-2">
                        <p className="text-sm font-medium text-gray-900 mb-2">Aksesoris — SN {line.serial}</p>
                        <HandoverAccessoryList
                          items={accessoriesByLineId[line.id] ?? []}
                          onChange={(a) => setAccessoriesByLineId((prev) => ({ ...prev, [line.id]: a }))}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <HandoverAccessoryList items={accessories} onChange={setAccessories} />
            )}

            <SignaturePadField ref={sigHdRef} label="TTD Penyerah" required value={sigHandover} onChange={setSigHandover} />
            <SignaturePadField ref={sigTekRef} label="TTD Penerima (opsional)" value={sigReceiver} onChange={setSigReceiver} />
            <input
              className="w-full border border-[#E2E8F0] rounded-[10px] px-4 py-3 text-sm focus:ring-2 focus:ring-[#2B6CB0] focus:border-[#2B6CB0] transition-colors"
              placeholder="Catatan opsional (Remarks)..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </>
        )}
      </div>

      {/* Footer buttons - Outside scrollable area */}
      <div className="flex justify-between gap-3 pt-4 border-t border-[#E2E8F0] bg-white shrink-0 -mx-4 px-4 sm:-mx-6 sm:px-6 pb-4 sm:pb-0">
        <button
          type="button"
          className="px-4 py-2.5 border border-[#E2E8F0] rounded-[10px] text-[#718096] text-sm font-semibold hover:bg-[#F7F8FA] hover:text-[#1A202C] transition-colors min-w-[100px]"
          onClick={step === 0 ? onCancel : () => setStep((s) => s - 1)}
        >
          {step === 0 ? "Batal" : (
            <span className="flex items-center justify-center gap-1.5">
              <ChevronLeft className="w-4 h-4" /> Kembali
            </span>
          )}
        </button>
        {step < STEPS.length - 1 ? (
          <button
            type="button"
            className="px-5 py-2.5 bg-[#1B3A6B] text-white rounded-[10px] text-sm font-semibold hover:bg-[#2B6CB0] transition-colors flex items-center gap-1.5 min-w-[100px] justify-center shadow-sm"
            onClick={next}
          >
            Lanjut <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            disabled={submitting}
            className="px-6 py-2.5 bg-[#D94F2B] text-white rounded-[10px] text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#B83D20] shadow-sm shadow-[#D94F2B]/20 transition-all min-w-[160px]"
            onClick={submit}
          >
            {submitting ? "Menyimpan..." : "Simpan serah terima"}
          </button>
        )}
      </div>
    </div>
  );
}
