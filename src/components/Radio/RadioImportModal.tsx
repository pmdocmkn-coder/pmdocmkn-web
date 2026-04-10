import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import {
    UploadCloud,
    FileType,
    CheckCircle,
    XCircle,
    AlertTriangle,
    RefreshCw,
    X
} from "lucide-react";
import { ImportResult } from "../../types/radio";
import { useToast } from "../../hooks/use-toast";

interface RadioImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    onImportSuccess: () => void;
    importApiCall: (file: File) => Promise<{ data: any }>;
}

export default function RadioImportModal({
    isOpen,
    onClose,
    title,
    onImportSuccess,
    importApiCall,
}: RadioImportModalProps) {
    const { toast } = useToast();
    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
    const [result, setResult] = useState<{ success: number; failed: number; errors?: string[] } | null>(null);
    const [errorMessage, setErrorMessage] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Reset state when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            resetState();
        }
    }, [isOpen]);

    const resetState = () => {
        setFile(null);
        setIsDragging(false);
        setStatus('idle');
        setResult(null);
        setErrorMessage("");
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileSelection(e.dataTransfer.files[0]);
        }
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFileSelection(e.target.files[0]);
        }
    };

    const handleFileSelection = (selectedFile: File) => {
        const validExtensions = ['.csv', '.xlsx', '.xls'];
        const extension = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();

        if (!validExtensions.includes(extension)) {
            toast({
                title: "Invalid File Type",
                description: "Silakan unggah file CSV atau Excel (.xlsx/.xls).",
                variant: "destructive"
            });
            return;
        }

        setFile(selectedFile);
        setStatus('idle');
        setResult(null);
        setErrorMessage("");
    };

    const removeFile = () => {
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleImport = async () => {
        if (!file) return;

        setStatus('uploading');
        try {
            const response = await importApiCall(file);
            // Backend wraps result in ApiResponse: { data: { success, failed, errors }, message: "..." }
            // Unwrap: response.data is the ApiResponse body, response.data.data is the actual payload
            const importData = response.data?.data ?? response.data;
            
            setResult({
                success: importData?.success ?? 0,
                failed: importData?.failed ?? 0,
                errors: importData?.errors || []
            });

            if ((importData?.failed ?? 0) > 0 && (importData?.success ?? 0) === 0) {
                setStatus('error');
                setErrorMessage("Seluruh data gagal diimpor. Periksa format atau data duplikat.");
            } else if ((importData?.failed ?? 0) > 0) {
                setStatus('success'); // Partial success is still a success, we just show warnings
                onImportSuccess();
            } else {
                setStatus('success');
                onImportSuccess();
            }

        } catch (error: any) {
            console.error("Import error:", error);
            setStatus('error');
            setErrorMessage(error.response?.data?.message || error.message || "Terjadi kesalahan saat mengunggah file.");
        }
    };

    const handleClose = () => {
        if (status === 'uploading') return;
        onClose();
    };

    const renderDropzone = () => (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`mt-4 border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 relative ${
                isDragging ? 'border-purple-500 bg-purple-50 scale-[1.02]' : 'border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-gray-400'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !file && fileInputRef.current?.click()}
        >
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileInput}
            />

            <AnimatePresence mode="wait">
                {file ? (
                    <motion.div
                        key="file-selected"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center justify-center pointer-events-none"
                    >
                        <div className="w-16 h-16 rounded-2xl bg-white shadow-md flex items-center justify-center mb-4 text-purple-600 relative pointer-events-auto group">
                            <FileType size={32} />
                            <button
                                onClick={(e) => { e.stopPropagation(); removeFile(); }}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-sm"
                            >
                                <X size={14} />
                            </button>
                        </div>
                        <h4 className="font-semibold text-gray-800 text-lg mb-1 truncate max-w-full px-4">{file.name}</h4>
                        <p className="text-gray-500 text-sm">
                            {(file.size / 1024 / 1024).toFixed(2)} MB • {file.name.split('.').pop()?.toUpperCase()}
                        </p>
                    </motion.div>
                ) : (
                    <motion.div
                        key="dropzone-empty"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center pointer-events-none"
                    >
                        <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center mb-4 text-gray-400">
                            <UploadCloud size={32} />
                        </div>
                        <h4 className="font-semibold text-gray-800 text-lg mb-1">Upload File</h4>
                        <p className="text-gray-500 text-sm mb-4">Seret dan lepas file ke sini atau klik untuk mencari</p>
                        <div className="flex gap-2 justify-center">
                            <span className="px-3 py-1 bg-white shadow-sm rounded-md text-xs font-medium text-gray-600 border border-gray-200">.CSV</span>
                            <span className="px-3 py-1 bg-white shadow-sm rounded-md text-xs font-medium text-gray-600 border border-gray-200">.XLSX</span>
                            <span className="px-3 py-1 bg-white shadow-sm rounded-md text-xs font-medium text-gray-600 border border-gray-200">.XLS</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );

    const renderResult = () => (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-4"
        >
            <div className={`p-6 rounded-xl border flex flex-col items-center text-center ${
                status === 'success' && result?.failed === 0 
                ? 'bg-green-50 border-green-200' 
                : status === 'success' && (result?.failed ?? 0) > 0
                ? 'bg-amber-50 border-amber-200'
                : 'bg-red-50 border-red-200'
            }`}>
               <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                status === 'success' && result?.failed === 0 
                ? 'bg-green-100 text-green-600' 
                : status === 'success' && (result?.failed ?? 0) > 0
                ? 'bg-amber-100 text-amber-600'
                : 'bg-red-100 text-red-600'
               }`}>
                   {status === 'success' && result?.failed === 0 ? <CheckCircle size={32} /> : 
                    status === 'success' && (result?.failed ?? 0) > 0 ? <AlertTriangle size={32} /> : 
                    <XCircle size={32} />}
               </div>
               <h4 className={`text-xl font-bold mb-2 ${
                status === 'success' && result?.failed === 0 ? 'text-green-800' : 
                status === 'success' && (result?.failed ?? 0) > 0 ? 'text-amber-800' : 'text-red-800'
               }`}>
                   {status === 'success' && result?.failed === 0 ? 'Import Berhasil!' : 
                    status === 'success' && (result?.failed ?? 0) > 0 ? 'Import Selesai dengan Catatan' : 'Import Gagal'}
               </h4>
               
               {status === 'error' && errorMessage && (
                   <p className="text-red-600 text-sm bg-white bg-opacity-60 px-4 py-2 rounded-lg mt-2 font-medium">
                       {errorMessage}
                   </p>
               )}

               {result && (
                   <div className="flex w-full gap-4 mt-6 justify-center">
                       <div className="bg-white px-6 py-3 rounded-xl shadow-sm border border-gray-100 w-32">
                           <div className="text-sm text-gray-500 font-medium mb-1">Sukses</div>
                           <div className="text-3xl font-bold text-green-600">{result.success}</div>
                       </div>
                       <div className="bg-white px-6 py-3 rounded-xl shadow-sm border border-gray-100 w-32">
                           <div className="text-sm text-gray-500 font-medium mb-1">Gagal</div>
                           <div className="text-3xl font-bold text-red-500">{result.failed}</div>
                       </div>
                   </div>
               )}

               {result?.errors && result.errors.length > 0 && (
                   <div className="mt-6 w-full text-left bg-white rounded-lg p-4 border border-red-100 shadow-sm max-h-40 overflow-y-auto">
                       <p className="text-sm font-semibold text-red-800 mb-2 flex items-center">
                           <AlertTriangle size={14} className="mr-1.5" /> Detail Error ({result.errors.length}):
                       </p>
                       <ul className="list-disc list-inside text-xs text-red-600 space-y-1">
                           {result.errors.map((err, i) => (
                               <li key={i} className="truncate" title={err}>{err}</li>
                           ))}
                       </ul>
                   </div>
               )}
            </div>
        </motion.div>
    );

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto p-0 gap-0 rounded-2xl border-0 shadow-2xl">
                <DialogHeader className="px-6 py-5 border-b sticky top-0 bg-white/95 backdrop-blur-sm z-10">
                    <DialogTitle className="text-xl font-bold text-gray-800">{title}</DialogTitle>
                </DialogHeader>

                <div className="px-6 pb-6">
                    {/* Status Content */}
                    <AnimatePresence mode="wait">
                        {(status === 'idle' || (status === 'error' && !result)) && renderDropzone()}
                        
                        {status === 'uploading' && (
                            <motion.div
                                key="loading"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="mt-4 p-12 flex flex-col items-center justify-center text-center bg-gray-50 rounded-xl border border-gray-100"
                            >
                                <div className="relative">
                                    <div className="absolute inset-0 bg-purple-200 rounded-full blur-xl opacity-50 animate-pulse"></div>
                                    <div className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center relative z-10 text-purple-600">
                                        <RefreshCw size={32} className="animate-spin" />
                                    </div>
                                </div>
                                <h4 className="mt-6 text-lg font-semibold text-gray-800">Menyinkronkan Data</h4>
                                <p className="text-gray-500 mt-1 text-sm max-w-[250px]">
                                    Mohon tunggu sebentar, file Anda sedang diproses oleh server...
                                </p>
                            </motion.div>
                        )}

                        {(status === 'success' || (status === 'error' && result)) && renderResult()}
                    </AnimatePresence>

                    {/* Actions */}
                    <div className="mt-8 flex gap-3 justify-end">
                        {status === 'idle' && (
                            <>
                                <Button variant="outline" onClick={handleClose} className="rounded-xl px-5">
                                    Batal
                                </Button>
                                <Button 
                                    onClick={handleImport} 
                                    disabled={!file}
                                    className={`rounded-xl px-6 ${file ? 'bg-purple-600 hover:bg-purple-700 hover:shadow-lg hover:shadow-purple-200' : ''} transition-all`}
                                >
                                    <UploadCloud className="w-4 h-4 mr-2" />
                                    Mulai Import
                                </Button>
                            </>
                        )}
                        {(status === 'success' || status === 'error') && (
                            <>
                                {(status === 'error' || (status === 'success' && (result?.failed ?? 0) > 0)) && (
                                    <Button variant="outline" onClick={resetState} className="rounded-xl px-5">
                                        Coba Lagi
                                    </Button>
                                )}
                                <Button onClick={handleClose} className="rounded-xl px-6">
                                    Tutup
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
