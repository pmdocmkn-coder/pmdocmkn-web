const fs = require('fs');
const path = require('path');

const files = [
    "c:\\Users\\jupri.eka\\CODE PM\\Frontend\\pmdocmkn-web\\src\\components\\WarehouseBorrow\\WarehouseCatalogPage.tsx",
    "c:\\Users\\jupri.eka\\CODE PM\\Frontend\\pmdocmkn-web\\src\\components\\WarehouseBorrow\\WarehousePartFormModal.tsx",
    "c:\\Users\\jupri.eka\\CODE PM\\Frontend\\pmdocmkn-web\\src\\components\\Dashboard.tsx"
];

const replacements = {
    "Master Data Part": "Master Data Tools",
    "Tambah Part Baru": "Tambah Tools Baru",
    "Ubah Data Part": "Ubah Data Tools",
    "Tambah Part": "Tambah Tools",
    "Kode Part": "Tools Code",
    "Nama Part": "Nama Tools",
    "Hapus Part": "Hapus Tools",
    "Belum ada data master part": "Belum ada data master tools",
    "Cari kode atau nama part": "Cari kode atau nama tools",
    "Masukkan kode part": "Masukkan kode tools",
    "Masukkan nama part": "Masukkan nama tools",
    "Manajemen Peminjaman Part": "Manajemen Peminjaman Tools",
    "Data part berhasil": "Data tools berhasil",
    "part ini dari master data": "tools ini dari master data",
    "Data Part": "Data Tools"
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
