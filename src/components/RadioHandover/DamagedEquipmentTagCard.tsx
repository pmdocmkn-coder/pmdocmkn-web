import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import type { HandoverAccessoryItem } from "../../types/radioHandover";

export type DamagedEquipmentTagData = {
  handoverNumber: string;
  handedOverByName: string;
  receivedByName: string;
  handoverAt: string;
  equipmentName?: string | null;
  unitNumber?: string | null;
  radioSerialNumber: string;
  radioOwnerLabel?: string | null;
  ownerDivision?: string | null;
  ownerDepartment?: string | null;
  damageDescription?: string | null;
  accessories: HandoverAccessoryItem[];
  helpdeskTicketNumber?: string | null;
  radioMasterId?: number | null;
  radioMasterRadioId?: string | null;
  radioFleet?: string | null;
  radioCategory?: string | null;
};

export default function DamagedEquipmentTagCard({ data }: { data: DamagedEquipmentTagData }) {
  const acc = data.accessories?.filter((a) => a.itemName?.trim()) ?? [];

  return (
    <div className="border-2 border-dashed border-violet-300 rounded-xl p-4 bg-violet-50/30">
      <p className="text-xs font-bold uppercase tracking-wide text-violet-700 mb-3">Tag Peralatan Rusak</p>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <TagRow label="Nama (HD → Teknisi)" value={`${data.handedOverByName} → ${data.receivedByName}`} span />
        <TagRow label="Tanggal serah terima" value={format(new Date(data.handoverAt), "dd MMMM yyyy HH:mm", { locale: localeId })} />
        <TagRow label="No. STR / Tiket" value={`${data.handoverNumber}${data.helpdeskTicketNumber ? ` · ${data.helpdeskTicketNumber}` : ""}`} />
        <TagRow label="Nama alat" value={data.equipmentName ?? "—"} />
        <TagRow label="Serial number" value={data.radioSerialNumber} />
        {data.radioMasterId != null && (
          <TagRow label="Ref. master" value={`#${data.radioMasterId}`} />
        )}
        <TagRow label="ID Radio" value={data.radioMasterRadioId?.trim() || "—"} />
        <TagRow label="Fleet" value={data.radioFleet?.trim() || "—"} span />
        {data.radioCategory?.trim() && <TagRow label="Kategori" value={data.radioCategory.trim()} />}
        <TagRow label="Nomor unit" value={data.unitNumber?.trim() || "—"} />
        <TagRow label="Pemilik radio" value={data.radioOwnerLabel?.trim() || "—"} />
        <TagRow label="Divisi" value={data.ownerDivision?.trim() || "—"} />
        <TagRow label="Departemen" value={data.ownerDepartment?.trim() || "—"} />
        {data.damageDescription && <TagRow label="Kerusakan" value={data.damageDescription} span />}
      </dl>
      {acc.length > 0 && (
        <div className="mt-3 pt-3 border-t border-violet-200">
          <p className="text-xs font-semibold text-gray-600 mb-2">Kelengkapan / aksesoris</p>
          <ul className="text-xs space-y-1">
            {acc.map((a, i) => (
              <li key={i} className="flex flex-wrap gap-2">
                <span className="font-medium">{a.itemName}</span>
                <span className="text-gray-500">×{a.quantity} {a.unit ?? "EA"}</span>
                {a.serialNumber?.trim() && <span className="text-gray-600">SN: {a.serialNumber}</span>}
                {a.description?.trim() && <span className="text-gray-500">— {a.description}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function TagRow({ label, value, span }: { label: string; value: string; span?: boolean }) {
  return (
    <div className={span ? "sm:col-span-2" : ""}>
      <dt className="text-xs text-gray-500">{label}</dt>
      <dd className="font-medium text-gray-900 mt-0.5">{value}</dd>
    </div>
  );
}
