import React, { useEffect, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "../ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../ui/table";
import { Badge } from "../ui/badge";
import { RadioHistory } from "../../types/radio";
import { radioTrunkingApi, radioConventionalApi } from "../../services/radioApi";
import { format } from "date-fns";

interface RadioHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    radioId: number | null;
    type: "trunking" | "conventional";
}

export default function RadioHistoryModal({
    isOpen,
    onClose,
    radioId,
    type,
}: RadioHistoryModalProps) {
    const [history, setHistory] = useState<RadioHistory[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen && radioId) {
            fetchHistory();
        } else {
            setHistory([]);
        }
    }, [isOpen, radioId]);

    const fetchHistory = async () => {
        if (!radioId) return;
        setIsLoading(true);
        try {
            const api = type === "trunking" ? radioTrunkingApi : radioConventionalApi;
            const response = await api.getHistory(radioId);
            setHistory(response.data);
        } catch (error) {
            console.error("Failed to fetch history", error);
        } finally {
            setIsLoading(false);
        }
    };

    const getChangeTypeColor = (type: string) => {
        switch (type) {
            case "Create":
                return "bg-green-100 text-green-800";
            case "Transfer":
                return "bg-blue-100 text-blue-800";
            case "Scrap":
                return "bg-red-100 text-red-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Radio History Log</DialogTitle>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex justify-center p-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Action</TableHead>
                                <TableHead>Unit Number</TableHead>
                                <TableHead>Department</TableHead>
                                <TableHead>Fleet</TableHead>
                                <TableHead>Changed By</TableHead>
                                <TableHead>Notes</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {history.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-4">
                                        No history found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                history.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>
                                            {format(new Date(item.changedAt), "yyyy-MM-dd HH:mm")}
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={getChangeTypeColor(item.changeType)}>
                                                {item.changeType}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span>{item.newUnitNumber}</span>
                                                {item.previousUnitNumber && item.previousUnitNumber !== item.newUnitNumber && (
                                                    <span className="text-xs text-gray-400 line-through">
                                                        {item.previousUnitNumber}
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span>{item.newDept || "-"}</span>
                                                {item.previousDept && item.previousDept !== item.newDept && (
                                                    <span className="text-xs text-gray-400 line-through">
                                                        {item.previousDept}
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span>{item.newFleet || "-"}</span>
                                                {item.previousFleet && item.previousFleet !== item.newFleet && (
                                                    <span className="text-xs text-gray-400 line-through">
                                                        {item.previousFleet}
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>{item.changedByName || "System"}</TableCell>
                                        <TableCell className="max-w-xs truncate" title={item.notes || ""}>
                                            {item.notes || "-"}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                )}
            </DialogContent>
        </Dialog>
    );
}
