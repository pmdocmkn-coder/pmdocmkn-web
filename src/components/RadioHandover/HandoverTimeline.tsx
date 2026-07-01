import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { CheckCircle2, Circle, Clock, CheckCircle } from "lucide-react";

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
  picReceiverName?: string | null;
  remarks?: string | null;
};

const STEPS: { type: string; label: string; short: string }[] = [
  { type: "HelpdeskToTechnician", label: "Helpdesk → Teknisi", short: "HD → Tek" },
  { type: "TechnicianToWarehouse", label: "Teknisi → Warehouse", short: "Tek → WH" },
  { type: "WarehouseToHelpdesk", label: "Warehouse → Helpdesk", short: "WH → HD" },
];

function tagBadge(type?: string) {
  if (type === "Good") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 border border-emerald-200">
        <CheckCircle className="w-3 h-3" />
        Tag Hijau
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 border border-amber-200">
      <Clock className="w-3 h-3" />
      Tag Kuning
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
    <div className={compact ? "space-y-3" : "space-y-4"}>
      {!compact && <h3 className="font-bold text-slate-900 text-[15px]">Timeline Serah Terima</h3>}
      <div className="relative pl-7 space-y-5">
        {/* Global Vertical Line */}
        <div className="absolute left-[11px] top-4 bottom-4 w-[2px] bg-slate-100 rounded-full" />
        
        {STEPS.map((step, index) => {
          const h = byType.get(step.type);
          const done = !!h;
          
          // Determine if this is the active (current) step or next step
          const isNext = !done && (index === 0 || !!byType.get(STEPS[index - 1].type));
          
          return (
            <div key={step.type} className="relative group">
              {/* Active Line Segment */}
              {done && index < STEPS.length - 1 && (
                <div className="absolute -left-[17px] top-6 bottom-[-20px] w-[2px] bg-violet-500 z-10" />
              )}

              {/* Icon/Circle */}
              <div 
                className={`absolute -left-[28px] top-0.5 z-20 flex items-center justify-center w-8 h-8 rounded-full border-2 bg-white transition-all duration-300 ${
                  done 
                    ? "border-violet-500 text-violet-600 shadow-sm" 
                    : isNext
                      ? "border-violet-300 text-violet-500 shadow-[0_0_0_4px_rgba(139,92,246,0.1)]"
                      : "border-slate-200 text-slate-300"
                }`}
              >
                {done ? (
                  <CheckCircle2 className="w-4 h-4" strokeWidth={2.5} />
                ) : isNext ? (
                  <Circle className="w-2.5 h-2.5 fill-violet-500" strokeWidth={0} />
                ) : (
                  <Circle className="w-2 h-2 fill-slate-200" strokeWidth={0} />
                )}
              </div>
              
              {/* Card */}
              <div 
                className={`rounded-xl border transition-all duration-300 ${
                  done 
                    ? "bg-white border-violet-100 shadow-sm hover:shadow-md" 
                    : isNext
                      ? "bg-white border-slate-200 shadow-sm hover:border-violet-200"
                      : "bg-slate-50/50 border-slate-100 opacity-80"
                }`}
              >
                <div className="p-3.5 sm:p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-1">
                    <p className={`font-bold text-sm ${done || isNext ? "text-slate-900" : "text-slate-500"}`}>
                      {step.label}
                    </p>
                    {h && tagBadge(h.equipmentTagType)}
                  </div>
                  
                  {done && h ? (
                    <div className="mt-3 space-y-3 text-xs">
                      <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                        <div>
                          <span className="block text-slate-500 mb-0.5">No Referensi</span>
                          <span className="font-mono font-bold text-violet-700">{h.handoverNumber}</span>
                        </div>
                        <div>
                          <span className="block text-slate-500 mb-0.5">Waktu Serah Terima</span>
                          <span className="font-semibold text-slate-700">
                            {format(new Date(h.handoverAt), "dd MMM yyyy, HH:mm", { locale: localeId })}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1.5 text-slate-600 px-1">
                        <div className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-200/70 text-slate-600 font-bold text-[10px]">
                          {h.handedOverByName.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-slate-700">{h.handedOverByName}</span>
                        <span className="text-slate-400 mx-0.5">→</span>
                        <div className="flex items-center justify-center w-5 h-5 rounded-full bg-violet-100 text-violet-700 font-bold text-[10px]">
                          {h.receivedByName.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-bold text-slate-800">{h.receivedByName}</span>
                      </div>
                      
                      {h.remarks && (
                        <div className="flex gap-1.5 text-slate-600 px-2 mt-2 bg-slate-50 border border-slate-100 py-1.5 rounded-md">
                          <span className="font-medium text-[11px] text-slate-500">Catatan:</span>
                          <span className="text-xs text-slate-700 whitespace-pre-wrap">{h.remarks}</span>
                        </div>
                      )}
                      
                      {h.signedAt && h.status !== "PendingReceiverSignature" && (
                        <div className="flex items-center gap-1.5 text-emerald-600 px-1 mt-2 bg-emerald-50/50 py-1.5 rounded-md">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span className="font-medium">
                            Tuntas — TTD Penerima
                            {h.picReceiverName ? ` (PIC: ${h.picReceiverName})` : ""}
                            : {format(new Date(h.signedAt), "dd MMM yyyy, HH:mm", { locale: localeId })}
                          </span>
                        </div>
                      )}
                      {(!h.signedAt || h.status === "PendingReceiverSignature") && (
                        <div className="flex items-center gap-1.5 text-amber-600 px-1 mt-2 bg-amber-50/50 py-1.5 rounded-md">
                          <Clock className="w-3.5 h-3.5" />
                          <span className="font-medium">Menunggu tanda tangan penerima</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mt-2 text-xs text-slate-400 flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${isNext ? "bg-violet-400 animate-pulse" : "bg-slate-300"}`} />
                      <span className="font-medium">{isNext ? "Langkah selanjutnya" : "Belum dilakukan"}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
