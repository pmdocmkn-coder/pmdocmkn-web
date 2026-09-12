import type { RadioHandoverDetail } from "../../types/radioHandover";
import { isGoodTag, toDamagedTagData, toGoodTagData } from "../../utils/handoverTagUtils";
import DamagedEquipmentTagCard from "./DamagedEquipmentTagCard";
import GoodEquipmentTagCard from "./GoodEquipmentTagCard";

export default function HandoverTagPreview({ detail }: { detail: RadioHandoverDetail }) {
  return (
    <div className="relative isolate">
      {detail.isScrap && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center overflow-hidden" aria-label="Radio Scrap">
          <span className="-rotate-12 border-4 border-red-600/25 px-4 py-2 text-4xl font-black tracking-widest text-red-600/20">RADIO SCRAP</span>
        </div>
      )}
      {isGoodTag(detail.equipmentTagType) && !detail.isScrap
        ? <GoodEquipmentTagCard data={toGoodTagData(detail)} />
        : <DamagedEquipmentTagCard data={toDamagedTagData(detail)} />}
    </div>
  );
}
