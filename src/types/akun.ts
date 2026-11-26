export type LbbContact = { name: string; whatsapp: string; display: string }

export type WaliAccount = {
  name: string
  initials: string
  role: string
  email: string
  whatsapp: string
  username: string
  students: { id: string; name: string; grade: string; subjects: string[] }[]
  lbbContact: LbbContact
  appVersion: string
}

export type TutorAccount = {
  name: string
  initials: string
  role: string
  email: string
  teaching: {
    subjects: string[]
    levels: string
    availability: string
    /* Rupiah per sesi */
    rate: number
  }
  lbbContact: LbbContact
  appVersion: string
}

/* P1 · Menu Lainnya: profil pengelola + ringkasan untuk keterangan menu */
export type PengelolaMenu = {
  name: string
  initials: string
  role: string
  email: string
  tutors: { total: number; active: number }
  students: { total: number; active: number }
  failedNotifications: number
}
