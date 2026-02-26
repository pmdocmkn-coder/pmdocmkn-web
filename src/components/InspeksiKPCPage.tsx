import React, { useState, useEffect, useRef, DragEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  inspeksiApi,
  TemuanKPC,
  InspeksiQueryParams,
} from "../services/inspeksiApi";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Edit,
  Trash2,
  X,
  Check,
  AlertCircle,
  Download,
  Search,
  Camera,
  CheckCircle,
  ChevronDown,
  ClipboardList,
  Archive,
  RotateCcw,
  Eye,
  Upload,
  MapPin,
  Calendar,
  User,
  Wrench,
  RefreshCw,
  Trash,
  AlertTriangle,
  ArrowLeft,
  Bell,
} from "lucide-react";
import { id } from "date-fns/locale";
import { formatCompactDate, formatDateTime } from "../utils/dateUtils";

// ImageUploadZone Component (unchanged)
interface ImageUploadZoneProps {
  label: string;
  files: File[];
  previews: string[];
  existingPhotos?: string[];
  onFilesChange: (files: File[]) => void;
  onRemovePreview: (index: number) => void;
  onRemoveExisting?: (index: number) => void;
  multiple?: boolean;
  accept?: string;
  iconColor?: string;
}

const ImageUploadZone: React.FC<ImageUploadZoneProps> = ({
  label,
  files,
  previews,
  existingPhotos = [],
  onFilesChange,
  onRemovePreview,
  onRemoveExisting,
  multiple = true,
  accept = "image/*",
  iconColor = "blue",
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files).filter((file) =>
      file.type.startsWith("image/")
    );

    if (droppedFiles.length > 0) {
      const newFiles = multiple
        ? [...files, ...droppedFiles]
        : droppedFiles.slice(0, 1);
      onFilesChange(newFiles);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const newFiles = multiple
      ? [...files, ...selectedFiles]
      : selectedFiles.slice(0, 1);
    onFilesChange(newFiles);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const totalImages = existingPhotos.length + previews.length;

  return (
    <div>
      <label
        className={`flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2`}
      >
        <Camera className={`w-4 h-4 text-${iconColor}-600`} />
        {label}
      </label>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
          ${isDragging
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-3">
          <div
            className={`p-4 rounded-full ${isDragging ? "bg-blue-100" : "bg-gray-100"
              }`}
          >
            <Upload
              className={`w-8 h-8 ${isDragging ? "text-blue-600" : "text-gray-600"
                }`}
            />
          </div>

          <div>
            <p className="font-medium text-gray-700">
              {isDragging
                ? "Lepaskan file di sini"
                : "Klik atau drag & drop gambar di sini"}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Support: JPG, PNG, GIF (Max 10MB per file)
            </p>
          </div>

          {totalImages > 0 && (
            <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
              📸 {totalImages} gambar terpilih
            </div>
          )}
        </div>
      </div>

      {existingPhotos.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-medium text-gray-600 mb-2">
            Foto yang sudah ada:
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {existingPhotos.map((url, index) => (
              <div
                key={`existing-${index}`}
                className="relative group bg-gray-100 rounded-lg overflow-hidden"
                style={{ paddingBottom: "75%" }} // 4:3 aspect ratio
              >
                <img
                  src={url}
                  alt={`Existing ${index + 1}`}
                  className="absolute inset-0 w-full h-full object-contain cursor-pointer hover:opacity-75 p-2 transition-opacity"
                  onClick={() => {
                    // Will be handled by parent to open full gallery
                    console.log("Open gallery at index:", index);
                  }}
                />
                {onRemoveExisting && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveExisting(index);
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600"
                    title="Hapus foto"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
                <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                  Existing {index + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {previews.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-medium text-gray-600 mb-2">
            Foto baru yang akan diupload:
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {previews.map((preview, index) => (
              <div
                key={`preview-${index}`}
                className="relative group bg-gray-100 rounded-lg overflow-hidden"
                style={{ paddingBottom: "75%" }} // 4:3 aspect ratio
              >
                <img
                  src={preview}
                  alt={`Preview ${index + 1}`}
                  className={`absolute inset-0 w-full h-full object-contain p-2 border-2 rounded-lg ${iconColor === "green"
                    ? "border-green-300"
                    : "border-blue-300"
                    }`}
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemovePreview(index);
                  }}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600"
                  title="Hapus preview"
                >
                  <X className="w-3 h-3" />
                </button>
                <div
                  className={`absolute bottom-2 left-2 ${iconColor === "green" ? "bg-green-600" : "bg-blue-600"
                    } text-white text-xs px-2 py-1 rounded shadow-md`}
                >
                  New {index + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {files.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-600">
          {files.map((file, idx) => (
            <span key={idx} className="bg-gray-100 px-2 py-1 rounded">
              {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

import { hasPermission } from "../utils/permissionUtils";

export default function InspeksiKPCPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // ✅ PERMISSION MANAGEMENT
  const canCreate = hasPermission("inspeksi.create");
  const canUpdate = hasPermission("inspeksi.update");
  const canDelete = hasPermission("inspeksi.delete");
  const canRestore = hasPermission("inspeksi.restore");
  const canExport = hasPermission("inspeksi.export");

  // State untuk data
  const [data, setData] = useState<TemuanKPC[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ✅ SEPARATE LOADING STATES - NO MORE GLOBAL QUEUE
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [deletingItem, setDeletingItem] = useState<number | null>(null);
  const [restoringItem, setRestoringItem] = useState<number | null>(null);
  const [deletingPermanentItem, setDeletingPermanentItem] = useState<
    number | null
  >(null);

  // State untuk pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 15;

  // State untuk filter
  const [selectedRuang, setSelectedRuang] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showHistory, setShowHistory] = useState(false);

  // State untuk modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit" | "update">(
    "create"
  );
  const [editingId, setEditingId] = useState<number | null>(null);
  const [expandedTemuan, setExpandedTemuan] = useState<number | null>(null);
  useEffect(() => {
    console.log("🔍 expandedTemuan changed:", expandedTemuan);
  }, [expandedTemuan]);

  // State untuk image gallery
  const [viewingImages, setViewingImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showImageGallery, setShowImageGallery] = useState(false);

  // State untuk form
  const [form, setForm] = useState({
    ruang: "",
    temuan: "",
    kategoriTemuan: "",
    inspector: "",
    severity: "Medium" as "Low" | "Medium" | "High" | "Critical",
    tanggalTemuan: format(new Date(), "yyyy-MM-dd"),
    noFollowUp: "",
    picPelaksana: "",
    keterangan: "",
    perbaikanDilakukan: "",
    tanggalPerbaikan: "",
    tanggalSelesaiPerbaikan: "",
    status: "Open" as "Open" | "In Progress" | "Closed" | "Rejected",
  });

  // State untuk upload foto
  const [fotoTemuanFiles, setFotoTemuanFiles] = useState<File[]>([]);
  const [fotoHasilFiles, setFotoHasilFiles] = useState<File[]>([]);
  const [fotoTemuanPreviews, setFotoTemuanPreviews] = useState<string[]>([]);
  const [fotoHasilPreviews, setFotoHasilPreviews] = useState<string[]>([]);
  const [existingFotoTemuan, setExistingFotoTemuan] = useState<string[]>([]);
  const [existingFotoHasil, setExistingFotoHasil] = useState<string[]>([]);

  // ✅ State untuk delete photo dengan proper tracking
  const [deletingPhoto, setDeletingPhoto] = useState<{
    id: number;
    type: "temuan" | "hasil";
    index: number;
  } | null>(null);

  const formatDateSafe = (
    dateString: string | undefined,
    formatStr: string = "dd/MM/yyyy"
  ): string => {
    if (!dateString || dateString === "-") return "-";
    try {
      const utcDate = new Date(dateString);
      const wibDate = new Date(
        utcDate.toLocaleString("en-US", { timeZone: "Asia/Makassar" })
      );
      if (isNaN(wibDate.getTime())) return "-";
      if (formatStr === "dd/MM/yyyy") {
        return format(wibDate, "dd/MM/yyyy");
      } else if (formatStr === "dd MMM yyyy") {
        return format(wibDate, "dd MMM yyyy", { locale: id });
      } else {
        return format(wibDate, formatStr);
      }
    } catch (error) {
      return "-";
    }
  };

  useEffect(() => {
    loadData();
  }, [
    currentPage,
    selectedRuang,
    selectedStatus,
    startDate,
    endDate,
    showHistory,
  ]);

  // ✅ IMPROVED AUTO-REFRESH - Only when idle
  useEffect(() => {
    if (isModalOpen || isSubmitting || exportLoading || deletingPhoto) {
      return;
    }

    const intervalId = setInterval(() => {
      console.log("🔄 Auto-refreshing data (silent mode)...");
      loadData();
    }, 30000);

    return () => {
      clearInterval(intervalId);
    };
  }, [
    currentPage,
    selectedRuang,
    selectedStatus,
    startDate,
    endDate,
    showHistory,
    isModalOpen,
    isSubmitting,
    exportLoading,
    deletingPhoto,
  ]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (
        !document.hidden &&
        !isModalOpen &&
        !isSubmitting &&
        !exportLoading &&
        !deletingPhoto
      ) {
        console.log("👁️ Tab became visible, refreshing data...");
        loadData();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isModalOpen, isSubmitting, exportLoading, deletingPhoto]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!showImageGallery) return;
      switch (e.key) {
        case "Escape":
          closeImageGallery();
          break;
        case "ArrowLeft":
          prevImage();
          break;
        case "ArrowRight":
          nextImage();
          break;
      }
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [showImageGallery, currentImageIndex]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 5000);
      return () => clearTimeout(timer);
    }
    if (success) {
      const timer = setTimeout(() => setSuccess(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const loadData = async () => {
    try {
      // ✅ DON'T show loading if this is a background refresh
      const isBackgroundRefresh = data.length > 0;

      if (!isBackgroundRefresh) {
        setLoading(true);
      }

      setError("");

      const params: InspeksiQueryParams = {
        page: currentPage,
        pageSize,
        includeDeleted: showHistory,
      };

      if (selectedRuang) params.ruang = selectedRuang;
      if (selectedStatus) params.status = selectedStatus;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const timestamp = new Date().getTime();
      console.log(`🔄 Loading data at ${timestamp}`);

      const response = showHistory
        ? await inspeksiApi.getHistory(params)
        : await inspeksiApi.getAll(params);

      console.log(`✅ Data loaded at ${timestamp}:`, {
        total: response.totalCount,
        dataLength: response.data.length,
      });

      setData(response.data);
      setTotalPages(response.totalPages);
      setTotalCount(response.totalCount);
    } catch (err: any) {
      console.error("Error loading data:", err);
      setError(err.response?.data?.message || "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  };

  const filteredData = data.filter((item) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      item.ruang.toLowerCase().includes(search) ||
      item.temuan.toLowerCase().includes(search) ||
      item.inspector?.toLowerCase().includes(search) ||
      item.picPelaksana?.toLowerCase().includes(search) ||
      item.keterangan?.toLowerCase().includes(search)
    );
  });

  const ruangList = [...new Set(data.map((d) => d.ruang))].sort();

  const handleFotoTemuanChange = (files: File[]) => {
    setFotoTemuanFiles(files);
    fotoTemuanPreviews.forEach((url) => URL.revokeObjectURL(url));
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setFotoTemuanPreviews(newPreviews);
  };

  const handleFotoHasilChange = (files: File[]) => {
    setFotoHasilFiles(files);
    fotoHasilPreviews.forEach((url) => URL.revokeObjectURL(url));
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setFotoHasilPreviews(newPreviews);
  };

  const removeFotoTemuanPreview = (index: number) => {
    const newFiles = fotoTemuanFiles.filter((_, i) => i !== index);
    const newPreviews = fotoTemuanPreviews.filter((_, i) => i !== index);
    URL.revokeObjectURL(fotoTemuanPreviews[index]);
    setFotoTemuanFiles(newFiles);
    setFotoTemuanPreviews(newPreviews);
  };

  const removeFotoHasilPreview = (index: number) => {
    const newFiles = fotoHasilFiles.filter((_, i) => i !== index);
    const newPreviews = fotoHasilPreviews.filter((_, i) => i !== index);
    URL.revokeObjectURL(fotoHasilPreviews[index]);
    setFotoHasilFiles(newFiles);
    setFotoHasilPreviews(newPreviews);
  };

  // ✅ IMPROVED DELETE FOTO - WITH PROPER STATE TRACKING
  const handleDeleteFotoTemuan = async (id: number, index: number) => {
    if (!confirm("Yakin ingin menghapus foto temuan ini?")) return;

    // ✅ PREVENT CONCURRENT DELETE OPERATIONS
    if (deletingPhoto) {
      setError("Sedang menghapus foto lain, mohon tunggu...");
      return;
    }

    try {
      setDeletingPhoto({ id, type: "temuan", index });
      setError("");

      console.log(`🗑️ Deleting foto temuan - ID: ${id}, Index: ${index}`);
      await inspeksiApi.deleteFotoTemuan(id, index);

      setSuccess("Foto temuan berhasil dihapus");

      // ✅ UPDATE LOCAL STATE - Remove from existing photos
      if (editingId === id) {
        setExistingFotoTemuan((prev) => prev.filter((_, i) => i !== index));
      }

      // ✅ RELOAD DATA AFTER DELETE
      await loadData();
    } catch (err: any) {
      console.error("❌ Delete foto temuan error:", err);
      setError(err.response?.data?.message || "Gagal menghapus foto temuan");
    } finally {
      setDeletingPhoto(null);
    }
  };

  const handleDeleteFotoHasil = async (id: number, index: number) => {
    if (!confirm("Yakin ingin menghapus foto hasil ini?")) return;

    // ✅ PREVENT CONCURRENT DELETE OPERATIONS
    if (deletingPhoto) {
      setError("Sedang menghapus foto lain, mohon tunggu...");
      return;
    }

    try {
      setDeletingPhoto({ id, type: "hasil", index });
      setError("");

      console.log(`🗑️ Deleting foto hasil - ID: ${id}, Index: ${index}`);
      await inspeksiApi.deleteFotoHasil(id, index);

      setSuccess("Foto hasil berhasil dihapus");

      // ✅ UPDATE LOCAL STATE - Remove from existing photos
      if (editingId === id) {
        setExistingFotoHasil((prev) => prev.filter((_, i) => i !== index));
      }

      // ✅ RELOAD DATA AFTER DELETE
      await loadData();
    } catch (err: any) {
      console.error("❌ Delete foto hasil error:", err);
      setError(err.response?.data?.message || "Gagal menghapus foto hasil");
    } finally {
      setDeletingPhoto(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting || deletingPhoto) {
      console.warn("⚠️ Operation in progress, ignoring...");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const formData = new FormData();

      // ===================================
      // ✅ CREATE MODE
      // ===================================
      if (modalMode === "create") {
        // Required fields
        formData.append("ruang", form.ruang.trim());
        formData.append("temuan", form.temuan.trim());
        formData.append("severity", form.severity);
        formData.append("tanggalTemuan", form.tanggalTemuan);

        // Optional fields - hanya kirim jika ada nilai
        if (form.kategoriTemuan) {
          formData.append("kategoriTemuan", form.kategoriTemuan.trim());
        }
        if (form.inspector) {
          formData.append("inspector", form.inspector.trim());
        }
        if (form.noFollowUp) {
          formData.append("noFollowUp", form.noFollowUp.trim());
        }
        if (form.picPelaksana) {
          formData.append("picPelaksana", form.picPelaksana.trim());
        }
        if (form.keterangan) {
          formData.append("keterangan", form.keterangan.trim());
        }

        // Upload foto temuan baru
        if (fotoTemuanFiles.length > 0) {
          fotoTemuanFiles.forEach((file) => {
            formData.append("fotoTemuanFiles", file);
          });
        }

        console.log("📤 CREATE - Sending FormData:");
        for (let [key, value] of formData.entries()) {
          console.log(
            `  ${key}:`,
            value instanceof File
              ? `${value.name} (${value.size} bytes)`
              : value
          );
        }

        await inspeksiApi.create(formData);
        setSuccess("Temuan berhasil dibuat");
      }
      // ===================================
      // ✅ EDIT MODE - UPDATE DETAIL TEMUAN
      // ===================================
      else if (modalMode === "edit" && editingId) {
        // Required fields - selalu kirim
        formData.append("ruang", form.ruang.trim());
        formData.append("temuan", form.temuan.trim());
        formData.append("severity", form.severity);
        formData.append("tanggalTemuan", form.tanggalTemuan);

        // ✅ OPTIONAL TEXT FIELDS - Dengan clear flag logic

        // KategoriTemuan
        if (form.kategoriTemuan === "") {
          formData.append("clearKategoriTemuan", "true");
        } else if (form.kategoriTemuan) {
          formData.append("kategoriTemuan", form.kategoriTemuan.trim());
        }

        // Inspector
        if (form.inspector === "") {
          formData.append("clearInspector", "true");
        } else if (form.inspector) {
          formData.append("inspector", form.inspector.trim());
        }

        // NoFollowUp
        if (form.noFollowUp === "") {
          formData.append("clearNoFollowUp", "true");
        } else if (form.noFollowUp) {
          formData.append("noFollowUp", form.noFollowUp.trim());
        }

        // PicPelaksana
        if (form.picPelaksana === "") {
          formData.append("clearPicPelaksana", "true");
        } else if (form.picPelaksana) {
          formData.append("picPelaksana", form.picPelaksana.trim());
        }

        // Keterangan
        if (form.keterangan === "") {
          formData.append("clearKeterangan", "true");
        } else if (form.keterangan) {
          formData.append("keterangan", form.keterangan.trim());
        }

        // ✅ Upload foto temuan baru (jika ada)
        if (fotoTemuanFiles.length > 0) {
          fotoTemuanFiles.forEach((file) => {
            formData.append("fotoTemuanFiles", file);
          });
        }

        console.log("📤 EDIT - Sending FormData:");
        for (let [key, value] of formData.entries()) {
          console.log(
            `  ${key}:`,
            value instanceof File
              ? `${value.name} (${value.size} bytes)`
              : value
          );
        }

        await inspeksiApi.update(editingId, formData);
        setSuccess("Detail temuan berhasil diperbarui");
      }
      // ===================================
      // ✅ UPDATE MODE - UPDATE PERBAIKAN
      // ===================================
      else if (modalMode === "update" && editingId) {
        // Status - selalu kirim
        formData.append("status", form.status);

        // ✅ OPTIONAL TEXT FIELDS - Dengan clear flag logic

        // NoFollowUp
        if (form.noFollowUp === "") {
          formData.append("clearNoFollowUp", "true");
        } else if (form.noFollowUp) {
          formData.append("noFollowUp", form.noFollowUp.trim());
        }

        // PicPelaksana
        if (form.picPelaksana === "") {
          formData.append("clearPicPelaksana", "true");
        } else if (form.picPelaksana) {
          formData.append("picPelaksana", form.picPelaksana.trim());
        }

        // PerbaikanDilakukan
        if (form.perbaikanDilakukan === "") {
          formData.append("clearPerbaikanDilakukan", "true");
        } else if (form.perbaikanDilakukan) {
          formData.append("perbaikanDilakukan", form.perbaikanDilakukan.trim());
        }

        // Keterangan
        if (form.keterangan === "") {
          formData.append("clearKeterangan", "true");
        } else if (form.keterangan) {
          formData.append("keterangan", form.keterangan.trim());
        }

        // ✅ DATE FIELDS - Dengan clear flag logic

        // TanggalPerbaikan
        if (form.tanggalPerbaikan === "") {
          formData.append("clearTanggalPerbaikan", "true");
        } else if (form.tanggalPerbaikan) {
          formData.append("tanggalPerbaikan", form.tanggalPerbaikan);
        }

        // TanggalSelesaiPerbaikan
        if (form.tanggalSelesaiPerbaikan === "") {
          formData.append("clearTanggalSelesaiPerbaikan", "true");
        } else if (form.tanggalSelesaiPerbaikan) {
          formData.append(
            "tanggalSelesaiPerbaikan",
            form.tanggalSelesaiPerbaikan
          );
        }

        // ✅ Upload foto hasil baru (jika ada)
        if (fotoHasilFiles.length > 0) {
          console.log(
            "📤 UPDATE - Attaching",
            fotoHasilFiles.length,
            "foto hasil files"
          );
          fotoHasilFiles.forEach((file, idx) => {
            formData.append("fotoHasilFiles", file);
            console.log(
              `  📁 File ${idx + 1}: ${file.name} (${file.size} bytes)`
            );
          });
        }

        console.log("📤 UPDATE - Sending FormData:");
        for (let [key, value] of formData.entries()) {
          console.log(
            `  ${key}:`,
            value instanceof File
              ? `${value.name} (${value.size} bytes)`
              : value
          );
        }

        await inspeksiApi.update(editingId, formData);
        setSuccess("Perbaikan berhasil diupdate");
      }

      closeModal();

      // ✅ Refresh data setelah delay
      setTimeout(() => {
        loadData();
      }, 1000);
    } catch (err: any) {
      console.error("❌ Error submitting:", err);
      const errorMessage =
        err.response?.data?.message || err.message || "Gagal menyimpan data";
      setError(`Error: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Yakin ingin memindahkan temuan ini ke history?")) return;

    if (deletingItem) {
      setError("Operasi delete sedang berjalan, mohon tunggu...");
      return;
    }

    try {
      setDeletingItem(id);
      setError("");
      const result = await inspeksiApi.delete(id);
      setSuccess(result.message || "Temuan dipindahkan ke history");
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || "Gagal menghapus data");
    } finally {
      setDeletingItem(null);
    }
  };

  const handleDeletePermanent = async (id: number, ruang: string) => {
    if (
      !confirm(
        `⚠️ PERHATIAN!\n\nApakah Anda yakin ingin menghapus PERMANEN temuan di "${ruang}"?\n\nData yang dihapus permanen TIDAK BISA dikembalikan!\n\nKlik OK untuk melanjutkan.`
      )
    ) {
      return;
    }

    if (
      !confirm(
        "Konfirmasi terakhir: Data akan dihapus PERMANEN dan tidak bisa dikembalikan. Lanjutkan?"
      )
    ) {
      return;
    }

    if (deletingPermanentItem) {
      setError("Operasi delete permanent sedang berjalan, mohon tunggu...");
      return;
    }

    try {
      setDeletingPermanentItem(id);
      setError("");
      await inspeksiApi.deletePermanent(id);
      setSuccess("Temuan berhasil dihapus permanen");
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || "Gagal menghapus data permanen");
    } finally {
      setDeletingPermanentItem(null);
    }
  };

  const handleRestore = async (id: number) => {
    if (!confirm("Yakin ingin mengembalikan temuan ini?")) return;

    if (restoringItem) {
      setError("Operasi restore sedang berjalan, mohon tunggu...");
      return;
    }

    try {
      setRestoringItem(id);
      setError("");
      const result = await inspeksiApi.restore(id);
      setSuccess(result.message || "Temuan berhasil dikembalikan");
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || "Gagal mengembalikan data");
    } finally {
      setRestoringItem(null);
    }
  };

  // ✅ IMPROVED EXPORT - INDEPENDENT LOADING STATE
  const handleExportWithImages = async () => {
    if (exportLoading) {
      console.warn("⚠️ Export already in progress");
      return;
    }

    try {
      setExportLoading(true);
      setError("");

      console.log("📤 Starting export process...");

      await inspeksiApi.exportToExcel({
        history: showHistory,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        ruang: selectedRuang || undefined,
        status: selectedStatus || undefined,
      });

      setSuccess("Export dengan gambar berhasil");
    } catch (err: any) {
      console.error("❌ Export error:", err);
      setError("Gagal export data dengan gambar");
    } finally {
      setExportLoading(false);
    }
  };

  const openCreateModal = () => {
    setModalMode("create");
    setEditingId(null);
    setForm({
      ruang: "",
      temuan: "",
      kategoriTemuan: "",
      inspector: "",
      severity: "Medium",
      tanggalTemuan: format(new Date(), "yyyy-MM-dd"),
      noFollowUp: "",
      picPelaksana: "",
      keterangan: "",
      perbaikanDilakukan: "",
      tanggalPerbaikan: "",
      tanggalSelesaiPerbaikan: "",
      status: "Open",
    });
    setFotoTemuanFiles([]);
    setFotoHasilFiles([]);
    setFotoTemuanPreviews([]);
    setFotoHasilPreviews([]);
    setExistingFotoTemuan([]);
    setExistingFotoHasil([]);
    setIsModalOpen(true);
  };

  const openEditModal = async (id: number) => {
    try {
      setLoading(true);
      const item = await inspeksiApi.getById(id);

      setModalMode("edit");
      setEditingId(id);
      setForm({
        ruang: item.ruang,
        temuan: item.temuan,
        kategoriTemuan: item.kategoriTemuan || "",
        inspector: item.inspector || "",
        severity: item.severity,
        tanggalTemuan: item.tanggalTemuan || format(new Date(), "yyyy-MM-dd"),
        noFollowUp: item.noFollowUp || "",
        picPelaksana: item.picPelaksana || "",
        keterangan: item.keterangan || "",
        perbaikanDilakukan: item.perbaikanDilakukan || "",
        tanggalPerbaikan: item.tanggalPerbaikan || "",
        tanggalSelesaiPerbaikan: item.tanggalSelesaiPerbaikan || "",
        status: item.status,
      });

      setExistingFotoTemuan(item.fotoTemuanUrls || []);
      setExistingFotoHasil(item.fotoHasilUrls || []);
      setFotoTemuanFiles([]);
      setFotoHasilFiles([]);
      setFotoTemuanPreviews([]);
      setFotoHasilPreviews([]);
      setIsModalOpen(true);
    } catch (err: any) {
      setError("Gagal memuat detail temuan");
    } finally {
      setLoading(false);
    }
  };

  const openUpdateModal = async (id: number) => {
    try {
      setLoading(true);
      const item = await inspeksiApi.getById(id);

      setModalMode("update");
      setEditingId(id);
      setForm({
        ruang: item.ruang,
        temuan: item.temuan,
        kategoriTemuan: item.kategoriTemuan || "",
        inspector: item.inspector || "",
        severity: item.severity,
        tanggalTemuan: item.tanggalTemuan || format(new Date(), "yyyy-MM-dd"),
        noFollowUp: item.noFollowUp || "",
        picPelaksana: item.picPelaksana || "",
        keterangan: item.keterangan || "",
        perbaikanDilakukan: item.perbaikanDilakukan || "",
        tanggalPerbaikan: item.tanggalPerbaikan || "",
        tanggalSelesaiPerbaikan: item.tanggalSelesaiPerbaikan || "",
        status: item.status,
      });

      setExistingFotoTemuan(item.fotoTemuanUrls || []);
      setExistingFotoHasil(item.fotoHasilUrls || []);
      setFotoTemuanFiles([]);
      setFotoHasilFiles([]);
      setFotoTemuanPreviews([]);
      setFotoHasilPreviews([]);
      setIsModalOpen(true);
    } catch (err: any) {
      setError("Gagal memuat detail temuan");
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalMode("create");
    setEditingId(null);
    setFotoTemuanFiles([]);
    setFotoHasilFiles([]);
    fotoTemuanPreviews.forEach((url) => URL.revokeObjectURL(url));
    fotoHasilPreviews.forEach((url) => URL.revokeObjectURL(url));
    setFotoTemuanPreviews([]);
    setFotoHasilPreviews([]);
    setExistingFotoTemuan([]);
    setExistingFotoHasil([]);
  };

  const clearFilters = () => {
    setSelectedRuang("");
    setSelectedStatus("");
    setSearchTerm("");
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);
  };

  const openImageGallery = (images: string[], startIndex: number = 0) => {
    setViewingImages(images);
    setCurrentImageIndex(startIndex);
    setShowImageGallery(true);
  };

  const closeImageGallery = () => {
    setShowImageGallery(false);
    setViewingImages([]);
    setCurrentImageIndex(0);
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % viewingImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex(
      (prev) => (prev - 1 + viewingImages.length) % viewingImages.length
    );
  };

  if (loading && data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="md:p-6 max-w-full mx-auto">
      {/* ========== MOBILE HEADER (md:hidden) ========== */}
      <div className="md:hidden sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-indigo-100">
        <div className="flex items-center p-4 justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/dashboard")}
              className="text-indigo-600 flex size-10 items-center justify-center rounded-full bg-indigo-50"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-gray-900 text-lg font-bold leading-tight tracking-tight">
              Inspeksi KPC {showHistory && "- History"}
            </h2>
          </div>
          <div className="flex items-center">
            <button
              onClick={() => {
                const el = document.getElementById('mobile-search-input');
                if (el) { el.classList.toggle('hidden'); el.focus(); }
              }}
              className="flex size-10 items-center justify-center rounded-full text-gray-600 hover:bg-indigo-50"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>
        </div>
        {/* Mobile Search Input (toggleable) */}
        <div id="mobile-search-input" className="hidden px-4 pb-3">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari ruang, temuan, inspector..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm bg-gray-50"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>
        {/* Mobile Filter Chips */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto no-scrollbar relative z-30">
          {/* Custom Dropdown: Ruangan */}
          <div className="relative shrink-0">
            <button
              onClick={() => {
                const el = document.getElementById("dropdown-ruangan");
                if (el) el.classList.toggle("hidden");
                // Hide the other dropdown
                const other = document.getElementById("dropdown-status");
                if (other && !other.classList.contains("hidden")) other.classList.add("hidden");
              }}
              className="flex items-center justify-between h-8 rounded-full bg-indigo-50 pl-3 pr-2 border border-indigo-200 text-indigo-700 text-xs font-semibold select-none min-w-[100px]"
            >
              <span className="truncate max-w-[120px]">{selectedRuang || "Ruangan"}</span>
              <ChevronDown className="w-3.5 h-3.5 ml-1 opacity-70" />
            </button>
          </div>

          {/* Custom Dropdown: Status */}
          <div className="relative shrink-0">
            <button
              onClick={() => {
                const el = document.getElementById("dropdown-status");
                if (el) el.classList.toggle("hidden");
                // Hide the other dropdown
                const other = document.getElementById("dropdown-ruangan");
                if (other && !other.classList.contains("hidden")) other.classList.add("hidden");
              }}
              className="flex items-center justify-between h-8 rounded-full bg-indigo-50 pl-3 pr-2 border border-indigo-200 text-indigo-700 text-xs font-semibold select-none min-w-[80px]"
            >
              <span>{selectedStatus || "Status"}</span>
              <ChevronDown className="w-3.5 h-3.5 ml-1 opacity-70" />
            </button>
          </div>
          <button
            onClick={() => { setShowHistory(!showHistory); setCurrentPage(1); }}
            className={`flex h-8 shrink-0 items-center gap-1 rounded-full px-3 border text-xs font-semibold ${showHistory ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-gray-50 border-gray-200 text-gray-600'}`}
          >
            {showHistory ? <RotateCcw className="w-3 h-3" /> : <Archive className="w-3 h-3" />}
            {showHistory ? "Aktif" : "History"}
          </button>
          {canExport && (
            <button
              onClick={handleExportWithImages}
              disabled={exportLoading}
              className="flex h-8 shrink-0 items-center gap-1 rounded-full bg-purple-50 px-3 border border-purple-200 text-purple-700 text-xs font-semibold"
            >
              <Download className="w-3 h-3" />
              Export
            </button>
          )}
        </div>
      </div>

      {/* ========== DESKTOP HEADER (hidden md:block) ========== */}
      <div className="hidden md:block mb-6">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <ClipboardList className="w-8 h-8 text-blue-600" />
          Inspeksi KPC {showHistory && "- History"}
        </h1>
        <p className="text-gray-600 mt-1">
          {showHistory
            ? "Data temuan yang sudah dihapus"
            : canCreate
              ? "Kelola temuan inspeksi per ruang"
              : "Update perbaikan temuan inspeksi"}
        </p>
      </div>

      {/* Notifications */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
            <button onClick={() => setError("")} className="ml-auto">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center gap-2"
          >
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span>{success}</span>
            <button onClick={() => setSuccess("")} className="ml-auto">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters & Actions - Desktop only */}
      <div className="hidden md:block mb-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ruang
            </label>
            <select
              value={selectedRuang}
              onChange={(e) => {
                setSelectedRuang(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Semua Ruang</option>
              {ruangList.map((ruang) => (
                <option key={ruang} value={ruang}>
                  {ruang}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Semua Status</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Closed">Closed</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dari Tanggal
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sampai Tanggal
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cari
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* ✅ EXPORT BUTTON WITH PROPER LOADING STATE */}
          <button
            onClick={handleExportWithImages}
            disabled={exportLoading}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${exportLoading
              ? "bg-purple-400 cursor-not-allowed"
              : "bg-purple-600 hover:bg-purple-700"
              } text-white`}
          >
            {exportLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Export to Excel</span>
              </>
            )}
          </button>

          <button
            onClick={() => {
              setShowHistory(!showHistory);
              setCurrentPage(1);
            }}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${showHistory
              ? "bg-orange-600 text-white hover:bg-orange-700"
              : "bg-gray-600 text-white hover:bg-gray-700"
              }`}
          >
            {showHistory ? (
              <RotateCcw className="w-4 h-4" />
            ) : (
              <Archive className="w-4 h-4" />
            )}
            {showHistory ? "Lihat Data Aktif" : "Lihat History"}
          </button>

          {(selectedRuang ||
            selectedStatus ||
            startDate ||
            endDate ||
            searchTerm) && (
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Clear Filters
              </button>
            )}

          {!showHistory && canCreate && (
            <button
              onClick={() => openCreateModal()}
              className="ml-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Tambah Temuan
            </button>
          )}

          <div className="text-sm text-gray-600">
            Total: <span className="font-semibold">{totalCount}</span> temuan
          </div>
        </div>
      </div>

      {/* ========== MOBILE CARD VIEW (md:hidden) ========== */}
      <div className="md:hidden flex flex-col gap-4 p-4 pb-28">
        {filteredData.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <ClipboardList className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">{showHistory ? 'Tidak ada data di history' : 'Belum ada data temuan'}</p>
          </div>
        ) : (
          filteredData.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex flex-col bg-white rounded-xl shadow-sm border border-indigo-100 overflow-hidden ${item.status === 'Closed' ? 'opacity-75' : ''}`}
            >
              {/* Card Image / Photo Header */}
              <div
                className={`relative w-full aspect-video bg-slate-200 bg-cover bg-center ${item.status === 'Closed' ? 'grayscale' : ''}`}
                style={item.fotoTemuanUrls && item.fotoTemuanUrls.length > 0 ? { backgroundImage: `url("${item.fotoTemuanUrls[0]}")` } : {}}
                onClick={() => item.fotoTemuanUrls && item.fotoTemuanUrls.length > 0 && openImageGallery(item.fotoTemuanUrls)}
              >
                {/* If no photo, show placeholder icon */}
                {(!item.fotoTemuanUrls || item.fotoTemuanUrls.length === 0) && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Camera className="w-10 h-10 text-slate-400" />
                  </div>
                )}
                {/* Badges */}
                <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
                  <span className={`text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${item.severity === 'Critical' ? 'bg-red-600' : item.severity === 'High' ? 'bg-red-500' : item.severity === 'Medium' ? 'bg-amber-500' : 'bg-slate-500'
                    }`}>
                    {item.severity} Severity
                  </span>
                  <span className={`text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${item.status === 'Open' ? 'bg-blue-500' : item.status === 'In Progress' ? 'bg-indigo-500' : item.status === 'Closed' ? 'bg-emerald-600' : 'bg-red-600'
                    }`}>
                    {item.status}
                  </span>
                </div>
                {/* Photo count badge */}
                {item.fotoTemuanUrls && item.fotoTemuanUrls.length > 1 && (
                  <div className="absolute top-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    <Camera className="w-3 h-3" /> {item.fotoTemuanUrls.length}
                  </div>
                )}
              </div>
              {/* Card Body */}
              <div className="p-4 flex flex-col gap-2">
                <h3 className="text-gray-900 text-lg font-bold">{item.ruang}</h3>
                <p className="text-gray-500 text-sm flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  Inspektur: {item.inspector || '-'}
                </p>
                <p className="text-gray-600 text-sm line-clamp-2">{item.temuan}</p>
                {/* Card Footer */}
                <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <p className="text-gray-400 text-xs">{formatCompactDate(item.tanggalTemuan)}</p>
                    {/* Lihat Detail - SEMUA USER */}
                    {!showHistory && (
                      <button
                        onClick={() => item.id && setExpandedTemuan(item.id)}
                        className="flex items-center gap-1 rounded-lg h-8 px-3 bg-indigo-600 text-white text-xs font-semibold"
                      >
                        <Eye className="w-3 h-3" /> Lihat Detail
                      </button>
                    )}
                    {/* History - Restore */}
                    {showHistory && canRestore && (
                      <button
                        onClick={() => item.id && handleRestore(item.id)}
                        disabled={restoringItem === item.id}
                        className="flex items-center gap-1 rounded-lg h-8 px-3 bg-green-100 text-green-700 text-xs font-semibold"
                      >
                        <RotateCcw className="w-3 h-3" /> Restore
                      </button>
                    )}
                  </div>
                  {/* Admin actions - Edit & Update */}
                  {!showHistory && canUpdate && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => item.id && openEditModal(item.id)}
                        className="flex-1 flex items-center justify-center gap-1 rounded-lg h-8 bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200"
                      >
                        <Edit className="w-3 h-3" /> Edit
                      </button>
                      <button
                        onClick={() => item.id && openUpdateModal(item.id)}
                        className="flex-1 flex items-center justify-center gap-1 rounded-lg h-8 bg-green-50 text-green-700 text-xs font-semibold border border-green-200"
                      >
                        <RefreshCw className="w-3 h-3" /> Update
                      </button>
                      {canDelete && (
                        <button
                          onClick={() => item.id && handleDelete(item.id)}
                          disabled={deletingItem === item.id}
                          className="flex items-center justify-center rounded-lg h-8 w-8 bg-red-50 text-red-600 border border-red-200"
                        >
                          {deletingItem === item.id ? (
                            <div className="w-3 h-3 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <Trash2 className="w-3 h-3" />
                          )}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
        {/* Mobile Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between py-3">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">Hal {currentPage}/{totalPages}</span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* ========== MOBILE FAB (md:hidden) ========== */}
      {!showHistory && canCreate && (
        <button
          onClick={openCreateModal}
          className="md:hidden fixed bottom-6 right-4 flex items-center gap-2 bg-indigo-600 text-white px-5 py-3 rounded-full shadow-lg shadow-indigo-600/40 active:scale-95 transition-transform z-30"
        >
          <Plus className="w-5 h-5" />
          <span className="font-bold text-sm">Tambah Temuan</span>
        </button>
      )}

      {/* ========== DESKTOP TABLE (hidden md:block) ========== */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-blue-700 uppercase">
                  No
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-blue-700 uppercase">
                  Ruang
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-blue-700 uppercase">
                  Inspector
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-blue-700 uppercase">
                  Temuan
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-blue-700 uppercase">
                  Severity
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-blue-700 uppercase">
                  Tgl Temuan
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-blue-700 uppercase">
                  Foto Temuan
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-blue-700 uppercase">
                  Perbaikan
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-blue-700 uppercase">
                  Tgl Selesai
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-blue-700 uppercase">
                  Foto Hasil
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-blue-700 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-blue-700 uppercase">
                  Dibuat
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-blue-700 uppercase">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredData.length === 0 ? (
                <tr>
                  <td
                    colSpan={13}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    {showHistory
                      ? "Tidak ada data di history"
                      : "Belum ada data temuan"}
                  </td>
                </tr>
              ) : (
                filteredData.map((item, i) => (
                  <tr
                    key={item.id}
                    className="hover:bg-blue-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {(currentPage - 1) * pageSize + i + 1}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-blue-700">
                      {item.ruang}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {item.inspector || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-xs">
                      <div className="flex items-center gap-2">
                        <div
                          className="line-clamp-2 flex-1 cursor-help"
                          title={item.temuan}
                        >
                          {item.temuan}
                        </div>
                        {/* ✅ SELALU TAMPILKAN EYE BUTTON - NO CONDITIONS */}
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log("🔍 Opening modal for ID:", item.id);
                            setExpandedTemuan(item.id || null);
                          }}
                          type="button"
                          className="text-blue-600 hover:text-blue-800 flex-shrink-0 hover:scale-110 transition-transform p-1.5 rounded-lg hover:bg-blue-50 border border-transparent hover:border-blue-200"
                          title="Lihat detail lengkap"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${item.severity === "Critical"
                          ? "bg-red-100 text-red-800"
                          : item.severity === "High"
                            ? "bg-orange-100 text-orange-800"
                            : item.severity === "Medium"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-green-100 text-green-800"
                          }`}
                      >
                        {item.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatCompactDate(item.tanggalTemuan)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {item.fotoTemuanUrls && item.fotoTemuanUrls.length > 0 ? (
                        <div className="flex items-center gap-2">
                          <div className="relative w-12 h-12 flex-shrink-0">
                            <img
                              src={item.fotoTemuanUrls[0]}
                              alt="Foto Temuan"
                              className="w-full h-full object-cover rounded border border-blue-300 cursor-pointer hover:opacity-75 transition-opacity"
                              onClick={() =>
                                openImageGallery(item.fotoTemuanUrls || [])
                              }
                            />
                            {item.fotoTemuanUrls.length > 1 && (
                              <div className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                                {item.fotoTemuanUrls.length}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() =>
                              openImageGallery(item.fotoTemuanUrls || [])
                            }
                            className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-xs"
                          ></button>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-xs">
                      <div className="line-clamp-2">
                        {item.perbaikanDilakukan || "-"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatDateSafe(item.tanggalSelesaiPerbaikan)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {item.fotoHasilUrls && item.fotoHasilUrls.length > 0 ? (
                        <div className="flex items-center gap-2">
                          {/* Thumbnail Preview */}
                          <div className="relative w-12 h-12 flex-shrink-0">
                            <img
                              src={item.fotoHasilUrls[0]}
                              alt="Foto Hasil"
                              className="w-full h-full object-cover rounded border border-green-300 cursor-pointer hover:opacity-75 transition-opacity"
                              onClick={() =>
                                openImageGallery(item.fotoHasilUrls || [])
                              }
                            />
                            {item.fotoHasilUrls.length > 1 && (
                              <div className="absolute -top-1 -right-1 bg-green-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                                {item.fotoHasilUrls.length}
                              </div>
                            )}
                          </div>

                          {/* View Button */}
                          <button
                            onClick={() =>
                              openImageGallery(item.fotoHasilUrls || [])
                            }
                            className="text-green-600 hover:text-green-800 flex items-center gap-1 text-xs"
                          >
                            {/* <Eye className="w-3 h-3" />
                            {item.fotoHasil} */}
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.status === "Closed"
                          ? "bg-green-100 text-green-800"
                          : item.status === "In Progress"
                            ? "bg-blue-100 text-blue-800"
                            : item.status === "Rejected"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <div>{item.createdByName}</div>
                      <div className="text-xs text-gray-500">
                        {formatDateTime(item.createdAt)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        {showHistory ? (
                          <>
                            {canRestore && (
                              <button
                                onClick={() => item.id && handleRestore(item.id)}
                                disabled={restoringItem === item.id}
                                className="px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 flex items-center gap-1 text-xs font-medium disabled:opacity-50"
                                title="Restore dari History"
                              >
                                {restoringItem === item.id ? (
                                  <div className="w-3 h-3 border-2 border-green-700 border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                  <RotateCcw className="w-3 h-3" />
                                )}
                                Restore
                              </button>
                            )}

                            {canDelete && (
                              <button
                                onClick={() =>
                                  item.id &&
                                  handleDeletePermanent(item.id, item.ruang)
                                }
                                disabled={deletingPermanentItem === item.id}
                                className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 flex items-center gap-1 text-xs font-medium disabled:opacity-50"
                                title="Hapus Permanen (Tidak bisa dikembalikan!)"
                              >
                                {deletingPermanentItem === item.id ? (
                                  <div className="w-3 h-3 border-2 border-red-700 border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                  <AlertTriangle className="w-3 h-3" />
                                )}
                                Hapus Permanen
                              </button>
                            )}
                          </>
                        ) : (
                          <>
                            {canUpdate && (
                              <button
                                onClick={() =>
                                  item.id && openEditModal(item.id)
                                }
                                className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 flex items-center gap-1 text-xs font-medium"
                                title="Edit Detail Temuan"
                              >
                                <Edit className="w-3 h-3" />
                                Edit
                              </button>
                            )}

                            {canUpdate && (
                              <button
                                onClick={() =>
                                  item.id && openUpdateModal(item.id)
                                }
                                className="px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 flex items-center gap-1 text-xs font-medium"
                                title="Update Perbaikan"
                              >
                                <RefreshCw className="w-3 h-3" />
                                Update
                              </button>
                            )}

                            {canDelete && (
                              <button
                                onClick={() => item.id && handleDelete(item.id)}
                                disabled={deletingItem === item.id}
                                className="text-red-600 hover:text-red-800 disabled:opacity-50"
                                title="Pindah ke History"
                              >
                                {deletingItem === item.id ? (
                                  <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Halaman {currentPage} dari {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========== DETAIL MODAL (visible on ALL screens) ========== */}
      <AnimatePresence>
        {expandedTemuan && (() => {
          const item = data.find((d) => d.id === expandedTemuan);
          if (!item) return null;
          return (
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setExpandedTemuan(null)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: "spring", duration: 0.3 }}
                className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 md:p-5 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Eye className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg md:text-xl font-bold">Detail Temuan</h3>
                      <p className="text-white/70 text-xs">{item.ruang}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setExpandedTemuan(null)}
                    className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-colors"
                    type="button"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Scrollable Content */}
                <div className="p-4 md:p-6 overflow-y-auto flex-1 space-y-4">
                  {/* Status & Severity Badges */}
                  <div className="flex flex-wrap gap-2">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${item.severity === "Critical" ? "bg-red-100 text-red-800"
                      : item.severity === "High" ? "bg-orange-100 text-orange-800"
                        : item.severity === "Medium" ? "bg-yellow-100 text-yellow-800"
                          : "bg-green-100 text-green-800"
                      }`}>
                      ⚠️ {item.severity}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${item.status === "Closed" ? "bg-green-100 text-green-800"
                      : item.status === "In Progress" ? "bg-blue-100 text-blue-800"
                        : item.status === "Rejected" ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}>
                      {item.status}
                    </span>
                  </div>

                  {/* Deskripsi Temuan */}
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">📝 Deskripsi Temuan</h4>
                    <p className="text-gray-800 whitespace-pre-wrap leading-relaxed text-sm">{item.temuan}</p>
                  </div>

                  {/* Info Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <span className="text-xs text-gray-500 block">📍 Ruang</span>
                      <span className="font-semibold text-gray-900 text-sm">{item.ruang}</span>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <span className="text-xs text-gray-500 block">👤 Inspector</span>
                      <span className="font-semibold text-gray-900 text-sm">{item.inspector || "-"}</span>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <span className="text-xs text-gray-500 block">📅 Tgl Temuan</span>
                      <span className="font-semibold text-gray-900 text-sm">{formatCompactDate(item.tanggalTemuan)}</span>
                    </div>
                    {item.kategoriTemuan && (
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <span className="text-xs text-gray-500 block">🏷️ Kategori</span>
                        <span className="font-semibold text-gray-900 text-sm">{item.kategoriTemuan}</span>
                      </div>
                    )}
                    {item.noFollowUp && (
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <span className="text-xs text-gray-500 block">📋 No Follow Up</span>
                        <span className="font-semibold text-gray-900 text-sm">{item.noFollowUp}</span>
                      </div>
                    )}
                    {item.picPelaksana && (
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <span className="text-xs text-gray-500 block">🔧 PIC Pelaksana</span>
                        <span className="font-semibold text-gray-900 text-sm">{item.picPelaksana}</span>
                      </div>
                    )}
                  </div>

                  {/* Foto Temuan */}
                  {item.fotoTemuanUrls && item.fotoTemuanUrls.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">📸 Foto Temuan ({item.fotoTemuanUrls.length})</h4>
                      <div className="grid grid-cols-3 gap-2">
                        {item.fotoTemuanUrls.map((url, idx) => (
                          <img
                            key={idx}
                            src={url}
                            alt={`Temuan ${idx + 1}`}
                            className="w-full h-24 md:h-32 object-cover rounded-lg border border-blue-200 cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => openImageGallery(item.fotoTemuanUrls || [], idx)}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Perbaikan Section */}
                  {(item.perbaikanDilakukan || item.tanggalPerbaikan || (item.fotoHasilUrls && item.fotoHasilUrls.length > 0)) && (
                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                      <h4 className="text-sm font-semibold text-green-800 mb-3">🔧 Perbaikan</h4>
                      {item.perbaikanDilakukan && (
                        <p className="text-gray-800 text-sm mb-3 whitespace-pre-wrap">{item.perbaikanDilakukan}</p>
                      )}
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {item.tanggalPerbaikan && (
                          <div>
                            <span className="text-xs text-gray-500 block">📅 Tgl Perbaikan</span>
                            <span className="font-medium text-gray-800">{formatDateSafe(item.tanggalPerbaikan)}</span>
                          </div>
                        )}
                        {item.tanggalSelesaiPerbaikan && (
                          <div>
                            <span className="text-xs text-gray-500 block">✅ Tgl Selesai</span>
                            <span className="font-medium text-gray-800">{formatDateSafe(item.tanggalSelesaiPerbaikan)}</span>
                          </div>
                        )}
                      </div>

                      {/* Foto Hasil */}
                      {item.fotoHasilUrls && item.fotoHasilUrls.length > 0 && (
                        <div className="mt-3">
                          <h5 className="text-xs font-semibold text-green-700 mb-2">📸 Foto Hasil ({item.fotoHasilUrls.length})</h5>
                          <div className="grid grid-cols-3 gap-2">
                            {item.fotoHasilUrls.map((url, idx) => (
                              <img
                                key={idx}
                                src={url}
                                alt={`Hasil ${idx + 1}`}
                                className="w-full h-24 md:h-32 object-cover rounded-lg border border-green-200 cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => openImageGallery(item.fotoHasilUrls || [], idx)}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Keterangan */}
                  {item.keterangan && (
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">💬 Keterangan</h4>
                      <p className="text-gray-800 text-sm whitespace-pre-wrap">{item.keterangan}</p>
                    </div>
                  )}

                  {/* Created By */}
                  <div className="text-xs text-gray-400 text-right">
                    Dibuat oleh {item.createdByName} • {formatDateTime(item.createdAt)}
                  </div>
                </div>

                {/* Footer */}
                <div className="px-4 md:px-6 py-3 md:py-4 bg-gray-50 border-t flex justify-end shrink-0">
                  <button
                    onClick={() => setExpandedTemuan(null)}
                    type="button"
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm text-sm"
                  >
                    Tutup
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* Modal Form - Keep existing modal code but use new delete handlers */}
      {/* I'll continue with the modal in the next part due to length... */}

      {/* Image Gallery Modal - Unchanged */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full my-8 overflow-hidden"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-5 flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  {modalMode === "create" && (
                    <>
                      <Plus className="w-5 h-5" />
                      Tambah Temuan Baru
                    </>
                  )}
                  {modalMode === "edit" && (
                    <>
                      <Edit className="w-5 h-5" />
                      Edit Detail Temuan
                    </>
                  )}
                  {modalMode === "update" && (
                    <>
                      <RefreshCw className="w-5 h-5" />
                      Update Perbaikan
                    </>
                  )}
                </h2>
                <button
                  onClick={closeModal}
                  disabled={isSubmitting}
                  className="text-white/80 hover:text-white disabled:opacity-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* ✅ WARNING IF DELETE OPERATION IN PROGRESS */}
              {deletingPhoto && (
                <div className="bg-yellow-50 border-b border-yellow-200 p-3 flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-yellow-600 border-t-transparent"></div>
                  <span className="text-sm text-yellow-800 font-medium">
                    Menghapus foto... Mohon tunggu hingga selesai sebelum
                    menyimpan perubahan.
                  </span>
                </div>
              )}

              <form
                onSubmit={handleSubmit}
                className="p-6 space-y-5 max-h-[75vh] overflow-y-auto"
              >
                {/* ====================================== */}
                {/* CREATE MODE */}
                {/* ====================================== */}
                {modalMode === "create" && (
                  <>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4">
                      <p className="text-sm text-blue-800 font-medium">
                        📝 Form Laporan Temuan Baru
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                          <MapPin className="w-4 h-4 text-blue-600" />
                          Ruang <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={form.ruang}
                          onChange={(e) =>
                            setForm({ ...form, ruang: e.target.value })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Contoh: Ruang Server A"
                        />
                      </div>

                      <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                          <User className="w-4 h-4 text-blue-600" />
                          Inspector
                        </label>
                        <input
                          type="text"
                          value={form.inspector}
                          onChange={(e) =>
                            setForm({ ...form, inspector: e.target.value })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Nama inspector"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Severity <span className="text-red-500">*</span>
                        </label>
                        <select
                          required
                          value={form.severity}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              severity: e.target.value as any,
                            })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="Low">Low</option>
                          <option value="Medium">Medium</option>
                          <option value="High">High</option>
                          <option value="Critical">Critical</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                        <AlertCircle className="w-4 h-4 text-yellow-600" />
                        Temuan <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        required
                        rows={3}
                        value={form.temuan}
                        onChange={(e) =>
                          setForm({ ...form, temuan: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                        placeholder="Jelaskan temuan secara detail..."
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Kategori Temuan
                        </label>
                        <input
                          type="text"
                          value={form.kategoriTemuan}
                          onChange={(e) =>
                            setForm({ ...form, kategoriTemuan: e.target.value })
                          }
                          className="w-full px-4 py-2 border rounded-lg"
                          placeholder="Contoh: Kebersihan, Keamanan, dll"
                        />
                      </div>

                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                          <Calendar className="w-4 h-4" />
                          Tanggal Temuan <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          required
                          value={form.tanggalTemuan}
                          onChange={(e) =>
                            setForm({ ...form, tanggalTemuan: e.target.value })
                          }
                          className="w-full px-4 py-2 border rounded-lg"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          No Follow Up
                        </label>
                        <input
                          type="text"
                          value={form.noFollowUp}
                          onChange={(e) =>
                            setForm({ ...form, noFollowUp: e.target.value })
                          }
                          className="w-full px-4 py-2 border rounded-lg"
                          placeholder="WR-2025-001 atau Email"
                        />
                      </div>

                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                          <User className="w-4 h-4" />
                          PIC Pelaksana
                        </label>
                        <input
                          type="text"
                          value={form.picPelaksana}
                          onChange={(e) =>
                            setForm({ ...form, picPelaksana: e.target.value })
                          }
                          className="w-full px-4 py-2 border rounded-lg"
                          placeholder="Nama PIC atau Email"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Keterangan
                      </label>
                      <textarea
                        rows={2}
                        value={form.keterangan}
                        onChange={(e) =>
                          setForm({ ...form, keterangan: e.target.value })
                        }
                        className="w-full px-4 py-2 border rounded-lg resize-none"
                        placeholder="Catatan tambahan..."
                      />
                    </div>

                    <ImageUploadZone
                      label="Foto Temuan (Multiple)"
                      files={fotoTemuanFiles}
                      previews={fotoTemuanPreviews}
                      onFilesChange={handleFotoTemuanChange}
                      onRemovePreview={removeFotoTemuanPreview}
                      iconColor="blue"
                    />
                  </>
                )}

                {/* ====================================== */}
                {/* EDIT MODE */}
                {/* ====================================== */}
                {modalMode === "edit" && (
                  <>
                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-200 mb-4">
                      <p className="text-sm text-orange-800 font-medium">
                        ✏️ Edit Detail Temuan (Admin Only)
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                          <MapPin className="w-4 h-4 text-blue-600" />
                          Ruang <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={form.ruang}
                          onChange={(e) =>
                            setForm({ ...form, ruang: e.target.value })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                          <User className="w-4 h-4 text-blue-600" />
                          Inspector
                        </label>
                        <input
                          type="text"
                          value={form.inspector}
                          onChange={(e) =>
                            setForm({ ...form, inspector: e.target.value })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Severity <span className="text-red-500">*</span>
                        </label>
                        <select
                          required
                          value={form.severity}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              severity: e.target.value as any,
                            })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="Low">Low</option>
                          <option value="Medium">Medium</option>
                          <option value="High">High</option>
                          <option value="Critical">Critical</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                        <AlertCircle className="w-4 h-4 text-yellow-600" />
                        Temuan <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        required
                        rows={3}
                        value={form.temuan}
                        onChange={(e) =>
                          setForm({ ...form, temuan: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Kategori Temuan
                        </label>
                        <input
                          type="text"
                          value={form.kategoriTemuan}
                          onChange={(e) =>
                            setForm({ ...form, kategoriTemuan: e.target.value })
                          }
                          className="w-full px-4 py-2 border rounded-lg"
                        />
                      </div>

                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                          <Calendar className="w-4 h-4" />
                          Tanggal Temuan <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          required
                          value={form.tanggalTemuan}
                          onChange={(e) =>
                            setForm({ ...form, tanggalTemuan: e.target.value })
                          }
                          className="w-full px-4 py-2 border rounded-lg"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          No Follow Up
                        </label>
                        <input
                          type="text"
                          value={form.noFollowUp}
                          onChange={(e) =>
                            setForm({ ...form, noFollowUp: e.target.value })
                          }
                          className="w-full px-4 py-2 border rounded-lg"
                        />
                      </div>

                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                          <User className="w-4 h-4" />
                          PIC Pelaksana
                        </label>
                        <input
                          type="text"
                          value={form.picPelaksana}
                          onChange={(e) =>
                            setForm({ ...form, picPelaksana: e.target.value })
                          }
                          className="w-full px-4 py-2 border rounded-lg"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Keterangan
                      </label>
                      <textarea
                        rows={2}
                        value={form.keterangan}
                        onChange={(e) =>
                          setForm({ ...form, keterangan: e.target.value })
                        }
                        className="w-full px-4 py-2 border rounded-lg resize-none"
                      />
                    </div>

                    {/* ✅ EXISTING FOTO TEMUAN WITH DELETE */}
                    {existingFotoTemuan.length > 0 && (
                      <div className="mt-4">
                        <p className="text-xs font-medium text-gray-600 mb-2">
                          Foto yang sudah ada:
                        </p>
                        <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                          {existingFotoTemuan.map((url, index) => (
                            <div
                              key={`existing-${index}`}
                              className="relative group"
                            >
                              <img
                                src={url}
                                alt={`Existing ${index + 1}`}
                                className="w-full h-20 object-cover rounded-lg border-2 border-gray-300 cursor-pointer hover:opacity-75"
                                onClick={() =>
                                  openImageGallery(existingFotoTemuan, index)
                                }
                              />
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (editingId) {
                                    handleDeleteFotoTemuan(editingId, index);
                                  }
                                }}
                                disabled={
                                  deletingPhoto?.id === editingId &&
                                  deletingPhoto?.type === "temuan" &&
                                  deletingPhoto.index === index
                                }
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                                title={
                                  deletingPhoto
                                    ? "Menghapus foto..."
                                    : "Hapus foto"
                                }
                              >
                                {deletingPhoto?.id === editingId &&
                                  deletingPhoto?.type === "temuan" &&
                                  deletingPhoto.index === index ? (
                                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                  <X className="w-3 h-3" />
                                )}
                              </button>
                              <div className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-2 py-0.5 rounded">
                                Existing {index + 1}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <ImageUploadZone
                      label="Tambah Foto Temuan Baru"
                      files={fotoTemuanFiles}
                      previews={fotoTemuanPreviews}
                      onFilesChange={handleFotoTemuanChange}
                      onRemovePreview={removeFotoTemuanPreview}
                      iconColor="blue"
                    />
                  </>
                )}

                {/* ====================================== */}
                {/* UPDATE MODE */}
                {/* ====================================== */}
                {modalMode === "update" && (
                  <>
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200 mb-4">
                      <p className="text-sm text-green-800 font-medium">
                        🔄 Update Status Perbaikan
                      </p>
                    </div>

                    {/* Show Temuan Info (Read-only) */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <h3 className="font-semibold text-gray-900 mb-3">
                        📋 Info Temuan
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-600">Ruang:</span>
                          <span className="ml-2 font-medium">{form.ruang}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Inspector:</span>
                          <span className="ml-2 font-medium">
                            {form.inspector || "-"}
                          </span>
                        </div>
                        <div className="md:col-span-2">
                          <span className="text-gray-600">Temuan:</span>
                          <p className="mt-1 text-gray-900">{form.temuan}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Severity:</span>
                          <span
                            className={`ml-2 px-2 py-0.5 rounded text-xs font-medium ${form.severity === "Critical"
                              ? "bg-red-100 text-red-800"
                              : form.severity === "High"
                                ? "bg-orange-100 text-orange-800"
                                : form.severity === "Medium"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-green-100 text-green-800"
                              }`}
                          >
                            {form.severity}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Tanggal Temuan:</span>
                          <span className="ml-2 font-medium">
                            {formatDateSafe(form.tanggalTemuan, "dd MMM yyyy")}
                          </span>
                        </div>
                      </div>

                      {existingFotoTemuan.length > 0 && (
                        <div className="mt-3">
                          <span className="text-gray-600 text-sm">
                            Foto Temuan:
                          </span>
                          <div className="grid grid-cols-4 md:grid-cols-6 gap-2 mt-2">
                            {existingFotoTemuan.map((url, index) => (
                              <img
                                key={index}
                                src={url}
                                alt={`Temuan ${index + 1}`}
                                className="w-full h-16 object-cover rounded border cursor-pointer hover:opacity-75"
                                onClick={() =>
                                  openImageGallery(existingFotoTemuan, index)
                                }
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* ✅ UPDATE PERBAIKAN FORM */}
                    <div className="space-y-4 mt-6">
                      {/* ✅ No Follow Up & PIC Pelaksana - EDITABLE IN UPDATE MODE */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <div>
                          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                            <AlertCircle className="w-4 h-4 text-blue-600" />
                            No Follow Up
                          </label>
                          <input
                            type="text"
                            value={form.noFollowUp}
                            onChange={(e) =>
                              setForm({ ...form, noFollowUp: e.target.value })
                            }
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                            placeholder="WR-2025-001 atau Email"
                          />
                        </div>

                        <div>
                          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                            <User className="w-4 h-4 text-blue-600" />
                            PIC Pelaksana
                          </label>
                          <input
                            type="text"
                            value={form.picPelaksana}
                            onChange={(e) =>
                              setForm({ ...form, picPelaksana: e.target.value })
                            }
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                            placeholder="Nama PIC atau Email"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                          <Wrench className="w-4 h-4 text-green-600" />
                          Perbaikan yang Dilakukan
                        </label>
                        <textarea
                          rows={4}
                          value={form.perbaikanDilakukan}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              perbaikanDilakukan: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 border rounded-lg resize-none focus:ring-2 focus:ring-green-500"
                          placeholder="Deskripsikan perbaikan yang telah dilakukan..."
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                            <Calendar className="w-4 h-4" />
                            Tanggal Perbaikan
                          </label>
                          <input
                            type="date"
                            value={form.tanggalPerbaikan}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                tanggalPerbaikan: e.target.value,
                              })
                            }
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                          />
                        </div>

                        <div>
                          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            Tanggal Selesai
                          </label>
                          <input
                            type="date"
                            value={form.tanggalSelesaiPerbaikan}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                tanggalSelesaiPerbaikan: e.target.value,
                              })
                            }
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Status
                          </label>
                          <select
                            value={form.status}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                status: e.target.value as any,
                              })
                            }
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                          >
                            <option value="Open">Open</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Closed">Closed</option>
                            <option value="Rejected">Rejected</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Keterangan Update
                        </label>
                        <textarea
                          rows={2}
                          value={form.keterangan}
                          onChange={(e) =>
                            setForm({ ...form, keterangan: e.target.value })
                          }
                          className="w-full px-4 py-2 border rounded-lg resize-none focus:ring-2 focus:ring-green-500"
                          placeholder="Catatan tambahan tentang perbaikan..."
                        />
                      </div>

                      {/* ✅ EXISTING FOTO HASIL WITH DELETE */}
                      {existingFotoHasil.length > 0 && (
                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-2 block">
                            Foto Hasil Existing:
                          </label>
                          <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                            {existingFotoHasil.map((url, index) => (
                              <div key={index} className="relative group">
                                <img
                                  src={url}
                                  alt={`Hasil ${index + 1}`}
                                  className="w-full h-20 object-cover rounded border cursor-pointer hover:opacity-75"
                                  onClick={() =>
                                    openImageGallery(existingFotoHasil, index)
                                  }
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (editingId) {
                                      handleDeleteFotoHasil(editingId, index);
                                    }
                                  }}
                                  disabled={
                                    deletingPhoto?.id === editingId &&
                                    deletingPhoto?.type === "hasil" &&
                                    deletingPhoto.index === index
                                  }
                                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                                  title={
                                    deletingPhoto
                                      ? "Menghapus foto..."
                                      : "Hapus foto hasil"
                                  }
                                >
                                  {deletingPhoto?.id === editingId &&
                                    deletingPhoto?.type === "hasil" &&
                                    deletingPhoto.index === index ? (
                                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                  ) : (
                                    <X className="w-3 h-3" />
                                  )}
                                </button>
                                <div className="absolute bottom-1 left-1 bg-green-600 text-white text-xs px-2 py-0.5 rounded">
                                  Hasil {index + 1}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <ImageUploadZone
                        label="Foto Hasil Perbaikan (Multiple)"
                        files={fotoHasilFiles}
                        previews={fotoHasilPreviews}
                        onFilesChange={handleFotoHasilChange}
                        onRemovePreview={removeFotoHasilPreview}
                        iconColor="green"
                      />
                    </div>
                  </>
                )}

                {/* ✅ SUBMIT BUTTONS */}
                <div className="flex gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={isSubmitting || !!deletingPhoto}
                    className="flex-1 px-5 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !!deletingPhoto}
                    className={`flex-1 px-5 py-3 text-white rounded-xl font-medium disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${modalMode === "create"
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                      : modalMode === "edit"
                        ? "bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
                        : "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                      }`}
                    title={
                      deletingPhoto
                        ? "Tunggu hingga proses delete foto selesai"
                        : ""
                    }
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        {modalMode === "create"
                          ? "Menyimpan..."
                          : modalMode === "edit"
                            ? "Mengupdate..."
                            : "Mengupdate Perbaikan..."}
                      </>
                    ) : deletingPhoto ? (
                      <>
                        <AlertCircle className="w-4 h-4" />
                        Tunggu Delete Foto...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        {modalMode === "create"
                          ? "Simpan Temuan"
                          : modalMode === "edit"
                            ? "Update Detail"
                            : "Update Perbaikan"}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Image Gallery Modal */}
      <AnimatePresence>
        {showImageGallery && (
          <div
            className="fixed inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
            onClick={closeImageGallery}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full h-full max-w-7xl max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="text-white text-lg font-medium">
                  {currentImageIndex + 1} / {viewingImages.length}
                </div>
                <button
                  onClick={closeImageGallery}
                  className="text-white hover:text-gray-300 flex items-center gap-2 bg-black/50 px-4 py-2 rounded-lg hover:bg-black/70 transition-colors"
                >
                  <X className="w-5 h-5" />
                  <span>Close (ESC)</span>
                </button>
              </div>

              {/* Main Image Container - FIXED ASPECT RATIO */}
              <div className="relative flex-1 bg-black/30 rounded-lg overflow-hidden flex items-center justify-center">
                <img
                  src={viewingImages[currentImageIndex]}
                  alt={`Image ${currentImageIndex + 1}`}
                  className="max-w-full max-h-full w-auto h-auto object-contain"
                  style={{
                    imageRendering: "crisp-edges" as any, // ✅ FIXED: Use 'crisp-edges' or 'pixelated'
                  }}
                />

                {/* Navigation Arrows */}
                {viewingImages.length > 1 && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        prevImage();
                      }}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-4 transition-all hover:scale-110"
                      title="Previous (←)"
                    >
                      <ChevronDown className="w-6 h-6 rotate-90" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        nextImage();
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-4 transition-all hover:scale-110"
                      title="Next (→)"
                    >
                      <ChevronDown className="w-6 h-6 -rotate-90" />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnail Strip - FIXED ASPECT RATIO */}
              {viewingImages.length > 1 && (
                <div className="mt-4 flex gap-2 justify-center overflow-x-auto pb-2 px-2">
                  {viewingImages.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`flex-shrink-0 w-24 h-16 rounded-lg border-2 overflow-hidden transition-all ${index === currentImageIndex
                        ? "border-blue-500 ring-2 ring-blue-400"
                        : "border-gray-400 hover:border-gray-300"
                        }`}
                    >
                      <img
                        src={img}
                        alt={`Thumb ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========== FILTER MODALS (Root level to fix z-index issues) ========== */}
      <div id="dropdown-ruangan" className="hidden fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 sm:p-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={() => document.getElementById("dropdown-ruangan")?.classList.add("hidden")}>
        <div
          className="bg-white rounded-2xl shadow-xl w-full max-w-sm sm:max-w-md overflow-hidden flex flex-col max-h-[70vh] sm:max-h-[80vh] animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/80">
            <h3 className="font-bold text-gray-800">Pilih Ruangan</h3>
            <button onClick={() => document.getElementById("dropdown-ruangan")?.classList.add("hidden")} className="text-gray-500 hover:text-gray-700 hover:bg-gray-200 p-1.5 rounded-full transition-colors"><X className="w-5 h-5" /></button>
          </div>
          <div className="overflow-y-auto overscroll-contain p-2 space-y-1">
            <div
              className={`px-4 py-3.5 text-sm rounded-xl cursor-pointer transition-all flex items-center justify-between ${!selectedRuang ? 'font-bold text-indigo-700 bg-indigo-50/80' : 'text-gray-700 hover:bg-gray-50'}`}
              onClick={() => {
                setSelectedRuang("");
                setCurrentPage(1);
                document.getElementById("dropdown-ruangan")?.classList.add("hidden");
              }}
            >
              Semua Ruangan
              {!selectedRuang && <Check className="w-4 h-4" />}
            </div>
            {ruangList.map((r) => (
              <div
                key={r}
                className={`px-4 py-3.5 text-sm rounded-xl cursor-pointer transition-all flex items-center justify-between ${selectedRuang === r ? 'font-bold text-indigo-700 bg-indigo-50/80' : 'text-gray-700 hover:bg-gray-50'}`}
                onClick={() => {
                  setSelectedRuang(r);
                  setCurrentPage(1);
                  document.getElementById("dropdown-ruangan")?.classList.add("hidden");
                }}
              >
                {r}
                {selectedRuang === r && <Check className="w-4 h-4" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div id="dropdown-status" className="hidden fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 sm:p-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={() => document.getElementById("dropdown-status")?.classList.add("hidden")}>
        <div
          className="bg-white rounded-2xl shadow-xl w-full max-w-sm sm:max-w-md overflow-hidden flex flex-col max-h-[70vh] sm:max-h-[80vh] animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/80">
            <h3 className="font-bold text-gray-800">Pilih Status</h3>
            <button onClick={() => document.getElementById("dropdown-status")?.classList.add("hidden")} className="text-gray-500 hover:text-gray-700 hover:bg-gray-200 p-1.5 rounded-full transition-colors"><X className="w-5 h-5" /></button>
          </div>
          <div className="overflow-y-auto overscroll-contain p-2 space-y-1">
            {[
              { val: "", label: "Semua Status" },
              { val: "Open", label: "Open" },
              { val: "In Progress", label: "In Progress" },
              { val: "Closed", label: "Closed" },
              { val: "Rejected", label: "Rejected" }
            ].map((s) => (
              <div
                key={s.label}
                className={`px-4 py-3.5 text-sm rounded-xl cursor-pointer transition-all flex items-center justify-between ${selectedStatus === s.val ? 'font-bold text-indigo-700 bg-indigo-50/80' : 'text-gray-700 hover:bg-gray-50'}`}
                onClick={() => {
                  setSelectedStatus(s.val);
                  setCurrentPage(1);
                  document.getElementById("dropdown-status")?.classList.add("hidden");
                }}
              >
                {s.label}
                {selectedStatus === s.val && <Check className="w-4 h-4" />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
