import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import type { HandoverAccessoryItem } from "../../types/radioHandover";

export type GoodEquipmentTagData = {
  handoverNumber: string;
  helpdeskTicketNumber?: string | null;
  handoverAt: string;
  handedOverByName: string;
  receivedByName: string;
  equipmentName?: string | null;
  unitNumber?: string | null;
  radioSerialNumber: string;
  radioOwnerLabel?: string | null;
  ownerDivision?: string | null;
  ownerDepartment?: string | null;
  radioMasterRadioId?: string | null;
  radioFleet?: string | null;
  originFrom?: string | null;
  repairDataDescription?: string | null;
  repairedByName?: string | null;
  frequencyError?: string | null;
  afReading?: string | null;
  powerReading?: string | null;
  voltageOutNoLoad?: string | null;
  voltageOutWithLoad?: string | null;
  physicalCondition?: string | null;
  displayCondition?: string | null;
  handoverType?: string;
  accessories?: HandoverAccessoryItem[];
};

function flowLabel(type?: string) {
  if (type === "WarehouseToHelpdesk") return "Warehouse → Helpdesk";
  if (type === "TechnicianToWarehouse") return "Teknisi → Warehouse";
  return "Helpdesk → Teknisi";
}

export default function GoodEquipmentTagCard({ data }: { data: GoodEquipmentTagData }) {
  const acc = data.accessories?.filter((a) => a.itemName?.trim()) ?? [];
  const alurLabel = flowLabel(data.handoverType);
  const flowNames = `${data.handedOverByName} → ${data.receivedByName}`;
  const alurValue = alurLabel.toLowerCase() === flowNames.toLowerCase() 
    ? alurLabel 
    : `${alurLabel} · ${flowNames}`;

  return (
    <div className="rounded-xl overflow-hidden border-2 border-emerald-500 shadow-md text-sm max-w-md">
      <div className="bg-white px-4 pt-4 pb-2 flex flex-col items-center border-b border-emerald-200">
        <img src="/MKN.png" alt="MKN Logo" className="h-12 object-contain" />
      </div>
      <div className="bg-emerald-600 py-3 px-4 text-center">
        <p className="text-white font-black text-lg tracking-wide leading-tight">PERALATAN BAIK</p>
      </div>
      <div className="bg-emerald-50 px-4 py-3 space-y-2">
        <TagField
          label="No. STR / Tiket"
          value={`${data.handoverNumber}${data.helpdeskTicketNumber ? ` · ${data.helpdeskTicketNumber}` : ""}`}
        />
        <TagField
          label="Tanggal / jam"
          value={format(new Date(data.handoverAt), "dd MMMM yyyy HH:mm", { locale: localeId })}
        />
        <TagField label="Alur" value={alurValue} />
        <TagField label="Nama alat" value={data.equipmentName ?? "—"} />
        <TagField label="Nomor unit" value={data.unitNumber?.trim() || "—"} />
        <TagField label="S/N" value={data.radioSerialNumber} highlight />
        <TagField label="ID Radio" value={data.radioMasterRadioId?.trim() || "—"} />
        <TagField label="Fleet" value={data.radioFleet?.trim() || "—"} />
        <TagField label="Pemilik" value={data.radioOwnerLabel?.trim() || "—"} />
        <TagField label="Divisi" value={data.ownerDivision?.trim() || "—"} />
        <TagField label="Departemen" value={data.ownerDepartment?.trim() || "—"} />
        <TagField label="Berasal dari" value={data.originFrom?.trim() || "—"} />
        <TagField label="Diperbaiki oleh" value={data.repairedByName?.trim() || "—"} />
        {data.repairDataDescription?.trim() && (
          <div className="border-b border-emerald-200 pb-2">
            <p className="text-xs text-gray-500 mb-1">Data perbaikan</p>
            <p className="text-xs text-gray-800 whitespace-pre-wrap">{data.repairDataDescription}</p>
          </div>
        )}
        <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 pt-1">
          <TagField label="Freq error" value={data.frequencyError?.trim() || "—"} compact />
          <TagField label="AF" value={data.afReading?.trim() || "—"} compact />
          <TagField label="Power" value={data.powerReading?.trim() || "—"} compact />
          <TagField label="V.out tanpa beban" value={data.voltageOutNoLoad?.trim() || "—"} compact />
          <TagField label="V.out dengan beban" value={data.voltageOutWithLoad?.trim() || "—"} compact />
          <TagField label="Fisik" value={data.physicalCondition?.trim() || "—"} compact />
          <TagField label="Display" value={data.displayCondition?.trim() || "—"} compact />
        </div>
        {acc.length > 0 && (
          <div className="pt-2 border-t border-emerald-200 mt-2">
            <p className="text-xs font-bold text-gray-700 mb-1.5">Kelengkapan</p>
            <ul className="space-y-1">
              {acc.map((a, i) => (
                <li key={i} className="flex flex-wrap gap-2 text-xs">
                  <span className="font-semibold text-gray-800">{a.itemName}</span>
                  <span className="text-gray-600">×{a.quantity} {a.unit ?? "EA"}</span>
                  {a.serialNumber?.trim() && <span className="text-gray-500">SN: {a.serialNumber}</span>}
                  {a.description?.trim() && <span className="text-gray-500">— {a.description}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <div className="h-2 bg-emerald-600" />
    </div>
  );
}

function TagField({
  label,
  value,
  highlight,
  compact,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <div>
        <p className="text-[10px] text-gray-500">{label}</p>
        <p className="text-[11px] font-medium text-gray-800 truncate" title={value}>
          {value}
        </p>
      </div>
    );
  }
  return (
    <div className="flex gap-2 items-baseline border-b border-emerald-200 pb-1.5 last:border-0">
      <span className="text-xs text-gray-500 w-28 shrink-0">{label}</span>
      <span className={`text-xs font-semibold flex-1 ${highlight ? "font-mono text-gray-900" : "text-gray-800"}`}>
        {value}
      </span>
    </div>
  );
}
