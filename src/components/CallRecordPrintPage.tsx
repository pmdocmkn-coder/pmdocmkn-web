import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  type ChartOptions,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { callRecordApi } from "../services/api";
import { DailySummary, HourlySummary } from "../types/callRecord";
import { format, addDays, eachDayOfInterval } from "date-fns";
import { id as dateFnsLocale } from "date-fns/locale";
import { id as dayPickerLocale } from "react-day-picker/locale";
import { DayPicker, DateRange } from "react-day-picker";
import "react-day-picker/style.css";
import { Printer, Calendar, RefreshCw, AlertCircle, Download, ChevronDown } from "lucide-react";

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend);

const formatDate = (dateStr: string): string => {
  try {
    return format(new Date(dateStr), "d MMM yyyy", { locale: dateFnsLocale });
  } catch {
    return dateStr;
  }
};

const pct = (val: number, decimals = 2) => `${val.toFixed(decimals)}%`;

// ─── Chart ────────────────────────────────────────────────────────────

interface PrintChartProps { hourlyData: HourlySummary[]; }

// Custom plugin: draw label at the end of each line
const lineEndLabelPlugin = {
  id: 'lineEndLabels',
  afterDatasetsDraw(chart: any) {
    const { ctx, chartArea } = chart;
    chart.data.datasets.forEach((dataset: any, i: number) => {
      if (dataset.type !== "line") return;

      const meta = chart.getDatasetMeta(i);
      if (!meta.hidden) {
        const lastPoint = meta.data[meta.data.length - 1] as any;
        if (!lastPoint) return;

        // Label digambar DALAM chart area (rata kanan ke batas kanan plot)
        // Angka % ada di LUAR area (axis), jadi tidak akan pernah tumpang tindih
        let x = chartArea.right - 4;
        let y = lastPoint.y;

        // Posisikan text menjauh dari titik koordinat agar tidak menutupi line sama sekali
        if (dataset.label === "Sys Busy %") y -= 9; // Taruh di atas ujung garis biru
        if (dataset.label === "TE Busy %") y -= 14;  // Taruh di atas ujung garis oranye
        if (dataset.label === "Others %") y -= 14;   // Taruh di atas ujung garis hitam

        let txt = dataset.label || '';

        ctx.save();
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'right'; // RATA KANAN - teks berakhir di batas kanan plot area
        ctx.textBaseline = 'middle';

        // Add white stroke/halo shadow to make text readable over grid lines
        ctx.lineJoin = 'round';
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#ffffff';
        ctx.strokeText(txt, x, y);

        // Draw colored text over the white stroke
        ctx.fillStyle = dataset.borderColor || '#000';
        ctx.fillText(txt, x, y);
        ctx.restore();
      }
    });
  },
};

// Plugin untuk memberi jarak khusus di bawah legenda agar tidak menyentuh ujung Bar tertinggi
const legendMarginPlugin = {
  id: 'legendMargin',
  beforeInit(chart: any) {
    if (chart.legend) {
      const originalFit = chart.legend.fit;
      chart.legend.fit = function fit() {
        if (originalFit) {
          originalFit.bind(chart.legend)();
        }
        this.height += 25; // Gap tertata rapi
      };
    }
  }
};

const PrintChart: React.FC<PrintChartProps> = ({ hourlyData }) => {
  const labels = hourlyData.map((h) => h.timeRange);
  const chartData = {
    labels,
    datasets: [
      {
        type: "bar" as const, label: "Qty",
        data: hourlyData.map((h) => h.qty),
        backgroundColor: "#60a5fa",
        yAxisID: "yLeft", order: 4, barPercentage: 0.85, categoryPercentage: 0.9,
      },
      {
        type: "line" as const, label: "TE Busy %",
        data: hourlyData.map((h) => h.teBusyPercent),
        borderColor: "#ea580c", backgroundColor: "#ea580c",
        borderWidth: 2, pointRadius: 0, pointHoverRadius: 3,
        yAxisID: "yRight", order: 1, tension: 0.1,
      },
      {
        type: "line" as const, label: "Sys Busy %",
        data: hourlyData.map((h) => h.sysBusyPercent),
        borderColor: "#1e40af", backgroundColor: "#1e40af",
        borderWidth: 2, pointRadius: 0, pointHoverRadius: 3,
        yAxisID: "yRight", order: 2, tension: 0.1,
      },
      {
        type: "line" as const, label: "Others %",
        data: hourlyData.map((h) => h.othersPercent),
        borderColor: "#0f172a", backgroundColor: "#0f172a",
        borderWidth: 2, pointRadius: 0, pointHoverRadius: 3,
        yAxisID: "yRight", order: 3, tension: 0.1,
      },
    ],
  };

  const options: ChartOptions<"bar"> = {
    responsive: true, maintainAspectRatio: false, animation: false,
    devicePixelRatio: 4, // Force resolusi 4x lipat (membuat grafik tajam saat di-print/PDF)
    plugins: {
      legend: {
        position: "top", align: "start",
        labels: {
          usePointStyle: true,
          pointStyle: "circle",
          boxWidth: 8, boxHeight: 8, padding: 16, // Padding antar teks ditormalkan
          font: { size: 10, family: "sans-serif", weight: "bold" }, color: "#111",
        },
      },
      tooltip: { mode: "index", intersect: false },
    },
    scales: {
      x: {
        ticks: { maxRotation: 90, minRotation: 90, font: { size: 8 }, color: "#333", padding: 2, autoSkip: false },
        grid: { display: false },
        title: { display: true, text: "Time", font: { size: 9, weight: "bold" }, color: "#444" },
      },
      yLeft: {
        type: "linear", position: "left", beginAtZero: true,
        title: { display: true, text: "Jumlah Panggilan", font: { size: 9, weight: "bold" }, color: "#444" },
        ticks: { font: { size: 8.5 }, color: "#555" },
        grid: { color: "#f0f0f0" }, border: { dash: [3, 3] },
        grace: '5%', // Agar batang bar tertinggi (misal 3900) tidak mentok sampai ujung atas frame garis!
      },
      yRight: {
        type: "linear", position: "right", beginAtZero: true, max: 100,
        // Judul vertikal aktif - aman karena label custom ada di dalam chart area (zona berbeda)
        title: { display: true, text: "TE Busy %, Sys Busy % and Others %", font: { size: 9, weight: "bold" }, color: "#444" },
        // Padding kecil agar angka % mepet
        ticks: { font: { size: 8 }, color: "#555", callback: (v: any) => `${v}%`, stepSize: 20, padding: 4 },
        grid: { drawOnChartArea: false },
        border: { display: false },
      },
    },
    // Menghilangkan layout padding top tambahan, chart area kini dimaksimalkan menempel di kotak boundary
    layout: { padding: { bottom: 0, top: 0, left: 0, right: 0 } },
  };

  return <Bar plugins={[lineEndLabelPlugin as any, legendMarginPlugin as any]} options={options} data={chartData as any} />;
};

// ─── Main Page ────────────────────────────────────────────────────────────

const CallRecordPrintPage: React.FC = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize to midnight local time
  const [range, setRange] = useState<DateRange | undefined>({ from: today, to: today });
  const [calOpen, setCalOpen] = useState(false);
  const calRef = useRef<HTMLDivElement>(null);
  const [summaries, setSummaries] = useState<{ date: string; data: DailySummary }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (calRef.current && !calRef.current.contains(e.target as Node)) setCalOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const handleRangeSelect = (r: DateRange | undefined) => {
    setRange(r);
    setSummaries([]); setHasLoaded(false);
  };

  const dayCount = range?.from && range?.to
    ? eachDayOfInterval({ start: range.from, end: range.to }).length
    : 1;

  const formatRangeLabel = () => {
    if (!range?.from) return 'Pilih Tanggal';
    const fmt = (d: Date) => format(d, 'd MMM yyyy', { locale: dateFnsLocale });
    if (!range.to || range.from.toDateString() === range.to.toDateString()) return fmt(range.from);
    return `${fmt(range.from)} – ${fmt(range.to)}`;
  };

  const toIso = (d: Date) => format(d, 'yyyy-MM-dd');

  const loadSummaries = useCallback(async () => {
    if (!range?.from) return;
    setIsLoading(true); setError(null);
    const from = range.from;
    const to = range.to ?? range.from;
    const dates = eachDayOfInterval({ start: from, end: to }).map(toIso);
    try {
      const results = await Promise.all(
        dates.map(async (date) => {
          const data = await callRecordApi.getDailySummary(date);
          return { date, data };
        })
      );
      setSummaries(results);
      setHasLoaded(true);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Gagal memuat data");
      setSummaries([]);
    } finally { setIsLoading(false); }
  }, [range]);

  return (
    <>
      <style>{`
        @media print {
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: 297mm !important;
            height: auto !important;
            min-height: 0 !important;
            overflow: hidden !important;
          }
          body * { visibility: hidden !important; }
          #print-pages, #print-pages * { visibility: visible !important; }
          #print-pages {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 297mm !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .print-page {
            width: 297mm !important;
            height: 210mm !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            page-break-after: always !important;
            break-after: always !important;
            overflow: hidden !important;
            box-shadow: none !important;
          }
          .print-page:last-child {
            page-break-after: avoid !important;
            break-after: avoid !important;
          }
          #screen-preview {
            height: 0 !important;
            min-height: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
          }
          .no-print { display: none !important; }
          @page { size: A4 landscape; margin: 0; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>

      {/* Top control bar */}
      <div className="no-print bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-screen-xl mx-auto px-5 py-3 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 mr-auto">
            <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center">
              <Printer className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-[11px] text-gray-500 leading-none">NEC Report</p>
              <h1 className="text-sm font-bold text-gray-900 leading-tight">Print Call Record</h1>
            </div>
          </div>

          {/* Single Calendar Range Picker */}
          <div className="relative" ref={calRef}>
            <button
              onClick={() => setCalOpen(v => !v)}
              className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 hover:bg-blue-100 transition-colors"
            >
              <Calendar className="w-4 h-4 text-blue-500 shrink-0" />
              <span className="text-sm font-semibold text-blue-700">{formatRangeLabel()}</span>
              {dayCount > 1 && (
                <span className="text-[10px] bg-blue-200 text-blue-700 font-bold px-1.5 py-0.5 rounded-full">
                  {dayCount} hari
                </span>
              )}
              <ChevronDown className="w-3.5 h-3.5 text-blue-400" />
            </button>

            {/* Calendar Popup */}
            {calOpen && (
              <div className="absolute top-full left-0 mt-2 z-50 bg-white rounded-xl shadow-2xl border border-gray-200 p-3">
                <DayPicker
                  mode="range"
                  selected={range}
                  onSelect={handleRangeSelect}
                  locale={dayPickerLocale}
                  showOutsideDays
                  disabled={{ after: new Date() }}
                  footer={
                    <div className="flex justify-between items-center pt-3 border-t mt-3 text-sm">
                      <div className="flex gap-4">
                        <button
                          onClick={() => { setRange(undefined); setSummaries([]); setHasLoaded(false); }}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >Hapus</button>
                        <button
                          onClick={() => { setRange({ from: new Date(), to: new Date() }); }}
                          className="text-blue-500 font-semibold hover:text-blue-700 transition-colors"
                        >Hari ini</button>
                      </div>
                      <button
                        onClick={() => { setCalOpen(false); loadSummaries(); }}
                        className="bg-blue-600 text-white px-4 py-1.5 justify-end rounded-md text-xs font-bold hover:bg-blue-700 transition-colors"
                      >Selesai</button>
                    </div>
                  }
                />
              </div>
            )}
          </div>

          <button
            onClick={loadSummaries} disabled={isLoading || !range?.from}
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-600 text-sm font-semibold rounded-lg disabled:opacity-40 hover:bg-gray-200 transition-colors"
            title="Muat ulang data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </button>

          {hasLoaded && summaries.length > 0 && (
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" /> Print / PDF
              {summaries.length > 1 && (
                <span className="bg-emerald-400 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {summaries.length} hal
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="no-print mt-4 max-w-screen-xl mx-auto px-5">
          <div className="bg-red-50 text-red-700 p-3 rounded-lg flex gap-2 text-sm border border-red-200">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
          </div>
        </div>
      )}

      {/* Screen preview */}
      <div id="screen-preview" className="bg-slate-100 min-h-screen py-8 flex flex-col items-center gap-6 overflow-auto">
        {hasLoaded && summaries.length > 0 ? (
          /* Print pages container — visible in both screen and print */
          <div id="print-pages">
            {summaries.map(({ date, data }, index) => (
              <div
                key={date}
                className="print-page"
                style={{ marginBottom: index < summaries.length - 1 ? '32px' : '0' }}
              >
                <div className="bg-white shadow-2xl border border-gray-300 print:shadow-none print:border-none" style={{ width: '277mm' }}>
                  <PrintContent summary={data} selectedDate={date} />
                </div>
              </div>
            ))}
          </div>
        ) : !isLoading ? (
          <div className="no-print text-gray-400 mt-24 flex flex-col items-center gap-3">
            <Download className="w-14 h-14 text-gray-300" />
            <p className="text-sm">Pilih rentang tanggal dan klik "Tampilkan" untuk preview laporan.</p>
          </div>
        ) : (
          <div className="no-print flex flex-col items-center justify-center mt-24 gap-3">
            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Mengambil data {dayCount} hari dari server...</p>
          </div>
        )}
      </div>
    </>
  );
};


// ─── Printable Content ─────────────────────────────────────────────────────

interface PrintContentProps {
  summary: DailySummary;
  selectedDate: string;
}

const PrintContent = React.forwardRef<HTMLDivElement, PrintContentProps>(
  ({ summary, selectedDate }, ref) => {
    const now = format(new Date(), "dd MMMM yyyy HH:mm", { locale: dateFnsLocale });

    return (
      <div
        id="print-root"
        ref={ref}
        style={{
          width: '277mm',
          backgroundColor: 'white',
          fontFamily: "'Segoe UI', Arial, sans-serif",
          color: '#111',
          padding: '6px 10px 4px',
          boxSizing: 'border-box',
          margin: '0 auto',
        }}
      >
        {/* ── Title ── */}
        <div style={{ textAlign: 'center', fontWeight: '900', fontSize: '16px', marginBottom: '6px', letterSpacing: '0.05em' }}>
          DATA CALLRECORD
        </div>

        {/* ── Date ── */}
        <div style={{ marginBottom: '6px' }}>
          <div style={{ fontSize: '10px', fontWeight: '800', color: '#111', marginBottom: '1px', textTransform: 'uppercase' }}>
            Date
          </div>
          <div style={{ display: 'inline-block', borderBottom: '2px solid #1e293b', paddingBottom: '2px', minWidth: '140px', fontSize: '11px', fontWeight: '700', color: '#111' }}>
            {formatDate(selectedDate)}
            <span style={{ float: 'right', fontSize: '9px', marginTop: '2px' }}>▼</span>
          </div>
        </div>

        {/* ── Main: Table + Chart ── */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>

          {/* Table */}
          <div style={{ flexShrink: 0, width: '390px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #cbd5e1' }}>
                  {['Time', 'Qty', 'TE Busy', 'TE Busy %', 'Sys Busy', 'Sys Busy %', 'Others', 'Others %'].map((h, i) => (
                    <th key={h} style={{ padding: '6px 2px', textAlign: i === 0 ? 'left' : 'center', fontWeight: '700', color: '#444' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {summary.hourlyData.map((h, i) => (
                  <tr key={h.hourGroup} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '2.5px 2px', fontWeight: '600', color: '#333' }}>{h.timeRange}</td>
                    <td style={{ padding: '2.5px 2px', textAlign: 'center', fontWeight: '700' }}>{h.qty.toLocaleString()}</td>
                    <td style={{ padding: '2.5px 2px', textAlign: 'center', color: '#555' }}>{h.teBusy.toLocaleString()}</td>
                    <td style={{ padding: '2.5px 2px', textAlign: 'center', color: '#111', fontWeight: '600' }}>{pct(h.teBusyPercent)}</td>
                    <td style={{ padding: '2.5px 2px', textAlign: 'center', color: '#555' }}>{h.sysBusy.toLocaleString()}</td>
                    <td style={{ padding: '2.5px 2px', textAlign: 'center', color: '#111', fontWeight: '600' }}>{pct(h.sysBusyPercent)}</td>
                    <td style={{ padding: '2.5px 2px', textAlign: 'center', color: '#555' }}>{h.others.toLocaleString()}</td>
                    <td style={{ padding: '2.5px 2px', textAlign: 'center', color: '#111', fontWeight: '600' }}>{pct(h.othersPercent)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: '2px solid #334155', borderBottom: '2px solid #334155' }}>
                  {['Total', summary.totalQty.toLocaleString(), summary.totalTEBusy.toLocaleString(), '', summary.totalSysBusy.toLocaleString(), '', summary.totalOthers.toLocaleString(), ''].map((v, i) => (
                    <td key={i} style={{ padding: '6px 2px', textAlign: i === 0 ? 'left' : 'center', fontWeight: '800', color: '#111' }}>
                      {v}
                    </td>
                  ))}
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Chart */}
          <div style={{ flex: 1, border: '1px solid #e2e8f0', padding: '16px', minWidth: 0, borderRadius: '8px' }}>
            {/* Height grafik 400px agar sejajar dengan tinggi tabel dan muat di A4 landscape */}
            <div style={{ width: '100%', height: '400px' }}>
              <PrintChart hourlyData={summary.hourlyData} />
            </div>
          </div>
        </div>

        {/* ── Average Percent/Day Stats ── */}
        <div style={{ marginTop: '8px' }}>
          <div style={{ textAlign: 'center', fontSize: '9px', fontWeight: '800', letterSpacing: '0.05em', color: '#334155', marginBottom: '8px', textTransform: 'uppercase' }}>
            AVERAGE PERCENT/DAY
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', padding: '0 20px' }}>
            {/* Total Call */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: '800', fontSize: '16px', color: '#1e293b' }}>
                {summary.totalQty.toLocaleString()}
              </div>
              <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '600', marginTop: '2px' }}>
                Total Call
              </div>
            </div>
            {/* TE Busy */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: '800', fontSize: '16px', color: '#1e293b' }}>
                {pct(summary.avgTEBusyPercent)}
              </div>
              <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '600', marginTop: '2px' }}>
                TE Busy %
              </div>
            </div>
            {/* Sys Busy */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: '800', fontSize: '16px', color: '#1e293b' }}>
                {pct(summary.avgSysBusyPercent)}
              </div>
              <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '600', marginTop: '2px' }}>
                Sys Busy %
              </div>
            </div>
            {/* Others */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: '800', fontSize: '16px', color: '#1e293b' }}>
                {pct(summary.avgOthersPercent)}
              </div>
              <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '600', marginTop: '2px' }}>
                Others %
              </div>
            </div>
          </div>
        </div>


      </div>
    );
  }
);

PrintContent.displayName = "PrintContent";

export default CallRecordPrintPage;
