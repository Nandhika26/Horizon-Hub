HORIZON HUB – UPDATE V45

Basis: v44 (soft-fade background), preserving the approved HORIZON HUB visual design and v22-style login layout.

Perbaikan:
1. Ikon kalender pada kartu TODAY sekarang berupa tombol aktif yang menggulir ke jadwal mingguan.
2. Menu dan halaman Inventaris Fasilitas dibatasi untuk akun admin. Mahasiswa tetap dapat mengajukan peminjaman melalui alur Peminjaman Ruangan/kategori fasilitas.
3. Formulir peminjaman memakai lebar kolom yang responsif agar input tidak melampaui kartu di layar kecil.
4. Ikon inventaris diganti dengan SVG garis untuk proyektor, kursi, meja, AC portable, sound system, dan kabel/adaptor.
5. Validasi tanggal dan jam peminjaman ditampilkan tepat di bawah kolom terkait: tanggal lampau, waktu mulai yang sudah lewat pada hari ini, dan waktu selesai yang tidak lebih besar dari waktu mulai.
6. Tombol Kembali, Kembali ke Langkah 1, dan Kirim Pengajuan ditata ulang agar membungkus dengan rapi pada layar ponsel.
7. Menghapus listener ganda pada tombol Kembali ke Langkah 1.

Catatan:
- Proyek masih prototipe berbasis localStorage; data tidak tersinkron antarperangkat.
- Ikon kalender saat ini menggulir ke jadwal mingguan (bukan kalender tanggal interaktif).
- Validasi waktu memakai jam lokal perangkat.
- Pemeriksaan yang dilakukan: sintaks JavaScript dan integritas ZIP. Belum dilakukan pengujian browser end-to-end.
