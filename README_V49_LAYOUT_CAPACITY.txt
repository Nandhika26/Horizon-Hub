HORIZON HUB v49 – Booking Layout & Header Refinement

Perubahan:
1. Form peminjaman diberi min-width:0, max-width:100%, dan width:100% untuk mencegah kolom input melewati border kartu, terutama pada layar iPhone.
2. Tombol navigasi langkah dibuat responsif dan tidak boleh melebar keluar kartu.
3. Header aplikasi tetap sticky saat halaman discroll, dengan latar solid, z-index teratur, dan tanpa transform agar tidak tampak terpotong/melayang.
4. Jumlah peserta divalidasi sebagai bilangan bulat minimal 1.
5. Validasi batas kapasitas sudah disiapkan melalui data kapasitas ruangan `horizonHubRoomCapacities` (object: kode ruang -> jumlah orang).
6. Kapasitas ruangan belum tersedia di data sumber proyek. Karena itu angka kapasitas tidak dibuat-buat; antarmuka menampilkan pemberitahuan bahwa kapasitas menunggu pendataan admin. Setelah data kapasitas resmi dimasukkan ke `horizonHubRoomCapacities`, batas maksimum akan otomatis diterapkan pada pengajuan.
7. Daftar admin menampilkan “Kapasitas belum didata” daripada nilai null.

Pemeriksaan:
- JavaScript lolos `node --check`.
- ZIP diuji integritas.
- Belum dilakukan pengujian browser langsung di perangkat.
