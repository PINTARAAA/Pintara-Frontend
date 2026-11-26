## Deskripsi

<!-- Jelaskan secara singkat apa yang diubah dan mengapa perubahan ini diperlukan. -->

## Jenis Perubahan

<!-- Beri tanda [x] pada yang sesuai. -->

- [ ] `feat` — Fitur baru
- [ ] `fix` — Perbaikan bug
- [ ] `refactor` — Perubahan struktur kode tanpa mengubah perilaku
- [ ] `style` — Perubahan tampilan/UI (spacing, warna, layout)
- [ ] `chore` — Konfigurasi, tooling, dependensi, atau pemeliharaan repo
- [ ] `docs` — Dokumentasi
- [ ] `test` — Menambah atau memperbaiki test

## Modul / Role Terdampak

<!-- Contoh: pengelola/keuangan, pengelola/notifikasi, komponen UI bersama, dsb. -->

-

## Issue Terkait

<!-- Tautkan issue jika ada, misalnya: Closes #12 -->

-

## Daftar Perubahan

<!-- Rincikan poin-poin perubahan utama. -->

-

## Screenshot / Rekaman

<!-- Wajib untuk perubahan UI. Sertakan tampilan sebelum dan sesudah jika memungkinkan. -->

| Sebelum | Sesudah |
| ------- | ------- |
|         |         |

## Cara Menguji

<!-- Langkah-langkah agar reviewer dapat memverifikasi perubahan ini. -->

1.
2.
3.

## Checklist

- [ ] Branch dibuat dari `develop` dan PR ditujukan ke `develop`
- [ ] Nama branch dan pesan commit mengikuti konvensi (`feat/...`, `fix(scope): ...`)
- [ ] `npm run build` berhasil tanpa error TypeScript
- [ ] `npx eslint .` tidak menghasilkan error
- [ ] `npm run test` lulus (jika ada test terkait)
- [ ] Kode sudah diformat dengan Prettier
- [ ] Import menggunakan path alias / barrel (`index.ts`) sesuai struktur proyek
- [ ] Tampilan sudah dicek pada ukuran layar mobile dan desktop
- [ ] Tidak ada `console.log`, kode mati, atau file `.env` yang ikut ter-commit

## Catatan untuk Reviewer

<!-- Hal yang perlu diperhatikan khusus, keputusan desain, atau pekerjaan lanjutan. -->
