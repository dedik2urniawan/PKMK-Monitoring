```markdown
# INSTRUCTION SPECIFICATION: MODUL ANALISIS SDIDTK TERINTEGRASI (0–60 BULAN)
## Platform: SIGMA PKMK (System Longitudinal Assessment & Growth Tracking)
**Target Environment:** Antigravity IDE / Fullstack Web Framework (Next.js / FastAPI / PostgreSQL / Python Pandas)[cite: 2]
**Clinical Standard:** Buku Bagan SDIDTK Kementerian Kesehatan RI (Revisi 2022) & IDAI[cite: 2]
**Version:** 3.0-SDIDTK-ANTIGRAVITY-FULL[cite: 2]

---

## 1. ARSITEKTUR KOMPUTASI UMUR & KOREKSI PREMATURITAS

### A. Algoritma Perhitungan Umur Presisi (Date Subtraction Engine)
Sistem menghitung umur kronologis dengan metode penanggalan penuh (*borrowing method*)[cite: 2]:
* **Tahun, Bulan, Hari:** $\text{Tanggal Pemeriksaan} - \text{Tanggal Lahir}$ (Jika hari kurang, pinjam 30 hari dari bulan; jika bulan kurang, pinjam 12 bulan dari tahun)[cite: 2].
* **Bulan Penuh (*Completed Months*):** Berlaku setelah umur 3 bulan (misal: 6 bulan 12 hari dibulatkan menjadi 6 bulan)[cite: 2].

### B. Koreksi Prematuritas (Hingga Usia Kronologis 24 Bulan)
* **Kriteria Trigger:** Berlaku jika **Usia Kronologis < 2 Tahun** DAN **Usia Kehamilan < 37 Minggu** (atau lahir $\ge 2$ minggu sebelum HPL / $<38$ minggu)[cite: 2].
* **Formula Perhitungan:**
  $$\text{Koreksi Prematuritas (Minggu)} = 40\text{ Minggu} - \text{Usia Gestasi saat Lahir (Minggu)}$$
[cite: 2]
  $$\text{Defisit Hari} = \text{Koreksi Prematuritas (Minggu)} \times 7$$
[cite: 2]
  $$\text{Umur Terkoreksi (Hari)} = \text{Umur Kronologis (Hari)} - \text{Defisit Hari}$$
[cite: 2]
  $$\text{Umur Koreksi (Bulan)} = \left\lfloor \frac{\text{Umur Terkoreksi (Hari)}}{30.4375} \right\rfloor$$
[cite: 2]

### C. Logika Pemilihan Jadwal KPSP
* Jika sisa hari pada perhitungan umur $\ge 16\text{ hari}$, bulatkan ke atas menjadi $+1\text{ bulan}$[cite: 2].
* **Titik Usia Baku KPSP:** `3, 6, 9, 12, 15, 18, 21, 24, 30, 36, 42, 48, 54, 60 Bulan`[cite: 2].
* Jika umur anak tidak persis pada titik baku, sistem otomatis memilih paket KPSP untuk **kelompok umur yang lebih muda** terdekat[cite: 2].

---

## 2. MATRIKS ASESMEN & FORM KUESIONER KPSP LENGKAP (0–60 BULAN)

### Sektor Perkembangan KPSP:
* `GK` : Gerak Kasar[cite: 2]
* `GH` : Gerak Halus[cite: 2]
* `BB` : Bicara dan Bahasa[cite: 2]
* `SK` : Sosialisasi dan Kemandirian[cite: 2]

---

### KPSP 3 BULAN
1. `[GK]` Pada posisi telungkup, apakah bayi dapat mengangkat kepala setinggi $45^\circ$?
2. `[GK]` Pada posisi telungkup, apakah bayi dapat mengangkat kepala hingga $90^\circ$?
3. `[GK]` Pada posisi telentang, apakah bayi dapat mempertahankan posisi kepala di tengah saat digerakkan?
4. `[GH]` Apakah bayi dapat membalas senyuman pemeriksa/ibu saat diajak bicara/tersenyum?
5. `[GH]` Apakah bayi dapat mengamati tangannya sendiri?
6. `[GH]` Apakah bayi dapat memegang mainan kerincingan (*rattle*) yang diletakkan di telapak tangannya selama beberapa detik?
7. `[BB]` Apakah bayi mengeluarkan suara-suara lain selain menangis (mengoceh/berdeguk /*cooing*)?
8. `[BB]` Apakah bayi menolehkan kepala atau mengarahkan pandangan ke sumber suara/bel?
9. `[SK]` Apakah bayi menatap mata ibu/pemeriksa dengan penuh perhatian?
10. `[SK]` Apakah bayi dapat tertawa spontan atau memekik gembira saat diajak bercanda?
* **Red Flags (Umur 3–5 Bulan):** Bayi tidak merespons suara keras, tidak menatap mata pemeriksa, kepala terkulai lemas (*head lag* persisten), tangan tetap mengepal erat terus-menerus[cite: 2].

---

### KPSP 6 BULAN
1. `[GK]` Apakah bayi dapat membalikkan badan sendiri dari telentang ke telungkup atau sebaliknya?
2. `[GK]` Pada posisi telungkup, apakah bayi dapat menopang dada dengan kedua tangannya bertumpu pada matras?
3. `[GK]` Apakah bayi dapat duduk tegak tanpa ditopang selama beberapa detik saat didudukkan?
4. `[GH]` Apakah bayi dapat meraih mainan/benda yang diletakkan di depannya?
5. `[GH]` Apakah bayi dapat memindahkan mainan/benda dari satu tangan ke tangan lainnya?
6. `[GH]` Apakah bayi berusaha memungut remah-remah biskuit/benda kecil dengan telapak tangannya?
7. `[BB]` Apakah bayi dapat mengeluarkan suara seperti *"ba-ba"*, *"da-da"*, atau *"ma-ma"* (konsonan ganda / *babbling*)?
8. `[BB]` Apakah bayi menoleh langsung ke arah datangnya suara bisikan atau panggilan namanya?
9. `[SK]` Apakah bayi tersenyum saat melihat bayangannya di cermin?
10. `[SK]` Apakah bayi menunjukkan rasa takut/cemas terhadap orang asing yang belum dikenal?
* **Red Flags (Umur 6–8 Bulan):** Tidak berusaha meraih benda, tubuh kaku atau sangat lemas, tidak mengeluarkan suara konsonan, tidak ada respons saat diajak interaksi[cite: 2].

---

### KPSP 9 BULAN
1. `[GK]` Apakah anak dapat bangkit sendiri ke posisi duduk dari posisi telungkup atau telentang?
2. `[GK]` Apakah anak dapat berdiri dengan berpegangan pada perabot/kursi (*cruising*)?
3. `[GK]` Apakah anak dapat merangkak atau merayap ke depan secara aktif?
4. `[GH]` Apakah anak dapat menjepit benda kecil (remah makanan) menggunakan ibu jari dan jari telunjuk (*inferior pincer grasp*)?
5. `[GH]` Apakah anak dapat memukulkan dua mainan/kubus yang dipegang di kedua tangan satu sama lain?
6. `[GH]` Apakah anak berusaha mencari benda yang sengaja disembunyikan di bawah kain di depannya?
7. `[BB]` Apakah anak mengulang suku kata ganda bermakna saat berinteraksi (*"pa-pa"*, *"ma-ma"*)?
8. `[BB]` Apakah anak merespons saat dipanggil namanya dari sisi samping atau belakang?
9. `[SK]` Apakah anak dapat bermain *cilukba* (*peek-a-boo*) dengan ekspresi antusias?
10. `[SK]` Apakah anak dapat melambaikan tangan saat ditinggal pergi (*da-dah*)?
* **Red Flags (Umur 9–11 Bulan):** Tidak bisa duduk stabil tanpa bantuan, tidak menumpu beban pada kedua kaki saat diberdirikan, tidak mengoceh suku kata ganda, kontak mata sangat minim[cite: 2].

---

### KPSP 12 BULAN
1. `[GK]` Apakah anak dapat berdiri sendiri tanpa berpegangan selama minimal 30 detik?
2. `[GK]` Apakah anak dapat berjalan beberapa langkah tanpa bantuan/berpegangan?
3. `[GK]` Dari posisi berdiri, apakah anak dapat membungkuk mengambil mainan di lantai lalu berdiri kembali tanpa jatuh?
4. `[GH]` Apakah anak dapat memasukkan balok/mainan ke dalam wadah dan mengeluarkannya kembali?
5. `[GH]` Apakah anak dapat menjepit benda sangat kecil menggunakan ujung ibu jari dan telunjuk (*fine pincer grasp*)?
6. `[GH]` Apakah anak dapat membolak-balik halaman buku tebal (board book)?
7. `[BB]` Apakah anak dapat menyebut minimal 1 kata bermakna selain *mama* dan *papa* (misal: *"cucu"*, *"bola"*)?
8. `[BB]` Apakah anak memahami instruksi sederhana (seperti *"berikan pada mama"*) tanpa bantuan isyarat?
9. `[SK]` Apakah anak dapat memperlihatkan apa yang diinginkannya dengan menunjuk menggunakan jari telunjuk?
10. `[SK]` Apakah anak dapat minum dari cangkir dengan kedua tangannya sendiri?
* **Red Flags (Umur 12–17 Bulan):** Belum bisa berdiri berpegangan, tidak menunjukkan gerakan menunjuk objek (*pointing*), tidak ada kata bermakna, kehilangan kemampuan bicara/sosial yang telah dicapai[cite: 2].

---

### KPSP 15 BULAN
1. `[GK]` Apakah anak dapat berjalan mundur beberapa langkah tanpa terjatuh?
2. `[GK]` Apakah anak dapat berjalan lancar tanpa terhuyung-huyung?
3. `[GK]` Apakah anak dapat menaiki tangga dengan merangkak atau dipapah?
4. `[GH]` Apakah anak dapat menyusun 2 tumpukan kubus ke atas tanpa jatuh?
5. `[GH]` Apakah anak dapat mencoret-coret kertas menggunakan krayon/pensil secara spontan?
6. `[GH]` Apakah anak dapat memasukkan kelereng/biji-bijian ke dalam lubang botol kecil?
7. `[BB]` Apakah anak dapat mengucapkan minimal 3–5 kata yang memiliki arti jelas?
8. `[BB]` Apakah anak dapat menunjuk 1 gambar benda yang disebutkan pemeriksa?
9. `[SK]` Apakah anak dapat membantu memegang sendok dan memasukkan makanan ke dalam mulutnya?
10. `[SK]` Apakah anak dapat memeluk orang tua atau boneka kesayangannya saat bermain?

---

### KPSP 18 BULAN
1. `[GH]` Berikan pensil & kertas: Apakah anak dapat mencoret-coret kertas tanpa bantuan atau petunjuk?[cite: 2]
2. `[GH]` Apakah anak dapat menyusun menara dari 3 buah kubus?
3. `[GK]` Apakah anak dapat menaiki tangga dengan berpegangan pada dinding/drel tangga?
4. `[GK]` Letakkan bola di lantai: Apakah anak dapat menendang bola ke depan tanpa berpegangan?
5. `[BB]` Tanyakan orang tua: Apakah anak dapat menyebutkan sedikitnya 3 kata yang bermakna?[cite: 2]
6. `[BB]` Dapatkah anak menunjuk minimal 1 bagian tubuhnya saat ditanya ("Mana hidungmu?")?
7. `[SK]` Tanyakan orang tua: Apakah anak dapat menunjukkan apa yang diinginkannya tanpa menangis atau merengek?[cite: 2]
8. `[SK]` Apakah anak dapat meniru aktivitas rumah tangga sederhana (seperti menyapu, mengelap)?
9. `[SK]` Apakah anak dapat melepas kaos kakinya sendiri?
10. `[GH]` Apakah anak dapat memutar tutup botol kecil atau membalik buku berhalaman tipis?
* **Red Flags (Umur 18–23 Bulan):** Tidak bisa berjalan sendiri, tidak mengucapkan sedikitnya 6 kata, tidak menoleh saat dipanggil namanya, tidak tertarik bermain interaktif dengan orang lain[cite: 2].

---

### KPSP 21 BULAN
1. `[GK]` Apakah anak dapat menaiki tangga dengan menaruh satu kaki pada tiap anak tangga secara mandiri?
2. `[GK]` Apakah anak dapat berlari pelan tanpa mudah tersandung?
3. `[GK]` Apakah anak dapat menendang bola besar ke arah depan dengan ayunan kaki mantap?
4. `[GH]` Apakah anak dapat menyusun menara dari minimal 4 kubus?
5. `[GH]` Apakah anak dapat meniru membuat garis lurus ke bawah di atas kertas?
6. `[BB]` Apakah anak dapat menggabungkan 2 kata (subjek-predikat/objek) seperti *"mau minum"*, *"naik mobil"*?
7. `[BB]` Apakah anak dapat menunjuk $\ge 3$ bagian tubuhnya secara benar tanpa dibantu?
8. `[BB]` Apakah anak memahami sedikitnya 10 kata perintah harian sederhana?
9. `[SK]` Apakah anak dapat makan sendiri menggunakan sendok tanpa banyak makanan tumpah?
10. `[SK]` Apakah anak mengajak orang lain melihat hal menarik dengan menunjuk dan menatap wajah orang tersebut (*shared attention*)?

---

### KPSP 24 BULAN
1. `[GH]` Berikan pensil & kertas: Apakah anak dapat mencoret-coret kertas tanpa bantuan/petunjuk?[cite: 2]
2. `[GH]` Minta anak menyusun kubus: Apakah anak dapat menyusun minimal 4 kubus ke atas?[cite: 2]
3. `[GH]` Apakah anak dapat membuka bungkus permen/biskuit kecil secara mandiri?
4. `[GK]` Apakah anak dapat berjalan naik tangga sendiri tanpa berpegangan (satu persatu anak tangga)?[cite: 2]
5. `[GK]` Apakah anak dapat berlari stabil tanpa terjatuh?[cite: 2]
6. `[GK]` Apakah anak dapat melompat ke atas dengan kedua kaki terangkat dari lantai?
7. `[BB]` Tanpa bantuan, dapatkah anak menunjuk paling sedikit 2 bagian tubuhnya dengan benar (rambut, mata, hidung, mulut)?[cite: 2]
8. `[BB]` Apakah anak mampu merangkai 2 kata menjadi kalimat sederhana (*"Mama jalan"*, *"Mau susu"*)[cite: 2]?
9. `[SK]` Apakah anak dapat melepas pakaiannya sendiri (baju terbuka, celana pendek)?[cite: 2]
10. `[SK]` Apakah anak dapat mencuci dan mengeringkan kedua tangannya sendiri setelah makan?
* **Red Flags (Umur 24 Bulan):** Tidak dapat berjalan dengan stabil, tidak dapat mengatakan kalimat yang terdiri dari 2 kata, tidak mampu mengikuti perintah sederhana, tidak dapat meniru tindakan/perkataan orang lain, kontak mata minimal[cite: 2].

---

### KPSP 30 BULAN
1. `[GK]` Apakah anak dapat melompat ke depan dengan kedua kaki secara bersamaan sejauh $\ge 15\text{ cm}$?
2. `[GK]` Apakah anak dapat berdiri dengan 1 kaki selama minimal 1–2 detik tanpa ditopang?
3. `[GK]` Apakah anak dapat mengayuh sepeda roda tiga sejauh beberapa meter?
4. `[GH]` Apakah anak dapat menyusun menara dari 6 buah kubus?
5. `[GH]` Apakah anak dapat meniru membuat garis horizontal (mendatar) di kertas?
6. `[BB]` Apakah anak dapat menyebutkan nama depannya sendiri saat ditanya?
7. `[BB]` Apakah anak dapat menyebutkan nama minimal 2 benda dari gambar yang ditunjukkan pemeriksa?
8. `[BB]` Apakah anak mulai bertanya dengan kata tanya *"Apa ini?"*, *"Mana?"*?
9. `[SK]` Apakah anak dapat memakai sepatu sendiri tanpa tali?
10. `[SK]` Apakah anak sudah mulai memberitahu saat ingin buang air kecil/besar (*toilet training awareness*)?

---

### KPSP 36 BULAN
1. `[GH]` Beri kubus di depan anak: Dapatkah anak menyusun 6 buah kubus satu persatu di atas kubus lain tanpa menjatuhkannya?[cite: 2]
2. `[GH]` Buat garis lurus sepanjang 2.5 cm di samping: Minta anak menggambar garis lain di sampingnya (Nilai 'Ya' jika garis lurus; 'Tidak' jika bergelombang/lingkaran)[cite: 2].
3. `[GH]` Apakah anak dapat memegang pensil dengan posisi jempol dan jari telunjuk (bukan digenggam penuh)?
4. `[GK]` Apakah anak dapat melompati lebar kertas atau rintangan rendah dengan kedua kaki bersamaan?
5. `[GK]` Apakah anak dapat berdiri di atas 1 kaki tanpa berpegangan selama minimal 3 detik?
6. `[BB]` Tunjukkan gambar binatang (kucing, burung, kuda, anjing, orang): Tanpa bantuan, dapatkah anak menyebut 4 gambar dengan benar (suara binatang tidak dinilai)?[cite: 2]
7. `[BB]` Apakah anak dapat menyebutkan nama lengkap dirinya sendiri?[cite: 2]
8. `[BB]` Apakah anak dapat memahami 2 kata sifat berlawanan (*"gajah besar, tikus..."*, *"es dingin, api..."*)?
9. `[SK]` Apakah anak dapat mengenakan celana panjang/kaos sendiri dengan benar?
10. `[SK]` Apakah anak dapat bermain peran sederhana bersama teman sebaya (misal: bermain masak-masakan, menyuapi boneka)?
* **Red Flags (Umur 24–35 Bulan):** Belum bisa bicara kalimat 3 kata, tidak mengerti konsep kepemilikan/nama sendiri, sering tersandung dan jatuh saat jalan biasa, sulit memegang benda kecil[cite: 2].

---

### KPSP 42 BULAN
1. `[GH]` Buat garis lurus vertikal: Minta anak menggambar garis lain di samping garis tersebut (Evaluasi kelurusan garis)[cite: 2].
2. `[GH]` Beri 8 kubus: Dapatkah anak menyusun 8 buah kubus bertingkat satu persatu tanpa jatuh?[cite: 2]
3. `[GH]` Dapatkah anak meniru melipat selembar kertas menjadi dua bagian rapi?
4. `[GK]` Apakah anak dapat berdiri di atas 1 kaki selama minimal 3 detik tanpa berpegangan?
5. `[GK]` Apakah anak dapat melompat dengan 1 kaki (engklek) minimal 1 kali?
6. `[BB]` Tunjukkan gambar: Tanyakan *"Mana yang dapat terbang?"*, *"Mana yang dapat mengeong?"*, *"Mana yang dapat meringkik?"*. Apakah anak dapat menunjuk $\ge 2$ kegiatan yang sesuai?[cite: 2]
7. `[BB]` Tanyakan pertanyaan: *"Apa yang kamu lakukan bila kedinginan?"* (pakai jaket), *"Bila kelelahan?"* (tidur/istirahat), *"Bila merasa lapar?"* (makan). Apakah anak dapat menjawab 3 pertanyaan dengan benar tanpa isyarat?[cite: 2]
8. `[BB]` Apakah anak dapat menyebutkan jenis kelamin dirinya (laki-laki / perempuan)?
9. `[SK]` Apakah anak dapat mencuci tangan dan mengeringkannya tanpa membuat baju basah kuyup?
10. `[SK]` Apakah anak dapat mengenakan baju/kaos sendiri tanpa dibantu orang tua?

---

### KPSP 48 BULAN
1. `[GH]` Berikan contoh membuat jembatan dari 3 kubus (2 balok dasar diberi jarak, 1 balok di atasnya): Dapatkah anak menirunya?[cite: 2]
2. `[GH]` Perlihatkan gambar lingkaran: Mintalah anak meniru menggambar lingkaran di kertas (Evaluasi: garis kurva tertutup utuh)[cite: 2].
3. `[GH]` Apakah anak dapat memotong kertas menjadi 2 bagian menggunakan gunting anak secara aman?
4. `[GK]` Apakah anak dapat berdiri di atas satu kaki selama $\ge 4$ detik tanpa goyang/berpegangan?
5. `[GK]` Apakah anak dapat melompat maju sejauh $\ge 30\text{ cm}$ dengan kedua kaki bertumpu serentak?
6. `[BB]` Konsep angka: Letakkan 5 kubus di meja, katakan *"Berikan pada saya satu kubus"*. Dapatkah anak mengambil tepat 1 kubus?
7. `[BB]` Dapatkah anak menyebutkan sedikitnya 4 warna dasar (Merah, Kuning, Hijau, Biru) dengan benar?[cite: 2]
8. `[BB]` Apakah ucapan anak sudah dapat dipahami sepenuhnya oleh orang lain/orang asing di luar keluarga?
9. `[SK]` Apakah anak dapat mengancingkan kancing bajunya sendiri (minimal 1 kancing besar)?
10. `[SK]` Apakah anak dapat mengikuti aturan sederhana dalam permainan kelompok bersama teman sebaya (ular naga, petak umpet)[cite: 2]?
* **Red Flags (Umur 48 Bulan):** Tidak dapat melompat di tempat, mengalami kesulitan menggambar orang/bentuk dasar, bicara tidak jelas / tidak mampu menjawab pertanyaan sederhana, tidak menghiraukan anak lain / tidak merespons orang selain keluarga, tidak menunjukkan ketertarikan pada permainan interaktif atau bermain pura-pura (*pretend play*)[cite: 2].

---

### KPSP 54 BULAN
1. `[GH]` Gambar 2 garis sejajar vertikal beda panjang: Tanyakan *"Mana garis yang lebih panjang?"*. Putar lembar dan ulangi pertanyaan: Apakah anak dapat menunjuk garis yang lebih panjang sebanyak 3 kali berturut-turut dengan benar?[cite: 2]
2. `[GH]` Berikan kertas dan pensil: Dapatkah anak menggambar tanda silang / tanda tambah (+) meniru contoh?
3. `[GH]` Dapatkah anak memasang tali sepatu atau memasukkan benang ke lubang manik-manik besar?
4. `[GK]` Dapatkah anak berdiri di atas 1 kaki selama minimal 6 detik tanpa berpegangan atau menurunkan kaki?
5. `[GK]` Apakah anak dapat melompat-lompat dengan satu kaki (engklek) sejauh $\ge 2\text{ meter}$?
6. `[BB]` Tanyakan fungsi benda: *"Gelas gunanya untuk apa?"*, *"Sendok untuk apa?"*, *"Pensil untuk apa?"*. Apakah anak dapat menjawab minimal 3 fungsi benda dengan tepat?
7. `[BB]` Mengetahui lawan kata: *"Kuda besar, tikus..."*, *"Matahari terbit siang hari, bulan terbit..."*. Apakah anak menjawab $\ge 2$ antonim dengan benar?
8. `[SK]` Apakah anak dapat memakai sepatu lengkap dengan memasang velcro/menyesuaikan sendiri?
9. `[SK]` Apakah anak dapat membersihkan giginya sendiri menggunakan sikat gigi dengan benar?
10. `[SK]` Apakah anak dapat menceritakan peristiwa yang dialaminya hari ini secara runtut dan masuk akal?

---

### KPSP 60 BULAN
1. `[GH]` Perlihatkan gambar 2 garis beda panjang: Apakah anak dapat menunjuk garis yang lebih panjang sebanyak 3 kali berturut-turut dengan benar?[cite: 2]
2. `[GH]` Minta anak membuat gambar orang: Hitunglah bagian tubuh yang tergambar (mata, hidung, mulut, kepala, badan, tangan, kaki). Apakah anak dapat menggambar orang dengan sedikitnya 3 bagian tubuh terpisah?[cite: 2]
3. `[GH]` Tunjukkan kartu 4 warna (Merah, Kuning, Hijau, Biru): Dapatkah anak menyebutkan ke-4 warna tersebut dengan benar?[cite: 2]
4. `[GK]` Apakah anak dapat berdiri di atas 1 kaki selama minimal 6 detik (dari 2 kali kesempatan)?[cite: 2]
5. `[GK]` Apakah anak dapat melompat dengan 1 kaki berturut-turut $\ge 3$ kali tanpa jatuh?
6. `[GK]` Apakah anak dapat menangkap bola kecil seukuran bola tenis yang dilempar dari jarak 1.5 meter menggunakan kedua tangan?
7. `[BB]` Tanyakan: *"Apa yang kamu lakukan bila kamu kedinginan / kelelahan / lapar / haus?"*. Dapatkah anak menjawab 3 pertanyaan terkait kata sifat tersebut dengan benar tanpa isyarat?[cite: 2]
8. `[BB]` Mengenal kata depan: Minta anak menaruh kubus di *atas meja*, di *bawah kursi*, di *depan anak*, di *belakang anak*. Dapatkah melakukan 3 perintah dengan benar?
9. `[SK]` Apakah anak dapat berpakaian sendiri secara mandiri dari awal hingga selesai tanpa bantuan?
10. `[SK]` Apakah anak bereaksi tenang saat berpisah dengan orang tua di lingkungan aman (misal: di sekolah PAUD/Posyandu)?
* **Red Flags (Umur 48–59 Bulan & 60 Bulan):** Tidak mampu menggambar bentuk sederhana, interaksi sosial sangat tertutup/agresif tak terkendali, tidak mampu mandiri memakai celana/baju dasar, bicara gagap parah atau kata-kata tidak bermakna[cite: 2].

---

## 3. INSTRUMEN SKRINING SPESIFIK & PERILAKU EMOSIONAL

### A. Tes Daya Dengar (TDD) Berdasarkan Kelompok Usia
* **TDD Umur 0–3 Bulan:** Apakah bayi terkejut/berkedip saat ada tepukan keras mendadak? Apakah bayi tenang saat mendengar suara ibu[cite: 2]?
* **TDD Umur 3–6 Bulan:** Apakah bayi menolehkan bola mata atau kepalanya ke arah suara kerincingan yang dibunyikan di luar jangkauan pandangnya[cite: 2]?
* **TDD Umur 6–12 Bulan:** Apakah bayi langsung memalingkan kepala ke arah sumber suara lembut/panggilan namanya dari samping/bawah[cite: 2]?
* **TDD Umur 12–24 Bulan:** Apakah anak dapat menunjuk mainan/gambar yang disebutkan namanya tanpa melihat isyarat bibir penguji[cite: 2]?
* **TDD Umur 24–36 Bulan:** Apakah anak mampu melakukan 2 perintah berturutan (*"ambil bola lalu taruh di keranjang"*) secara tepat[cite: 2]?
* **TDD Umur >36 Bulan:**
  1. *Kemampuan Ekspresif:* Apakah anak dapat menyebutkan nama benda dan kegunaannya (cangkir untuk minum, bola untuk dilempar)? Apakah $>75\%$ perkataan anak dimengerti orang luar[cite: 2]?
  2. *Kemampuan Reseptif:* Apakah anak dapat menunjukkan $\ge 2$ nama benda di depannya sesuai fungsinya[cite: 2]?
* **Skoring TDD:** Total jawaban "Tidak" $\ge 1 \rightarrow$ `SUSPEK_GANGGUAN_DENGAR` (Rujuk Faskes Rujukan / THT)[cite: 2].

---

### B. Skrining Kelainan Penglihatan
1. **Pemeriksaan Pupil Putih (Leukokoria):** Dilakukan pada bayi dan anak dengan senter/oftalmoskop di ruang redup jarak 50 cm. Refleks merah asimetris/pupil tampak keputihan $\rightarrow$ `EMERGENCY_RUJUKAN` (Suspek Katarak Kongenital / Retinoblastoma)[cite: 2].
2. **Tes Daya Lihat (TDL - Kartu E Tumbling) (Usia 36–60 Bulan):**
   * Pemeriksaan jarak 3 meter setinggi mata anak[cite: 2].
   * Anak memegang kartu E dan mencocokkan arah kaki E yang ditunjuk pemeriksa[cite: 2].
   * Hasil: Menjawab benar $\ge 4$ dari 5 kesempatan = `DAYA_LIHAT_BAIK`; $<4$ kali benar = `DAYA_LIHAT_KURANG` (Rujuk Poli Mata)[cite: 2].

---

### C. M-CHAT-R (Modified Checklist for Autism in Toddlers, Revised) (Usia 16–30 Bulan)
Instruksi: Jawab 'Ya' atau 'Tidak' sesuai perilaku kebiasaan anak sehari-hari[cite: 2].

| No | Butir Pertanyaan M-CHAT-R | Nilai Risiko (Poin = 1) |
| :---: | :--- | :---: |
| 1 | Jika Anda menunjuk sesuatu di ruangan, apakah anak Anda melihatnya? | **TIDAK** |
| 2 | Pernahkah Anda berpikir bahwa anak Anda mungkin tuli / sulit mendengar? | **YA**[cite: 2] |
| 3 | Apakah anak Anda suka bermain pura-pura? (Misal: pura-pura minum dari cangkir kosong) | **TIDAK** |
| 4 | Apakah anak Anda suka memanjat benda-benda? (Misal: memanjat tangga, perabot) | **TIDAK** |
| 5 | Apakah anak Anda membuat gerakan jari yang tidak biasa di dekat matanya? | **YA**[cite: 2] |
| 6 | Apakah anak Anda menunjuk dengan satu jari untuk meminta sesuatu atau meminta tolong? | **TIDAK** |
| 7 | Apakah anak Anda menunjuk dengan satu jari untuk memperlihatkan sesuatu yang menarik? | **TIDAK** |
| 8 | Apakah anak Anda tertarik pada anak-anak lain? (Memperhatikan atau mendekati mereka) | **TIDAK** |
| 9 | Apakah anak Anda menunjukkan barang pada Anda dengan membawa atau mengangkatnya? | **TIDAK** |
| 10 | Apakah anak Anda merespons saat namanya dipanggil? (Menoleh, menatap, menghentikan aktivitas) | **TIDAK** |
| 11 | Saat Anda tersenyum pada anak Anda, apakah anak Anda tersenyum balik?[cite: 2] | **TIDAK**[cite: 2] |
| 12 | Apakah anak Anda marah/menangis saat mendengar suara bising sehari-hari? (Vacuum cleaner, blender)[cite: 2] | **YA**[cite: 2] |
| 13 | Apakah anak Anda bisa berjalan mandiri?[cite: 2] | **TIDAK**[cite: 2] |
| 14 | Apakah anak Anda menatap mata Anda saat Anda bicara padanya, bermain, atau memakaikan baju?[cite: 2] | **TIDAK**[cite: 2] |
| 15 | Apakah anak Anda mencoba meniru apa yang Anda lakukan? (Tepuk tangan, melambai) | **TIDAK** |
| 16 | Jika Anda memutar kepala untuk melihat sesuatu, apakah anak Anda melihat ke mana Anda melihat? | **TIDAK** |
| 17 | Apakah anak Anda mencoba membuat Anda melihat ke arahnya? (Mencari perhatian/pujian) | **TIDAK** |
| 18 | Apakah anak Anda memahami saat Anda memintanya melakukan sesuatu tanpa bantuan gestur? | **TIDAK** |
| 19 | Jika ada sesuatu yang baru terjadi, apakah anak Anda menatap wajah Anda untuk melihat reaksi Anda? | **TIDAK** |
| 20 | Apakah anak Anda menyukai aktivitas gerakan fisik yang dinamis? (Diayun, dilambungkan di lutut) | **TIDAK** |

* **Skoring M-CHAT-R:**
  * **Skor 0 – 2:** `RISIKO_RENDAH` $\rightarrow$ Stimulasi perkembangan rutin[cite: 2].
  * **Skor 3 – 7:** `RISIKO_SEDANG` $\rightarrow$ Evaluasi tindak lanjut KPSP/M-CHAT-R Follow-up; jika tetap $\ge 3 \rightarrow$ `RUJUK_LEVEL_1`[cite: 2].
  * **Skor 8 – 20:** `RISIKO_TINGGI` $\rightarrow$ Segera rujuk ke Klinik Tumbuh Kembang / Dokter Spesialis Anak Konsultan Tumbuh Kembang[cite: 2].

---

### D. Kuesioner Masalah Perilaku Emosional (KMPE) (Usia 36–60 Bulan)
Terdiri dari 14 pertanyaan keluhan perilaku emosional anak yang diamati orang tua/pengasuh[cite: 2]:
1. Apakah anak sering bereaksi negatif, marah, atau tegang tanpa sebab yang jelas (rewel, tidak sabaran, mudah tersinggung)[cite: 2]?
2. Apakah anak tampak lebih memilih menyendiri, bermain sendiri, atau menghindar dari anak seumuran / orang dewasa[cite: 2]?
3. Apakah anak cenderung bersikap menentang (membantah, melawan, tidak mau menurut, tidak peduli ditegur)[cite: 2]?
4. Apakah anak mudah takut atau cemas berlebihan tanpa sebab yang jelas (takut pada benda/hewan tidak berbahaya)[cite: 2]?
5. Apakah anak sering sulit konsentrasi, perhatiannya mudah teralihkan, atau banyak bergerak/tidak bisa diam[cite: 2]?
6. Apakah anak lebih banyak menempel, selalu minta ditemani, mudah cemas, dan tidak percaya diri[cite: 2]?
7. Apakah anak menunjukkan perubahan pola tidur (sulit tidur, sering terbangun menangis karena mimpi buruk)[cite: 2]?
8. Apakah anak mengalami perubahan pola makan drastis (kehilangan nafsu makan atau makan berlebihan/mengemut makanan lama)[cite: 2]?
9. Apakah anak seringkali mengeluh sakit kepala, sakit perut, atau keluhan fisik lainnya tanpa penyebab medis jelas[cite: 2]?
10. Apakah anak mudah putus asa atau frustrasi dan sering menunjukkan emosi negatif saat menghadapi kesulitan[cite: 2]?
11. Apakah anak menunjukkan kemunduran pola perilaku dari kemampuan yang sudah dimiliki (mengompol kembali, menghisap jempol)[cite: 2]?
12. Apakah anak sering berkelahi, bertengkar, atau menyerang anak lain secara verbal maupun fisik (mengejek, memukul)[cite: 2]?
13. Apakah anak sering diperlakukan tidak menyenangkan oleh anak lain (dijauhi, diintimidasi, mainan direbut paksa)[cite: 2]?
14. Apakah anak cenderung berperilaku merusak benda di sekitarnya atau menyakiti diri sendiri / hewan[cite: 2]?
* **Klasifikasi KMPE:**
  * **Total "Ya" = 0:** `NORMAL`[cite: 2].
  * **Total "Ya" $\ge 1$:** `KECURIGAAN_MASALAH_EMOSIONAL` $\rightarrow$ Lakukan konseling pola asuh, evaluasi kembali 1 bulan kemudian[cite: 2]. Jika pada kunjungan ulang tetap ada jawaban "Ya" $\rightarrow$ `RUJUK_LEVEL_1` (Poli Jiwa Anak / RS Rujukan)[cite: 2].

---

### E. Skrining GPPH / Abbreviated Conner's Rating Scale (Usia $\ge 36$ Bulan)
Terdiri dari 10 pertanyaan perilaku dengan 4 opsi skor:
`0 = Tidak Pernah` | `1 = Kadang-kadang` | `2 = Sering` | `3 = Selalu`[cite: 2]
1. Tidak kenal lelah atau aktivitas berlebihan.
2. Mudah gembira lalu tiba-tiba meledak-ledak.
3. Mengganggu anak-anak lain.
4. Gagal menyelesaikan kegiatan yang telah dimulai, rentang perhatian pendek.
5. Menggerak-gerakkan anggota tubuh terus-menerus (gelisah).
6. Kurang perhatian, mudah teralihkan.
7. Permintaan harus segera dipenuhi, mudah menjadi frustrasi.
8. Sering dan mudah menangis.
9. Suasana hatinya berubah-ubah secara cepat dan drastis.
10. Ledakan kekesalan, tingkah laku eksplosif dan tak terduga.
* **Klasifikasi GPPH:**
  * **Total Skor $< 13$:** `NORMAL / BUKAN GPPH`[cite: 2].
  * **Total Skor $\ge 13$:** `KEMUNGKINAN_GPPH` $\rightarrow$ Rujuk ke RS Rujukan Tumbuh Kembang Level 1 / Psikiater Anak[cite: 2].

---

## 4. CLINICAL DECISION FLOWCHART & LOGIKA RUJUKAN OTOMATIS


```

```
              +-------------------------------------------------+
              |   INPUT HASIL ASESMEN SDIDTK LENGKAP            |
              +-------------------------------------------------+
                                       │
     ┌─────────────────────────────────┴─────────────────────────────────┐
     ▼                                                                   ▼

```

+─────────────────────────────────+                         +─────────────────────────────────+
|      SKRINING PERTUMBUHAN       |                         |      SKRINING PERKEMBANGAN      |
|  - WAZ, HAZ, WHZ, LK, LiLA      |                         |  - KPSP (10 Butir)              |
|  - Weight Increment Standar     |                         |  - TDD & Penglihatan (TDL/Pupil)|
|  - Early Adiposity Rebound      |                         |  - M-CHAT-R / KMPE / GPPH       |
+─────────────────────────────────+                         +─────────────────────────────────+
│                                                                   │
└─────────────────────────────────┬─────────────────────────────────┘
│
▼
+───────────────────────────────────────+
|   EVALUASI KRITERIA RUJUKAN SISTEM   |
+───────────────────────────────────────+
│
┌────────────────────────────────────┼────────────────────────────────────┐
▼                                    ▼                                    ▼
[EMERGENCY RUJUKAN]             [RUJUK RS TUMBANG LEVEL 1]            [EVALUASI 2 MGG / 1 BLN]

* Leukokoria / Pupil Putih      - KPSP Penyimpangan (Skor <= 6)       - KPSP Meragukan (7-8)
* Gizi Buruk + Komplikasi Klinis- M-CHAT-R Risiko Sedang/Tinggi       - KMPE Total Ya >= 1
* LK Makro/Mikrosefali Ekstrem  - GPPH Total Skor >= 13               - Weight Increment Sub-optimal
- TDD Tidak Lolos (Re-test Gagal)     - TDD Suspek (Re-eval 1 mgg)
- Failure to Thrive / Weight Faltering

```

---

## 5. SKEMA DATABASE POSTGRESQL & BACKEND PYTHON ENGINE

### A. Skema Database DDL PostgreSQL
```sql
-- Schema Database Modul SDIDTK SIGMA PKMK
CREATE TABLE sdidtk_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    faskes_id UUID NOT NULL REFERENCES puskesmas(id),
    examiner_name VARCHAR(100) NOT NULL,
    assessment_date DATE NOT NULL,
    birth_date DATE NOT NULL,
    gestational_weeks INT DEFAULT 40,
    chronological_age_months NUMERIC(4, 2) NOT NULL,
    corrected_age_months NUMERIC(4, 2),
    is_premature_corrected BOOLEAN DEFAULT FALSE,
    
    -- Antropometri & Pertumbuhan Fisik
    weight_kg NUMERIC(4, 2) NOT NULL,
    height_cm NUMERIC(4, 1) NOT NULL,
    head_circ_cm NUMERIC(4, 1) NOT NULL,
    muac_lila_cm NUMERIC(4, 1),
    waz NUMERIC(4, 2),
    haz NUMERIC(4, 2),
    whz NUMERIC(4, 2),
    bmiz NUMERIC(4, 2),
    growth_trajectory VARCHAR(50),
    weight_increment_adequate BOOLEAN,
    
    -- Hasil Perkembangan KPSP
    kpsp_age_bracket INT NOT NULL,
    kpsp_yes_count INT NOT NULL,
    kpsp_status VARCHAR(30) NOT NULL, -- SESUAI_UMUR, MERAGUKAN, PENYIMPANGAN
    kpsp_failed_sectors TEXT[],       -- ['GK', 'GH', 'BB', 'SK']
    kpsp_answers JSONB NOT NULL,      -- Full raw answers
    
    -- Skrining Sensorik & Perilaku Khusus
    tdd_status VARCHAR(30) NOT NULL,  -- NORMAL, SUSPEK_GANGGUAN_DENGAR
    tdd_answers JSONB,
    leukocoria_status VARCHAR(30) NOT NULL, -- NORMAL, CURIGA_LEUKOKORIA
    tdl_status VARCHAR(30),           -- DAYA_LIHAT_BAIK, DAYA_LIHAT_KURANG
    mchat_score INT,
    mchat_risk VARCHAR(30),           -- RISIKO_RENDAH, RISIKO_SEDANG, RISIKO_TINGGI
    kmpe_yes_count INT,
    kmpe_status VARCHAR(30),          -- NORMAL, MASALAH_EMOSIONAL
    gpph_total_score INT,
    gpph_status VARCHAR(30),          -- NORMAL, KEMUNGKINAN_GPPH
    
    -- Keputusan Klinis & Rujukan
    clinical_action VARCHAR(50) NOT NULL,
    referral_required BOOLEAN DEFAULT FALSE,
    referral_urgency VARCHAR(30),     -- ROUTINE, SPECIALIST_LEVEL_1, EMERGENCY
    referral_reasons TEXT[],
    referral_destination VARCHAR(100),
    next_visit_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sdidtk_child_time ON sdidtk_assessments(child_id, assessment_date DESC);
CREATE INDEX idx_sdidtk_faskes_search ON sdidtk_assessments(faskes_id, kpsp_status);

```

### B. Engine Komputasi Lengkap (`sdidtk_complete_engine.py`)

```python
import math
from datetime import datetime, date
from typing import Dict, List, Optional, Any

class SdidtkEvaluationEngine:
    """
    Core Evaluation Engine untuk SDIDTK Balita (0 - 60 Bulan)
    Standar Pedoman Kemenkes RI Revisi 2022.
    """

    KPSP_BRACKETS = [3, 6, 9, 12, 15, 18, 21, 24, 30, 36, 42, 48, 54, 60]

    @classmethod
    def compute_age(cls, birth_date: date, eval_date: date, gestational_weeks: int) -> Dict[str, Any]:
        # Exact date subtraction (borrowing method simulation)
        years = eval_date.year - birth_date.year
        months = eval_date.month - birth_date.month
        days = eval_date.day - birth_date.day

        if days < 0:
            months -= 1
            days += 30
        if months < 0:
            years -= 1
            months += 12

        total_days = (eval_date - birth_date).days
        total_months_exact = total_days / 30.4375

        is_corrected = False
        corrected_days = total_days
        corrected_months = total_months_exact

        # Koreksi prematuritas jika usia < 2 tahun dan gestasi < 37 minggu
        if total_months_exact < 24.0 and gestational_weeks < 37:
            is_corrected = True
            deficit_weeks = 40 - gestational_weeks
            deficit_days = deficit_weeks * 7
            corrected_days = max(0, total_days - deficit_days)
            corrected_months = corrected_days / 30.4375

        # Usia efektif penentuan instrumen
        effective_months = corrected_months if is_corrected else total_months_exact
        
        # Aturan pembulatan KPSP: jika sisa hari >= 16 hari, bulatkan ke atas (+1 bln)
        rem_days = days
        rounded_months = int(effective_months) + (1 if rem_days >= 16 else 0)

        # Pilih bracket KPSP yang sesuai (bracket <= rounded_months)
        selected_bracket = 3
        for b in cls.KPSP_BRACKETS:
            if rounded_months >= b:
                selected_bracket = b
            else:
                break

        return {
            "chronological_days": total_days,
            "chronological_months": round(total_months_exact, 2),
            "age_text": f"{years} Tahun {months} Bulan {days} Hari",
            "is_premature_corrected": is_corrected,
            "corrected_days": corrected_days,
            "corrected_months": round(corrected_months, 2),
            "effective_age_months": round(effective_months, 2),
            "kpsp_schedule_bracket": selected_bracket
        }

    @staticmethod
    def evaluate_kpsp(responses: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        responses: [{'id': 'q1', 'sector': 'GK', 'yes': True}, ...]
        """
        yes_count = sum(1 for item in responses if item.get('yes') is True)
        failed_sectors = list(set(item['sector'] for item in responses if item.get('yes') is False))

        if yes_count >= 9:
            status = "SESUAI_UMUR"
        elif 7 <= yes_count <= 8:
            status = "MERAGUKAN"
        else:
            status = "PENYIMPANGAN"

        return {
            "yes_count": yes_count,
            "no_count": len(responses) - yes_count,
            "status": status,
            "failed_sectors": failed_sectors
        }

    @staticmethod
    def evaluate_mchat(answers: Dict[int, bool]) -> Dict[str, Any]:
        if not answers:
            return {"score": 0, "risk": "NOT_ASSESSED"}
        risk_score = 0
        # Butir 2, 5, 12 berisiko jika dijawab YA (True). Sisanya jika TIDAK (False)
        for num, ans in answers.items():
            if num in [2, 5, 12]:
                if ans is True: risk_score += 1
            else:
                if ans is False: risk_score += 1

        if risk_score <= 2:
            risk = "RISIKO_RENDAH"
        elif 3 <= risk_score <= 7:
            risk = "RISIKO_SEDANG"
        else:
            risk = "RISIKO_TINGGI"

        return {"score": risk_score, "risk": risk}

    @staticmethod
    def evaluate_kmpe(answers: Dict[int, bool]) -> Dict[str, Any]:
        if not answers:
            return {"yes_count": 0, "status": "NOT_ASSESSED"}
        yes_count = sum(1 for v in answers.values() if v is True)
        status = "NORMAL" if yes_count == 0 else "MASALAH_EMOSIONAL"
        return {"yes_count": yes_count, "status": status}

    @staticmethod
    def evaluate_gpph(scores: Dict[int, int]) -> Dict[str, Any]:
        if not scores:
            return {"total_score": 0, "status": "NOT_ASSESSED"}
        total = sum(scores.values())
        status = "KEMUNGKINAN_GPPH" if total >= 13 else "NORMAL"
        return {"total_score": total, "status": status}

    @classmethod
    def evaluate_full_case(cls, payload: Dict[str, Any]) -> Dict[str, Any]:
        birth_d = datetime.strptime(payload['birth_date'], '%Y-%m-%d').date()
        eval_d = datetime.strptime(payload['assessment_date'], '%Y-%m-%d').date()
        gest_w = payload.get('gestational_weeks', 40)

        age_result = cls.compute_age(birth_d, eval_d, gest_w)
        kpsp_result = cls.evaluate_kpsp(payload.get('kpsp_responses', []))
        
        # Sensorik
        tdd_no_count = sum(1 for item in payload.get('tdd_responses', []) if item.get('yes') is False)
        tdd_status = "NORMAL" if tdd_no_count == 0 else "SUSPEK_GANGGUAN_DENGAR"
        
        leukocoria = payload.get('leukocoria_check', 'NORMAL').upper()
        tdl_correct = payload.get('tdl_correct_count')
        tdl_status = "DAYA_LIHAT_BAIK" if (tdl_correct is not None and tdl_correct >= 4) else (
            "DAYA_LIHAT_KURANG" if tdl_correct is not None else None
        )

        mchat_result = cls.evaluate_mchat(payload.get('mchat_answers', {}))
        kmpe_result = cls.evaluate_kmpe(payload.get('kmpe_answers', {}))
        gpph_result = cls.evaluate_gpph(payload.get('gpph_answers', {}))

        # Algoritma Rujukan & Rekomendasi Klinis
        reasons = []
        urgency = "ROUTINE"

        if leukocoria == "CURIGA_LEUKOKORIA":
            reasons.append("Pupil Putih / Curiga Leukokoria")
            urgency = "EMERGENCY"

        if kpsp_result['status'] == "PENYIMPANGAN":
            reasons.append(f"KPSP Penyimpangan ({kpsp_result['yes_count']}/10 Ya, Gagal sektor: {', '.join(kpsp_result['failed_sectors'])})")
            if urgency != "EMERGENCY": urgency = "SPECIALIST_LEVEL_1"

        if tdd_status == "SUSPEK_GANGGUAN_DENGAR":
            reasons.append("Skrining TDD Gagal")
            if urgency != "EMERGENCY": urgency = "SPECIALIST_LEVEL_1"

        if tdl_status == "DAYA_LIHAT_KURANG":
            reasons.append("Tes Daya Lihat Kurang (< 4 benar)")
            if urgency != "EMERGENCY": urgency = "SPECIALIST_LEVEL_1"

        if mchat_result.get('risk') in ["RISIKO_SEDANG", "RISIKO_TINGGI"]:
            reasons.append(f"M-CHAT-R {mchat_result['risk']} (Skor {mchat_result['score']})")
            if urgency != "EMERGENCY": urgency = "SPECIALIST_LEVEL_1"

        if gpph_result.get('status') == "KEMUNGKINAN_GPPH":
            reasons.append(f"GPPH Positif (Skor {gpph_result['total_score']})")
            if urgency != "EMERGENCY": urgency = "SPECIALIST_LEVEL_1"

        referral_required = len(reasons) > 0

        if urgency == "EMERGENCY":
            action_code = "EMERGENCY_RUJUKAN"
            destination = "Spesialis Mata / RS Rujukan Tersier"
        elif urgency == "SPECIALIST_LEVEL_1":
            action_code = "RUJUK_RS_LEVEL_1"
            destination = "RS Rujukan Tumbuh Kembang Level 1 / Dokter Spesialis Anak"
        elif kpsp_result['status'] == "MERAGUKAN" or kmpe_result.get('status') == "MASALAH_EMOSIONAL":
            action_code = "EVALUASI_2_MINGGU"
            destination = "Puskesmas (Intervensi Stimulasi)"
        else:
            action_code = "STIMULASI_RUTIN"
            destination = "Posyandu / Rumah Tangga"

        return {
            "age_metadata": age_result,
            "kpsp_evaluation": kpsp_result,
            "sensory_evaluation": {
                "tdd": tdd_status,
                "leukocoria": leukocoria,
                "tdl": tdl_status
            },
            "behavioral_evaluation": {
                "mchat": mchat_result,
                "kmpe": kmpe_result,
                "gpph": gpph_result
            },
            "clinical_decision": {
                "action_code": action_code,
                "referral_required": referral_required,
                "referral_urgency": urgency,
                "referral_destination": destination,
                "referral_reasons": reasons
            }
        }

```

---

## 6. SPESIFIKASI IMPLEMENTASI FRONTEND WIZARD DI ANTIGRAVITY IDE

1. **Auto-Load KPSP by Corrected Age:** Sistem secara otomatis memuat paket 10 soal KPSP sesuai *bracket* usia aktif hasil kalkulasi umur terkoreksi.


2. **Sectoral Radar Performance Chart:** Merender grafik jaring (*spider radar*) yang menunjukkan proporsi kelulusan per sektor perkembangan (`GK`, `GH`, `BB`, `SK`) secara *real-time*.


3. **Adaptive Conditional Forms:**
* Form **M-CHAT-R** hanya aktif dan wajib diisi jika balita berada di rentang usia **16–30 bulan**.


* Form **TDL, KMPE, dan GPPH** hanya terbuka jika usia $\ge 36\text{ bulan}$.




4. **Clinical Referral Letter Engine:** Menyediakan tombol cetak otomatis lembar rujukan PDF standar Kemenkes RI yang memuat ringkasan identitas, grafik *growth velocity*, hasil evaluasi KPSP/TDD/KMPE, dan sektor yang mengalami penyimpangan.



```

```