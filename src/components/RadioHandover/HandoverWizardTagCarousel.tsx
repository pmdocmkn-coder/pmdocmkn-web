import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { EquipmentTagType } from "../../types/equipmentTag";
import type { GreenTagFields } from "../../types/equipmentTag";
import type { HandoverAccessoryItem } from "../../types/radioHandover";
import type { RadioSerialLine } from "./MultiRadioSerialList";
import type { SharedRadioDefaults } from "./SharedRadioDefaultsFields";
import { mergedLines, toDamagedPreview, toGoodPreview } from "../../utils/handoverLineTagUtils";
import DamagedEquipmentTagCard from "./DamagedEquipmentTagCard";
import GoodEquipmentTagCard from "./GoodEquipmentTagCard";

type Props = {
  tagType: EquipmentTagType;
  radioLines: RadioSerialLine[];
  sharedDefaults: SharedRadioDefaults;
  ticket: string;
  damage: string;
  greenFields: GreenTagFields;
  accessories: HandoverAccessoryItem[];
};

export default function HandoverWizardTagCarousel({
  tagType,
  radioLines,
  sharedDefaults,
  ticket,
  damage,
  greenFields,
  accessories,
}: Props) {
  const lines = mergedLines(radioLines, sharedDefaults);
  const [index, setIndex] = useState(0);
  const safeIndex = lines.length ? Math.min(index, lines.length - 1) : 0;
  const line = lines[safeIndex];

  if (lines.length === 0) {
    return (
      <p className="text-sm text-amber-700 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
        Belum ada SN — kembali ke langkah Tiket &amp; radio.
      </p>
    );
  }

  const prev = () => setIndex((i) => Math.max(0, i - 1));
  const next = () => setIndex((i) => Math.min(lines.length - 1, i + 1));

  return (
    <div className="space-y-3">
      {lines.length > 1 && (
        <div className="flex items-center justify-between gap-2 rounded-[10px] border border-[#E2E8F0] bg-[#F7F8FA] px-3 py-2">
          <button
            type="button"
            onClick={prev}
            disabled={safeIndex === 0}
            className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-[6px] border border-[#E2E8F0] bg-white disabled:opacity-40 text-[#4A5568]"
          >
            <ChevronLeft className="w-4 h-4" /> Tag sebelumnya
          </button>
          <span className="text-xs font-semibold text-[#1B3A6B] text-center">
            Tag {safeIndex + 1} / {lines.length}
            <span className="block font-mono text-[#718096] font-normal mt-0.5">SN {line.serial}</span>
          </span>
          <button
            type="button"
            onClick={next}
            disabled={safeIndex >= lines.length - 1}
            className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-[6px] border border-[#E2E8F0] bg-white disabled:opacity-40 text-[#4A5568]"
          >
            Tag berikutnya <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {lines.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          {lines.map((l, i) => (
            <button
              key={l.id}
              type="button"
              onClick={() => setIndex(i)}
              className={`text-[10px] font-mono px-3 py-1.5 rounded-full border transition-colors ${
                i === safeIndex
                  ? "bg-[#1B3A6B] text-white border-[#1B3A6B]"
                  : "bg-white text-[#718096] border-[#E2E8F0] hover:border-[#2B6CB0]"
              }`}
            >
              {l.serial}
            </button>
          ))}
        </div>
      )}

      {tagType === "Damaged" ? (
        <DamagedEquipmentTagCard
          data={toDamagedPreview(line, { ticket, damage, accessories })}
        />
      ) : (
        <GoodEquipmentTagCard data={toGoodPreview(line, greenFields, { ticket })} />
      )}
    </div>
  );
}
