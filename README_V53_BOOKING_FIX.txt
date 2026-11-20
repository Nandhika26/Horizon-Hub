HORIZON HUB v53 – BOOKING LAYOUT, ROOM DIRECTORY & CAPACITY

Perubahan:
1. Form peminjaman menggunakan box-sizing border-box, min-width:0, dan grid minmax agar input tanggal, waktu, jumlah peserta, select, textarea, serta tombol tidak melewati border pada layar kecil.
2. Ikon di kartu pilihan ruangan, notification center, dan detail denah menggunakan SVG line icons agar konsisten.
3. Pemilihan gedung/lantai pada form peminjaman mereset pilihan ruangan dan memperbarui daftar kelas sesuai gedung dan lantai yang dipilih.
4. Halaman denah menampilkan daftar lokasi sesuai lantai terpilih; daftar diperbarui ketika gedung/lantai berubah.
5. Admin dapat mengisi kapasitas resmi tiap ruang melalui menu Kelola Ruangan & Fasilitas. Nilai kapasitas disimpan lokal di browser sebagai data prototipe.
6. Form jumlah peserta menampilkan validasi langsung. Jika kapasitas ruang telah diisi 40 dan peserta diisi 50, pesan akan menjelaskan bahwa jumlah peserta melebihi kapasitas. Pengajuan ditolak sampai jumlah peserta dikurangi atau ruang diganti.

PENTING:
- Kapasitas ruang tidak diisi otomatis karena belum ada daftar kapasitas resmi yang terverifikasi. Admin harus mengisi kapasitas sesuai data kampus.
- Penyimpanan masih localStorage browser/perangkat, belum sinkron antarperangkat atau pengguna.
- Data ruangan mengikuti direktori dan signage yang tersedia; beberapa lantai belum memiliki gambar layout atau daftar lengkap.

Cara mengatur kapasitas:
Login sebagai admin > Kelola Ruangan & Fasilitas > cari kode ruang > isi Kapasitas resmi (orang) > Simpan kapasitas.
