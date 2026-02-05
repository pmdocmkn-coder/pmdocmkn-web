import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { ScrapFromRadioDto } from "../../types/radio";

interface ScrapRadioModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (data: ScrapFromRadioDto) => void;
    loading?: boolean;
    radioUnitNumber?: string;
}

const ScrapRadioModal: React.FC<ScrapRadioModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    loading = false,
    radioUnitNumber,
}) => {
    const [formData, setFormData] = useState<ScrapFromRadioDto>({
        dateScrap: new Date().toISOString().split("T")[0],
        jobNumber: "",
        remarks: "",
    });

    const handleSubmit = () => {
        onConfirm(formData);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Scrap Radio {radioUnitNumber}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Date Scrap *</label>
                        <Input
                            type="date"
                            value={formData.dateScrap}
                            onChange={(e) => setFormData({ ...formData, dateScrap: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Job Number</label>
                        <Input
                            value={formData.jobNumber}
                            placeholder="e.g. WO-12345"
                            onChange={(e) => setFormData({ ...formData, jobNumber: e.target.value })}
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
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading}>
                        {loading ? "Processing..." : "Confirm Scrap"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ScrapRadioModal;
