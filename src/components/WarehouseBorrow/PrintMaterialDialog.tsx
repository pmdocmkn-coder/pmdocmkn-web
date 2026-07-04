import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "../ui/dialog";
import { Button } from "../ui/button";

import { Printer, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { warehouseBorrowApi } from "../../services/warehouseBorrowApi";
import type { WarehouseBorrowList, WarehouseBorrowDetail } from "../../types/warehouseBorrow";
import { useToast } from "../../hooks/use-toast";

interface PrintMaterialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetBorrow: WarehouseBorrowList | null;
  onConfirmPrint: (itemsToPrint: WarehouseBorrowDetail[]) => void;
}

export default function PrintMaterialDialog({
  open,
  onOpenChange,
  targetBorrow,
  onConfirmPrint
}: PrintMaterialDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [relatedBorrows, setRelatedBorrows] = useState<WarehouseBorrowList[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [fetchingDetails, setFetchingDetails] = useState(false);

  useEffect(() => {
    if (open && targetBorrow) {
      // Selalu mulai dengan memilih item target itu sendiri
      setSelectedIds([targetBorrow.id]);
      
      // Jika punya nomor tiket, cari peminjaman lain dengan tiket yang sama
      if (targetBorrow.ticketNumber) {
        setLoading(true);
        warehouseBorrowApi.getAll({ ticketNumber: targetBorrow.ticketNumber, pageSize: 50 })
          .then(res => {
            // Urutkan agar target utama ada di atas, sisanya berurutan
            const items = res.data ?? [];
            const sortedItems = [
              targetBorrow,
              ...items.filter(i => i.id !== targetBorrow.id)
            ];
            setRelatedBorrows(sortedItems);
            // Otomatis pilih semua yang terkait tiket yang sama
            setSelectedIds(sortedItems.map(i => i.id));
          })
          .catch(() => {
            setRelatedBorrows([targetBorrow]);
          })
          .finally(() => {
            setLoading(false);
          });
      } else {
        setRelatedBorrows([targetBorrow]);
      }
    } else {
      setRelatedBorrows([]);
      setSelectedIds([]);
    }
  }, [open, targetBorrow]);

  const handleToggle = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handlePrint = async () => {
    if (selectedIds.length === 0) {
      toast({ title: "Pilih item", description: "Pilih setidaknya satu peminjaman untuk dicetak", variant: "destructive" });
      return;
    }

    setFetchingDetails(true);
    try {
      // Fetch the full details for the selected IDs so we have the items and signatures
      const detailPromises = selectedIds.map(id => warehouseBorrowApi.getById(id));
      const details = await Promise.all(detailPromises);
      onConfirmPrint(details);
    } catch (err) {
      toast({ title: "Gagal", description: "Gagal memuat detail peminjaman", variant: "destructive" });
    } finally {
      setFetchingDetails(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-blue-600" />
            Cetak Bukti Material
          </DialogTitle>
          <DialogDescription>
            Pilih peminjaman mana saja yang ingin disertakan dalam cetakan.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="space-y-3">
              {relatedBorrows.length > 1 && (
                <div className="mb-4 p-3 bg-blue-50 text-blue-800 text-sm rounded-md border border-blue-100">
                  Ditemukan {relatedBorrows.length - 1} peminjaman lain yang berkaitan dengan tiket <strong>{targetBorrow?.ticketNumber}</strong>. Anda dapat menggabungkannya dalam satu cetakan.
                </div>
              )}
              
              {relatedBorrows.map(borrow => (
                <div key={borrow.id} className="flex items-start space-x-3 p-3 border rounded-md hover:bg-gray-50 transition-colors">
                  <input 
                    type="checkbox"
                    id={`print-item-${borrow.id}`} 
                    checked={selectedIds.includes(borrow.id)}
                    onChange={() => handleToggle(borrow.id)}
                    className="mt-1 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <div className="flex-1">
                    <label htmlFor={`print-item-${borrow.id}`} className="font-medium cursor-pointer flex justify-between">
                      <span>{borrow.borrowNumber}</span>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {borrow.items.length} Barang
                      </span>
                    </label>
                    <div className="text-sm text-gray-600 mt-1 flex justify-between">
                      <span>{borrow.borrowedByName}</span>
                      <span>{format(new Date(borrow.requestedAt), "dd/MM/yyyy")}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={fetchingDetails}>
            Batal
          </Button>
          <Button onClick={handlePrint} disabled={fetchingDetails || selectedIds.length === 0} className="bg-blue-600 hover:bg-blue-700">
            {fetchingDetails ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Printer className="w-4 h-4 mr-2" />
            )}
            Proses Cetak
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
