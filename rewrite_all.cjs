const fs = require('fs');

let m = fs.readFileSync('monthly.txt', 'utf8');

const m_header_regex = /return \(\s*<div className="space-y-6">\s*<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">/;
const m_header_repl = `return (
            <div className="space-y-6">
                {/* ---------------- MOBILE MONTHLY CHART ---------------- */}
                <div className="md:hidden space-y-4">
                    <div className="bg-gradient-to-r from-violet-600 to-purple-700 rounded-2xl p-4 text-white">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-violet-200 mb-1">Periode</p>
                                <h3 className="text-lg font-black tracking-tight">{monthNames[selectedMonth]} {selectedYear}</h3>
                                <p className="text-[11px] text-violet-200 mt-1">{filteredLinks.length} link aktif dipantau</p>
                            </div>
                            <Button
                                variant="outline" size="sm"
                                onClick={() => setActiveMobileFilter("chart-type")}
                                className="rounded-full bg-white/10 border-white/20 text-white hover:bg-white/20 h-8 px-3 text-xs"
                            >
                                <span>{chartTypeFilter ? LINK_TYPE_OPTIONS.find(o => o.value === chartTypeFilter)?.label : "Semua Tipe"}</span>
                                <ChevronDown className="w-3 h-3 ml-1 opacity-70" />
                            </Button>
                        </div>
                        <div className="mt-4">
                            <Input placeholder="Cari link..." className="h-9 bg-black/20 border-white/10 text-white placeholder:text-white/50 text-sm focus-visible:ring-white/30" value={chartLinkFilter ?? ""} onChange={(e) => setChartLinkFilter(e.target.value || null)} />
                        </div>
                    </div>

                    {pieData.length > 0 && (
                        <div className="bg-white rounded-2xl border border-purple-50 shadow-sm p-4">
                            <h4 className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-purple-600/70 mb-3">Distribusi Status Link</h4>
                            <div className="flex flex-wrap gap-2">
                                {pieData.map((item, i) => (
                                    <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold" style={{ backgroundColor: item.fill + '20', color: item.fill }}>
                                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.fill }} />
                                        {item.name}: {item.value}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <h4 className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-purple-600/70 mt-2">Detail Per Link</h4>
                    <div className="space-y-3">
                        {filteredLinks.map((link) => {
                            const histRsl = allHistories
                                .filter(h => {
                                    const d = new Date(h.date);
                                    return h.internalLinkId === link.id && d.getFullYear() === selectedYear && d.getMonth() + 1 === selectedMonth && h.rslNearEnd != null;
                                })
                                .map(h => h.rslNearEnd!);
                            const avgRsl = histRsl.length > 0 ? Math.round((histRsl.reduce((a, b) => a + b, 0) / histRsl.length) * 10) / 10 : null;
                            const rslPercent = avgRsl !== null ? Math.max(0, Math.min(100, ((avgRsl - (-70)) / (-30 - (-70))) * 100)) : 0;
                            
                            const badgeBg = avgRsl !== null ? (getRslStatus(avgRsl) === 'optimal' ? 'bg-green-100 text-green-700' : getRslStatus(avgRsl) === 'too_strong' ? 'bg-pink-100 text-pink-700' : getRslStatus(avgRsl) === 'warning' ? 'bg-amber-100 text-amber-700' : getRslStatus(avgRsl) === 'sub_optimal' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700') : 'bg-gray-100 text-gray-500';
                            
                            const barBg = avgRsl !== null ? (getRslStatus(avgRsl) === 'optimal' ? 'bg-green-500' : getRslStatus(avgRsl) === 'too_strong' ? 'bg-pink-500' : getRslStatus(avgRsl) === 'warning' ? 'bg-amber-500' : getRslStatus(avgRsl) === 'sub_optimal' ? 'bg-orange-500' : 'bg-red-500') : 'bg-gray-200';

                            return (
                                <div key={link.id} className="bg-white rounded-2xl border border-purple-50 shadow-sm p-4">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1 pr-2">
                                            <p className="text-[11px] font-bold text-purple-600/70 uppercase tracking-wider">{link.linkGroup || link.type || "-"}</p>
                                            <h5 className="text-[13px] font-black text-slate-800 leading-tight mt-0.5">{link.linkName}</h5>
                                        </div>
                                        <span className={"px-2.5 py-1 rounded-full text-[10px] font-black " + badgeBg}>
                                            {getRslStatusLabel(avgRsl)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[11px] text-slate-500 font-medium">Rata-rata RSL</span>
                                        {avgRsl !== null ? (
                                            <span className={"text-[16px] font-black font-mono " + getRslTextColor(avgRsl)}>
                                                {avgRsl.toFixed(1)} <span className="text-[11px] font-bold">dBm</span>
                                            </span>
                                        ) : (
                                            <span className="text-[16px] font-black font-mono text-slate-400">-</span>
                                        )}
                                    </div>
                                    <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div className={"absolute left-0 top-0 h-full rounded-full transition-all duration-500 " + barBg} style={{ width: rslPercent + '%' }} />
                                    </div>
                                    <div className="flex justify-between mt-1">
                                        <span className="text-[9px] text-slate-400">-70 dBm</span>
                                        <span className="text-[9px] text-slate-400">-30 dBm</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ---------------- DESKTOP MONTHLY CHART ---------------- */}
                <div className="hidden md:block space-y-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">`;

m = m.replace(m_header_regex, m_header_repl);
const m_mobile_regex = /\{\/\* Mobile View \*\/\}[\s\S]*?\{\/\* Desktop View \*\/\}/;
m = m.replace(m_mobile_regex, '{/* Desktop View */}');
const m_end_regex = /<\/CardContent>\s*<\/Card>\s*<\/div>\s*\);\s*\};/g;
m = m.replace(m_end_regex, `                    </CardContent>\n                </Card>\n                </div>\n            </div>\n        );\n    };`);


let y = fs.readFileSync('yearly.txt', 'utf8');

const y_header_regex = /return \(\s*<div className="space-y-6">\s*<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">/;
const y_header_repl = `return (
            <div className="space-y-6">
                {/* ---------------- MOBILE YEARLY CHART ---------------- */}
                <div className="md:hidden space-y-4">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-4 text-white">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-blue-200 mb-1">Periode</p>
                                <h3 className="text-lg font-black tracking-tight">Tahun {selectedYear}</h3>
                                <p className="text-[11px] text-blue-200 mt-1">{filteredLinks.length} link aktif dipantau</p>
                            </div>
                            <Button
                                variant="outline" size="sm"
                                onClick={() => setActiveMobileFilter("chart-type")}
                                className="rounded-full bg-white/10 border-white/20 text-white hover:bg-white/20 h-8 px-3 text-xs"
                            >
                                <span>{chartTypeFilter ? LINK_TYPE_OPTIONS.find(o => o.value === chartTypeFilter)?.label : "Semua Tipe"}</span>
                                <ChevronDown className="w-3 h-3 ml-1 opacity-70" />
                            </Button>
                        </div>
                        <div className="mt-4">
                            <Input placeholder="Cari link..." className="h-9 bg-black/20 border-white/10 text-white placeholder:text-white/50 text-sm focus-visible:ring-white/30" value={chartLinkFilter ?? ""} onChange={(e) => setChartLinkFilter(e.target.value || null)} />
                        </div>
                    </div>

                    <h4 className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-blue-600/70 mt-2">Detail Tahunan Per Link</h4>
                    <div className="space-y-3">
                        {filteredLinks.map((link) => {
                            const hist = allHistories.filter(h => h.internalLinkId === link.id && new Date(h.date).getFullYear() === selectedYear && h.rslNearEnd != null);
                            const avgRsl = hist.length > 0 ? Math.round((hist.reduce((a, b) => a + b.rslNearEnd!, 0) / hist.length) * 10) / 10 : null;
                            const rslPercent = avgRsl !== null ? Math.max(0, Math.min(100, ((avgRsl - (-70)) / (-30 - (-70))) * 100)) : 0;
                            
                            const badgeBg = avgRsl !== null ? (getRslStatus(avgRsl) === 'optimal' ? 'bg-green-100 text-green-700' : getRslStatus(avgRsl) === 'too_strong' ? 'bg-pink-100 text-pink-700' : getRslStatus(avgRsl) === 'warning' ? 'bg-amber-100 text-amber-700' : getRslStatus(avgRsl) === 'sub_optimal' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700') : 'bg-gray-100 text-gray-500';
                            const barBg = avgRsl !== null ? (getRslStatus(avgRsl) === 'optimal' ? 'bg-green-500' : getRslStatus(avgRsl) === 'too_strong' ? 'bg-pink-500' : getRslStatus(avgRsl) === 'warning' ? 'bg-amber-500' : getRslStatus(avgRsl) === 'sub_optimal' ? 'bg-orange-500' : 'bg-red-500') : 'bg-gray-200';

                            // Hitung warning bulanan
                            const warnings: { month: string, status: string, value: number }[] = [];
                            months.forEach((month, idx) => {
                                const monthHist = hist.filter(h => new Date(h.date).getMonth() === idx);
                                const monthAvg = monthHist.length > 0 ? (monthHist.reduce((a, b) => a + b.rslNearEnd!, 0) / monthHist.length) : null;
                                if (monthAvg !== null) {
                                    const status = getRslStatusLabel(monthAvg);
                                    if (status !== 'Optimal' && status !== 'Terlalu Kuat') {
                                        warnings.push({ month: month.substring(0, 3), status, value: monthAvg });
                                    }
                                }
                            });

                            return (
                                <div key={link.id} className="bg-white rounded-2xl border border-blue-50 shadow-sm p-4">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1 pr-2">
                                            <p className="text-[11px] font-bold text-blue-600/70 uppercase tracking-wider">{link.linkGroup || link.type || "-"}</p>
                                            <h5 className="text-[13px] font-black text-slate-800 leading-tight mt-0.5">{link.linkName}</h5>
                                        </div>
                                        <span className={"px-2.5 py-1 rounded-full text-[10px] font-black " + badgeBg}>
                                            {getRslStatusLabel(avgRsl)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[11px] text-slate-500 font-medium">Rata-rata Tahunan</span>
                                        {avgRsl !== null ? (
                                            <span className={"text-[16px] font-black font-mono " + getRslTextColor(avgRsl)}>
                                                {avgRsl.toFixed(1)} <span className="text-[11px] font-bold">dBm</span>
                                            </span>
                                        ) : (
                                            <span className="text-[16px] font-black font-mono text-slate-400">-</span>
                                        )}
                                    </div>
                                    <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div className={"absolute left-0 top-0 h-full rounded-full transition-all duration-500 " + barBg} style={{ width: rslPercent + '%' }} />
                                    </div>
                                    <div className="flex justify-between mt-1 mb-2">
                                        <span className="text-[9px] text-slate-400">-70 dBm</span>
                                        <span className="text-[9px] text-slate-400">-30 dBm</span>
                                    </div>

                                    {warnings.length > 0 && (
                                        <div className="mt-3 pt-3 border-t border-red-50/50">
                                            <div className="flex items-start gap-1.5">
                                                <div className="mt-0.5 shrink-0 bg-red-100 p-1 rounded-full">
                                                    <AlertTriangle className="h-3 w-3 text-red-600" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-[10px] font-bold text-red-700 uppercase tracking-wide mb-1">Peringatan Bulanan</p>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {warnings.map((w, wIdx) => (
                                                            <div key={wIdx} className="text-[9px] font-bold text-red-700 bg-red-50 px-2 py-1 rounded-md border border-red-100/50">
                                                                {w.month}: {w.value.toFixed(1)} dBm
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ---------------- DESKTOP YEARLY CHART ---------------- */}
                <div className="hidden md:block space-y-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">`;

y = y.replace(y_header_regex, y_header_repl);
const y_mobile_regex = /\{\/\* Mobile View \*\/\}[\s\S]*?\{\/\* Desktop View \*\/\}/;
y = y.replace(y_mobile_regex, '{/* Desktop View */}');
const y_end_regex = /<\/CardContent>\s*<\/Card>\s*<\/div>\s*\);\s*\};/g;
y = y.replace(y_end_regex, `                    </CardContent>\n                </Card>\n                </div>\n            </div>\n        );\n    };`);


let orig = fs.readFileSync('src/components/InternalLink/LinkInternalPage.tsx', 'utf8');
const old_m = fs.readFileSync('monthly.txt', 'utf8');
const old_y = fs.readFileSync('yearly.txt', 'utf8');

orig = orig.replace(old_m, m);
orig = orig.replace(old_y, y);

// Import fixes
orig = orig.replace(/Activity,/, 'Activity, AlertTriangle,');

fs.writeFileSync('src/components/InternalLink/LinkInternalPage.tsx', orig);
console.log('SUCCESS!');
