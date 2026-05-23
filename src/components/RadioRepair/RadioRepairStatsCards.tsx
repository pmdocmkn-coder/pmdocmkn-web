import { motion } from "framer-motion";
import {
  CheckCircle2,
  Clock,
  Eye,
  Package,
  Radio,
  Wrench,
} from "lucide-react";
import type { RadioRepairDashboard } from "../../types/radioRepair";

const cardHoverVariants = {
  rest: { scale: 1, y: 0 },
  hover: { scale: 1.03, y: -4, transition: { type: "spring" as const, stiffness: 400, damping: 12 } },
};

type StatCard = {
  label: string;
  value: number;
  sub?: string;
  gradient: string;
  icon: React.ReactNode;
};

type Props = {
  dash: RadioRepairDashboard;
  page: number;
  totalPages: number;
};

export default function RadioRepairStatsCards({ dash, page, totalPages }: Props) {
  const cards: StatCard[] = [
    {
      label: "Total",
      value: dash.total,
      sub: `hal ${page}/${totalPages}`,
      gradient: "from-[#64748b] to-[#475569]",
      icon: <Wrench className="w-4 h-4 md:w-5 md:h-5" />,
    },
    {
      label: "Diterima",
      value: dash.received,
      sub: "baru masuk",
      gradient: "from-[#94a3b8] to-[#64748b]",
      icon: <Radio className="w-4 h-4 md:w-5 md:h-5" />,
    },
    {
      label: "Progress",
      value: dash.inProgress,
      sub: "diperbaiki",
      gradient: "from-[#3b82f6] to-[#2563eb]",
      icon: <Wrench className="w-4 h-4 md:w-5 md:h-5" />,
    },
    {
      label: "Monitoring",
      value: dash.monitoring,
      sub: "pantau",
      gradient: "from-[#6366f1] to-[#4f46e5]",
      icon: <Eye className="w-4 h-4 md:w-5 md:h-5" />,
    },
    {
      label: "Tunggu Material",
      value: dash.waitingMaterialApproval,
      sub: "approval",
      gradient: "from-[#f59e0b] to-[#d97706]",
      icon: <Clock className="w-4 h-4 md:w-5 md:h-5" />,
    },
    {
      label: "Selesai",
      value: dash.repairCompleted,
      sub: "perbaikan",
      gradient: "from-[#10b981] to-[#059669]",
      icon: <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5" />,
    },
    {
      label: "Ke WH",
      value: dash.handedToWarehouse,
      sub: "warehouse",
      gradient: "from-[#8b5cf6] to-[#6d28d9]",
      icon: <Package className="w-4 h-4 md:w-5 md:h-5" />,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 md:gap-4">
      {cards.map((c) => (
        <motion.div
          key={c.label}
          variants={cardHoverVariants}
          initial="rest"
          whileHover="hover"
          className={`relative overflow-hidden rounded-2xl p-3 md:p-4 shadow-sm text-white bg-gradient-to-br ${c.gradient} cursor-default min-h-[88px]`}
        >
          <div className="absolute -top-5 -right-5 w-20 h-20 bg-white/10 rounded-full" />
          <div className="relative z-10 flex flex-col h-full justify-between gap-2">
            <div className="flex items-start justify-between gap-1">
              <span className="text-[10px] md:text-xs font-semibold opacity-90 leading-tight">{c.label}</span>
              <div className="p-1 bg-white/20 rounded-md backdrop-blur-sm shrink-0">{c.icon}</div>
            </div>
            <div className="flex items-end justify-between gap-1">
              <p className="text-xl md:text-2xl font-bold tracking-tight leading-none">{c.value}</p>
              {c.sub && <p className="text-[9px] md:text-[10px] opacity-80 font-medium text-right">{c.sub}</p>}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
