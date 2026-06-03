const fs = require('fs');
let c = fs.readFileSync('src/components/InternalLink/LinkInternalPage.tsx', 'utf8');

// Find and replace the mobile yearly section
const oldMobile = `                {/* ---------------- MOBILE YEARLY CHART ---------------- */}
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
                </div>`;

const newMobile = `                {/* ---------------- MOBILE YEARLY CHART — NEC STYLE ---------------- */}
                <div className="md:hidden space-y-4">
                    <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl p-4 text-white">
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-amber-100 mb-1">Ringkasan</p>
                        <h3 className="text-lg font-black tracking-tight">Tahun {selectedYear}</h3>
                        <p className="text-[11px] text-amber-100 mt-1">{filteredLinks.length} link aktif dipantau</p>
                    </div>

                    {/* Mini AreaChart — Tren RSL */}
                    {chartData.length > 0 && (
                        <div className="bg-white rounded-2xl border border-orange-50 shadow-sm p-4">
                            <h4 className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-amber-600/70 mb-3">Tren RSL Bulanan</h4>
                            <ResponsiveContainer width="100%" height={180}>
                                <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                                    <defs>
                                        <linearGradient id="rslGradYearly" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#a855f7" stopOpacity={0.05} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                                    <YAxis domain={[-70, -30]} tick={{ fontSize: 9, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} formatter={(value: any) => [\`\${value} dBm\`, 'Avg RSL']} />
                                    <ReferenceLine y={-45} stroke="#10b981" strokeDasharray="4 4" strokeWidth={1} />
                                    <ReferenceLine y={-55} stroke="#f59e0b" strokeDasharray="4 4" strokeWidth={1} />
                                    <ReferenceLine y={-65} stroke="#dc2626" strokeDasharray="4 4" strokeWidth={1} />
                                    <Area type="monotone" dataKey="value" stroke="#a855f7" strokeWidth={2} fill="url(#rslGradYearly)" dot={{ r: 3, fill: '#a855f7', strokeWidth: 0 }} />
                                </AreaChart>
                            </ResponsiveContainer>
                            <div className="flex gap-3 mt-2 flex-wrap">
                                {[{ color: '#10b981', label: 'Optimal (-45)' }, { color: '#f59e0b', label: 'Warning (-55)' }, { color: '#dc2626', label: 'Critical (-65)' }].map(t => (
                                    <div key={t.label} className="flex items-center gap-1">
                                        <div className="w-4 h-0.5 rounded" style={{ backgroundColor: t.color }} />
                                        <span className="text-[9px] text-slate-500 font-medium">{t.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <h4 className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-amber-600/70">Statistik Per Link</h4>
                    <div className="space-y-3">
                        {filteredLinks.map((link) => {
                            const hist = allHistories.filter(h => h.internalLinkId === link.id && new Date(h.date).getFullYear() === selectedYear && h.rslNearEnd != null);
                            const avgRsl = hist.length > 0 ? Math.round((hist.reduce((a, b) => a + b.rslNearEnd!, 0) / hist.length) * 10) / 10 : null;
                            const rslPercent = avgRsl !== null ? Math.max(0, Math.min(100, ((avgRsl - (-70)) / (-30 - (-70))) * 100)) : 0;
                            
                            const badgeBg = avgRsl !== null ? (getRslStatus(avgRsl) === 'optimal' ? 'bg-green-100 text-green-700' : getRslStatus(avgRsl) === 'too_strong' ? 'bg-pink-100 text-pink-700' : getRslStatus(avgRsl) === 'warning' ? 'bg-amber-100 text-amber-700' : getRslStatus(avgRsl) === 'sub_optimal' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700') : 'bg-gray-100 text-gray-500';
                            const barBg = avgRsl !== null ? (getRslStatus(avgRsl) === 'optimal' ? 'bg-green-500' : getRslStatus(avgRsl) === 'too_strong' ? 'bg-pink-500' : getRslStatus(avgRsl) === 'warning' ? 'bg-amber-500' : getRslStatus(avgRsl) === 'sub_optimal' ? 'bg-orange-500' : 'bg-red-500') : 'bg-gray-200';

                            // Hitung statistik bulanan
                            const monthlyStats: { month: string, avg: number }[] = [];
                            months.forEach((month, idx) => {
                                const monthHist = hist.filter(h => new Date(h.date).getMonth() === idx);
                                const monthAvg = monthHist.length > 0 ? Math.round((monthHist.reduce((a, b) => a + b.rslNearEnd!, 0) / monthHist.length) * 10) / 10 : null;
                                if (monthAvg !== null) {
                                    monthlyStats.push({ month: month.substring(0, 3), avg: monthAvg });
                                }
                            });

                            return (
                                <div key={link.id} className="bg-white rounded-2xl border border-orange-50 shadow-sm p-4">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1 pr-2">
                                            <p className="text-[11px] font-bold text-amber-600/70 uppercase tracking-wider">{link.linkGroup || link.type || "-"}</p>
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
                                    <div className="flex justify-between mt-1">
                                        <span className="text-[9px] text-slate-400">-70 dBm</span>
                                        <span className="text-[9px] text-slate-400">-30 dBm</span>
                                    </div>
                                    {monthlyStats.length > 0 && (
                                        <div className="mt-3 pt-3 border-t border-slate-50">
                                            <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">Bulanan</p>
                                            <div className="flex gap-1 flex-wrap">
                                                {monthlyStats.map((ms) => (
                                                    <div key={ms.month} className={"px-2 py-0.5 rounded-md text-[9px] font-bold " + (getRslStatus(ms.avg) === 'optimal' ? 'bg-green-100 text-green-700' : getRslStatus(ms.avg) === 'too_strong' ? 'bg-pink-100 text-pink-700' : getRslStatus(ms.avg) === 'warning' ? 'bg-amber-100 text-amber-700' : getRslStatus(ms.avg) === 'sub_optimal' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700')}>
                                                        {ms.month}: {ms.avg.toFixed(1)}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>`;

c = c.replace(oldMobile, newMobile);

fs.writeFileSync('src/components/InternalLink/LinkInternalPage.tsx', c);
console.log('SUCCESS');
