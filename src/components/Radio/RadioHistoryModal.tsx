
import { useEffect, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "../ui/dialog";
import { radioApi, RadioHistoryDto, RadioDto } from "../../services/radioApi";
import { userApi } from "../../services/api";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Clock, Radio, CheckCircle2, RefreshCw, Trash2, AlertCircle, Info, Building2, Users, Zap, Wrench, ArrowRightLeft } from "lucide-react";

interface RadioHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    radioId: number | null;
}

interface ResolvedUser {
    displayName: string;
    fullName: string;
    username: string | null;
    photoUrl: string | null;
}

async function resolveUser(createdBy: string): Promise<ResolvedUser> {
    const fallback = (name: string): ResolvedUser => ({
        displayName: name,
        fullName: name,
        username: null,
        photoUrl: null,
    });

    if (!createdBy || createdBy === "System") return fallback("System");

    const nameMatch = createdBy.match(/^(.*?)\s*\(([^)]+)\)$/);
    if (nameMatch) {
        const fullName = nameMatch[1].trim();
        const username = nameMatch[2];
        try {
            const users = await userApi.getAll();
            const found = users.find((u: any) =>
                u.username?.toLowerCase() === username.toLowerCase()
            );
            return {
                displayName: createdBy,
                fullName,
                username,
                photoUrl: found?.photoUrl ?? null,
            };
        } catch {
            return { displayName: createdBy, fullName, username, photoUrl: null };
        }
    }

    const userId = parseInt(createdBy, 10);
    if (!isNaN(userId)) {
        try {
            const user = await userApi.getById(userId);
            if (user) {
                const fullName = user.fullName || user.username || createdBy;
                const username = user.username || null;
                return {
                    displayName: username ? `${fullName} (${username})` : fullName,
                    fullName,
                    username,
                    photoUrl: user.photoUrl ?? null,
                };
            }
        } catch {
            // fallback silently
        }
    }

    return fallback(createdBy);
}

export default function RadioHistoryModal({
    isOpen,
    onClose,
    radioId,
}: RadioHistoryModalProps) {
    const [history, setHistory] = useState<RadioHistoryDto[]>([]);
    const [radioInfo, setRadioInfo] = useState<RadioDto | null>(null);
    const [resolvedUsers, setResolvedUsers] = useState<Record<number, ResolvedUser>>({});
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen && radioId) {
            fetchHistory();
        } else {
            setHistory([]);
            setRadioInfo(null);
            setResolvedUsers({});
        }
    }, [isOpen, radioId]);

    const fetchHistory = async () => {
        if (!radioId) return;
        setIsLoading(true);
        try {
            // Fetch history and radio info in parallel
            const [historyRes, radioRes] = await Promise.all([
                radioApi.getHistory(radioId),
                radioApi.getById(radioId),
            ]);
            const items = historyRes.data.data;
            setHistory(items);
            setRadioInfo(radioRes.data.data);

            const userMap: Record<number, ResolvedUser> = {};
            await Promise.all(
                items.map(async (item) => {
                    userMap[item.id] = await resolveUser(item.createdBy || "System");
                })
            );
            setResolvedUsers(userMap);
        } catch (error) {
            console.error("Failed to fetch history", error);
        } finally {
            setIsLoading(false);
        }
    };

    const getActionConfig = (type: string) => {
        switch (type) {
            case "Created":
                return {
                    badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
                    dot: "bg-emerald-500",
                    icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />,
                    label: "Dibuat",
                };
            case "Updated":
                return {
                    badge: "bg-blue-100 text-blue-700 border-blue-200",
                    dot: "bg-blue-500",
                    icon: <RefreshCw className="w-3.5 h-3.5 text-blue-600" />,
                    label: "Diperbarui",
                };
            case "Transferred":
                return {
                    badge: "bg-sky-100 text-sky-700 border-sky-200",
                    dot: "bg-sky-500",
                    icon: <ArrowRightLeft className="w-3.5 h-3.5 text-sky-600" />,
                    label: "Dipindahkan",
                };
            case "Scrapped":
                return {
                    badge: "bg-red-100 text-red-700 border-red-200",
                    dot: "bg-red-500",
                    icon: <Trash2 className="w-3.5 h-3.5 text-red-600" />,
                    label: "Di-scrap",
                };
            case "RepairOpened":
                return {
                    badge: "bg-violet-100 text-violet-700 border-violet-200",
                    dot: "bg-violet-500",
                    icon: <Wrench className="w-3.5 h-3.5 text-violet-600" />,
                    label: "Perbaikan dibuka",
                };
            case "RepairStatusChanged":
                return {
                    badge: "bg-amber-100 text-amber-800 border-amber-200",
                    dot: "bg-amber-500",
                    icon: <RefreshCw className="w-3.5 h-3.5 text-amber-600" />,
                    label: "Status perbaikan",
                };
            case "RepairHandoverWarehouse":
                return {
                    badge: "bg-teal-100 text-teal-700 border-teal-200",
                    dot: "bg-teal-500",
                    icon: <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />,
                    label: "Serah ke warehouse",
                };
            case "RepairReturnedToHelpdesk":
                return {
                    badge: "bg-indigo-100 text-indigo-700 border-indigo-200",
                    dot: "bg-indigo-500",
                    icon: <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />,
                    label: "Kembali ke helpdesk",
                };
            default:
                return {
                    badge: "bg-gray-100 text-gray-600 border-gray-200",
                    dot: "bg-gray-400",
                    icon: <AlertCircle className="w-3.5 h-3.5 text-gray-500" />,
                    label: type,
                };
        }
    };

    const getInitials = (name: string): string => {
        const clean = name.replace(/\s*\(.*\)$/, "").trim();
        const parts = clean.split(" ").filter(Boolean);
        if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
        if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
        return "?";
    };

    const getAvatarColor = (name: string): string => {
        const colors = [
            "bg-violet-500", "bg-blue-500", "bg-emerald-500",
            "bg-amber-500", "bg-rose-500", "bg-cyan-500",
            "bg-indigo-500", "bg-teal-500", "bg-pink-500", "bg-orange-500",
        ];
        let hash = 0;
        for (let i = 0; i < name.length; i++) hash = (hash + name.charCodeAt(i)) % colors.length;
        return colors[hash];
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
                <DialogHeader className="pb-3 border-b border-gray-100 flex-shrink-0">
                    <DialogTitle className="flex items-center gap-2.5 text-base font-bold text-gray-900">
                        <div className="p-1.5 bg-violet-100 rounded-lg">
                            <Clock className="w-4 h-4 text-violet-600" />
                        </div>
                        Riwayat Perubahan Radio
                        {history.length > 0 && (
                            <span className="ml-auto text-xs font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                                {history.length} entri
                            </span>
                        )}
                    </DialogTitle>

                    {/* Radio info card */}
                    {radioInfo && (
                        <div className="mt-3 flex flex-wrap gap-2">
                            {/* Kategori */}
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                                radioInfo.category === "Internal"
                                    ? "bg-violet-100 text-violet-700 border-violet-200"
                                    : radioInfo.category === "Contractor"
                                    ? "bg-blue-100 text-blue-700 border-blue-200"
                                    : radioInfo.category === "Unit"
                                    ? "bg-green-100 text-green-700 border-green-200"
                                    : "bg-gray-100 text-gray-600 border-gray-200"
                            }`}>
                                <Radio className="w-3 h-3" />
                                {radioInfo.category}
                            </span>

                            {/* Jenis */}
                            {radioInfo.isTrunking && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border bg-blue-100 text-blue-700 border-blue-200">
                                    <Zap className="w-3 h-3" />
                                    Trunking
                                </span>
                            )}
                            {radioInfo.isConventional && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border bg-green-100 text-green-700 border-green-200">
                                    <Zap className="w-3 h-3" />
                                    Konvensional
                                </span>
                            )}

                            {/* Divisi */}
                            {(radioInfo.division || radioInfo.company) && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border bg-amber-100 text-amber-700 border-amber-200">
                                    <Building2 className="w-3 h-3" />
                                    {radioInfo.division || radioInfo.company}
                                </span>
                            )}

                            {/* Dept */}
                            {radioInfo.department && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border bg-teal-100 text-teal-700 border-teal-200">
                                    <Users className="w-3 h-3" />
                                    {radioInfo.department}
                                </span>
                            )}

                            {/* Identifier */}
                            {(radioInfo.nomorAset || radioInfo.serialNumber) && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border bg-gray-100 text-gray-600 border-gray-200 font-mono">
                                    {radioInfo.nomorAset || radioInfo.serialNumber}
                                </span>
                            )}
                        </div>
                    )}
                </DialogHeader>

                <div className="overflow-y-auto flex-1 py-4">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-3">
                            <div className="animate-spin rounded-full h-8 w-8 border-[3px] border-violet-200 border-t-violet-600" />
                            <span className="text-sm text-gray-500">Memuat riwayat...</span>
                        </div>
                    ) : history.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
                            <div className="p-4 bg-gray-100 rounded-full">
                                <Radio className="w-8 h-8 opacity-40" />
                            </div>
                            <p className="text-sm font-medium">Belum ada riwayat perubahan</p>
                        </div>
                    ) : (
                        <div className="relative pl-8">
                            <div className="absolute left-3.5 top-2 bottom-2 w-px bg-gray-200" />
                            <div className="space-y-4">
                                {history.map((item) => {
                                    const cfg = getActionConfig(item.action);
                                    const resolved = resolvedUsers[item.id];
                                    const fullName = resolved?.fullName || item.createdBy || "System";
                                    const username = resolved?.username;
                                    const photoUrl = resolved?.photoUrl;
                                    const initials = getInitials(fullName);
                                    const avatarColor = getAvatarColor(fullName);

                                    const hasChanges = item.changes &&
                                        item.changes !== "-" &&
                                        item.changes !== "Tidak ada perubahan terdeteksi";
                                    const isNoDiff = item.changes === "Tidak ada perubahan terdeteksi";
                                    const diffLines = hasChanges ? item.changes!.split("\n").filter(Boolean) : [];

                                    return (
                                        <div key={item.id} className="relative">
                                            <div className={`absolute -left-[22px] top-3.5 w-3 h-3 rounded-full border-2 border-white shadow-sm ${cfg.dot}`} />
                                            <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all p-4">
                                                {/* Badge + timestamp */}
                                                <div className="flex items-center justify-between mb-3">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.badge}`}>
                                                        {cfg.icon}
                                                        {cfg.label}
                                                    </span>
                                                    <span className="text-xs text-gray-400 flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {format(new Date(item.createdAt), "dd MMM yyyy, HH:mm", { locale: localeId })}
                                                    </span>
                                                </div>

                                                {/* User avatar + name */}
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-8 h-8 rounded-full flex-shrink-0 shadow-sm overflow-hidden">
                                                        {photoUrl ? (
                                                            <img
                                                                src={photoUrl}
                                                                alt={fullName}
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => {
                                                                    const el = e.currentTarget.parentElement as HTMLElement;
                                                                    el.classList.add(avatarColor);
                                                                    el.innerHTML = `<span class="text-white text-[11px] font-bold flex items-center justify-center w-full h-full">${initials}</span>`;
                                                                }}
                                                            />
                                                        ) : (
                                                            <div className={`w-full h-full ${avatarColor} flex items-center justify-center`}>
                                                                <span className="text-white text-[11px] font-bold">{initials}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold text-gray-800 leading-tight truncate">{fullName}</p>
                                                        {username && <p className="text-xs text-gray-400 leading-tight">@{username}</p>}
                                                    </div>
                                                </div>

                                                {/* Diff for Updated */}
                                                {item.action === "Updated" && (
                                                    <div className="mt-3">
                                                        {diffLines.length > 0 ? (
                                                            <>
                                                                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                                                                    Perubahan ({diffLines.length} field)
                                                                </p>
                                                                <div className="space-y-1">
                                                                    {diffLines.map((line, i) => {
                                                                        const arrowIdx = line.indexOf(" → ");
                                                                        if (arrowIdx !== -1) {
                                                                            const colonIdx = line.indexOf(": ");
                                                                            const field = colonIdx !== -1 ? line.slice(0, colonIdx) : "";
                                                                            const oldVal = colonIdx !== -1 ? line.slice(colonIdx + 2, arrowIdx).replace(/^"|"$/g, "") : "";
                                                                            const newVal = line.slice(arrowIdx + 3).replace(/^"|"$/g, "");
                                                                            return (
                                                                                <div key={i} className="grid grid-cols-[80px_1fr_16px_1fr] items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100 text-xs">
                                                                                    <span className="font-semibold text-gray-500 truncate">{field}</span>
                                                                                    <span className="text-red-500 line-through font-mono truncate bg-red-50 px-1.5 py-0.5 rounded" title={oldVal}>
                                                                                        {oldVal || <span className="italic opacity-50">kosong</span>}
                                                                                    </span>
                                                                                    <span className="text-gray-400 text-center">→</span>
                                                                                    <span className="text-emerald-600 font-mono font-semibold truncate bg-emerald-50 px-1.5 py-0.5 rounded" title={newVal}>
                                                                                        {newVal || <span className="italic opacity-50">kosong</span>}
                                                                                    </span>
                                                                                </div>
                                                                            );
                                                                        }
                                                                        return (
                                                                            <div key={i} className="px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100 text-xs text-gray-600 font-mono">
                                                                                {line}
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </>
                                                        ) : isNoDiff ? (
                                                            <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-1">
                                                                <Info className="w-3 h-3" />
                                                                Tidak ada perubahan terdeteksi
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 rounded-lg border border-amber-100 text-xs text-amber-600 mt-1">
                                                                <Info className="w-3 h-3 flex-shrink-0" />
                                                                Detail perubahan tidak tersedia untuk data lama
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Scrap details */}
                                                {item.action === "Scrapped" && item.changes && item.changes !== "-" && (
                                                    <div className="mt-3 px-3 py-2 bg-red-50 rounded-lg border border-red-100 text-xs text-red-700 font-mono">
                                                        {item.changes}
                                                    </div>
                                                )}

                                                {/* Transfer details */}
                                                {item.action === "Transferred" && item.changes && (
                                                    <div className="mt-3 px-3 py-2 bg-sky-50 rounded-lg border border-sky-100 text-xs text-sky-700 font-medium flex items-center gap-2">
                                                        <ArrowRightLeft className="w-3.5 h-3.5 flex-shrink-0" />
                                                        {item.changes}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
