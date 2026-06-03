const fs = require('fs');
let c = fs.readFileSync('src/components/InternalLink/LinkInternalPage.tsx', 'utf8');

const regex1 = /return \(\s*<div className="space-y-6">[\s\S]*? <div className="grid grid-cols-1 md:grid-cols-2 gap-6">/;
const replacement1 = `return (
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
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <h3 className="text-xl font-semibold">Performa Bulanan - {monthNames[selectedMonth]} {selectedYear}</h3>
                        <div className="flex flex-wrap gap-2">
                            <Input placeholder="Cari link..." className="w-[160px]" value={chartLinkFilter ?? ""}
                                onChange={(e) => setChartLinkFilter(e.target.value || null)} />
                            <Select value={chartTypeFilter ?? "all"} onValueChange={(v) => setChartTypeFilter(v === "all" ? null : v)}>
                                <SelectTrigger className="w-[120px]"><SelectValue placeholder="Tipe" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Tipe</SelectItem>
                                    {LINK_TYPE_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">`;

const regex2 = /\{\/\* Mobile View \*\/\}[\s\S]*?\{\/\* Desktop View \*\/\}/;
const replacement2 = `{/* Desktop View */}`;

const regex3 = /<\/CardContent>\s*<\/Card>\s*<\/div>\s*\);\s*\};\s*\/\* ============================================ \*\//;
const replacement3 = `                    </CardContent>
                </Card>
                </div>
            </div>
        );
    };

    // ============================================`;

c = c.replace(regex1, replacement1);
c = c.replace(regex2, replacement2);
c = c.replace(regex3, replacement3);

fs.writeFileSync('src/components/InternalLink/LinkInternalPage.tsx', c);
console.log('OK');
