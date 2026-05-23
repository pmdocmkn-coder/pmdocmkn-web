import type { RadioHandoverDetail } from "../../types/radioHandover";
import { isGoodTag, toDamagedTagData, toGoodTagData } from "../../utils/handoverTagUtils";
import DamagedEquipmentTagCard from "./DamagedEquipmentTagCard";
import GoodEquipmentTagCard from "./GoodEquipmentTagCard";

export default function HandoverTagPreview({ detail }: { detail: RadioHandoverDetail }) {
  if (isGoodTag(detail.equipmentTagType)) {
    return <GoodEquipmentTagCard data={toGoodTagData(detail)} />;
  }
  return <DamagedEquipmentTagCard data={toDamagedTagData(detail)} />;
}
