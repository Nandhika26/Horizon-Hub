HORIZON HUB v69 — ACADEMIC DATA INTEGRATION

Perubahan utama:
1. Jadwal kelas mahasiswa dan jadwal admin sekarang membaca satu sumber data localStorage:
   horizonHubAdminSchedule.
2. Saat pertama kali dibuka setelah update, jadwal IF-KA Y1S1 yang sebelumnya sudah tertanam
   pada prototype dimigrasikan satu kali ke data jadwal admin. Admin tidak perlu mengetik ulang
   jadwal yang sudah tampil di akun mahasiswa.
3. Perubahan, penambahan, dan penghapusan jadwal admin akan tercermin pada akun mahasiswa
   sesuai kelas dan semester akun tersebut.
4. Direktori mahasiswa yang sebelumnya tertanam di HTML (ITSD, Finance, GSD, CSDL) dimigrasikan
   satu kali ke horizonHubLecturers, bersama nama dosen pengampu yang memang tercantum pada
   jadwal prototype. Data direktori tersebut kini dibaca bersama oleh halaman admin dan mahasiswa.
5. Menambahkan pembaruan lintas-tab melalui event storage untuk jadwal dan direktori.

PENTING:
- Ini tetap prototype frontend tanpa database/backend.
- localStorage hanya berbagi data pada origin/browser/perangkat yang sama. Jika admin membuka
  Netlify dari perangkat berbeda, datanya tidak otomatis tersinkronisasi. Sinkronisasi lintas
  perangkat memerlukan backend/database online pada tahap berikutnya.
- Data dosen dan jadwal merupakan data contoh/transkripsi yang sudah ada pada prototype, bukan
  klaim sebagai data akademik resmi yang diverifikasi universitas.
- Jika prototype sebelumnya sudah memiliki localStorage jadwal/direktori non-kosong, data tersebut
  dipertahankan. Migrasi awal hanya mengisi jika data lama belum tersedia/kosong.
- Untuk menguji migrasi awal yang sudah pernah dijalankan, gunakan browser profile bersih atau
  hapus key horizonHubAcademicSeedV69 dan horizonHubDirectorySeedV69 serta data demo terkait.
  Jangan hapus localStorage jika ada transaksi demo yang ingin dipertahankan.

Akun demo:
Mahasiswa: username mahasiswa / password mhs123
Admin: username admin / password admin123

File utama:
index.html
style.css
custom.css
script.js
assets/
