import React, { useState } from "react";
import { ResponsiveModal } from "../common/ResponsiveModal";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { ScrapRadioDto, radioApi } from "../../services/radioApi";
import { useToast } from "../../hooks/use-toast";

interface ScrapRadioModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    radioId?: number;
    radioIdentifier?: string;
}

const ScrapRadioModal: React.FC<ScrapRadioModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    radioId,
    radioIdentifier,
}) => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<ScrapRadioDto>({
        dateScrapped: new Date().toISOString().split("T")[0],
        scrapJobNumber: "",
        remarks: "",
    });

    const handleSubmit = async () => {
        if (!radioId) return;
        setLoading(true);
        try {
            await radioApi.scrapRadio(radioId, formData);
            toast({ title: "Success", description: "Radio scrapped successfully" });
            onSuccess();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to scrap radio",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <ResponsiveModal 
            open={isOpen} 
            onOpenChange={onClose}
            title={`Scrap Radio ${radioIdentifier}`}
            desktopClassName="max-w-md"
        >
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Date Scrap *</label>
                        <Input
                            type="date"
                            value={formData.dateScrapped}
                            onChange={(e) => setFormData({ ...formData, dateScrapped: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Job Number</label>
                        <Input
                            value={formData.scrapJobNumber}
                            placeholder="e.g. WO-12345"
                            onChange={(e) => setFormData({ ...formData, scrapJobNumber: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Remarks</label>
                        <Input
                            value={formData.remarks}
                            placeholder="Reason for scrapping..."
                            onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                        />
                    </div>
                </div>
                <div className="flex gap-2 justify-end pt-4 border-t">
                    <Button variant="outline" onClick={onClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading}>
                        {loading ? "Processing..." : "Confirm Scrap"}
                    </Button>
                </div>
        </ResponsiveModal>
    );
};

export default ScrapRadioModal;
