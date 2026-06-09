# Panduan Belajar Cloud & Deployment StockVantage WMS

Selamat belajar Cloud Computing! Berkas ini adalah panduan lengkap untuk memahami konsep arsitektur cloud, menguji aplikasi secara lokal, hingga meluncurkannya ke internet secara **12-Factor App (Cloud-Ready)** secara gratis.

---

## 1. Konsep Cloud & 12-Factor App
Aplikasi cloud modern didesain berbeda dengan aplikasi tradisional. Kita menggunakan prinsip **12-Factor App** yang membuat aplikasi kita bisa diskalakan (*scalable*) dan dipindahkan (*portable*) antar layanan cloud (AWS, Google Cloud, Azure, dll).

Dua konsep penting yang kita terapkan dalam aplikasi ini:
* **Stateless Backend**: Server Node.js kita tidak menyimpan data atau file gambar di harddisk server lokal. Mengapa? Karena di cloud, instans server bisa mati, hidup kembali, atau bertambah banyak secara dinamis. Semua data harus disimpan di database luar (MySQL).
* **Environment Variables (`.env`)**: Kredensial database (host, user, password) tidak boleh ditulis langsung di kode program (*hardcoding*). Nilai-nilai ini dibaca dari sistem operasi secara dinamis. Hal ini menjaga keamanan kode kita saat diunggah ke GitHub.

---

## 2. Cara Menjalankan Aplikasi di Komputer Lokal

### Langkah 1: Instalasi Node.js
1. Unduh dan instal **Node.js** (rekomendasi versi LTS) dari situs resmi: [nodejs.org](https://nodejs.org/).
2. Verifikasi instalasi dengan membuka Terminal/Command Prompt lalu ketik:
   ```bash
   node -v
   npm -v
   ```

### Langkah 2: Setup Database MySQL Lokal
1. Pastikan Anda sudah memiliki MySQL Server (misal lewat XAMPP, Laragon, atau instalasi mandiri MySQL).
2. Buka MySQL Client Anda (seperti phpMyAdmin, DBeaver, HeidiSQL, atau MySQL CLI).
3. Buat database baru bernama `stockvantage_db`:
   ```sql
   CREATE DATABASE stockvantage_db;
   ```
4. Impor seluruh isi berkas **[schema.sql](file:///d:/project website/schema.sql)** ke database tersebut untuk membuat tabel dan data uji coba awal.

### Langkah 3: Konfigurasi File `.env`
1. Di folder proyek ini, buat berkas baru bernama **`.env`** (salin isi dari [.env.example](file:///d:/project website/.env.example)).
2. Sesuaikan nilai password dan username dengan akun MySQL komputer Anda:
   ```env
   PORT=3000
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=isi_password_mysql_kamu
   DB_NAME=stockvantage_db
   ```

### Langkah 4: Jalankan Server Node.js
1. Buka terminal di folder proyek ini.
2. Instal semua dependensi yang didefinisikan di `package.json`:
   ```bash
   npm install
   ```
3. Jalankan aplikasi web:
   ```bash
   npm start
   ```
4. Buka browser Anda dan akses alamat: `http://localhost:3000`.

---

## 3. Cara Mendeploy Aplikasi ke Cloud Secara Gratis (100% Free)

Kita akan menggunakan **Aiven.io** untuk database MySQL cloud gratis permanen, dan **Render** untuk meng-host web server kita.

### Tahap A: Buat Database MySQL Cloud Gratis di Aiven.io
1. Buka [aiven.io](https://aiven.io/) dan daftarkan akun baru secara gratis.
2. Di Dashboard Aiven, klik **Create Service**.
3. Pilih database **MySQL**, lalu pilih paket **Free Tier** (Gratis).
4. Pilih lokasi server cloud terdekat (misalnya region Singapura atau Asia Tenggara lainnya).
5. Klik **Create Service** dan tunggu sekitar 3-5 menit hingga statusnya menjadi **Running**.
6. Setelah aktif, salin informasi koneksi database yang diberikan di panel kontrol Aiven:
   - **Host** (nama host panjang, misal `mysql-xxx.aivencloud.com`)
   - **Port** (biasanya berupa angka seperti `12345` atau `3306`)
   - **User** (biasanya `avnadmin`)
   - **Password** (karakter acak aman)
   - **Database Name** (biasanya `defaultdb`)
7. Gunakan aplikasi database client Anda untuk masuk menggunakan info koneksi tersebut, lalu impor berkas `schema.sql` Anda ke database cloud tersebut.

### Tahap B: Unggah Proyek ke GitHub
Layanan hosting cloud seperti Render akan membaca kode Anda langsung dari GitHub:
1. Buat akun di [github.com](https://github.com/) jika belum punya.
2. Buat repositori baru bernama `stockvantage-wms`.
3. Inisialisasi git pada folder lokal Anda, lakukan commit, lalu hubungkan dan dorong (*push*) ke GitHub.
   *(PENTING: Jangan ikut mengunggah file `.env` lokal Anda ke GitHub demi keamanan credential. File `.gitignore` harus mengecualikan berkas `.env`)*.

### Tahap C: Deploy Web Server ke Render
1. Buka [render.com](https://render.com/) dan masuk menggunakan akun GitHub Anda.
2. Di dashboard Render, klik **New** -> **Web Service**.
3. Hubungkan repositori GitHub `stockvantage-wms` yang telah Anda buat sebelumnya.
4. Konfigurasikan detail web service:
   - **Name**: `stockvantage-wms`
   - **Language**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Gulir ke bawah dan klik tombol **Advanced** -> pilih **Add Environment Variable**. Di sinilah kita menyuntikkan konfigurasi database cloud Aiven.io:
   - Tambahkan `DB_HOST` = (Host MySQL Aiven Anda)
   - Tambahkan `DB_PORT` = (Port MySQL Aiven Anda)
   - Tambahkan `DB_USER` = (User MySQL Aiven Anda)
   - Tambahkan `DB_PASSWORD` = (Password MySQL Aiven Anda)
   - Tambahkan `DB_NAME` = `defaultdb` (atau nama database Aiven Anda)
   - Tambahkan `PORT` = `10000` (atau biarkan Render menentukan portnya sendiri secara otomatis)
6. Klik **Create Web Service**.
7. Render akan melakukan proses build dan deploy secara otomatis. Setelah selesai, Render akan memberikan tautan publik gratis (misal: `https://stockvantage-wms.onrender.com`) yang bisa Anda bagikan dan akses dari mana saja!
