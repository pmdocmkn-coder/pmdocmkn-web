import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  FileText,
  Download,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowLeft,
  Table,
  Settings,
  Phone,
  User,
  ChevronDown,
  ChevronUp,
  BookOpen,
  HelpCircle,
  Shield,
  Upload,
  BarChart3,
  Mail,
  MessageCircle,
  ExternalLink,
  Search,
  Trash2,
  Copy
} from 'lucide-react';

interface DocsProps {
  setActiveTab?: (tab: string) => void;
}

const DocsPage: React.FC<DocsProps> = ({ setActiveTab }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTabState] = useState<'docs' | 'faq' | 'contact'>('docs');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const isAdmin = user?.roleId === 1 || user?.roleId === 2;

  const handleBack = () => {
    if (setActiveTab) {
      setActiveTab('dashboard');
    }
    navigate('/dashboard');
  };

  const handleSectionClick = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Function untuk WhatsApp
  const handleWhatsAppClick = () => {
    // Nomor WhatsApp (format international tanpa +) - GANTI DENGAN NOMOR ASLI
    const phoneNumber = '6289504186544';

    // Pesan default
    const message = `Halo, saya ${user?.fullName || 'User'} butuh bantuan dengan Call Analytics Dashboard.`;

    // Encode message untuk URL
    const encodedMessage = encodeURIComponent(message);

    // Buat WhatsApp URL
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

    // Buka WhatsApp di tab baru
    window.open(whatsappUrl, '_blank');
  };

  const csvExample = `callRecordId,calldate,callTime,callCloseReason,hourGroup
1,2024-01-15,08:30:25,0,8
2,2024-01-15,09:15:42,1,9
3,2024-01-15,10:05:18,4,10
4,2024-01-15,11:20:33,2,11
5,2024-01-15,14:45:12,0,14`;

  const sections = [
    { id: 'format-umum', title: '📋 Format Umum' },
    { id: 'struktur-kolom', title: '🗂️ Struktur Kolom' },
    { id: 'kode-alasan', title: '📞 Kode Alasan' },
    { id: 'contoh-file', title: '📄 Contoh File' },
    { id: 'tips-upload', title: '💡 Tips Upload' },
    { id: 'role-guide', title: '👤 Panduan Role' }
  ];

  const adminFaqs = [
    {
      question: "Bagaimana cara upload file CSV?",
      answer: "Klik menu 'Upload' di sidebar, pilih file CSV dari komputer Anda, lalu klik 'Upload'. Pastikan format file sesuai dengan panduan yang tersedia. File akan divalidasi secara otomatis sebelum disimpan."
    },
    {
      question: "Apakah ada batasan ukuran file?",
      answer: "Ya, maksimal ukuran file adalah 10MB per upload dengan maksimal 100,000 records. Jika data Anda lebih besar, split menjadi beberapa file berdasarkan tanggal."
    },
    {
      question: "Bagaimana cara menghapus data yang sudah diupload?",
      answer: "Buka halaman 'Call Records', pilih tanggal yang ingin dihapus, lalu klik tombol 'Delete Records'. Konfirmasi penghapusan akan muncul sebelum data benar-benar dihapus."
    },
    {
      question: "Bisakah saya export data setelah upload?",
      answer: "Ya! Anda bisa export data dalam format CSV atau Excel. Pilih range tanggal yang diinginkan, lalu klik tombol 'Export' di halaman Call Records."
    },
    {
      question: "Apa yang terjadi jika ada data duplikat?",
      answer: "Sistem akan mendeteksi data duplikat berdasarkan callRecordId. Data duplikat akan ditolak dan Anda akan mendapat notifikasi tentang records yang gagal diimport."
    },
    {
      question: "Bagaimana cara memberikan akses ke user lain?",
      answer: "Saat ini hanya Super Admin yang bisa mengelola user. Hubungi Super Admin untuk menambahkan user baru atau mengubah permission."
    }
  ];

  const userFaqs = [
    {
      question: "Bagaimana cara melihat analytics call records?",
      answer: "Klik menu 'Call Records' di sidebar. Anda akan melihat dashboard dengan berbagai metrics, chart trend hourly, dan tabel detail records."
    },
    {
      question: "Apa arti dari berbagai status panggilan?",
      answer: "Status panggilan ditunjukkan oleh callCloseReason (0-10). Kode 4 = Complete (berhasil), kode lainnya menunjukkan berbagai alasan kegagalan."
    },
    {
      question: "Bagaimana cara export report?",
      answer: "Buka halaman 'Call Records', pilih range tanggal yang diinginkan, lalu klik tombol 'Export CSV' atau 'Export Excel' di bagian atas."
    },
    {
      question: "Bisakah saya filter data berdasarkan jam tertentu?",
      answer: "Ya! Di halaman Call Records, gunakan filter 'Hour Group' untuk melihat data pada jam-jam tertentu."
    },
    {
      question: "Mengapa saya tidak bisa upload file CSV?",
      answer: "Fitur upload hanya tersedia untuk role Admin. Jika Anda perlu akses upload, hubungi Administrator untuk upgrade role Anda."
    },
    {
      question: "Bagaimana cara membaca chart analytics?",
      answer: "Chart hourly menampilkan volume panggilan per jam. Garis hijau menunjukkan panggilan sukses, garis lain menunjukkan berbagai status gagal."
    }
  ];

  const faqs = isAdmin ? adminFaqs : userFaqs;

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const filteredFaqs = faqs.filter(faq =>
    searchQuery === '' ||
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const callCloseReasons = [
    { code: 0, title: 'TE Busy', description: 'Perangkat tujuan sedang sibuk' },
    { code: 1, title: 'System Busy', description: 'Sistem sedang overload' },
    { code: 2, title: 'No Answer', description: 'Tidak ada jawaban' },
    { code: 3, title: 'Not Found', description: 'Nomor tidak ditemukan' },
    { code: 4, title: 'Complete', description: 'Panggilan berhasil' },
    { code: 5, title: 'Preempted', description: 'Panggilan dihentikan untuk prioritas' },
    { code: 6, title: 'Timeout', description: 'Panggilan timeout' },
    { code: 7, title: 'Inactive', description: 'Perangkat tidak aktif' },
    { code: 8, title: 'Callback', description: 'Masuk antrian callback' },
    { code: 9, title: 'Unsupported', description: 'Request tidak didukung' },
    { code: 10, title: 'Invalid Call', description: 'Panggilan tidak valid' }
  ];

  return (
    <div className="w-full">
      {/* MOBILE VIEW (Dribbble/Figma style based on user's reference) */}
      <div className="md:hidden bg-[#fdfafb] min-h-screen pb-24 font-sans text-gray-800">
        {/* Top Header */}
        <div className="bg-[#fdfafb] px-4 pt-5 pb-3 sticky top-0 z-30 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <button onClick={handleBack} className="w-10 h-10 flex items-center justify-center rounded-full bg-purple-50 text-purple-600 shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-[17px] font-bold text-gray-900 truncate">Pusat Bantuan</h1>
            <button className="w-10 h-10 flex items-center justify-center rounded-full text-purple-600 shrink-0">
              <Search className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex w-full">
            <button onClick={() => setActiveTabState('docs')} className={`flex-1 pb-3 text-xs font-bold text-center border-b-[3px] transition-colors ${activeTab === 'docs' ? 'text-[var(--primary)] border-[var(--primary)] text-purple-600 border-purple-600' : 'text-gray-400 border-transparent'}`}>Dokumentasi</button>
            <button onClick={() => setActiveTabState('faq')} className={`flex-1 pb-3 text-xs font-bold text-center border-b-[3px] transition-colors ${activeTab === 'faq' ? 'text-purple-600 border-purple-600' : 'text-gray-400 border-transparent'}`}>FAQ</button>
            <button onClick={() => setActiveTabState('contact')} className={`flex-1 pb-3 text-xs font-bold text-center border-b-[3px] transition-colors ${activeTab === 'contact' ? 'text-purple-600 border-purple-600' : 'text-gray-400 border-transparent'}`}>Kontak Support</button>
          </div>
        </div>
        <div className="h-[1px] w-full bg-gray-100 -mt-1"></div>

        {/* Tab Content */}
        <div className="p-4 space-y-7">
          {activeTab === 'docs' && (
            <>
              {/* Daftar Isi */}
              <div>
                <h2 className="text-sm font-bold text-gray-900 mb-3">Daftar Isi</h2>
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                  <button onClick={() => handleSectionClick('role-guide')} className="shrink-0 px-4 py-1.5 bg-[#f3e8ff] text-[#9333ea] rounded-lg text-xs font-bold transition-transform active:scale-95">Panduan {isAdmin ? 'Admin' : 'User'}</button>
                  <button onClick={() => handleSectionClick('struktur-kolom')} className="shrink-0 px-4 py-1.5 bg-[#f3e8ff] text-[#9333ea] rounded-lg text-xs font-bold transition-transform active:scale-95">Format CSV</button>
                  <button onClick={() => handleSectionClick('struktur-kolom')} className="shrink-0 px-4 py-1.5 bg-[#f3e8ff] text-[#9333ea] rounded-lg text-xs font-bold transition-transform active:scale-95">Struktur Kolom</button>
                </div>
              </div>

              {/* Panduan Administrator / User */}
              <div id="role-guide" className="scroll-mt-24">
                <div className="flex items-center gap-2 mb-4">
                  <div className="bg-[#f3e8ff] p-1.5 rounded-lg">
                    {isAdmin ? <Shield className="w-4 h-4 text-[#9333ea]" /> : <User className="w-4 h-4 text-[#9333ea]" />}
                  </div>
                  <h2 className="text-sm font-bold text-gray-900">Panduan {isAdmin ? 'Administrator' : 'User'}</h2>
                </div>
                {isAdmin ? (
                  <div className="space-y-3">
                    <div className="bg-white p-4 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-[#f3e8ff]/50 flex gap-4 items-start">
                      <div className="w-10 h-10 rounded-xl bg-[#f3e8ff] flex items-center justify-center shrink-0">
                        <Upload className="w-5 h-5 text-[#9333ea]" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-xs mb-1">Upload Data CSV</h3>
                        <p className="text-[11px] text-gray-500 leading-relaxed">Impor data panggilan secara massal melalui modul Unggah File.</p>
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-[#f3e8ff]/50 flex gap-4 items-start">
                      <div className="w-10 h-10 rounded-xl bg-[#f3e8ff] flex items-center justify-center shrink-0">
                        <Trash2 className="w-5 h-5 text-[#9333ea]" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-xs mb-1">Hapus Data</h3>
                        <p className="text-[11px] text-gray-500 leading-relaxed">Pembersihan record yang tidak valid atau duplikat dari database.</p>
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-[#f3e8ff]/50 flex gap-4 items-start">
                      <div className="w-10 h-10 rounded-xl bg-[#f3e8ff] flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-[#9333ea]" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-xs mb-1">Export Reports</h3>
                        <p className="text-[11px] text-gray-500 leading-relaxed">Unduh laporan performa panggilan dalam format PDF atau Excel.</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-white p-4 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-[#f3e8ff]/50 flex gap-4 items-start">
                      <div className="w-10 h-10 rounded-xl bg-[#f3e8ff] flex items-center justify-center shrink-0">
                        <BarChart3 className="w-5 h-5 text-[#9333ea]" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-xs mb-1">Lihat Analytics</h3>
                        <p className="text-[11px] text-gray-500 leading-relaxed">Akses dashboard analytics untuk melihat metrics, trend, dan insights.</p>
                      </div>
                    </div>
                    <div className="bg-[#fff9f9] p-4 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-red-100 flex gap-4 items-start">
                      <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      </div>
                      <div>
                        <h3 className="font-bold text-red-900 text-xs mb-1">Akses Terbatas</h3>
                        <p className="text-[11px] text-red-700 leading-relaxed">Fitur upload dan delete hanya tersedia untuk Admin. Hubungi administrator jika Anda membutuhkan akses lebih.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Detail Format CSV */}
              <div id="format-umum" className="scroll-mt-24">
                <h2 className="text-sm font-bold text-gray-900 mb-3">Detail Format CSV</h2>
                <div className="space-y-2">
                  <div className="bg-white px-4 py-3.5 rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex justify-between items-center border border-[#f3e8ff]/50">
                    <span className="text-xs text-gray-500 font-medium">Encoding</span>
                    <span className="text-xs font-bold text-[#9333ea]">UTF-8</span>
                  </div>
                  <div className="bg-white px-4 py-3.5 rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex justify-between items-center border border-[#f3e8ff]/50">
                    <span className="text-xs text-gray-500 font-medium">Max File Size</span>
                    <span className="text-xs font-bold text-[#9333ea]">10 MB</span>
                  </div>
                  <div className="bg-white px-4 py-3.5 rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex justify-between items-center border border-[#f3e8ff]/50">
                    <span className="text-xs text-gray-500 font-medium">Date Format</span>
                    <span className="text-xs font-bold text-[#9333ea]">YYYY-MM-DD HH:mm:ss</span>
                  </div>
                </div>
              </div>

              {/* Struktur Kolom */}
              <div id="struktur-kolom" className="scroll-mt-24">
                <h2 className="text-sm font-bold text-gray-900 mb-3">Struktur Kolom</h2>
                <div className="space-y-3">
                  <div className="bg-white p-4 rounded-r-2xl rounded-l-md flex flex-col gap-3 shadow-[0_2px_10px_rgba(0,0,0,0.03)] border-l-4 border-[#9333ea]">
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-[#9333ea] text-[13px]">callRecordId</h3>
                      <span className="bg-[#f3e8ff] text-[#9333ea] text-[9px] px-2 py-1 rounded font-bold uppercase tracking-wide">Mandatory</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-gray-500">Tipe: <strong className="text-gray-900">Integer</strong></span>
                      <span className="text-gray-500">Contoh: <strong className="text-gray-900">1, 2, 3</strong></span>
                    </div>
                    <p className="text-[11px] text-gray-500">ID unik record rekaman panggilan.</p>
                  </div>
                  <div className="bg-white p-4 rounded-r-2xl rounded-l-md flex flex-col gap-3 shadow-[0_2px_10px_rgba(0,0,0,0.03)] border-l-4 border-[#9333ea]">
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-[#9333ea] text-[13px]">calldate</h3>
                      <span className="bg-[#f3e8ff] text-[#9333ea] text-[9px] px-2 py-1 rounded font-bold uppercase tracking-wide">Mandatory</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-gray-500">Tipe: <strong className="text-gray-900">Date</strong></span>
                      <span className="text-gray-500">Contoh: <strong className="text-gray-900">2024-01-15</strong></span>
                    </div>
                    <p className="text-[11px] text-gray-500">Tanggal panggilan terjadi.</p>
                  </div>
                  <div className="bg-white p-4 rounded-r-2xl rounded-l-md flex flex-col gap-3 shadow-[0_2px_10px_rgba(0,0,0,0.03)] border-l-4 border-[#9333ea]">
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-[#9333ea] text-[13px]">callTime</h3>
                      <span className="bg-[#f3e8ff] text-[#9333ea] text-[9px] px-2 py-1 rounded font-bold uppercase tracking-wide">Mandatory</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-gray-500">Tipe: <strong className="text-gray-900">Time</strong></span>
                      <span className="text-gray-500">Contoh: <strong className="text-gray-900">14:30:25</strong></span>
                    </div>
                    <p className="text-[11px] text-gray-500">Waktu panggilan (24 jam).</p>
                  </div>
                  <div className="bg-white p-4 rounded-r-2xl rounded-l-md flex flex-col gap-3 shadow-[0_2px_10px_rgba(0,0,0,0.03)] border-l-4 border-[#9333ea]">
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-[#9333ea] text-[13px]">callCloseReason</h3>
                      <span className="bg-[#f3e8ff] text-[#9333ea] text-[9px] px-2 py-1 rounded font-bold uppercase tracking-wide">Mandatory</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-gray-500">Tipe: <strong className="text-gray-900">Integer</strong></span>
                      <span className="text-gray-500">Contoh: <strong className="text-gray-900">0, 1, 4</strong></span>
                    </div>
                    <p className="text-[11px] text-gray-500">Kode alasan penutupan (0-10).</p>
                  </div>
                  <div className="bg-white p-4 rounded-r-2xl rounded-l-md flex flex-col gap-3 shadow-[0_2px_10px_rgba(0,0,0,0.03)] border-l-4 border-[#9333ea]">
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-[#9333ea] text-[13px]">hourGroup</h3>
                      <span className="bg-[#f3e8ff] text-[#9333ea] text-[9px] px-2 py-1 rounded font-bold uppercase tracking-wide">Mandatory</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-gray-500">Tipe: <strong className="text-gray-900">Integer</strong></span>
                      <span className="text-gray-500">Contoh: <strong className="text-gray-900">8, 14, 22</strong></span>
                    </div>
                    <p className="text-[11px] text-gray-500">Grup jam panggilan (0-23).</p>
                  </div>
                </div>
              </div>

              {/* Kode Penutupan Panggilan */}
              <div id="kode-alasan" className="bg-[#121626] -mx-4 px-4 py-8 rounded-[24px] text-white space-y-4 shadow-2xl scroll-mt-24">
                <h2 className="text-sm font-bold text-center mb-5">Kode Penutupan Panggilan</h2>
                <div className="grid grid-cols-2 gap-3">
                  {callCloseReasons.map((reason) => (
                    <div key={reason.code} className="bg-[#242b3e] p-4 rounded-xl shadow-lg border border-slate-700/60">
                      <div className={`font-bold text-xl mb-1 ${reason.code === 4 ? 'text-green-400' : 'text-purple-400'}`}>{reason.code}</div>
                      <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed mb-1.5">{reason.title}</div>
                      <p className="text-[10px] text-gray-500 leading-tight">{reason.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contoh CSV */}
              <div id="contoh-file" className="scroll-mt-24">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-sm font-bold text-gray-900">Contoh CSV</h2>
                  <button onClick={() => {
                    const cb = navigator.clipboard;
                    cb.writeText(csvExample);
                  }} className="text-[11px] font-bold text-[#9333ea] flex items-center gap-1.5 hover:bg-purple-50 px-2 py-1 rounded-md transition-colors">
                    <Copy className="w-3.5 h-3.5" /> Copy
                  </button>
                </div>
                <div className="bg-[#f6f2fe] p-4 rounded-xl border border-purple-100/70 overflow-x-auto">
                  <pre className="text-[9px] text-purple-700 font-mono leading-relaxed">{csvExample}</pre>
                </div>
              </div>

              {/* Tips & Best Practices */}
              <div id="tips-upload" className="bg-[#fbf4ff] p-5 rounded-2xl space-y-4 shadow-sm border border-purple-100/60 scroll-mt-24">
                <div className="flex items-center gap-2 text-[#9333ea] mb-2">
                  <div className="bg-white shadow-[0_2px_6px_rgba(147,51,234,0.1)] p-1.5 rounded-full">
                    <AlertCircle className="w-4 h-4 text-[#bf7bf2]" />
                  </div>
                  <h2 className="text-sm font-bold">Tips &amp; Best Practices</h2>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle className="w-3.5 h-3.5 text-[#9333ea] shrink-0 mt-0.5" />
                    <p className="text-[11px] text-gray-600 leading-relaxed">Pastikan file CSV tidak memiliki baris kosong di bagian akhir.</p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle className="w-3.5 h-3.5 text-[#9333ea] shrink-0 mt-0.5" />
                    <p className="text-[11px] text-gray-600 leading-relaxed">Gunakan pemisah koma (,) bukan titik koma (;).</p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="w-3.5 h-3.5 text-[#9333ea] shrink-0 mt-0.5" />
                    <p className="text-[11px] text-gray-600 leading-relaxed">Troubleshoot: Jika gagal, periksa format tanggal pada sistem Anda.</p>
                  </div>
                </div>
              </div>

              {/* Masih Ada Pertanyaan? */}
              <div className="text-center pt-8 pb-4">
                <h3 className="font-bold text-gray-900 text-sm mb-1.5">Masih Ada Pertanyaan?</h3>
                <p className="text-[11px] text-gray-500 mb-6 font-medium">Tim dukungan kami siap membantu Anda 24/7.</p>
                <div className="flex flex-col gap-3 px-2">
                  <button onClick={() => setActiveTabState('faq')} className="w-full bg-[#9b34e2] text-white font-bold text-xs py-3.5 rounded-[14px] shadow-[0_4px_14px_rgba(147,51,234,0.3)] transition-transform active:scale-[0.98]">
                    Lihat FAQ Lengkap
                  </button>
                  <button onClick={() => setActiveTabState('contact')} className="w-full bg-white text-[#9333ea] font-bold text-xs py-3.5 rounded-[14px] border border-[#9333ea] transition-transform active:scale-[0.98]">
                    Hubungi Support
                  </button>
                </div>
              </div>
            </>
          )}

          {activeTab === 'faq' && (
            <div className="space-y-4 min-h-[50vh] flex flex-col mt-4">
              <div className="relative mb-6">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari pertanyaan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#9333ea] focus:border-transparent text-xs"
                />
              </div>

              {filteredFaqs.map((faq, index) => (
                <div key={index} className="bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100 overflow-hidden">
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full flex items-center justify-between p-3.5 text-left active:bg-gray-50 transition-colors"
                  >
                    <span className="font-bold text-gray-800 text-xs pr-4">{faq.question}</span>
                    {openFaqIndex === index ? (
                      <ChevronUp className="w-4 h-4 text-[#9333ea] shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                    )}
                  </button>
                  {openFaqIndex === index && (
                    <div className="px-3.5 pb-3.5 pt-1">
                      <p className="text-[11px] text-gray-500 leading-relaxed">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'contact' && (
            <div className="space-y-4 min-h-[50vh] flex flex-col mt-4">
              <div className="bg-white p-5 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-[#f3e8ff]/50 text-center">
                <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <MessageCircle className="w-6 h-6 text-green-500" />
                </div>
                <h3 className="font-bold text-gray-900 text-sm mb-1">WhatsApp Support</h3>
                <p className="text-[11px] text-gray-500 mb-5 leading-relaxed">Chat langsung dengan tim kami via WhatsApp. Online Senin - Jumat (09:00 - 17:00).</p>
                <button onClick={handleWhatsAppClick} className="w-full bg-green-500 text-white font-bold text-xs py-3 rounded-xl shadow-[0_4px_14px_rgba(34,197,94,0.3)] transition-transform active:scale-[0.98]">
                  Mulai Chat WhatsApp
                </button>
              </div>

              <div className="bg-white p-5 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-[#f3e8ff]/50 text-center">
                <div className="w-12 h-12 bg-[#f3e8ff] rounded-full flex items-center justify-center mx-auto mb-3">
                  <Mail className="w-6 h-6 text-[#9333ea]" />
                </div>
                <h3 className="font-bold text-gray-900 text-sm mb-1">Email Support</h3>
                <p className="text-[11px] text-gray-500 mb-5 leading-relaxed">Kirim detail masalah atau pertanyaan Anda ke email tim technical support.</p>
                <a href="mailto:jupri.eka@mkncorp.com" className="block w-full bg-white text-[#9333ea] border border-[#f3e8ff] font-bold text-xs py-3 rounded-xl transition-transform active:scale-[0.98]">
                  jupri.eka@mkncorp.com
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* DESKTOP VIEW */}
      <div className="hidden md:block min-h-screen bg-gray-50 p-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handleBack}
              className="flex items-center text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Kembali ke Dashboard
            </button>
            <div className="flex items-center space-x-2">
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${isAdmin ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                }`}>
                {isAdmin ? 'Admin' : 'User'}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <BookOpen className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Pusat Bantuan & Dokumentasi</h1>
              <p className="text-gray-600">Panduan lengkap untuk {isAdmin ? 'mengelola' : 'menggunakan'} sistem analytics call records</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 mb-6">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTabState('docs')}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium transition-all ${activeTab === 'docs'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-50'
                }`}
            >
              <FileText className="w-5 h-5" />
              <span>Dokumentasi</span>
            </button>
            <button
              onClick={() => setActiveTabState('faq')}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium transition-all ${activeTab === 'faq'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-50'
                }`}
            >
              <HelpCircle className="w-5 h-5" />
              <span>FAQ</span>
            </button>
            <button
              onClick={() => setActiveTabState('contact')}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium transition-all ${activeTab === 'contact'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-50'
                }`}
            >
              <MessageCircle className="w-5 h-5" />
              <span>Kontak Support</span>
            </button>
          </div>
        </div>

        {activeTab === 'faq' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="relative">
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari pertanyaan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Pertanyaan yang Sering Diajukan {isAdmin ? '(Admin)' : '(User)'}
              </h2>
              <div className="space-y-3">
                {filteredFaqs.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <HelpCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>Tidak ada FAQ yang cocok dengan pencarian Anda</p>
                  </div>
                ) : (
                  filteredFaqs.map((faq, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg overflow-hidden"
                    >
                      <button
                        onClick={() => toggleFaq(index)}
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center space-x-3 flex-1">
                          <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-semibold text-sm">{index + 1}</span>
                          </div>
                          <span className="font-medium text-gray-900">{faq.question}</span>
                        </div>
                        {openFaqIndex === index ? (
                          <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                        )}
                      </button>
                      {openFaqIndex === index && (
                        <div className="px-4 pb-4 pt-2 bg-gray-50 border-t border-gray-200">
                          <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'contact' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Mail className="w-6 h-6 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Email Support</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Kirim email untuk pertanyaan teknis atau bantuan lebih lanjut
              </p>
              <a
                href="mailto:jupri.eka@mkncorp.com"
                className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
              >
                jupri.eka@mkncorp.com
                <ExternalLink className="w-4 h-4 ml-2" />
              </a>
            </div>

            {/* WhatsApp Section - UPDATED */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <MessageCircle className="w-6 h-6 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">WhatsApp Support</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Chat langsung via WhatsApp dengan tim support kami
              </p>
              <button
                onClick={handleWhatsAppClick}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Mulai Chat WhatsApp</span>
              </button>
              <p className="text-xs text-gray-500 mt-2">
                Senin - Jumat: 09:00 - 17:00 WIB
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Phone className="w-6 h-6 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Telepon</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Hubungi kami untuk support urgent
              </p>
              <p className="text-gray-900 font-medium">+62 549 523099 ext 1234</p>
              <p className="text-sm text-gray-500 mt-1">Senin - Jumat: 09:00 - 17:00 WIB</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Shield className="w-6 h-6 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  {isAdmin ? 'Hak Akses Anda' : 'Akses Anda'}
                </h3>
              </div>
              {isAdmin ? (
                <>
                  <p className="text-gray-600 mb-3">
                    Anda memiliki akses admin penuh dengan fitur:
                  </p>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                      Upload & hapus data CSV
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                      Export laporan lengkap
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                      Akses semua analytics
                    </li>
                  </ul>
                </>
              ) : (
                <>
                  <p className="text-gray-600 mb-3">
                    Akses Anda saat ini sebagai User:
                  </p>
                  <ul className="space-y-2 text-sm text-gray-600 mb-3">
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                      Lihat analytics & dashboard
                    </li>
                    <li className="flex items-center">
                      <XCircle className="w-4 h-4 text-red-500 mr-2 flex-shrink-0" />
                      Tidak bisa Export laporan (read-only)
                    </li>
                    <li className="flex items-center">
                      <XCircle className="w-4 h-4 text-red-500 mr-2 flex-shrink-0" />
                      Tidak bisa upload/hapus data
                    </li>
                  </ul>
                  <p className="text-sm text-gray-600 mb-2">
                    Butuh akses admin? Hubungi:
                  </p>
                  <a
                    href="mailto:jupri.eka@mkncorp.com"
                    className="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    jupri.eka@mkncorp.com
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === 'docs' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Daftar Isi</h3>
                <nav className="space-y-2">
                  {sections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => handleSectionClick(section.id)}
                      className="flex items-center w-full text-left py-2 px-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <span className="text-sm font-medium">{section.title}</span>
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            <div className="lg:col-span-3 space-y-6">
              <section id="role-guide" className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-sm border border-blue-200 p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <User className="w-6 h-6 text-blue-600" />
                  <h2 className="text-xl font-bold text-gray-900">
                    Panduan untuk {isAdmin ? 'Administrator' : 'User'}
                  </h2>
                </div>

                {isAdmin ? (
                  <div className="space-y-4">
                    <div className="bg-white rounded-lg p-4 border border-blue-200">
                      <div className="flex items-center space-x-3 mb-2">
                        <Upload className="w-5 h-5 text-blue-600" />
                        <h4 className="font-semibold text-gray-900">Upload Data CSV</h4>
                      </div>
                      <p className="text-sm text-gray-600">
                        Sebagai admin, Anda dapat mengupload file CSV call records. Pastikan format sesuai panduan, maksimal 10MB per file.
                      </p>
                    </div>

                    <div className="bg-white rounded-lg p-4 border border-blue-200">
                      <div className="flex items-center space-x-3 mb-2">
                        <XCircle className="w-5 h-5 text-red-600" />
                        <h4 className="font-semibold text-gray-900">Hapus Data</h4>
                      </div>
                      <p className="text-sm text-gray-600">
                        Anda dapat menghapus data berdasarkan tanggal. Proses ini tidak dapat dibatalkan, pastikan data sudah di-backup.
                      </p>
                    </div>

                    <div className="bg-white rounded-lg p-4 border border-blue-200">
                      <div className="flex items-center space-x-3 mb-2">
                        <Download className="w-5 h-5 text-green-600" />
                        <h4 className="font-semibold text-gray-900">Export Reports</h4>
                      </div>
                      <p className="text-sm text-gray-600">
                        Export data dalam format CSV atau Excel dengan range tanggal yang fleksibel untuk analisis lebih lanjut.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-white rounded-lg p-4 border border-blue-200">
                      <div className="flex items-center space-x-3 mb-2">
                        <BarChart3 className="w-5 h-5 text-purple-600" />
                        <h4 className="font-semibold text-gray-900">Lihat Analytics</h4>
                      </div>
                      <p className="text-sm text-gray-600">
                        Akses dashboard analytics untuk melihat metrics, trend, dan insights dari call records yang tersedia.
                      </p>
                    </div>

                    {/* <div className="bg-white rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center space-x-3 mb-2">
                      <Download className="w-5 h-5 text-green-600" />
                      <h4 className="font-semibold text-gray-900">Export Reports</h4>
                    </div>
                    <p className="text-sm text-gray-600">
                      Download laporan dalam format CSV atau Excel untuk periode tertentu sesuai kebutuhan analisis Anda.
                    </p>
                  </div> */}

                    <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                      <div className="flex items-center space-x-3 mb-2">
                        <AlertCircle className="w-5 h-5 text-yellow-600" />
                        <h4 className="font-semibold text-gray-900">Akses Terbatas</h4>
                      </div>
                      <p className="text-sm text-gray-600">
                        Fitur upload dan delete hanya tersedia untuk Admin. Hubungi administrator jika Anda membutuhkan akses lebih.
                      </p>
                    </div>
                  </div>
                )}
              </section>

              <section id="format-umum" className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <Table className="w-6 h-6 text-blue-600" />
                  <h2 className="text-xl font-bold text-gray-900">Format Umum File CSV</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-gray-900">Format yang Didukung</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          File CSV dengan encoding UTF-8, pemisah koma, dan header kolom
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-gray-900">Ukuran File</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Maksimal 10MB per file. Support hingga 100,000 records
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-gray-900">Format Tanggal & Waktu</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          YYYY-MM-DD untuk tanggal, HH:MM:SS untuk waktu
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-gray-900">Yang Harus Dihindari</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Karakter khusus, format tanggal lokal, file terproteksi
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-gray-900">Format Tidak Support</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          File Excel (.xlsx), PDF, atau format binary lainnya
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-gray-900">Penting</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Backup data sebelum upload. Proses tidak bisa dibatalkan
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section id="struktur-kolom" className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <Settings className="w-6 h-6 text-blue-600" />
                  <h2 className="text-xl font-bold text-gray-900">Struktur Kolom Wajib</h2>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kolom</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipe Data</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Wajib</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contoh</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deskripsi</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">callRecordId</td>
                        <td className="px-4 py-3 text-sm text-gray-600">Integer</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Ya</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">1, 2, 3</td>
                        <td className="px-4 py-3 text-sm text-gray-600">ID unik record</td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">calldate</td>
                        <td className="px-4 py-3 text-sm text-gray-600">Date</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Ya</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">2024-01-15</td>
                        <td className="px-4 py-3 text-sm text-gray-600">Tanggal panggilan</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">callTime</td>
                        <td className="px-4 py-3 text-sm text-gray-600">Time</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Ya</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">14:30:25</td>
                        <td className="px-4 py-3 text-sm text-gray-600">Waktu panggilan</td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">callCloseReason</td>
                        <td className="px-4 py-3 text-sm text-gray-600">Integer</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Ya</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">0, 1, 4</td>
                        <td className="px-4 py-3 text-sm text-gray-600">Kode alasan penutupan</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">hourGroup</td>
                        <td className="px-4 py-3 text-sm text-gray-600">Integer</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Ya</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">8, 14, 22</td>
                        <td className="px-4 py-3 text-sm text-gray-600">Grup jam (0-23)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              <section id="kode-alasan" className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <Phone className="w-6 h-6 text-blue-600" />
                  <h2 className="text-xl font-bold text-gray-900">Kode Alasan Penutupan Panggilan</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {callCloseReasons.map((reason) => (
                    <div key={reason.code} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          Kode: {reason.code}
                        </span>
                        <span className={`text-xs font-medium px-2 py-1 rounded ${reason.code === 4
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                          }`}>
                          {reason.code === 4 ? 'Success' : 'Not Connected'}
                        </span>
                      </div>
                      <h4 className="font-semibold text-gray-900 text-sm mb-1">{reason.title}</h4>
                      <p className="text-xs text-gray-600">{reason.description}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section id="contoh-file" className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-6 h-6 text-blue-600" />
                    <h2 className="text-xl font-bold text-gray-900">Contoh File CSV</h2>
                  </div>
                  <button
                    onClick={() => {
                      const blob = new Blob([csvExample], { type: 'text/csv' });
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'contoh_format_call_records.csv';
                      a.click();
                      window.URL.revokeObjectURL(url);
                    }}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Contoh</span>
                  </button>
                </div>

                <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-sm text-green-400 font-mono">{csvExample}</pre>
                </div>

                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-blue-900 mb-1">Tips Formatting</h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Pastikan header kolom sesuai dengan contoh di atas</li>
                        <li>• Gunakan format tanggal YYYY-MM-DD</li>
                        <li>• Gunakan format waktu 24 jam (HH:MM:SS)</li>
                        <li>• Tidak ada spasi ekstra atau karakter khusus</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </section>

              <section id="tips-upload" className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <User className="w-6 h-6 text-blue-600" />
                  <h2 className="text-xl font-bold text-gray-900">Tips & Best Practices</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900 flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                      Sebelum Upload
                    </h3>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li className="flex items-start">
                        <span className="text-green-500 mr-2">✓</span>
                        Validasi data di file CSV sebelum upload
                      </li>
                      <li className="flex items-start">
                        <span className="text-green-500 mr-2">✓</span>
                        Pastikan tidak ada data duplikat
                      </li>
                      <li className="flex items-start">
                        <span className="text-green-500 mr-2">✓</span>
                        Cek konsistensi format tanggal dan waktu
                      </li>
                      <li className="flex items-start">
                        <span className="text-green-500 mr-2">✓</span>
                        Backup data original
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900 flex items-center">
                      <AlertCircle className="w-5 h-5 text-yellow-500 mr-2" />
                      Troubleshooting
                    </h3>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li className="flex items-start">
                        <span className="text-blue-500 mr-2">ℹ</span>
                        File gagal upload? Cek encoding UTF-8
                      </li>
                      <li className="flex items-start">
                        <span className="text-blue-500 mr-2">ℹ</span>
                        Data tidak muncul? Validasi format kolom
                      </li>
                      <li className="flex items-start">
                        <span className="text-blue-500 mr-2">ℹ</span>
                        Error parsing? Pastikan tidak ada karakter khusus
                      </li>
                      <li className="flex items-start">
                        <span className="text-blue-500 mr-2">ℹ</span>
                        Butuh bantuan? Hubungi tim support
                      </li>
                    </ul>
                  </div>
                </div>
              </section>

              <section className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg p-8 text-white">
                <div className="text-center">
                  <h3 className="text-2xl font-bold mb-3">Masih Ada Pertanyaan?</h3>
                  <p className="text-blue-100 mb-6">
                    Tim support kami siap membantu Anda 24/7
                  </p>
                  <div className="flex justify-center space-x-4">
                    <button
                      onClick={() => setActiveTabState('faq')}
                      className="px-6 py-3 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors"
                    >
                      Lihat FAQ
                    </button>
                    <button
                      onClick={() => setActiveTabState('contact')}
                      className="px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-400 transition-colors"
                    >
                      Hubungi Support
                    </button>
                  </div>
                </div>
              </section>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocsPage;