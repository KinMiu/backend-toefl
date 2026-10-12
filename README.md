# 🎓 TOEFL ITP ITB Practice App — Backend API

Backend RESTful API untuk platform latihan ujian **TOEFL ITP (Fokus Section 2: Structure & Written Expression)** yang dirancang khusus untuk persiapan masuk pascasarjana Institut Teknologi Bandung (ITB) dan beasiswa (target skor: ITP 570–580 / iBT 88+).

Dilengkapi dengan algoritma **Spaced Repetition System (SRS)**, mesin penilaian resmi skala ITP & iBT concordance, serta **AI Question Generator** berbasis Google Gemini dengan perlindungan mutlak terhadap *data poisoning*.

---

## 🚀 Fitur Utama

1. **Autentikasi & Otorisasi Berbasis Peran (RBAC)**:
   - Registrasi, Login, dan verifikasi sesi berbasis JSON Web Token (JWT) + `bcryptjs`.
   - Role: `student` (mahasiswa) & `admin` (administrator).
   - Fitur reset password darurat oleh Administrator.

2. **Mesin Penilaian Resmi (Official Scoring Engine)**:
   - Konversi *raw score* (0–40) ke scaled score Section 2 (31–68).
   - Estimasi total skor TOEFL ITP (310–677) dan konkordansi TOEFL iBT (0–120).
   - Tolok ukur kelulusan ITB (ITP 570–580 / iBT 88+).

3. **Spaced Repetition System (SRS)**:
   - Melacak performa setiap pengguna per butir soal (`UserQuestionProgress`).
   - Rumus grammar dan soal yang dijawab salah otomatis dijadwalkan ulang untuk dilatih kembali (*drill mistake mode*).
   - Status penguasaan bertahap: `learning`, `reviewing`, hingga `kept` (setelah streak 5x benar berturut-turut).

4. **AI Question Generator (Google Gemini SDK) + Guardrail Mutlak**:
   - Memproduksi paket soal baru secara instan menggunakan `@google/genai`.
   - **Guardrail Data Poisoning**: Hanya soal bersertifikasi manual (`source: "manual"` dan `is_reference: true`) yang diumpankan sebagai *few-shot examples* ke Gemini.
   - Soal hasil AI otomatis divalidasi skema Zod dan ditandai `source: "ai"`, `is_reference: false`.

5. **Manajemen Soal Massal (Bulk Excel Import & Export)**:
   - Impor puluhan soal sekaligus dari format `.xlsx` atau `.csv`.
   - Ekspor template resmi Excel siap pakai untuk dosen/kontributor.

6. **Auto-Seeder Otomatis**:
   - Saat database kosong, sistem otomatis menginisialisasi 24 soal referensi terverifikasi, akun admin, dan akun mahasiswa demo.

---

## 🛠️ Tech Stack & Dependencies

* **Runtime**: Node.js (v18+)
* **Framework**: Express.js
* **Database**: MongoDB (Mongoose ORM)
* **Validasi Skema**: Zod
* **Keamanan**: JWT (`jsonwebtoken`), `bcryptjs`, CORS
* **AI Engine**: `@google/genai` (Google Gemini SDK)
* **Pengolah Spreadsheet**: `xlsx` (SheetJS) & `multer`
* **Logging & Waktu**: `date-fns`

---

## 📦 Panduan Instalasi & Menjalankan

### 1. Prasyarat
* Node.js versi 18.0.0 atau lebih baru.
* Layanan MongoDB lokal aktif di `mongodb://127.0.0.1:27017` atau URI MongoDB Atlas.

### 2. Kloning & Pasang Dependensi
```bash
git clone https://github.com/KinMiu/backend-toefl.git
cd backend-toefl
npm install
```

### 3. Konfigurasi Environment Variables
Salin file `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```

Sesuaikan isi `.env`:
```env
PORT=5000
NODE_ENV=development

# Database MongoDB
MONGO_URI=mongodb://127.0.0.1:27017/toefl_itb

# JWT Secret
JWT_SECRET=rahasia_jwt_super_aman_minimal_32_karakter_2026

# Google Gemini API Key (Opsional untuk AI Generator)
# Dapatkan gratis di: https://aistudio.google.com/app/apikey
GEMINI_API_KEY=AIzaSyDxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 4. Jalankan Server
```bash
# Menjalankan server backend
npm start
```

Server akan aktif di: `http://localhost:5000`

---

## 🔑 Akun Bawaan (Default Seeded Accounts)

Jika database masih baru, akun berikut otomatis dibuat:

| Peran | Email | Password | Kegunaan |
|---|---|---|---|
| **Administrator** | `admin@toefl.itb.ac.id` | `admin123` | Akses panel admin, import Excel, AI generator, reset password |
| **Mahasiswa** | `student@itb.ac.id` | `student123` | Latihan soal, tracking SRS, review pembahasan |

---

## 📡 Dokumentasi Endpoint REST API

### 1. Autentikasi (`/api/auth`)
| Method | Endpoint | Akses | Deskripsi |
|---|---|---|---|
| `POST` | `/api/auth/register` | Publik | Registrasi akun baru mahasiswa |
| `POST` | `/api/auth/login` | Publik | Login & memperoleh token JWT |
| `GET` | `/api/auth/me` | Auth | Mengambil profil pengguna yang sedang login |
| `POST` | `/api/auth/forgot-password-request` | Publik | Mengirim permintaan reset password ke admin |

### 2. Sesi Latihan (`/api/practice`)
| Method | Endpoint | Akses | Deskripsi |
|---|---|---|---|
| `POST` | `/api/practice/start` | Auth | Memulai sesi latihan (pilih paket 5, 10, 20, 40 soal & mode timer) |
| `POST` | `/api/practice/submit` | Auth | Mengirim jawaban sesi, hitung skor resmi, perbarui SRS |
| `POST` | `/api/practice/retry-wrong` | Auth | Membuat sesi latihan khusus mengulang soal-soal yang salah |
| `GET` | `/api/practice/stats` | Auth | Mengambil ringkasan statistik SRS & performa belajar pengguna |

### 3. Bank Soal (`/api/questions`)
| Method | Endpoint | Akses | Deskripsi |
|---|---|---|---|
| `GET` | `/api/questions` | Auth | Mengambil daftar bank soal dengan filter & pagination |
| `GET` | `/api/questions/template-excel` | Auth | Mengunduh berkas template `.xlsx` untuk impor soal |
| `POST` | `/api/questions` | Admin | Menambah 1 butir soal manual baru |
| `DELETE` | `/api/questions/:id` | Admin | Menghapus soal dari bank soal |
| `POST` | `/api/questions/import-excel` | Admin | Unggah & impor massal soal via file Excel (`multipart/form-data`) |

### 4. Administrator Panel (`/api/admin`)
| Method | Endpoint | Akses | Deskripsi |
|---|---|---|---|
| `GET` | `/api/admin/users` | Admin | Mengambil daftar seluruh pengguna dan status reset password |
| `POST` | `/api/admin/reset-password` | Admin | Mereset password akun pengguna |

### 5. Health Check
* `GET /api/health` — Memeriksa status kesehatan server backend.

---

## 🛡️ Aturan Part B (Written Expression)
Pada format soal Part B (*Error Identification*), empat opsi kata digarisbawahi ditulis menggunakan format tanda kurung siku:
```
Mount Krakatoa produced one of the [most loud](A) volcanic explosions [recorded](B) in [modern](C) human [history](D).
```
Sistem frontend secara otomatis mem-parsing format ini menjadi teks garis bawah interaktif dengan label pilihan `(A)`, `(B)`, `(C)`, dan `(D)`.

---

## 📄 Lisensi
ISC License. Dikembangkan untuk persiapan TOEFL ITP resmi pascasarjana ITB.
