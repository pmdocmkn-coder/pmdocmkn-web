const fs = require('fs');

const files = [
    "c:\\Users\\jupri.eka\\CODE PM\\Frontend\\pmdocmkn-web\\src\\components\\RadioRepair\\RadioRepairJobDetailPanel.tsx",
    "c:\\Users\\jupri.eka\\CODE PM\\Frontend\\pmdocmkn-web\\src\\components\\RadioRepair\\RepairJobCustomStatusManager.tsx"
];

const replacements = {
    "Pinjam Part ke Warehouse": "Pinjam Tools ke Warehouse",
    "contoh: Menunggu Spare Part": "contoh: Menunggu Spare Tools"
};

files.forEach(filepath => {
    if (fs.existsSync(filepath)) {
        let content = fs.readFileSync(filepath, 'utf-8');
        for (const [k, v] of Object.entries(replacements)) {
            content = content.split(k).join(v);
        }
        fs.writeFileSync(filepath, content, 'utf-8');
        console.log(`Updated ${filepath}`);
    }
});
