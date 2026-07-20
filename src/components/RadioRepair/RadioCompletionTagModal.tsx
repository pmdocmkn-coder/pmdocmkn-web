import { useEffect, useState } from "react";
import { ResponsiveModal } from "../common/ResponsiveModal";
import { Button } from "../ui/button";
import type { RadioRepairJobDetail, RadioRepairJobList } from "../../types/radioRepair";
import type { GreenTagFields } from "../../types/equipmentTag";
import GreenTagFieldsForm from "../RadioHandover/GreenTagFieldsForm";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: RadioRepairJobDetail | RadioRepairJobList | null;
  saving: boolean;
  onSave: (tagType: "Good" | "Damaged", payload: any) => void;
};

export default function RadioCompletionTagModal({
  open,
  onOpenChange,
  job,
  saving,
  onSave,
}: Props) {
  const [tagTypeInput, setTagTypeInput] = useState<"Good" | "Damaged" | null>(null);
  const [damageInput, setDamageInput] = useState("");
  const [greenTagInput, setGreenTagInput] = useState<GreenTagFields>({
    originFrom: "",
  });

  useEffect(() => {
    if (open && job) {
      setTagTypeInput(job.equipmentTagType === "Good" ? "Good" : (job.equipmentTagType === "Damaged" ? "Damaged" : null));
      setDamageInput(job.damageDescription ?? "");
      setGreenTagInput({
        originFrom: job.originFrom || [job.radioOwnerLabel, ("ownerDivision" in job ? job.ownerDivision : null)].filter(Boolean).join(" - ") || "",
        repairDataDescription: job.repairDataDescription ?? undefined,
        repairedByName: job.repairedByName || job.workshopTechnicianName || job.assignedTechnicianName || undefined,
        frequencyError: job.frequencyError ?? undefined,
        afReading: job.afReading ?? undefined,
        powerReading: job.powerReading ?? undefined,
        voltageOutNoLoad: job.voltageOutNoLoad ?? undefined,
        voltageOutWithLoad: job.voltageOutWithLoad ?? undefined,
        physicalCondition: job.physicalCondition ?? undefined,
        displayCondition: job.displayCondition ?? undefined,
      });
    }
  }, [open, job]);

  if (!job) return null;

  const handleSave = () => {
    if (!tagTypeInput) return;
    
    const payload: any = {
      equipmentTagType: tagTypeInput,
      damageDescription: damageInput,
    };
    
    if (tagTypeInput === "Good") {
      Object.assign(payload, greenTagInput);
    }
    
    onSave(tagTypeInput, payload);
  };

  return (
    <ResponsiveModal 
      open={open} 
      onOpenChange={onOpenChange}
      desktopClassName="max-w-2xl max-h-[90vh] overflow-y-auto"
      bottomSheetSize="xl"
      title="Pilih Tag Radio & Kelengkapan Data"
    >
        
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Silakan pilih tag untuk radio ini dan lengkapi data perbaikan sebelum menyelesaikan pekerjaan:
          </p>

          <div className="flex gap-4 p-3 bg-white rounded-lg border">
            <label className="flex items-center gap-2 text-sm cursor-pointer font-medium text-amber-800">
              <input
                type="radio"
                name="modalTagType"
                checked={tagTypeInput === "Damaged"}
                onChange={() => setTagTypeInput("Damaged")}
              />
              <span>Tag Kuning (Rusak)</span>
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer font-medium text-emerald-800">
              <input
                type="radio"
                name="modalTagType"
                checked={tagTypeInput === "Good"}
                onChange={() => setTagTypeInput("Good")}
              />
              <span>Tag Hijau (Bagus)</span>
            </label>
          </div>

          {tagTypeInput === "Damaged" && (
            <div className="space-y-2 p-4 bg-amber-50/60 border border-amber-200 rounded-lg">
              <p className="text-sm font-semibold text-amber-800">Keterangan kerusakan</p>
              <textarea
                className="w-full border border-amber-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                rows={4}
                value={damageInput}
                onChange={(e) => setDamageInput(e.target.value)}
                placeholder="Detail kerusakan radio..."
                disabled={saving}
              />
            </div>
          )}

          {tagTypeInput === "Good" && (
            <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-lg">
              <GreenTagFieldsForm
                value={greenTagInput}
                onChange={setGreenTagInput}
                requiredMode
                autoTechnicianName={job.workshopTechnicianName || job.assignedTechnicianName}
              />
            </div>
          )}

          <div className="pt-4 flex justify-end gap-2 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Batal</Button>
            <Button 
              onClick={handleSave} 
              disabled={saving || !tagTypeInput || (tagTypeInput === "Good" && !greenTagInput.repairDataDescription?.trim())}
              className={tagTypeInput === "Good" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-amber-600 hover:bg-amber-700 text-white"}
            >
              {saving ? "Menyimpan..." : "Simpan & Selesai"}
            </Button>
          </div>
        </div>
    </ResponsiveModal>
  );
}
