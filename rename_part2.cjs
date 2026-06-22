const fs = require('fs');

const files = [
    "c:\\Users\\jupri.eka\\CODE PM\\Frontend\\pmdocmkn-web\\src\\components\\RadioRepair\\RadioRepairGroupedTable.tsx",
    "c:\\Users\\jupri.eka\\CODE PM\\Frontend\\pmdocmkn-web\\src\\components\\RadioRepair\\WorkshopTechnicianManager.tsx"
];

const replacements = {
    "Pinjam Part": "Pinjam Tools",
    "Part Kembali": "Tools Kembali",
    "Ada part yang sedang dipinjam": "Ada tools yang sedang dipinjam",
    "Part yang dipinjam sudah dikembalikan": "Tools yang dipinjam sudah dikembalikan",
    "meminjam/mengembalikan part": "meminjam/mengembalikan tools"
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
