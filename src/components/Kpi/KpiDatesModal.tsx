import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { KpiDocument, UpdateKpiDocumentDatesDto } from "../../types/kpi";
import { kpiApi } from "../../services/kpiApi";
import { useToast } from "../../hooks/use-toast";
import { format, parseISO } from "date-fns";
import { DatePicker } from "../ui/date-picker";

interface KpiDatesModalProps {
    isOpen: boolean;
    onClose: () => void;
    documents: KpiDocument[];
    onSuccess: () => void;
}

export default function KpiDatesModal({ isOpen, onClose, documents, onSuccess }: KpiDatesModalProps) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    const [dates, setDates] = useState<UpdateKpiDocumentDatesDto>({
        dateReceived: "",
        dateSubmittedToReviewer: "",
        dateApproved: "",
        dateSubmittedToRqm: "",
        remarks: "",
        remarksSubmittedToReviewer: "",
        remarksApproved: "",
        remarksSubmittedToRqm: ""
    });

    const isMultiple = documents && documents.length > 1;

    useEffect(() => {
        if (isOpen && documents && documents.length > 0) {
            const firstDoc = documents[0];
            setDates({
                dateReceived: formatDateForInput(firstDoc.dateReceived),
                dateSubmittedToReviewer: formatDateForInput(firstDoc.dateSubmittedToReviewer),
                dateApproved: formatDateForInput(firstDoc.dateApproved),
                dateSubmittedToRqm: formatDateForInput(firstDoc.dateSubmittedToRqm),
                remarks: firstDoc.remarks || "",
                remarksSubmittedToReviewer: firstDoc.remarksSubmittedToReviewer || "",
                remarksApproved: firstDoc.remarksApproved || "",
                remarksSubmittedToRqm: firstDoc.remarksSubmittedToRqm || ""
            });
        }
    }, [isOpen, documents]);

    const formatDateForInput = (dateStr?: string | null) => {
        if (!dateStr) return "";
        try {
            return format(parseISO(dateStr), "yyyy-MM-dd");
        } catch {
            return "";
        }
    };

    const handleChange = (field: keyof UpdateKpiDocumentDatesDto, value: string) => {
        setDates(prev => ({ ...prev, [field]: value === "" ? null : value }));
    };

    const handleDateChange = (field: keyof UpdateKpiDocumentDatesDto, date: Date | undefined) => {
        const value = date ? format(date, "yyyy-MM-dd") : null;
        setDates(prev => ({ ...prev, [field]: value }));
    };

    const parseDateString = (dateStr: string | null | undefined): Date | undefined => {
        if (!dateStr) return undefined;
        try {
            const d = parseISO(dateStr);
            return isNaN(d.getTime()) ? undefined : d;
        } catch {
            return undefined;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!documents || documents.length === 0) return;

        setLoading(true);
        try {
            const payload = {
                dateReceived: dates.dateReceived || null,
                dateSubmittedToReviewer: dates.dateSubmittedToReviewer || null,
                dateApproved: dates.dateApproved || null,
                dateSubmittedToRqm: dates.dateSubmittedToRqm || null,
                remarks: dates.remarks || null,
                remarksSubmittedToReviewer: dates.remarksSubmittedToReviewer || null,
                remarksApproved: dates.remarksApproved || null,
                remarksSubmittedToRqm: dates.remarksSubmittedToRqm || null
            };

            if (isMultiple) {
                // If updating in bulk, WE DO NOT update Date Received to avoid overwriting individual dates
                delete (payload as any).dateReceived;
            }

            await Promise.all(documents.map(doc => kpiApi.updateDates(doc.id, payload)));

            toast({ title: "Progress berhasil diupdate" });
            onSuccess();
            onClose();
        } catch (error: any) {
            toast({
                title: "Gagal update",
                description: error.response?.data?.message || "Terjadi kesalahan",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    // Helper functions for quick actions
    const setToday = (field: keyof UpdateKpiDocumentDatesDto) => {
        setDates(prev => ({ ...prev, [field]: format(new Date(), "yyyy-MM-dd") }));
    };

    if (!documents || documents.length === 0) return null;
    const firstDoc = documents[0];

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-md rounded-2xl">
                <DialogHeader>
                    <DialogTitle className="text-xl"> Update Progres {isMultiple ? `Massal (${documents.length})` : "Dokumen"} </DialogTitle>
                </DialogHeader>
                <div className="bg-gray-50 -mx-6 px-6 py-3 border-y mb-4">
                    <p className="text-sm text-gray-500 font-medium">Dokumen</p>
                    <p className="font-semibold text-gray-900">{isMultiple ? `Grup Data Terpilih (${documents.length} dokumen)` : firstDoc.documentName}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Asal: {isMultiple ? "Multi Data Source" : firstDoc.dataSource}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-3">
                        {!isMultiple && (
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center">
                                    <Label className="text-xs font-semibold text-gray-500 uppercase">1. Date Received (Terima Laporan)</Label>
                                    <button type="button" onClick={() => setToday('dateReceived')} className="text-xs text-indigo-600 font-medium hover:underline">Hari Ini</button>
                                </div>
                                <DatePicker
                                    date={parseDateString(dates.dateReceived)}
                                    onSelect={(d) => handleDateChange("dateReceived", d)}
                                    className={dates.dateReceived ? "border-indigo-200 bg-indigo-50" : ""}
                                />
                            </div>
                        )}

                        <div className="space-y-1.5 bg-white p-2.5 rounded-lg border shadow-sm">
                            <div className="flex justify-between items-center mb-1">
                                <Label className="text-xs font-bold text-gray-700 uppercase">2. Submitted To User (Dikirim via Email)</Label>
                                <button type="button" onClick={() => setToday('dateSubmittedToReviewer')} className="text-xs text-indigo-600 font-medium hover:bg-indigo-50 px-2 py-0.5 rounded transition-colors">Hari Ini</button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                <DatePicker
                                    date={parseDateString(dates.dateSubmittedToReviewer)}
                                    onSelect={(d) => handleDateChange("dateSubmittedToReviewer", d)}
                                    className={`w-full ${dates.dateSubmittedToReviewer ? "border-indigo-200 bg-indigo-50" : ""}`}
                                />
                                <Input
                                    placeholder="Catatan pengiriman..."
                                    value={dates.remarksSubmittedToReviewer || ""}
                                    onChange={(e) => handleChange("remarksSubmittedToReviewer", e.target.value)}
                                    className="text-sm h-9 border-gray-200"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5 bg-white p-2.5 rounded-lg border shadow-sm">
                            <div className="flex justify-between items-center mb-1">
                                <Label className="text-xs font-bold text-gray-700 uppercase">3. Approved By User (Email dibalas ACC)</Label>
                                <button type="button" onClick={() => setToday('dateApproved')} className="text-xs text-indigo-600 font-medium hover:bg-indigo-50 px-2 py-0.5 rounded transition-colors">Hari Ini</button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                <DatePicker
                                    date={parseDateString(dates.dateApproved)}
                                    onSelect={(d) => handleDateChange("dateApproved", d)}
                                    className={`w-full ${dates.dateApproved ? "border-indigo-200 bg-indigo-50" : ""}`}
                                />
                                <Input
                                    placeholder="Catatan approval..."
                                    value={dates.remarksApproved || ""}
                                    onChange={(e) => handleChange("remarksApproved", e.target.value)}
                                    className="text-sm h-9 border-gray-200"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5 bg-white p-2.5 rounded-lg border shadow-sm">
                            <div className="flex justify-between items-center mb-1">
                                <Label className="text-xs font-bold text-gray-700 uppercase">4. Submitted RQM (Diserahkan ke Fin)</Label>
                                <button type="button" onClick={() => setToday('dateSubmittedToRqm')} className="text-xs text-indigo-600 font-medium hover:bg-green-50 text-green-700 px-2 py-0.5 rounded transition-colors">Hari Ini</button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                <DatePicker
                                    date={parseDateString(dates.dateSubmittedToRqm)}
                                    onSelect={(d) => handleDateChange("dateSubmittedToRqm", d)}
                                    className={`w-full ${dates.dateSubmittedToRqm ? "border-green-200 bg-green-50" : ""}`}
                                />
                                <Input
                                    placeholder="Catatan RQM..."
                                    value={dates.remarksSubmittedToRqm || ""}
                                    onChange={(e) => handleChange("remarksSubmittedToRqm", e.target.value)}
                                    className="text-sm h-9 border-gray-200 focus-visible:ring-green-500"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5 pt-2">
                            <div className="flex justify-between items-center">
                                <Label className="text-xs font-semibold text-red-500 uppercase">Remarks / Notes Khusus</Label>
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
                                        checked={(dates.remarks || "").toUpperCase().includes("TIDAK SUBMIT")}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                handleChange("remarks", "Tidak Submit RQM");
                                            } else {
                                                handleChange("remarks", "");
                                            }
                                        }}
                                    />
                                    <span className="text-xs font-medium text-gray-500 group-hover:text-indigo-600 transition-colors">Tandai Selesai (Tanpa RQM)</span>
                                </label>
                            </div>
                            <Input
                                placeholder="Cth: tidak submit ke rqm, direvisi, dll"
                                value={dates.remarks || ""}
                                onChange={(e) => handleChange("remarks", e.target.value)}
                                className="border-red-100 placeholder:text-red-200 focus-visible:ring-red-500"
                            />
                        </div>
                    </div>

                    <DialogFooter className="mt-6 border-t pt-4">
                        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Batal</Button>
                        <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">Simpan Progres</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
