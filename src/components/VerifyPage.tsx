import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { gatepassApi } from "../services/gatepassQuotationApi";
import { GatepassResponse } from "../types/gatepassQuotation";
import { CheckCircle, XCircle, FileText, User, Calendar, MapPin, Package } from "lucide-react";

export default function VerifyPage() {
    const { token } = useParams<{ token: string }>();
    const [loading, setLoading] = useState(true);
    const [verified, setVerified] = useState(false);
    const [gatepass, setGatepass] = useState<GatepassResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (token) verifyGatepass(token);
    }, [token]);

    const verifyGatepass = async (t: string) => {
        try {
            setLoading(true);
            const result = await gatepassApi.verify(t);
            setVerified(result.verified);
            setGatepass(result.gatepass);
        } catch (err: any) {
            setError(err.response?.data?.message || "Token verifikasi tidak valid");
            setVerified(false);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-500">Memverifikasi tanda tangan digital...</p>
                </div>
            </div>
        );
    }

    if (error || !verified || !gatepass) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-red-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-lg max-w-md w-full p-8 text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <XCircle className="h-8 w-8 text-red-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Verifikasi Gagal</h1>
                    <p className="text-gray-500">{error || "Token verifikasi tidak valid atau gatepass tidak ditemukan."}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-lg max-w-lg w-full overflow-hidden">
                {/* Header */}
                <div className="bg-emerald-600 px-6 py-5 text-white">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                            <CheckCircle className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold">Tanda Tangan Digital Valid</h1>
                            <p className="text-emerald-100 text-sm">Dokumen ini telah diverifikasi</p>
                        </div>
                    </div>
                </div>

                {/* Document Info */}
                <div className="p-6 space-y-4">
                    <div className="flex items-center gap-3 pb-4 border-b">
                        <FileText className="h-5 w-5 text-gray-400" />
                        <div>
                            <p className="text-xs text-gray-500 uppercase">Nomor Gatepass</p>
                            <p className="font-semibold text-gray-900">{gatepass.formattedNumber}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                            <div>
                                <p className="text-xs text-gray-500">Tujuan</p>
                                <p className="text-sm font-medium">{gatepass.destination}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-2">
                            <Calendar className="h-4 w-4 text-gray-400 mt-0.5" />
                            <div>
                                <p className="text-xs text-gray-500">Tanggal</p>
                                <p className="text-sm font-medium">{new Date(gatepass.gatepassDate).toLocaleDateString("id-ID")}</p>
                            </div>
                        </div>
                    </div>

                    {/* Signed By */}
                    {gatepass.signedByUser && (
                        <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-100">
                            <div className="flex items-center gap-2 mb-2">
                                <User className="h-4 w-4 text-emerald-600" />
                                <p className="text-xs font-semibold text-emerald-700 uppercase">Ditandatangani Oleh</p>
                            </div>
                            <p className="font-semibold text-gray-900">{gatepass.signedByUser.fullName}</p>
                            {gatepass.signedByUser.division && (
                                <p className="text-sm text-gray-600">{gatepass.signedByUser.division}</p>
                            )}
                            {gatepass.signedByUser.employeeId && (
                                <p className="text-xs text-gray-500">NIP: {gatepass.signedByUser.employeeId}</p>
                            )}
                            {gatepass.signedAt && (
                                <p className="text-xs text-gray-400 mt-1">
                                    {new Date(gatepass.signedAt).toLocaleString("id-ID")}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Items */}
                    {gatepass.items && gatepass.items.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Package className="h-4 w-4 text-gray-400" />
                                <p className="text-xs font-semibold text-gray-500 uppercase">Daftar Barang ({gatepass.items.length})</p>
                            </div>
                            <div className="border rounded-lg overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="text-left px-3 py-2 text-xs text-gray-500">Barang</th>
                                            <th className="text-left px-3 py-2 text-xs text-gray-500">Qty</th>
                                            <th className="text-left px-3 py-2 text-xs text-gray-500">Unit</th>
                                            <th className="text-left px-3 py-2 text-xs text-gray-500">S/N</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {gatepass.items.map((item, i) => (
                                            <tr key={i}>
                                                <td className="px-3 py-2 font-medium">{item.itemName}</td>
                                                <td className="px-3 py-2">{item.quantity}</td>
                                                <td className="px-3 py-2">{item.unit}</td>
                                                <td className="px-3 py-2 text-gray-400">{item.serialNumber || "-"}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-3 bg-gray-50 border-t text-center">
                    <p className="text-xs text-gray-400">Dokumen ini diverifikasi secara digital melalui sistem PM</p>
                </div>
            </div>
        </div>
    );
}
