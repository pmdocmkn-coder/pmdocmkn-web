import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import type { HandoverAccessoryItem } from "../../types/radioHandover";
import React from "react";

export type DamagedEquipmentTagData = {
  handoverNumber: string;
  handedOverByName: string;
  receivedByName: string;
  picReceiverName?: string;
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
  handoverType?: string;
};

function flowLabel(type?: string) {
  if (type === "WarehouseToHelpdesk") return "Warehouse → Helpdesk";
  if (type === "TechnicianToWarehouse") return "Teknisi → Warehouse";
  return "Helpdesk → Teknisi";
}

export default function DamagedEquipmentTagCard({ data }: { data: DamagedEquipmentTagData }) {
  const acc = data.accessories?.filter((a) => a.itemName?.trim()) ?? [];
  const alurLabel = flowLabel(data.handoverType);
  const flowNames = `${data.handedOverByName} → ${data.receivedByName}${data.picReceiverName ? ` (${data.picReceiverName})` : ""}`;
  const alurValue = alurLabel.toLowerCase() === flowNames.toLowerCase() 
    ? alurLabel 
    : `${alurLabel} · ${flowNames}`;

  return (
    <div className="rounded-xl overflow-hidden border-2 border-yellow-400 shadow-md text-sm">

      {/* ── Header hazard stripe ── */}
      <div
        className="h-3 w-full"
        style={{
          background: "repeating-linear-gradient(45deg, #000 0px, #000 8px, #facc15 8px, #facc15 16px)",
        }}
      />

      {/* ── Logo + AWAS banner ── */}
      <div className="bg-yellow-400 px-4 pt-3 pb-2 flex flex-col items-center">
        <img src="/MKN.png" alt="MKN Logo" className="h-14 object-contain" />
      </div>

      <div className="bg-gray-900 py-2 text-center">
        <p className="text-white font-black text-xl tracking-widest">AWAS</p>
      </div>

      <div className="bg-yellow-400 py-2 text-center">
        <p className="text-gray-900 font-black text-base tracking-wider leading-tight">
          PERALATAN<br />RUSAK
        </p>
      </div>

      {/* ── Bottom hazard stripe ── */}
      <div
        className="h-2 w-full"
        style={{
          background: "repeating-linear-gradient(45deg, #000 0px, #000 6px, #facc15 6px, #facc15 12px)",
        }}
      />

      {/* ── Data fields ── */}
      <div className="bg-yellow-50 px-4 py-3 space-y-2">
        <TagField label="No. STR / Tiket" value={`${data.handoverNumber}${data.helpdeskTicketNumber ? ` · ${data.helpdeskTicketNumber}` : ""}`} />
        <TagField label="Tanggal/waktu" value={format(new Date(data.handoverAt), "dd MMMM yyyy HH:mm", { locale: localeId })} />
        <TagField label="Alur" value={alurValue} />
        <TagField label="Nama Alat" value={data.equipmentName ?? "—"} />
        <TagField label="Nomor Unit" value={data.unitNumber?.trim() || "—"} />
        <TagField label="S/N" value={data.radioSerialNumber} highlight />
        <TagField label="ID Radio" value={data.radioMasterRadioId?.trim() || "—"} />
        <TagField label="Fleet" value={data.radioFleet?.trim() || "—"} />
        <TagField label="Pemilik" value={data.radioOwnerLabel?.trim() || "—"} />
        <TagField label="Divisi" value={data.ownerDivision?.trim() || "—"} />
        <TagField label="Departemen" value={data.ownerDepartment?.trim() || "—"} />
        {data.damageDescription && (
          <TagField label="Kerusakan" value={data.damageDescription} />
        )}

        {acc.length > 0 && (
          <div className="pt-2 border-t border-yellow-300">
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

      {/* ── Footer hazard stripe ── */}
      <div
        className="h-3 w-full"
        style={{
          background: "repeating-linear-gradient(45deg, #000 0px, #000 8px, #facc15 8px, #facc15 16px)",
        }}
      />
    </div>
  );
}

function TagField({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex gap-2 items-baseline border-b border-yellow-200 pb-1.5 last:border-0">
      <span className="text-xs text-gray-500 w-28 shrink-0">{label}</span>
      <span className={`text-xs font-semibold flex-1 ${highlight ? "text-gray-900 font-mono" : "text-gray-800"}`}>
        {value}
      </span>
    </div>
  );
}
