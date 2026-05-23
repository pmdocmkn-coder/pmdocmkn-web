import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { CheckCircle2, Circle, Clock } from "lucide-react";

export type HandoverTimelineItem = {
  id?: number;
  handoverNumber?: string;
  handoverType: string;
  handoverAt: string;
  signedAt?: string | null;
  handedOverByName: string;
  receivedByName: string;
  equipmentTagType?: string;
  status?: string;
};

const STEPS: { type: string; label: string; short: string }[] = [
  { type: "HelpdeskToTechnician", label: "Helpdesk → Teknisi", short: "HD → Tek" },
  { type: "TechnicianToWarehouse", label: "Teknisi → Warehouse", short: "Tek → WH" },
  { type: "WarehouseToHelpdesk", label: "Warehouse → Helpdesk", short: "WH → HD" },
];

function tagBadge(type?: string) {
  if (type === "Good") {
    return (
      <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
        Tag hijau
      </span>
    );
  }
  return (
    <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-800 border border-amber-200">
      Tag kuning
    </span>
  );
}

type Props = {
  handovers: HandoverTimelineItem[];
  compact?: boolean;
};

export default function HandoverTimeline({ handovers, compact }: Props) {
  const byType = new Map(handovers.map((h) => [h.handoverType, h]));

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      {!compact && <h3 className="font-semibold text-gray-900 text-sm">Timeline serah terima</h3>}
      <ol className="relative border-l-2 border-violet-200 ml-3 space-y-4 pl-6">
        {STEPS.map((step) => {
          const h = byType.get(step.type);
          const done = !!h;
          return (
            <li key={step.type} className="relative">
              <span
                className={`absolute -left-[1.6rem] flex items-center justify-center w-7 h-7 rounded-full border-2 bg-white ${
                  done ? "border-violet-500 text-violet-600" : "border-gray-300 text-gray-300"
                }`}
              >
                {done ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-3.5 h-3.5" />}
              </span>
              <div className={`rounded-lg border p-3 ${done ? "bg-violet-50/50 border-violet-100" : "bg-gray-50 border-gray-100"}`}>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-sm text-gray-900">{step.label}</p>
                  {h && tagBadge(h.equipmentTagType)}
                </div>
                {done && h ? (
                  <div className="mt-2 space-y-1 text-xs text-gray-600">
                    <p className="font-mono text-violet-700 font-medium">{h.handoverNumber}</p>
                    <p className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-gray-400" />
                      {format(new Date(h.handoverAt), "dd MMM yyyy HH:mm", { locale: localeId })}
                    </p>
                    <p>
                      {h.handedOverByName} → {h.receivedByName}
                    </p>
                    {h.signedAt && h.status !== "PendingReceiverSignature" && (
                      <p className="text-gray-500">
                        TTD penerima: {format(new Date(h.signedAt), "dd MMM yyyy HH:mm", { locale: localeId })}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 mt-1 italic">Belum dilakukan</p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
