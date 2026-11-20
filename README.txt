HORIZON HUB - PROTOTIPE ALL IN ONE
=================================

ISI FOLDER
- index.html : struktur halaman
- style.css  : seluruh desain / tampilan
- script.js  : fungsi login, navigasi, jadwal, lokasi, peminjaman, planner, admin
- assets/    : logo dan gambar

CARA MEMBUKA DI KODO EDITOR
1. Ekstrak file ZIP.
2. Buka folder Horizon_Hub_PersonalSchedule.
3. Buka index.html.
4. Pilih Preview.
5. Jangan pisahkan file dari folder assets.

AKUN DEMO
Mahasiswa : mahasiswa / mhs123
Admin     : admin / admin123

ATURAN KODE RUANG
West Building: 3 lantai.
- Format lantai 1-3: W101, W201, W301 (dua angka terakhir nomor ruang).
East Building: 10 lantai.
- Format lantai 1-9: E101, E201, ..., E901.
- Format lantai 10: E1001, E1002, dan seterusnya.

FITUR DEMO
- Login mahasiswa dan admin.
- Navigasi dashboard.
- Jadwal kuliah vertikal ke bawah (tidak perlu scroll horizontal).
- Pencarian lantai dan nomor ruang untuk West/East Building.
- Pilihan kategori peminjaman: kelas, lab, aula, ruang rapat, fasilitas lain.
- Pengajuan peminjaman dan status menunggu/disetujui/ditolak.
- Pemeriksaan bentrok waktu pada ruangan yang sama.
- Student Planner.
- Direktori dosen/staff dan pengumuman contoh.

CATATAN PENTING
Ini prototipe frontend. Data demo disimpan di LocalStorage browser/perangkat yang sama.
Admin dan mahasiswa dapat menguji alur pada browser yang sama dengan logout lalu login memakai akun lain.
Data tidak otomatis tersinkron antar HP/laptop atau antar pengguna. Untuk penggunaan kampus sungguhan perlu backend dan database (misalnya PHP + MySQL), autentikasi aman, serta data ruangan/kontak resmi.
Nama kontak, jadwal, kapasitas, fasilitas, dan status ruangan yang terlihat adalah data contoh yang perlu diverifikasi/diganti.

Update: Ikon antarmuka menggunakan SVG line icons agar bentuk ikon konsisten dan sesuai fungsi.


UPDATE POLISH
- Header dirapikan dengan tombol profil dan hamburger menu pada layar kecil.
- Navigasi desktop memakai sidebar; navigasi mobile memakai side drawer.
- Kartu Today's Class dan jadwal mingguan dapat ditekan untuk membuka detail kelas.
- Detail kelas tampil sebagai modal desktop dan bottom sheet pada iPhone.
- Status kelas dihitung dari waktu perangkat saat detail dibuka.
- Data dosen, sesi, pertemuan, dan link online masih berupa contoh/placeholder.

UPDATE NAVIGASI
- Navigasi HP menggunakan hamburger dengan panel dari sisi kiri.
- Panel dapat ditutup melalui tombol X, mengetuk area gelap, memilih menu, atau tombol Escape.
- Navigasi utama hanya berada di drawer/sidebar.
- Kartu shortcut menu di Beranda dihilangkan agar tidak duplikat.
- Beranda difokuskan untuk pengumuman dan ringkasan aktivitas.


UPDATE V13:
- Menu dan halaman lokasi menggunakan satu fitur Denah Gedung Interaktif.
- Kartu direktori lama dan daftar ruangan duplikat disembunyikan.
- West Building lantai 1-3 sekarang memiliki marker interaktif langsung pada gambar denah.
- East Building tetap menggunakan marker interaktif yang sudah diperbaiki pada versi sebelumnya.
- Klik marker untuk membuka detail lokasi dan, jika ruangan dapat dipinjam, tombol Pinjam Ruangan.
