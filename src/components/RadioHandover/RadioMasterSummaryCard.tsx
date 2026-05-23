import { CheckCircle2, AlertCircle, Pencil } from "lucide-react";
import type { RadioLookup } from "../../types/radioHandover";
import type { RadioSerialLine } from "./MultiRadioSerialList";
import { formatRadioOwnerLabel } from "../../utils/radioOwnerLabel";

type Props = {
  line: RadioSerialLine;
  compact?: boolean;
  onEditManual?: () => void;
};

function Field({ label, value }: { label: string; value: string }) {
  if (!value?.trim()) return null;
  return (
    <div className="min-w-0">
      <p className="text-[10px] uppercase tracking-wide text-gray-500">{label}</p>
      <p className="text-sm font-medium text-gray-900 truncate" title={value}>
        {value}
      </p>
    </div>
  );
}

export default function RadioMasterSummaryCard({ line, compact, onEditManual }: Props) {
  const fromMaster = !!line.radioId && !!line.lookup;

  if (!line.serial.trim()) return null;

  if (!fromMaster) {
    return (
      <div className={`rounded-lg border border-amber-200 bg-amber-50/80 ${compact ? "p-2.5" : "p-3"}`}>
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-amber-900">SN belum di master radio</p>
            <p className="text-xs text-amber-800 mt-0.5">
              Isi tipe/nama alat dan pemilik secara manual di bawah, atau gunakan data bersama (mode banyak radio).
            </p>
            {onEditManual && (
              <button type="button" onClick={onEditManual} className="mt-2 text-xs text-amber-800 underline flex items-center gap-1">
                <Pencil className="w-3 h-3" /> Isi manual
              </button>
            )}
          </div>
        </div>
        {!compact && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Field label="Tipe / nama alat" value={line.equipmentName || "—"} />
            <Field label="Pemilik" value={line.radioOwnerLabel || "—"} />
            <Field label="Divisi" value={line.ownerDivision} />
            <Field label="Departemen" value={line.ownerDepartment} />
            <Field label="Nomor unit" value={line.unitNumber} />
          </div>
        )}
      </div>
    );
  }

  const l = line.lookup!;
  return (
    <div className={`rounded-lg border border-emerald-200 bg-emerald-50/60 ${compact ? "p-2.5" : "p-3"}`}>
      <div className="flex items-center gap-2 mb-2">
        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
        <p className="text-xs font-semibold text-emerald-900">Terdaftar di master radio — data terisi otomatis</p>
      </div>
      <div className={`grid gap-2 ${compact ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3"}`}>
        <Field label="Tipe / nama alat" value={line.equipmentName || l.type || "—"} />
        <Field label="Pemilik" value={line.radioOwnerLabel || formatRadioOwnerLabel(l)} />
        <Field label="Divisi" value={line.ownerDivision || l.division || ""} />
        <Field label="Departemen" value={line.ownerDepartment || l.department || ""} />
        <Field label="Nomor unit" value={line.unitNumber || l.nomorUnit || ""} />
        <Field label="ID Radio" value={l.radioId?.trim() || l.nomorAset?.trim() || ""} />
        <Field label="Fleet" value={l.fleet?.trim() || ""} />
      </div>
    </div>
  );
}
