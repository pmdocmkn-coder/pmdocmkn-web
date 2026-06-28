import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { warehouseBorrowApi } from "../../services/warehouseBorrowApi";
import { warehousePartApi } from "../../services/warehousePartApi";
import { radioRepairApi } from "../../services/radioRepairApi";
import { workshopTechnicianApi, type WorkshopTechnicianDto } from "../../services/workshopTechnicianApi";
import { api } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import type { RadioRepairJobDetail, RadioRepairJobList } from "../../types/radioRepair";
import type { WarehousePartCatalogItem } from "../../services/warehousePartApi";
import type { WarehouseBorrowItem } from "../../types/warehouseBorrow";
import { useToast } from "../../hooks/use-toast";
import { motion } from "framer-motion";
import { PackageOpen, ArrowLeft, Wrench, AlertCircle, Search, Plus, Trash2, User } from "lucide-react";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { FormMobileSelect } from "../Radio/FormMobileSelect";

interface UserLookupItem {
  id: number;
  name: string;
  username: string;
  roleName?: string | null;
}

interface BorrowItemRow {
  key: number;
  partDescription: string;
  partCode: string;
  quantity: number;
  suggestions: WarehousePartCatalogItem[];
  searching: boolean;
  showSuggestions: boolean;
}

let rowKeyCounter = 0;

function createEmptyRow(): BorrowItemRow {
  return {
    key: ++rowKeyCounter,
    partDescription: "",
    partCode: "",
    quantity: 1,
    suggestions: [],
    searching: false,
    showSuggestions: false,
  };
}

export default function WarehouseBorrowRequestPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [params] = useSearchParams();
  const jobId = params.get("repairJobId");

  // Multi-item rows
  const [rows, setRows] = useState<BorrowItemRow[]>([createEmptyRow()]);

  // Ticket / Job search (combined into one input)
  const [ticketSearch, setTicketSearch] = useState("");
  const [jobSuggestions, setJobSuggestions] = useState<RadioRepairJobList[]>([]);
  const [jobPicking, setJobPicking] = useState(false);
  const [selectedRepairJobId, setSelectedRepairJobId] = useState<number | null>(
    jobId ? Number(jobId) : null
  );
  const [ticketNumber, setTicketNumber] = useState("");
  const [showJobSuggestions, setShowJobSuggestions] = useState(false);

  const [purpose, setPurpose] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [jobDetail, setJobDetail] = useState<RadioRepairJobDetail | null>(null);
  const [loadingJob, setLoadingJob] = useState(!!jobId);

  // Borrower name
  const [borrowerName, setBorrowerName] = useState("");
  // Step 2: nama teknisi spesifik dari workshop
  const [workshopTechName, setWorkshopTechName] = useState("");
  // Semua user terdaftar (dropdown utama)
  const [allUsers, setAllUsers] = useState<UserLookupItem[]>([]);
  // Teknisi workshop (dropdown ke-2 jika pilih Teknisi WSK)
  const [technicians, setTechnicians] = useState<WorkshopTechnicianDto[]>([]);
  // Simpan object user yang dipilih agar bisa akses roleName langsung
  const [selectedBorrowerUser, setSelectedBorrowerUser] = useState<UserLookupItem | null>(null);

  // Deteksi apakah user yang dipilih adalah Teknisi WSK — pakai object yang tersimpan
  const WORKSHOP_ROLE = "teknisi wsk";
  const selectedUserIsWorkshop =
    (selectedBorrowerUser?.roleName ?? "").toLowerCase().trim() === WORKSHOP_ROLE;

  // Load kedua data sekaligus
  useEffect(() => {
    api.get<{ data: UserLookupItem[] }>("/api/users/lookup")
      .then((res) => {
        const users = res.data?.data ?? [];
        console.log('📥 All Users loaded:', users.length, 'users');
        console.log('👥 Users with "Teknisi" or "Workshop" in role:',
          users.filter(u => u.roleName?.toLowerCase().includes('teknisi') || u.roleName?.toLowerCase().includes('workshop'))
        );
        setAllUsers(users);
      })
      .catch(() => setAllUsers([]));
    workshopTechnicianApi.getAllActive()
      .then((res) => {
        const techs = res.data?.data ?? [];
        console.log('🔧 Workshop Technicians loaded:', techs.length, 'technicians');
        setTechnicians(techs);
      })
      .catch(() => setTechnicians([]));
  }, []);

  // Auto-detect user yang dipilih dari borrowerName (fallback jika FormMobileSelect tidak trigger onChange dengan object)
  useEffect(() => {
    if (borrowerName && allUsers.length > 0) {
      const found = allUsers.find(u => u.name === borrowerName);
      if (found) {
        console.log('🔍 Auto-detect borrower:', { name: found.name, roleName: found.roleName, id: found.id });
        // Hanya update jika berbeda (bandingkan by id untuk avoid loop)
        if (!selectedBorrowerUser || selectedBorrowerUser.id !== found.id) {
          setSelectedBorrowerUser(found);
        }
      }
    } else if (!borrowerName) {
      // Reset jika borrowerName dikosongkan
      setSelectedBorrowerUser(null);
    }
  }, [borrowerName, allUsers]);

  // Debug: log perubahan selectedBorrowerUser dan status workshop
  useEffect(() => {
    console.log('═══════════════════════════════════════');
    console.log('📝 borrowerName:', borrowerName);
    console.log('👤 selectedBorrowerUser:', selectedBorrowerUser);
    console.log('🏭 selectedUserIsWorkshop:', selectedUserIsWorkshop);
    if (selectedBorrowerUser) {
      console.log('📋 Role Details:', {
        roleName: selectedBorrowerUser.roleName,
        lowercase: (selectedBorrowerUser.roleName ?? "").toLowerCase().trim(),
        expectedRole: WORKSHOP_ROLE,
        matches: (selectedBorrowerUser.roleName ?? "").toLowerCase().trim() === WORKSHOP_ROLE
      });
    }
    console.log('✅ Should show Step 2?', borrowerName && selectedUserIsWorkshop);
    console.log('═══════════════════════════════════════');
  }, [selectedBorrowerUser, selectedUserIsWorkshop, borrowerName]);

  // Load linked job detail
  useEffect(() => {
    if (jobId) {
      radioRepairApi
        .getById(Number(jobId), false)
        .then((res) => {
          setJobDetail(res);
          setTicketSearch(res.helpdeskTicketNumber);
          setTicketNumber(res.helpdeskTicketNumber);
        })
        .catch(() => {
          toast({ title: "Gagal memuat data pekerjaan", variant: "destructive" });
        })
        .finally(() => setLoadingJob(false));
    }
  }, [jobId, toast]);

  // Debounced part search per row
  useEffect(() => {
    const timers = rows.map((row, idx) => {
      return setTimeout(async () => {
        if (!row.partDescription.trim()) {
          updateRow(idx, { suggestions: [], searching: false });
          return;
        }
        updateRow(idx, { searching: true });
        try {
          const items = await warehousePartApi.search(row.partDescription, 6);
          updateRow(idx, { suggestions: items, searching: false, showSuggestions: true });
        } catch {
          updateRow(idx, { suggestions: [], searching: false });
        }
      }, 300);
    });
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows.map((r) => r.partDescription).join("|")]);

  // Debounced ticket/job search
  useEffect(() => {
    if (!ticketSearch.trim()) {
      setJobSuggestions([]);
      return;
    }
    // Prevent searching and popping up suggestions if it matches the already selected ticket
    if (ticketNumber && ticketSearch === ticketNumber) {
      return;
    }
    const timer = setTimeout(async () => {
      setJobPicking(true);
      try {
        const res = await radioRepairApi.getAll({
          search: ticketSearch,
          page: 1,
          pageSize: 5,
        });
        setJobSuggestions(res.data ?? []);
        setShowJobSuggestions(true);
      } catch {
        setJobSuggestions([]);
      } finally {
        setJobPicking(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [ticketSearch]);

  const updateRow = (idx: number, updates: Partial<BorrowItemRow>) => {
    setRows((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, ...updates } : r))
    );
  };

  const removeRow = (idx: number) => {
    setRows((prev) => prev.filter((_, i) => i !== idx));
  };

  const addRow = () => {
    setRows((prev) => [...prev, createEmptyRow()]);
  };

  const selectPartSuggestion = (idx: number, item: WarehousePartCatalogItem) => {
    updateRow(idx, {
      partDescription: item.partName,
      partCode: item.partCode,
      suggestions: [],
      showSuggestions: false,
    });
  };

  const selectJobSuggestion = (job: RadioRepairJobList) => {
    setSelectedRepairJobId(job.id);
    setTicketSearch(job.helpdeskTicketNumber);
    setTicketNumber(job.helpdeskTicketNumber);
    setShowJobSuggestions(false);
    setJobSuggestions([]);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validItems: WarehouseBorrowItem[] = rows
      .filter((r) => r.partDescription.trim())
      .map((r) => ({
        partDescription: r.partDescription.trim(),
        partCode: r.partCode.trim() || undefined,
        quantity: r.quantity,
      }));

    if (validItems.length === 0) {
      toast({ title: "Minimal 1 barang harus diisi", variant: "destructive" });
      return;
    }

    // Use ticketSearch as the ticket number if no job was selected from dropdown
    const finalTicket = ticketNumber || ticketSearch.trim() || undefined;

    setSubmitting(true);
    try {
      await warehouseBorrowApi.create({
        items: validItems,
        purpose: purpose || undefined,
        relatedRepairJobId:
          selectedRepairJobId ?? (jobId ? Number(jobId) : undefined),
        ticketNumber: finalTicket,
        // Jika user yang dipilih adalah Teknisi WSK dan ada nama teknisi spesifik → pakai nama teknisi
        borrowerName: (selectedUserIsWorkshop && workshopTechName ? workshopTechName : borrowerName.trim()) || undefined,
      });
      toast({ title: "Permintaan peminjaman berhasil dikirim" });

      if (jobId) {
        navigate("/radio/repair/dashboard");
      } else {
        setRows([createEmptyRow()]);
        setPurpose("");
        setTicketSearch("");
        setTicketNumber("");
        setSelectedRepairJobId(null);
      }
    } catch {
      toast({ title: "Gagal mengirim permintaan", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
      {/* ====== MOBILE INTEGRATED HEADER ====== */}
      <div className="md:hidden bg-white rounded-[14px] border border-[#E2E8F0] shadow-sm mb-4">
        <div className="flex items-start gap-4 p-4">
          <div className="w-12 h-12 rounded-[12px] bg-[#F0FFF4] flex items-center justify-center flex-shrink-0">
            <PackageOpen className="w-5 h-5 text-[#059669]" strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-[#059669] tracking-[0.1em] uppercase mb-0.5">Warehouse</p>
            <h1 className="text-[20px] font-bold text-[#1A202C] leading-tight">Ajuan Pinjam Tools</h1>
            <p className="text-[12px] text-[#718096] mt-0.5">Ajukan peminjaman tools dari warehouse</p>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center rounded-[10px] bg-[#F7F8FA] border border-[#E2E8F0] text-[#718096] hover:bg-[#EBF4FF] hover:text-[#2B6CB0] transition-colors flex-shrink-0"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* ── Page Header (Desktop) ── */}
      <div className="hidden md:flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 transition-colors shadow-sm"
          title="Kembali"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Peminjaman Tools
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Ajukan peminjaman suku cadang (tools) dari Warehouse</p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
      >
        <div className="p-6 sm:p-8">
          <form onSubmit={submit} className="space-y-6">

            {/* Context Info (If Linked to Job) */}
            {jobId && (
              <div className="bg-violet-50/50 border border-violet-100 rounded-xl p-4 flex gap-4 items-start">
                <div className="p-2 bg-violet-100 text-violet-600 rounded-lg shrink-0 mt-0.5">
                  <Wrench className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-violet-900 flex items-center gap-2">
                    Terkait Pekerjaan Perbaikan
                  </h3>
                  {loadingJob ? (
                    <p className="text-sm text-violet-600/70 animate-pulse">Memuat data tiket...</p>
                  ) : jobDetail ? (
                    <div className="text-sm text-violet-800/80">
                      <p>Tiket: <strong>{jobDetail.helpdeskTicketNumber}</strong></p>
                      <p>SN Radio: <strong>{jobDetail.radioSerialNumber}</strong> {jobDetail.equipmentName ? `— ${jobDetail.equipmentName}` : ''}</p>
                      <p className="mt-1 line-clamp-1 opacity-80 italic">"{jobDetail.damageDescription}"</p>
                    </div>
                  ) : (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" /> Pekerjaan tidak ditemukan (ID: {jobId})
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* ── MULTI-ITEM SECTION ── */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-gray-800">
                  Daftar Barang yang Dipinjam <span className="text-red-500">*</span>
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs h-8 text-violet-700 border-violet-200 hover:bg-violet-50"
                  onClick={addRow}
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Tambah Barang
                </Button>
              </div>

              {rows.map((row, idx) => (
                <motion.div
                  key={row.key}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-violet-600 bg-violet-100 px-2 py-0.5 rounded-full">
                      Barang #{idx + 1}
                    </span>
                    {rows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeRow(idx)}
                        className="text-red-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50 transition-colors"
                        title="Hapus barang"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Part Name Search */}
                  <div className="space-y-1.5 relative">
                    <label className="text-sm font-semibold text-slate-700">Nama / Deskripsi Tools</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="Contoh: Baterai Motorola XiR P8668i..."
                        className="pl-9 h-10 bg-white"
                        value={row.partDescription}
                        onChange={(e) =>
                          updateRow(idx, { partDescription: e.target.value, showSuggestions: true })
                        }
                        onFocus={() => updateRow(idx, { showSuggestions: true })}
                        onBlur={() => setTimeout(() => updateRow(idx, { showSuggestions: false }), 200)}
                        required
                      />
                    </div>
                    {row.searching && <p className="text-xs text-violet-600">Mencari daftar part...</p>}
                    {row.showSuggestions && row.suggestions.length > 0 && (
                      <ul className="absolute z-10 left-0 right-0 top-full mt-1 rounded-xl border border-gray-200 bg-white shadow-lg divide-y divide-gray-100 max-h-48 overflow-y-auto">
                        {row.suggestions.map((item) => (
                          <li key={item.id}>
                            <button
                              type="button"
                              className="w-full text-left px-3 py-2 hover:bg-violet-50 transition-colors"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => selectPartSuggestion(idx, item)}
                            >
                              <div className="text-sm font-semibold text-gray-800">{item.partName}</div>
                              <div className="text-xs text-gray-500">{item.partCode}</div>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-slate-700">Tools Code</label>
                      <Input
                        placeholder="Contoh: PMNN4409BR"
                        className="h-10 font-mono text-sm bg-white"
                        value={row.partCode}
                        onChange={(e) => updateRow(idx, { partCode: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-600">Kuantitas</label>
                      <Input
                        type="number"
                        min={1}
                        className="h-10 bg-white"
                        value={row.quantity}
                        onChange={(e) => updateRow(idx, { quantity: Number(e.target.value) || 1 })}
                        required
                      />
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Add more button (bottom, for mobile convenience) */}
              <button
                type="button"
                onClick={addRow}
                className="w-full py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-violet-400 hover:text-violet-600 hover:bg-violet-50/50 transition-all flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Tambah Barang Lainnya
              </button>
            </div>

            {/* ── TICKET SEARCH (COMBINED SINGLE INPUT) ── */}
            <div className="space-y-2 relative">
              <label className="text-sm font-semibold text-gray-700">No. Tiket / Pekerjaan (Opsional)</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Ketik nomor tiket atau SN radio — pilih dari daftar atau ketik manual"
                  className="pl-9 h-11"
                  value={ticketSearch}
                  onChange={(e) => {
                    setTicketSearch(e.target.value);
                    setTicketNumber("");
                    setSelectedRepairJobId(null);
                    setShowJobSuggestions(true);
                  }}
                  onFocus={() => setShowJobSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowJobSuggestions(false), 200)}
                />
              </div>
              {jobPicking && <p className="text-xs text-violet-600">Mencari tiket...</p>}
              {ticketSearch.trim() && !selectedRepairJobId && !jobPicking && (
                <p className="text-xs text-gray-400">
                  Tekan <strong>Ajukan Peminjaman</strong> untuk menggunakan "<span className="font-mono text-gray-600">{ticketSearch.trim()}</span>" sebagai nomor tiket manual.
                </p>
              )}
              {selectedRepairJobId && (
                <p className="text-xs text-emerald-600 flex items-center gap-1">
                  ✓ Terhubung dengan pekerjaan repair #{selectedRepairJobId}
                </p>
              )}
              {showJobSuggestions && jobSuggestions.length > 0 && (
                <ul className="absolute z-10 left-0 right-0 mt-1 rounded-xl border border-gray-200 bg-white shadow-lg divide-y divide-gray-100 max-h-48 overflow-y-auto">
                  {jobSuggestions.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        className="w-full text-left px-3 py-2.5 hover:bg-violet-50 transition-colors"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => selectJobSuggestion(item)}
                      >
                        <div className="text-sm font-semibold text-gray-800">{item.helpdeskTicketNumber}</div>
                        <div className="text-xs text-gray-500">SN {item.radioSerialNumber} • {item.equipmentName ?? "-"}</div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* ── NAMA PEMINJAM ── */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                <User className="w-4 h-4 text-violet-500" />
                Nama Peminjam <span className="text-red-500">*</span>
              </label>

              {/* Step 1: Pilih dari semua user terdaftar */}
              <FormMobileSelect
                value={borrowerName}
                onChange={(val) => {
                  setBorrowerName(val);
                  setWorkshopTechName(""); // reset step 2
                  // Simpan object user yang dipilih agar roleName bisa diakses langsung
                  const found = allUsers.find(u => u.name === val) ?? null;
                  setSelectedBorrowerUser(found);
                }}
                options={allUsers.map((u) => u.name)}
                placeholder="— Pilih atau ketik nama —"
                label="Pilih Peminjam"
                color="violet"
              />

              {/* Step 2: Jika user yang dipilih adalah Teknisi WSK → pilih nama teknisi spesifik */}
              {borrowerName && selectedUserIsWorkshop && (
                <div className="bg-violet-50 border border-violet-200 rounded-xl p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-violet-500 shrink-0" />
                    <p className="text-xs font-semibold text-violet-700">
                      <span className="font-bold">{borrowerName}</span> adalah Teknisi Workshop.
                      Pilih nama teknisi spesifik:
                    </p>
                  </div>
                  <FormMobileSelect
                    value={workshopTechName}
                    onChange={setWorkshopTechName}
                    options={
                      // Filter: hanya teknisi yang terkait dengan user ini (jika ada)
                      // Jika user memiliki relasi teknisi spesifik (userId match) → tampilkan hanya itu
                      // Jika tidak ada relasi → tampilkan semua
                      (() => {
                        const linkedTechs = technicians.filter(t => t.userId === selectedBorrowerUser?.id);
                        return linkedTechs.length > 0
                          ? linkedTechs.map(t => t.name)
                          : technicians.map(t => t.name); // fallback: tampilkan semua jika tidak ada relasi
                      })()
                    }
                    placeholder="— Pilih nama teknisi —"
                    label="Pilih Nama Teknisi"
                    color="violet"
                  />
                  {workshopTechName && (
                    <p className="text-xs text-emerald-600 flex items-center gap-1">
                      ✓ Peminjam: <strong>{workshopTechName}</strong>
                    </p>
                  )}
                </div>
              )}

              <p className="text-xs text-gray-400">Nama orang yang akan menggunakan tools ini.</p>
            </div>

            {/* Purpose */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Keperluan (Opsional)</label>
              <Textarea
                placeholder={jobId ? "Deskripsikan bagian spesifik yang rusak..." : "Tujuan penggunaan Tools..."}
                rows={3}
                className="resize-none"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
              />
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => navigate(-1)} className="h-11 px-6">
                Batal
              </Button>
              <Button
                type="submit"
                disabled={submitting || rows.every((r) => !r.partDescription.trim())}
                className="h-11 px-8 bg-violet-600 hover:bg-violet-700 font-semibold shadow-md shadow-violet-200"
              >
                {submitting ? "Memproses..." : "Ajukan Peminjaman"}
              </Button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
