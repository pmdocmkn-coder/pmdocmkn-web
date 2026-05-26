import { useState, useRef } from "react";
import { Plus, Radio, Layers, Loader2 } from "lucide-react";
import { radioHandoverApi } from "../../services/radioHandoverApi";
import { useToast } from "../../hooks/use-toast";
import RadioSerialLookupField from "./RadioSerialLookupField";
import RadioMasterSummaryCard from "./RadioMasterSummaryCard";
import SharedRadioDefaultsFields, {
  applyDefaultsToLines,
  type SharedRadioDefaults,
} from "./SharedRadioDefaultsFields";
import MultiRadioSerialList, { type RadioSerialLine } from "./MultiRadioSerialList";
import { lineFromLookup, syncSharedFromFirstMaster } from "../../utils/radioHandoverLineUtils";

export type EntryMode = "single" | "multiple";

const emptyDefaults = (): SharedRadioDefaults => ({
  equipmentName: "",
  radioOwnerLabel: "",
  ownerDivision: "",
  ownerDepartment: "",
  unitNumber: "",
});

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

async function resolveSerialFromMaster(sn: string): Promise<RadioSerialLine> {
  const trimmed = sn.trim();
  if (!trimmed) return initialLine();

  try {
    const results = await radioHandoverApi.lookupBySerial(trimmed);
    const exact =
      results.find((r) => (r.serialNumber ?? "").trim().toLowerCase() === trimmed.toLowerCase()) ??
      results[0];
    if (exact?.id) {
      return lineFromLookup(trimmed, exact.id, exact);
    }
  } catch {
    /* manual SN */
  }

  return { ...initialLine(), serial: trimmed };
}

type Props = {
  ticket: string;
  onTicketChange: (v: string) => void;
  noJobErp: string;
  onNoJobErpChange: (v: string) => void;
  entryMode: EntryMode;
  onEntryModeChange: (m: EntryMode) => void;
  radioLines: RadioSerialLine[];
  onRadioLinesChange: (lines: RadioSerialLine[]) => void;
  sharedDefaults: SharedRadioDefaults;
  onSharedDefaultsChange: (d: SharedRadioDefaults) => void;
};

export default function HandoverRadioEntryStep({
  ticket,
  onTicketChange,
  noJobErp,
  onNoJobErpChange,
  entryMode,
  onEntryModeChange,
  radioLines,
  onRadioLinesChange,
  sharedDefaults,
  onSharedDefaultsChange,
}: Props) {
  const { toast } = useToast();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [bulkSnText, setBulkSnText] = useState("");
  const [resolvingBulk, setResolvingBulk] = useState(false);
  const [showManualForLine, setShowManualForLine] = useState<string | null>(null);

  const singleLine = radioLines[0] ?? initialLine();

  const setSingleLine = (line: RadioSerialLine) => {
    onRadioLinesChange([line]);
    if (line.radioId && line.lookup) {
      onSharedDefaultsChange({
        equipmentName: line.equipmentName,
        radioOwnerLabel: line.radioOwnerLabel,
        ownerDivision: line.ownerDivision,
        ownerDepartment: line.ownerDepartment,
        unitNumber: line.unitNumber,
      });
    }
  };

  const onSingleSelect = (s: string, radioId: number | null, lookup?: Parameters<typeof lineFromLookup>[2]) => {
    const merged = lineFromLookup(s, radioId, lookup ?? null);
    setSingleLine({ ...merged, id: singleLine.id });
    setShowManualForLine(null);
  };

  const switchMode = (mode: EntryMode) => {
    onEntryModeChange(mode);
    if (mode === "single") {
      const first = radioLines.find((r) => r.serial.trim()) ?? initialLine();
      onRadioLinesChange([first]);
    } else if (radioLines.length === 0) {
      onRadioLinesChange([initialLine()]);
    }
  };

  const applyBulkSn = async () => {
    const serials = bulkSnText
      .split(/[\n,;]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (serials.length === 0) return;

    setResolvingBulk(true);
    try {
      const existing = new Set(
        radioLines.map((r) => r.serial.trim().toLowerCase()).filter(Boolean),
      );
      const newLines = [...radioLines.filter((r) => r.serial.trim())];

      let masterCount = 0;
      for (const sn of serials) {
        if (existing.has(sn.toLowerCase())) continue;
        existing.add(sn.toLowerCase());
        const line = await resolveSerialFromMaster(sn);
        if (line.radioId) masterCount += 1;
        newLines.push(line);
      }

      onRadioLinesChange(newLines.length ? newLines : [initialLine()]);

      const synced = syncSharedFromFirstMaster(newLines);
      if (synced) onSharedDefaultsChange(synced);

      setBulkSnText("");
      toast({
        title: `${serials.length} SN ditambahkan`,
        description:
          masterCount > 0
            ? `${masterCount} ditemukan di master (tipe, pemilik, divisi terisi otomatis).`
            : "Beberapa SN tidak ada di master — lengkapi data bersama atau per baris.",
      });
    } finally {
      setResolvingBulk(false);
    }
  };

  const filledCount = radioLines.filter((r) => r.serial.trim()).length;
  const masterCount = radioLines.filter((r) => r.radioId).length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">No Tiket Helpdesk *</label>
          <input
            className="w-full border rounded-lg px-3 py-2 mt-1"
            placeholder="#MKN/0526/0669"
            value={ticket}
            onChange={(e) => onTicketChange(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm font-medium">No Job ERP (MKNSmart)</label>
          <div className="relative mt-1">
            <input
              type="text"
              placeholder="Contoh: MKN/0526/1113 (Opsional)"
              className="w-full border rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              value={noJobErp}
              onChange={(e) => onNoJobErpChange(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-gray-800 mb-2">Jumlah radio pada tiket ini</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => switchMode("single")}
            className={`flex items-center gap-2 p-3 rounded-xl border-2 text-left text-sm transition-colors ${
              entryMode === "single"
                ? "border-violet-500 bg-violet-50 text-violet-900"
                : "border-gray-200 hover:border-violet-200"
            }`}
          >
            <Radio className="w-5 h-5 shrink-0" />
            <span>
              <span className="font-semibold block">Satu radio</span>
              <span className="text-xs opacity-80">Lookup master + preview data</span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => switchMode("multiple")}
            className={`flex items-center gap-2 p-3 rounded-xl border-2 text-left text-sm transition-colors ${
              entryMode === "multiple"
                ? "border-violet-500 bg-violet-50 text-violet-900"
                : "border-gray-200 hover:border-violet-200"
            }`}
          >
            <Layers className="w-5 h-5 shrink-0" />
            <span>
              <span className="font-semibold block">Beberapa radio</span>
              <span className="text-xs opacity-80">Tempel SN, auto-fill dari master</span>
            </span>
          </button>
        </div>
      </div>

      {entryMode === "single" ? (
        <div className="space-y-3">
          <RadioSerialLookupField
            serial={singleLine.serial}
            radioId={singleLine.radioId}
            lookup={singleLine.lookup}
            label="Serial Number Radio"
            required
            onSelect={onSingleSelect}
          />
          <RadioMasterSummaryCard 
            line={singleLine} 
            onEditManual={() => setShowManualForLine(singleLine.id === showManualForLine ? null : singleLine.id)} 
          />

          {(!singleLine.radioId || showManualForLine === singleLine.id) && (
            <div className="rounded-xl border border-gray-200 p-3 space-y-3 bg-gray-50/50">
              <p className="text-xs font-medium text-gray-600">
                {singleLine.radioId ? "Edit data (opsional)" : "Data manual (jika SN tidak di master)"}
              </p>
              <label className="block text-sm">
                <span className="font-medium">Tipe / nama alat *</span>
                <input
                  className="w-full border rounded-lg px-3 py-2 mt-1 bg-white"
                  value={singleLine.equipmentName}
                  onChange={(e) =>
                    setSingleLine({ ...singleLine, equipmentName: e.target.value })
                  }
                  placeholder="Motorola DP4800"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm col-span-2">
                  <span className="font-medium">Pemilik radio</span>
                  <input
                    className="w-full border rounded-lg px-3 py-2 mt-1 bg-white"
                    value={singleLine.radioOwnerLabel}
                    onChange={(e) =>
                      setSingleLine({ ...singleLine, radioOwnerLabel: e.target.value })
                    }
                  />
                </label>
                <label className="block text-sm">
                  <span className="font-medium">Divisi</span>
                  <input
                    className="w-full border rounded-lg px-3 py-2 mt-1 bg-white"
                    value={singleLine.ownerDivision}
                    onChange={(e) =>
                      setSingleLine({ ...singleLine, ownerDivision: e.target.value })
                    }
                  />
                </label>
                <label className="block text-sm">
                  <span className="font-medium">Departemen</span>
                  <input
                    className="w-full border rounded-lg px-3 py-2 mt-1 bg-white"
                    value={singleLine.ownerDepartment}
                    onChange={(e) =>
                      setSingleLine({ ...singleLine, ownerDepartment: e.target.value })
                    }
                  />
                </label>
              </div>
              <label className="block text-sm">
                <span className="font-medium">Nomor unit</span>
                <input
                  className="w-full border rounded-lg px-3 py-2 mt-1 bg-white"
                  value={singleLine.unitNumber}
                  onChange={(e) => setSingleLine({ ...singleLine, unitNumber: e.target.value })}
                />
              </label>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="rounded-lg border border-dashed border-violet-200 bg-violet-50/30 px-3 py-2 text-xs text-violet-800">
            Setiap SN dicocokkan ke <strong>master radio</strong>. Jika ketemu, tipe, pemilik, divisi, dan departemen
            terisi otomatis. SN yang tidak ada di master bisa dilengkapi lewat <strong>data bersama</strong> di bawah.
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600">Tempel banyak SN (baris atau koma)</label>
            <div className="flex gap-2 mt-1">
              <textarea
                className="flex-1 border rounded-lg px-3 py-2 text-sm min-h-[72px]"
                placeholder={"19988858\n21221231\n11101710"}
                value={bulkSnText}
                onChange={(e) => setBulkSnText(e.target.value)}
                disabled={resolvingBulk}
              />
              <button
                type="button"
                onClick={applyBulkSn}
                disabled={resolvingBulk}
                className="px-3 py-2 text-xs font-medium border rounded-lg hover:bg-violet-50 text-violet-700 shrink-0 self-end disabled:opacity-50 flex items-center gap-1"
              >
                {resolvingBulk ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                {resolvingBulk ? "Mencari..." : "Tambah & isi"}
              </button>
            </div>
          </div>

          {filledCount > 0 && (
            <p className="text-xs text-gray-500">
              {filledCount} SN · {masterCount} dari master
              {masterCount < filledCount ? ` · ${filledCount - masterCount} perlu data manual` : ""}
            </p>
          )}

          <SharedRadioDefaultsFields
            defaults={sharedDefaults}
            onChange={onSharedDefaultsChange}
            onApplyToAll={() => onRadioLinesChange(applyDefaultsToLines(radioLines, sharedDefaults))}
            lineCount={filledCount || radioLines.length}
          />

          <MultiRadioSerialList
            lines={radioLines}
            onChange={(lines) => {
              onRadioLinesChange(lines);
              const synced = syncSharedFromFirstMaster(lines);
              if (synced) onSharedDefaultsChange(synced);
            }}
            compactMode
          />

          {(showManualForLine || radioLines.some((r) => r.serial.trim() && !r.radioId)) && (
            <div className="rounded-xl border border-amber-100 bg-amber-50/40 p-3 space-y-3">
              <p className="text-xs font-medium text-amber-900">Lengkapi SN manual (belum di master)</p>
              {radioLines
                .filter((r) => !r.radioId && r.serial.trim())
                .map((row) => (
                  <div key={row.id} className="bg-white rounded-lg border p-3 space-y-2">
                    <p className="font-mono text-xs font-medium">{row.serial}</p>
                    <label className="block text-sm">
                      <span className="font-medium text-amber-800">Tipe / nama alat *</span>
                      <input
                        className="w-full border rounded-lg px-2 py-1.5 mt-0.5 text-sm"
                        value={row.equipmentName}
                        onChange={(e) =>
                          onRadioLinesChange(
                            radioLines.map((r) =>
                              r.id === row.id ? { ...r, equipmentName: e.target.value } : r,
                            ),
                          )
                        }
                      />
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="block text-sm col-span-2">
                        <span className="font-medium">Pemilik</span>
                        <input
                          className="w-full border rounded-lg px-2 py-1.5 mt-0.5 text-sm"
                          value={row.radioOwnerLabel}
                          onChange={(e) =>
                            onRadioLinesChange(
                              radioLines.map((r) =>
                                r.id === row.id ? { ...r, radioOwnerLabel: e.target.value } : r,
                              ),
                            )
                          }
                        />
                      </label>
                      <label className="block text-sm">
                        <span className="font-medium">Divisi</span>
                        <input
                          className="w-full border rounded-lg px-2 py-1.5 mt-0.5 text-sm"
                          value={row.ownerDivision}
                          onChange={(e) =>
                            onRadioLinesChange(
                              radioLines.map((r) =>
                                r.id === row.id ? { ...r, ownerDivision: e.target.value } : r,
                              ),
                            )
                          }
                        />
                      </label>
                      <label className="block text-sm">
                        <span className="font-medium">Departemen</span>
                        <input
                          className="w-full border rounded-lg px-2 py-1.5 mt-0.5 text-sm"
                          value={row.ownerDepartment}
                          onChange={(e) =>
                            onRadioLinesChange(
                              radioLines.map((r) =>
                                r.id === row.id ? { ...r, ownerDepartment: e.target.value } : r,
                              ),
                            )
                          }
                        />
                      </label>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
