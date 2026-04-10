import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { 
    Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue 
} from "../ui/select";
import { KpiDocument, CreateKpiDocumentDto, UpdateKpiDocumentDto } from "../../types/kpi";
import { kpiApi } from "../../services/kpiApi";
import { useToast } from "../../hooks/use-toast";
import { Link2, Info } from "lucide-react";

interface KpiFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    document: KpiDocument | null;
    periodMonth: string;
    existingTags?: string[];
    onSuccess: () => void;
}

const COMMON_AREAS = [
    "GENERAL",
    "BAO SANGATTA",
    "BAO VIA EMAIL",
    "BAO BENGALON",
    "WEST Operation"
];

export default function KpiFormModal({ isOpen, onClose, document, periodMonth, existingTags = [], onSuccess }: KpiFormModalProps) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    
    const isEdit = !!document;

    const [formData, setFormData] = useState({
        areaGroup: "GENERAL",
        documentName: "",
        dataSource: "",
        groupTag: ""
    });

    useEffect(() => {
        if (isOpen) {
            if (isEdit && document) {
                setFormData({
                    areaGroup: document.areaGroup,
                    documentName: document.documentName,
                    dataSource: document.dataSource,
                    groupTag: document.groupTag ?? ""
                });
            } else {
                setFormData({
                    areaGroup: "GENERAL",
                    documentName: "",
                    dataSource: "",
                    groupTag: ""
                });
            }
        }
    }, [isOpen, document, isEdit]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.documentName || !formData.dataSource) {
            toast({ title: "Validasi", description: "Lengkapi nama dokumen dan asal data", variant: "destructive" });
            return;
        }

        setLoading(true);
        try {
            if (isEdit && document) {
                const payload: UpdateKpiDocumentDto = {
                    areaGroup: formData.areaGroup,
                    documentName: formData.documentName,
                    dataSource: formData.dataSource,
                    groupTag: formData.groupTag.trim() || undefined,
                    remarks: document.remarks
                };
                await kpiApi.update(document.id, payload);
                toast({ title: "Dokumen berhasil diperbarui" });
            } else {
                const payload: CreateKpiDocumentDto = {
                    periodMonth: periodMonth,
                    areaGroup: formData.areaGroup,
                    documentName: formData.documentName,
                    dataSource: formData.dataSource,
                    groupTag: formData.groupTag.trim() || undefined
                };
                await kpiApi.create(payload);
                toast({ title: "Dokumen baru berhasil dibuat" });
            }
            onSuccess();
            onClose();
        } catch (error: any) {
            toast({
                title: "Gagal menyimpan",
                description: error.response?.data?.message || "Terjadi kesalahan",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-md rounded-2xl">
                <DialogHeader>
                    <DialogTitle className="text-xl">{isEdit ? "Edit Informasi Dokumen" : "Tambah Dokumen KPI Baru"}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                    <div className="space-y-1.5">
                        <Label>Grup / Wilayah (Sub Header Tabel)</Label>
                        <Select 
                            value={formData.areaGroup} 
                            onValueChange={(val) => setFormData(prev => ({ ...prev, areaGroup: val }))}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Pilih area / grup" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    {COMMON_AREAS.map(area => (
                                        <SelectItem key={area} value={area}>{area}</SelectItem>
                                    ))}
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                        <p className="text-[10px] text-gray-500 text-right">Ditulis bebas di database, ini opsi defaultnya.</p>
                    </div>

                    <div className="space-y-1.5">
                        <Label>Nama Dokumen / Data</Label>
                        <Input 
                            placeholder="Contoh: CALL RECORD, REPORT HSE" 
                            value={formData.documentName} 
                            onChange={(e) => setFormData(prev => ({ ...prev, documentName: e.target.value }))} 
                            required
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label>Asal Data (Orang/Sender)</Label>
                        <Input 
                            placeholder="Contoh: Bpk. Gunawan" 
                            value={formData.dataSource} 
                            onChange={(e) => setFormData(prev => ({ ...prev, dataSource: e.target.value }))} 
                            required
                        />
                    </div>

                    {/* Group Tag — new field for merge grouping */}
                    <div className="space-y-1.5">
                        <Label className="flex items-center gap-1.5">
                            <Link2 className="w-3.5 h-3.5 text-indigo-500" />
                            Tag Grup <span className="text-gray-400 font-normal text-xs">(opsional)</span>
                        </Label>
                        <Input 
                            placeholder="Contoh: G1, BATCH-A, NEC-GROUP" 
                            value={formData.groupTag} 
                            onChange={(e) => setFormData(prev => ({ ...prev, groupTag: e.target.value }))} 
                            list="existing-group-tags"
                        />
                        <datalist id="existing-group-tags">
                            {existingTags.map(tag => (
                                <option key={tag} value={tag} />
                            ))}
                        </datalist>
                        <div className="flex items-start gap-1.5 bg-indigo-50 text-indigo-700 rounded-lg px-3 py-2 text-[11px] border border-indigo-100">
                            <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                            <p>
                                Isi <strong>Tag Grup</strong> yang sama pada beberapa dokumen agar baris-baris tersebut 
                                digabung (merge) di tabel — seperti di Excel. Kosongkan jika baris ini berdiri sendiri.
                            </p>
                        </div>
                    </div>

                    <DialogFooter className="mt-8 border-t pt-4">
                        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Batal</Button>
                        <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">
                            {isEdit ? "Simpan Perubahan" : "Buat Dokumen"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
