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

interface KpiDatesModalProps {
    isOpen: boolean;
    onClose: () => void;
    document: KpiDocument | null;
    onSuccess: () => void;
}

export default function KpiDatesModal({ isOpen, onClose, document, onSuccess }: KpiDatesModalProps) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    
    const [dates, setDates] = useState<UpdateKpiDocumentDatesDto>({
        dateReceived: "",
        dateSubmittedToReviewer: "",
        dateApproved: "",
        dateSubmittedToRqm: "",
        remarks: ""
    });

    useEffect(() => {
        if (isOpen && document) {
            setDates({
                dateReceived: formatDateForInput(document.dateReceived),
                dateSubmittedToReviewer: formatDateForInput(document.dateSubmittedToReviewer),
                dateApproved: formatDateForInput(document.dateApproved),
                dateSubmittedToRqm: formatDateForInput(document.dateSubmittedToRqm),
                remarks: document.remarks || ""
            });
        }
    }, [isOpen, document]);

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!document) return;

        setLoading(true);
        try {
            // Nullify empty strings to match DTO expectations
            const payload = {
                dateReceived: dates.dateReceived || null,
                dateSubmittedToReviewer: dates.dateSubmittedToReviewer || null,
                dateApproved: dates.dateApproved || null,
                dateSubmittedToRqm: dates.dateSubmittedToRqm || null,
                remarks: dates.remarks || null
            };

            await kpiApi.updateDates(document.id, payload);
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

    if (!document) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-md rounded-2xl">
                <DialogHeader>
                    <DialogTitle className="text-xl">Update Progres Dokumen</DialogTitle>
                </DialogHeader>
                <div className="bg-gray-50 -mx-6 px-6 py-3 border-y mb-4">
                    <p className="text-sm text-gray-500 font-medium">Dokumen</p>
                    <p className="font-semibold text-gray-900">{document.documentName}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Asal: {document.dataSource}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-3">
                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center">
                                <Label className="text-xs font-semibold text-gray-500 uppercase">1. Date Received (Terima Laporan)</Label>
                                <button type="button" onClick={() => setToday('dateReceived')} className="text-xs text-indigo-600 font-medium hover:underline">Hari Ini</button>
                            </div>
                            <Input 
                                type="date" 
                                value={dates.dateReceived || ""} 
                                onChange={(e) => handleChange("dateReceived", e.target.value)} 
                                className={dates.dateReceived ? "border-indigo-200 bg-indigo-50" : ""}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center">
                                <Label className="text-xs font-semibold text-gray-500 uppercase">2. Submitted To User (Dikirim via Email)</Label>
                                <button type="button" onClick={() => setToday('dateSubmittedToReviewer')} className="text-xs text-indigo-600 font-medium hover:underline">Hari Ini</button>
                            </div>
                            <Input 
                                type="date" 
                                value={dates.dateSubmittedToReviewer || ""} 
                                onChange={(e) => handleChange("dateSubmittedToReviewer", e.target.value)} 
                                className={dates.dateSubmittedToReviewer ? "border-indigo-200 bg-indigo-50" : ""}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center">
                                <Label className="text-xs font-semibold text-gray-500 uppercase">3. Approved By User (Email dibalas ACC)</Label>
                                <button type="button" onClick={() => setToday('dateApproved')} className="text-xs text-indigo-600 font-medium hover:underline">Hari Ini</button>
                            </div>
                            <Input 
                                type="date" 
                                value={dates.dateApproved || ""} 
                                onChange={(e) => handleChange("dateApproved", e.target.value)} 
                                className={dates.dateApproved ? "border-indigo-200 bg-indigo-50" : ""}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center">
                                <Label className="text-xs font-semibold text-gray-500 uppercase">4. Submitted RQM (Diserahkan ke Fin)</Label>
                                <button type="button" onClick={() => setToday('dateSubmittedToRqm')} className="text-xs text-indigo-600 font-medium hover:underline">Hari Ini</button>
                            </div>
                            <Input 
                                type="date" 
                                value={dates.dateSubmittedToRqm || ""} 
                                onChange={(e) => handleChange("dateSubmittedToRqm", e.target.value)} 
                                className={dates.dateSubmittedToRqm ? "border-green-200 bg-green-50" : ""}
                            />
                        </div>

                        <div className="space-y-1.5 pt-2">
                            <Label className="text-xs font-semibold text-red-500 uppercase">Remarks / Notes Khusus</Label>
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
