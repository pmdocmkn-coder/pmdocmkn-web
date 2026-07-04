import React, { forwardRef } from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import type { WarehouseBorrowDetail } from "../../types/warehouseBorrow";
import mknLogo from "../../assets/MKN.png";

interface PrintMaterialTemplateProps {
  itemsToPrint: WarehouseBorrowDetail[];
}

type BorrowItem = WarehouseBorrowDetail["items"][number];

const FIRST_PAGE_ITEM_LIMIT = 15;
const NEXT_PAGE_ITEM_LIMIT = 18;

const statusLabel = (s: string) => {
  switch (s) {
    case "PendingApproval": return "Menunggu Persetujuan";
    case "PendingSignature": return "Menunggu TTD";
    case "Approved": return "Disetujui";
    case "Rejected": return "Ditolak";
    case "Issued": return "Telah Diserahkan";
    case "PendingReturnSignature": return "Menunggu TTD Pengembalian";
    case "Returned": return "Dikembalikan";
    case "Cancelled": return "Dibatalkan";
    default: return s;
  }
};

const chunkBorrowItems = (items: BorrowItem[]) => {
  if (items.length <= FIRST_PAGE_ITEM_LIMIT) return [items];

  const chunks: BorrowItem[][] = [items.slice(0, FIRST_PAGE_ITEM_LIMIT)];
  let cursor = FIRST_PAGE_ITEM_LIMIT;

  while (cursor < items.length) {
    chunks.push(items.slice(cursor, cursor + NEXT_PAGE_ITEM_LIMIT));
    cursor += NEXT_PAGE_ITEM_LIMIT;
  }

  return chunks;
};

const sumQuantity = (items: BorrowItem[]) => items.reduce((sum, item) => sum + item.quantity, 0);

const PrintMaterialTemplate = forwardRef<HTMLDivElement, PrintMaterialTemplateProps>(
  ({ itemsToPrint }, ref) => {
    const renderHeader = (borrow: WarehouseBorrowDetail, isContinuation: boolean, pageNumber: number, pageCount: number) => (
      <>
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 0 }}>
          <tbody>
            <tr>
              <td style={{ width: 80, verticalAlign: "middle", paddingRight: 16 }}>
                <img src={mknLogo} alt="MKN" style={{ width: 64, height: "auto" }} />
              </td>
              <td style={{ verticalAlign: "middle" }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#1B3A6B", letterSpacing: 1, lineHeight: 1.2 }}>
                  PT. Multi Kontrol Nusantara
                </div>
                <div style={{ fontSize: 11, color: "#718096", marginTop: 2, letterSpacing: 0.3 }}>
                  Bukti Serah Terima Material / Part Warehouse
                </div>
                {isContinuation && (
                  <div style={{ fontSize: 10, color: "#2B6CB0", fontWeight: 700, marginTop: 6, textTransform: "uppercase", letterSpacing: 0.8 }}>
                    Lanjutan daftar part / material - Halaman {pageNumber} dari {pageCount}
                  </div>
                )}
              </td>
              <td style={{ textAlign: "right", verticalAlign: "middle" }}>
                <div style={{
                  display: "inline-block",
                  background: "#EBF4FF",
                  border: "1.5px solid #2B6CB0",
                  borderRadius: 8,
                  padding: "8px 18px",
                  textAlign: "center",
                  minWidth: 180
                }}>
                  <div style={{ fontSize: 10, color: "#2B6CB0", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 2 }}>
                    No. Transaksi
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#1B3A6B", fontFamily: "'Courier New', monospace", letterSpacing: 1 }}>
                    {borrow.borrowNumber}
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div style={{ borderBottom: "3px solid #1B3A6B", margin: "8px 0 12px 0" }} />
      </>
    );

    const renderInfo = (borrow: WarehouseBorrowDetail) => (
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 12, fontSize: 11 }}>
        <tbody>
          <tr>
            <td style={{ width: "50%", paddingBottom: 6, verticalAlign: "top" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  <tr>
                    <td style={{ color: "#718096", width: 120, paddingBottom: 3 }}>Tanggal</td>
                    <td style={{ fontWeight: 600, paddingBottom: 3 }}>
                      : {format(new Date(borrow.requestedAt), "dd MMMM yyyy, HH:mm", { locale: localeId })} WIB
                    </td>
                  </tr>
                  <tr>
                    <td style={{ color: "#718096", paddingBottom: 3 }}>Peminjam</td>
                    <td style={{ fontWeight: 600, paddingBottom: 3 }}>
                      : {borrow.borrowerName || borrow.borrowedByName}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ color: "#718096", paddingBottom: 3 }}>Keperluan</td>
                    <td style={{ paddingBottom: 3 }}>: {borrow.purpose || "-"}</td>
                  </tr>
                </tbody>
              </table>
            </td>
            <td style={{ width: "50%", paddingBottom: 6, verticalAlign: "top" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  <tr>
                    <td style={{ color: "#718096", width: 130, paddingBottom: 3 }}>Status</td>
                    <td style={{ fontWeight: 600, paddingBottom: 3 }}>: {statusLabel(borrow.status)}</td>
                  </tr>
                  {borrow.ticketNumber && (
                    <tr>
                      <td style={{ color: "#718096", paddingBottom: 3 }}>No. Tiket</td>
                      <td style={{ fontWeight: 700, color: "#2B6CB0", paddingBottom: 3 }}>
                        : {borrow.ticketNumber}
                      </td>
                    </tr>
                  )}
                  {borrow.relatedJobNumber && (
                    <tr>
                      <td style={{ color: "#718096", paddingBottom: 3 }}>No. Pekerjaan</td>
                      <td style={{ fontWeight: 600, paddingBottom: 3 }}>: {borrow.relatedJobNumber}</td>
                    </tr>
                  )}
                  {borrow.issuedAt && (
                    <tr>
                      <td style={{ color: "#718096", paddingBottom: 3 }}>Waktu Keluar</td>
                      <td style={{ paddingBottom: 3 }}>: {format(new Date(borrow.issuedAt), "dd/MM/yyyy HH:mm")}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>
    );

    const renderItems = (
      borrow: WarehouseBorrowDetail,
      items: BorrowItem[],
      startIndex: number,
      isLastPage: boolean,
    ) => (
      <>
        <div style={{ fontSize: 9.5, fontWeight: 700, color: "#1B3A6B", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 4 }}>
          Daftar Part / Material
        </div>
        <table className="print-item-table" style={{
          width: "100%",
          borderCollapse: "collapse",
          border: "1.5px solid #1B3A6B",
          marginBottom: isLastPage ? 14 : 0,
          fontSize: 10,
        }}>
          <thead>
            <tr style={{ background: "#1B3A6B", color: "#fff" }}>
              <th style={{ padding: "5px 8px", textAlign: "center", width: 38, fontWeight: 700, borderRight: "1px solid #2B6CB0" }}>No</th>
              <th style={{ padding: "5px 8px", textAlign: "left", fontWeight: 700, borderRight: "1px solid #2B6CB0" }}>Kode Part</th>
              <th style={{ padding: "5px 8px", textAlign: "left", fontWeight: 700, borderRight: "1px solid #2B6CB0" }}>Deskripsi Part / Material</th>
              <th style={{ padding: "5px 8px", textAlign: "center", width: 58, fontWeight: 700, borderRight: "1px solid #2B6CB0" }}>Qty</th>
              <th style={{ padding: "5px 8px", textAlign: "center", width: 58, fontWeight: 700 }}>Satuan</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => {
              const rowIndex = startIndex + i;
              return (
                <tr key={item.id ?? `${borrow.id}-${rowIndex}`} style={{ background: rowIndex % 2 === 0 ? "#fff" : "#F7F8FA" }}>
                  <td style={{ padding: "4px 8px", textAlign: "center", borderTop: "1px solid #E2E8F0", fontWeight: 600 }}>{rowIndex + 1}</td>
                  <td style={{ padding: "4px 8px", borderTop: "1px solid #E2E8F0", fontFamily: "'Courier New', monospace", fontSize: 9.5, color: "#2B6CB0", fontWeight: 600 }}>
                    {item.partCode || "-"}
                  </td>
                  <td style={{ padding: "4px 8px", borderTop: "1px solid #E2E8F0", fontWeight: 500 }}>{item.partDescription}</td>
                  <td style={{ padding: "4px 8px", textAlign: "center", borderTop: "1px solid #E2E8F0", fontWeight: 800, fontSize: 11, color: "#1B3A6B" }}>
                    {item.quantity}
                  </td>
                  <td style={{ padding: "4px 8px", textAlign: "center", borderTop: "1px solid #E2E8F0", fontWeight: 700, color: "#059669" }}>
                    {item.unit || "-"}
                  </td>
                </tr>
              );
            })}
            {isLastPage && (
              <tr style={{ background: "#EBF4FF", borderTop: "2px solid #1B3A6B" }}>
                <td colSpan={3} style={{ padding: "5px 8px", textAlign: "right", fontWeight: 700, color: "#1B3A6B" }}>
                  TOTAL ITEM: {borrow.items.length} jenis
                </td>
                <td style={{ padding: "5px 8px", textAlign: "center", fontWeight: 800, fontSize: 12, color: "#1B3A6B" }}>
                  {sumQuantity(borrow.items)}
                </td>
                <td style={{ padding: "5px 8px" }} />
              </tr>
            )}
          </tbody>
        </table>
      </>
    );

    const renderSignatures = (borrow: WarehouseBorrowDetail) => (
      <div className="print-keep-together">
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 4 }}>
          <tbody>
            <tr>
              <td style={{ width: "50%", textAlign: "center", verticalAlign: "top", padding: "0 24px" }}>
                <div style={{ fontSize: 9.5, color: "#718096", fontWeight: 600, marginBottom: 4 }}>Yang Menyerahkan,</div>
                <div style={{ height: 48, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {borrow.issuerSignatureBase64 ? (
                    <img src={borrow.issuerSignatureBase64} alt="TTD" style={{ maxHeight: 42, objectFit: "contain" }} />
                  ) : (
                    <div style={{ height: 42 }} />
                  )}
                </div>
                <div style={{ borderTop: "1.5px solid #1A202C", paddingTop: 3, fontSize: 10.5, fontWeight: 700 }}>
                  Admin Warehouse
                </div>
              </td>
              <td style={{ width: "50%", textAlign: "center", verticalAlign: "top", padding: "0 24px" }}>
                <div style={{ fontSize: 9.5, color: "#718096", fontWeight: 600, marginBottom: 4 }}>Yang Menerima,</div>
                <div style={{ height: 48, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {borrow.receiverSignatureBase64 ? (
                    <img src={borrow.receiverSignatureBase64} alt="TTD" style={{ maxHeight: 42, objectFit: "contain" }} />
                  ) : (
                    <div style={{ height: 42 }} />
                  )}
                </div>
                <div style={{ borderTop: "1.5px solid #1A202C", paddingTop: 3, fontSize: 10.5, fontWeight: 700 }}>
                  {borrow.borrowerName || borrow.borrowedByName}
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div style={{ borderTop: "1px dashed #E2E8F0", marginTop: 14, paddingTop: 6, textAlign: "center" }}>
          <span style={{ fontSize: 8, color: "#A0AEC0", letterSpacing: 0.2 }}>
            Dokumen ini dicetak secara otomatis oleh Sistem PM Document Management - PT. Multi Kontrol Nusantara
          </span>
        </div>
      </div>
    );

    return (
      <div ref={ref} style={{ fontFamily: "'Segoe UI', Arial, sans-serif", background: "#fff", color: "#1A202C" }}>
        <style>{`
          @media print {
            @page { size: A4; margin: 0; }
            html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; }
            body * { visibility: hidden !important; }
            .print-material-root, .print-material-root * { visibility: visible !important; }
            .print-material-root {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              background: #fff;
            }
            .print-material-page {
              width: 210mm;
              min-height: 297mm;
              padding: 10mm 14mm;
              box-sizing: border-box;
              background: #fff;
              page-break-after: always;
              break-after: page;
            }
            .print-material-page:last-child {
              page-break-after: auto;
              break-after: auto;
            }
            .print-keep-together {
              page-break-inside: avoid;
              break-inside: avoid;
            }
            .print-item-table thead {
              display: table-header-group;
            }
            .print-item-table tr {
              page-break-inside: avoid;
              break-inside: avoid;
            }
          }
          @media not print {
            .print-material-root { display: none; }
          }
        `}</style>

        <div className="print-material-root">
          {itemsToPrint.flatMap((borrow, borrowIndex) => {
            const chunks = chunkBorrowItems(borrow.items);
            const firstChunkStarts = chunks.reduce<number[]>((acc, chunk, index) => {
              acc[index] = index === 0 ? 0 : acc[index - 1] + chunks[index - 1].length;
              return acc;
            }, []);

            return chunks.map((chunk, pageIndex) => {
              const isFirstPage = pageIndex === 0;
              const isLastPage = pageIndex === chunks.length - 1;

              return (
                <div
                  key={`${borrow.id}-${pageIndex}`}
                  className="print-material-page"
                >
                  {renderHeader(borrow, !isFirstPage, pageIndex + 1, chunks.length)}
                  {isFirstPage && renderInfo(borrow)}
                  {renderItems(borrow, chunk, firstChunkStarts[pageIndex], isLastPage)}
                  {isLastPage && renderSignatures(borrow)}
                </div>
              );
            });
          })}
        </div>
      </div>
    );
  }
);

PrintMaterialTemplate.displayName = "PrintMaterialTemplate";

export default PrintMaterialTemplate;
