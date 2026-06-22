import os

files = [
    r"c:\Users\jupri.eka\CODE PM\Frontend\pmdocmkn-web\src\components\WarehouseBorrow\WarehouseCatalogPage.tsx",
    r"c:\Users\jupri.eka\CODE PM\Frontend\pmdocmkn-web\src\components\WarehouseBorrow\WarehousePartFormModal.tsx",
    r"c:\Users\jupri.eka\CODE PM\Frontend\pmdocmkn-web\src\components\Dashboard.tsx"
]

replacements = {
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
}

for filepath in files:
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        for k, v in replacements.items():
            content = content.replace(k, v)
            
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {filepath}")
