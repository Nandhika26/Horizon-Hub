HORIZON HUB v70 — FIX EDIT JADWAL ADMIN

Perbaikan:
- Tombol Ubah dan Hapus pada daftar jadwal menggunakan delegated click handling pada container yang stabil.
- Tombol aksi diberi type="button" agar tidak memicu submit form secara tidak sengaja.
- Saat Ubah diklik, data jadwal dimuat ke form editor, judul berubah menjadi "Ubah Jadwal", tombol submit berubah menjadi "Simpan Perubahan", dan editor digulir ke tampilan.
- Perbaikan ditujukan untuk konsistensi interaksi setelah daftar dirender ulang dan pada Safari iOS.

Prototype tetap menggunakan localStorage. Perubahan hanya tersimpan pada browser/perangkat yang sama, belum tersinkron antarperangkat atau database online.

Uji lanjutan:
1. Login admin.
2. Buka Kelola Jadwal Kuliah.
3. Tekan Ubah pada salah satu jadwal.
4. Pastikan form terisi dan judul berubah menjadi Ubah Jadwal.
5. Ubah ruangan atau dosen, tekan Simpan Perubahan.
6. Login mahasiswa pada browser yang sama dan pastikan jadwal berubah.
