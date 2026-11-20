HORIZON HUB v55 — Icon & Room Selector Fix

Berbasis pada v54 Premium Hidden Sidebar Dashboard.

Perubahan:
1. Mengganti glyph/karakter dekoratif pada empat kartu Explore Campus dengan inline SVG line icons yang konsisten.
2. Menambahkan styling SVG khusus agar ikon memiliki ukuran, stroke, dan alignment seragam.
3. Menyatukan reset pilihan ruangan saat gedung atau lantai berubah.
4. Selector lantai divalidasi terhadap daftar lantai gedung aktif.
5. Daftar ruang kelas dirender ulang berdasarkan gedung dan lantai yang sedang dipilih, disertai ringkasan jumlah ruang yang tersedia dalam direktori.
6. Jika lokasi berubah, pilihan ruangan dari lokasi sebelumnya dihapus agar tidak terbawa ke pengajuan baru.

Catatan data:
- Kapasitas ruangan tetap dibaca dari pengaturan admin (localStorage horizonHubRoomCapacities).
- Kapasitas yang belum diinput admin tetap ditampilkan sebagai belum didata.
- Daftar ruang mengikuti data direktori yang telah tersedia di prototipe; lantai tanpa data kelas terverifikasi tidak diisi dengan data perkiraan.

Validasi teknis:
- JavaScript diperiksa dengan node --check.
- Integritas arsip ZIP diperiksa setelah dibuat.
- Belum dilakukan pengujian visual langsung di browser/Kodo Preview.
