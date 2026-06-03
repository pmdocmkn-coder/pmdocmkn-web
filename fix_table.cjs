const fs = require('fs');

// Read current broken file
let currentFile = fs.readFileSync('src/components/InternalLink/LinkInternalPage.tsx', 'utf8');
// Read original file to extract the table (PowerShell writes UTF-16LE by default when using >)
const originalFile = fs.readFileSync('temp_original.txt', 'utf16le');

// Use robust splitting
const lines = originalFile.split(/\r?\n/);

let tableStartIdx = -1;
let tableEndIdx = -1;

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('<CardTitle>Statistik Detail Per Link</CardTitle>')) {
        // Go back up to find the <Card> start
        for (let j = i; j >= 0; j--) {
            if (lines[j].includes('<Card>')) {
                tableStartIdx = j;
                break;
            }
        }
    }

    if (tableStartIdx !== -1 && i > tableStartIdx) {
        if (lines[i].includes('// ============================================')) {
            // Find the return wrapper before this
            for (let j = i; j >= 0; j--) {
                if (lines[j].includes('};')) {
                    tableEndIdx = j + 1;
                    break;
                }
            }
            break;
        }
    }
}

if (tableStartIdx === -1 || tableEndIdx === -1) {
    console.error("Could not find table boundaries");
    process.exit(1);
}

// Extract original table section
let originalTableSection = lines.slice(tableStartIdx, tableEndIdx).join('\n');

// Add "hidden md:block" to the desktop table wrapper
originalTableSection = originalTableSection.replace(
    /<div className="overflow-x-auto border rounded-xl shadow-sm">/g,
    `{/* ---- DESKTOP TABLE ---- */}\n                        <div className="hidden md:block overflow-x-auto border rounded-xl shadow-sm">`
);

// We want to insert the mobile cards right after the desktop table wrapper </div>
const mobileCardsJSX = `
                        {/* ---- MOBILE CARD VIEW ---- */}
                        <div className="md:hidden space-y-3 mt-4">
                            {groupKeys.map((groupName, idx) => {
                                const groupLinks = groupedLinks[groupName];
                                const txLink = groupLinks.find(l => l.directionString === 'TX') || groupLinks[0];
                                const rxLink = groupLinks.find(l => l.directionString === 'RX') || groupLinks[groupLinks.length > 1 ? 1 : 0];

                                // Calculate yearly average for the group
                                const allGroupHist = allHistories.filter(h => groupLinks.some(gl => gl.id === h.internalLinkId) && new Date(h.date).getFullYear() === selectedYear && h.rslNearEnd != null);
                                const groupAvg = allGroupHist.length > 0 ? Math.round((allGroupHist.reduce((a, b) => a + b.rslNearEnd!, 0) / allGroupHist.length) * 10) / 10 : null;

                                return (
                                    <div key={groupName} className="bg-white rounded-2xl border border-orange-50 shadow-sm overflow-hidden">
                                        {/* Card Header */}
                                        <div className="p-4 pb-3">
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex-1 pr-2">
                                                    <p className="text-[10px] font-bold text-amber-600/70 uppercase tracking-wider">#{idx + 1}</p>
                                                    <button onClick={() => {
                                                        setSelectedGroupName(groupName);
                                                        setSelectedGroupLinks(groupLinks);
                                                        setShowGroupDetailModal(true);
                                                    }} className="text-[13px] font-black text-slate-800 leading-tight mt-0.5 text-left hover:text-blue-600 transition-colors">
                                                        {groupName}
                                                    </button>
                                                </div>
                                                {groupAvg !== null && (
                                                    <span className={"px-2.5 py-1 rounded-full text-[10px] font-black " + (getRslStatus(groupAvg) === 'optimal' ? 'bg-green-100 text-green-700' : getRslStatus(groupAvg) === 'too_strong' ? 'bg-pink-100 text-pink-700' : getRslStatus(groupAvg) === 'warning' ? 'bg-amber-100 text-amber-700' : getRslStatus(groupAvg) === 'sub_optimal' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700')}>
                                                        {groupAvg.toFixed(1)} dBm
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Monthly TX/RX Data — Horizontal Scroll */}
                                        <div className="px-4 pb-4">
                                            <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
                                                {months.map((monthName, monthIdx) => {
                                                    const histTx = allHistories.filter(h => {
                                                        const d = new Date(h.date);
                                                        return h.internalLinkId === txLink?.id && d.getFullYear() === selectedYear && d.getMonth() === monthIdx && h.rslNearEnd != null;
                                                    });
                                                    const txVal = histTx.length > 0 ? Math.round(histTx.reduce((a, b) => a + b.rslNearEnd!, 0) / histTx.length) : null;
                                                    
                                                    const histRx = allHistories.filter(h => {
                                                        const d = new Date(h.date);
                                                        return h.internalLinkId === rxLink?.id && d.getFullYear() === selectedYear && d.getMonth() === monthIdx && h.rslNearEnd != null;
                                                    });
                                                    const rxVal = histRx.length > 0 ? Math.round(histRx.reduce((a, b) => a + b.rslNearEnd!, 0) / histRx.length) : null;

                                                    if (txVal === null && rxVal === null) return null;

                                                    return (
                                                        <div key={monthIdx} className="shrink-0 bg-slate-50 rounded-xl p-2 min-w-[56px] text-center border border-slate-100">
                                                            <p className="text-[8px] font-bold text-slate-400 uppercase mb-1.5">{monthName.substring(0, 3)}</p>
                                                            {txVal !== null && (
                                                                <div className="flex items-center justify-center gap-1 mb-0.5">
                                                                    <span className="text-[7px] font-bold text-[#42bbed]">TX</span>
                                                                    <span className={"text-[10px] font-black font-mono " + getRslTextColor(txVal)}>{txVal}</span>
                                                                </div>
                                                            )}
                                                            {rxVal !== null && (
                                                                <div className="flex items-center justify-center gap-1">
                                                                    <span className="text-[7px] font-bold text-red-500">RX</span>
                                                                    <span className={"text-[10px] font-black font-mono " + getRslTextColor(rxVal)}>{rxVal}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
`;

// Insert the mobile cards after the table wrapper closes
originalTableSection = originalTableSection.replace(
    /<\/table>\s*<\/div>/,
    `</table>\n                        </div>\n${mobileCardsJSX}`
);

// Now, locate the broken part in currentFile
const currentBrokenRegex = /<Area type="monotone" dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity=\{0\.3\} name="Rata-rata RSL" \/>[\s\S]*?<\/CardContent>[\s\S]*?<\/Card>[\s\S]*?<\/div>[\s\S]*?<\/div>[\s\S]*?\);\s*};/;

const match = currentFile.match(currentBrokenRegex);

if (match) {
    const brokenEnd = match[0];
    const fixedEnding = `<Area type="monotone" dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} name="Rata-rata RSL" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

${originalTableSection}`;

    currentFile = currentFile.replace(brokenEnd, fixedEnding);
    fs.writeFileSync('src/components/InternalLink/LinkInternalPage.tsx', currentFile);
    console.log('SUCCESS: File fixed and mobile table added.');
} else {
    console.error("Could not find the broken pattern in currentFile");
    process.exit(1);
}
