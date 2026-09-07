export interface ReciterItem {
  id: string;
  name: string;
  subName?: string;
  category:
    | 'famous'
    | 'riwayat'
    | 'teaching';
  riwayah: string;
  serverKey: string;

  /**
   * Audio source type.
   * everyayah: Per-ayah MP3 (001001.mp3)
   * mp3quran: Per-surah MP3 (001.mp3)
   */
  audioSource?: 'everyayah' | 'mp3quran';

  /**
   * Base URL for MP3Quran reciters.
   * Used when audioSource === 'mp3quran'.
   */
  audioBaseUrl?: string;
}

export const ALL_RECITERS_DIRECTORY: ReciterItem[] = [
  // ==========================================
  // ١. قورئانخوێنە ناودارە جیهانییەکان
  // ==========================================

  {
    id: 'alafasy',
    name: 'ميشاري بن راشد العفاسي',
    subName: 'Mishary Rashid Alafasy',
    category: 'famous',
    riwayah: 'حفص عن عاصم',
    serverKey: 'Alafasy',
    audioSource: 'mp3quran',
    audioBaseUrl: 'https://server8.mp3quran.net/afs/'
  },

  {
    id: 'abdul_basit_murattal',
    name: 'عبد الباسط عبد الصمد (مرتل)',
    subName: 'Abdul Basit (Murattal)',
    category: 'famous',
    riwayah: 'حفص عن عاصم',
    serverKey: 'Abdul_Basit_Murattal',
    audioSource: 'mp3quran',
    audioBaseUrl: 'https://server7.mp3quran.net/basit/'
  },

  {
    id: 'abdul_basit_mujawwad',
    name: 'عبد الباسط عبد الصمد (مجود)',
    subName: 'Abdul Basit (Mujawwad)',
    category: 'famous',
    riwayah: 'حفص عن عاصم',
    serverKey: 'Abdul_Basit_Mujawwad',
    audioSource: 'mp3quran',
    audioBaseUrl: 'https://server11.mp3quran.net/basit_mjwd/'
  },

  {
    id: 'minshawy_murattal',
    name: 'محمد صديق المنشاوي (مرتل)',
    subName: 'Al-Minshawy (Murattal)',
    category: 'famous',
    riwayah: 'حفص عن عاصم',
    serverKey: 'Minshawy_Murattal',
    audioSource: 'mp3quran',
    audioBaseUrl: 'https://server10.mp3quran.net/minsh/'
  },

  {
    id: 'minshawy_mujawwad',
    name: 'محمد صديق المنشاوي (مجود)',
    subName: 'Al-Minshawy (Mujawwad)',
    category: 'famous',
    riwayah: 'حفص عن عاصم',
    serverKey: 'Minshawy_Mujawwad',
    audioSource: 'mp3quran',
    audioBaseUrl: 'https://server11.mp3quran.net/minsh_mjwd/'
  },

  {
    id: 'husary_murattal',
    name: 'محمود خليل الحصري (مرتل)',
    subName: 'Al-Husary (Murattal)',
    category: 'famous',
    riwayah: 'حفص عن عاصم',
    serverKey: 'Husary',
    audioSource: 'mp3quran',
    audioBaseUrl: 'https://server13.mp3quran.net/husr/'
  },

  {
    id: 'maher_muaiqly',
    name: 'ماهر المعيقلي',
    subName: 'Maher Al-Muaiqly',
    category: 'famous',
    riwayah: 'حفص عن عاصم',
    serverKey: 'Maher_AlMuaiqly',
    audioSource: 'mp3quran',
    audioBaseUrl: 'https://server12.mp3quran.net/maher/'
  },

  {
    id: 'saad_ghamdi',
    name: 'سعد الغامدي',
    subName: 'Saad Al-Ghamdi',
    category: 'famous',
    riwayah: 'حفص عن عاصم',
    serverKey: 'Ghamadi',
    audioSource: 'mp3quran',
    audioBaseUrl: 'https://server7.mp3quran.net/s_gmd/'
  },

  {
    id: 'yasser_dosari',
    name: 'ياسر الدوسري',
    subName: 'Yasser Al-Dosari',
    category: 'famous',
    riwayah: 'حفص عن عاصم',
    serverKey: 'Yasser_Ad-Dussary',
    audioSource: 'mp3quran',
    audioBaseUrl: 'https://server11.mp3quran.net/yasser/'
  },

  {
    id: 'sudais',
    name: 'عبد الرحمن السديس',
    subName: 'Abdurrahman As-Sudais',
    category: 'famous',
    riwayah: 'حفص عن عاصم',
    serverKey: 'Abdurrahmaan_As-Sudais',
    audioSource: 'mp3quran',
    audioBaseUrl: 'https://server11.mp3quran.net/sds/'
  },

  {
    id: 'shuraim',
    name: 'سعود الشريم',
    subName: 'Saud Ash-Shuraim',
    category: 'famous',
    riwayah: 'حفص عن عاصم',
    serverKey: 'Saood_ash-Shuraym',
    audioSource: 'mp3quran',
    audioBaseUrl: 'https://server7.mp3quran.net/shur/'
  },

  {
    id: 'ahmed_ajamy',
    name: 'أحمد بن علي العجمي',
    subName: 'Ahmed Al-Ajamy',
    category: 'famous',
    riwayah: 'حفص عن عاصم',
    serverKey: 'Ahmed_ibn_Ali_al-Ajamy',
    audioSource: 'mp3quran',
    audioBaseUrl: 'https://server10.mp3quran.net/ajm/'
  },

  {
    id: 'abu_bakr_shatri',
    name: 'أبو بكر الشاطري',
    subName: 'Abu Bakr Al-Shatri',
    category: 'famous',
    riwayah: 'حفص عن عاصم',
    serverKey: 'Abu_Bakr_Ash-Shaatree',
    audioSource: 'mp3quran',
    audioBaseUrl: 'https://server11.mp3quran.net/shatri/'
  },

  {
    id: 'idrees_abkar',
    name: 'إدريس أبكر',
    subName: 'Idrees Abkar',
    category: 'famous',
    riwayah: 'حفص عن عاصم',
    serverKey: 'Idrees_Abkar',
    audioSource: 'mp3quran',
    audioBaseUrl: 'https://server6.mp3quran.net/abkar/'
  },

  {
    id: 'nasser_qatami',
    name: 'ناصر القطامي',
    subName: 'Nasser Al-Qatami',
    category: 'famous',
    riwayah: 'حفص عن عاصم',
    serverKey: 'Nasser_Alqatami',
    audioSource: 'mp3quran',
    audioBaseUrl: 'https://server6.mp3quran.net/qtm/'
  },

  {
    id: 'fares_abbad',
    name: 'فارس عباد',
    subName: 'Fares Abbad',
    category: 'famous',
    riwayah: 'حفص عن عاصم',
    serverKey: 'Fares_Abbad',
    audioSource: 'mp3quran',
    audioBaseUrl: 'https://server8.mp3quran.net/frs_a/'
  },

  {
    id: 'hudhaify',
    name: 'علي بن عبد الرحمن الحذيفي',
    subName: 'Ali Al-Hudhaify',
    category: 'famous',
    riwayah: 'حفص عن عاصم',
    serverKey: 'Hudhaify',
    audioSource: 'mp3quran',
    audioBaseUrl: 'https://server9.mp3quran.net/hthfi/'
  },

  {
    id: 'wadih_yamani',
    name: 'وديع اليمني',
    subName: 'Wadih Al-Yamani',
    category: 'famous',
    riwayah: 'حفص عن عاصم',
    serverKey: 'Wadih_Al-Yamani',
    audioSource: 'mp3quran',
    audioBaseUrl: 'https://server6.mp3quran.net/wd3/'
  },

  // ==========================================
  // ٢. خوێندنەوە بە ڕیوایەتە جیاوازەکان
  // ==========================================

  {
    id: 'yassin_aljazairi_warsh',
    name: 'ياسين الجزائري (رواية ورش)',
    subName: 'Yassin Al-Jazaery (Warsh)',
    category: 'riwayat',
    riwayah: 'ورش عن نافع',
    serverKey: 'Yassin_AlJazaery_Warsh',
    audioSource: 'mp3quran',
    audioBaseUrl: 'https://server11.mp3quran.net/jza/Rewayat-Warsh-A-n-Nafi/'
  },

  // ==========================================
  // ٣. دەنگی فێرکاری و منداڵان
  // ==========================================

  {
    id: 'husary_muallim',
    name: 'الحصري (المصحف المعلم)',
    subName: 'Al-Husary (Teacher Mode)',
    category: 'teaching',
    riwayah: 'حفص (معلم)',
    serverKey: 'Husary_Muallim',
    audioSource: 'mp3quran',
    audioBaseUrl: 'https://server13.mp3quran.net/husr_moalm/'
  },

  {
    id: 'minshawy_children',
    name: 'المنشاوي (مع الأطفال - ترديد)',
    subName: 'Al-Minshawy (With Children)',
    category: 'teaching',
    riwayah: 'حفص (ترديد)',
    serverKey: 'Minshawy_Teacher',
    audioSource: 'mp3quran',
    audioBaseUrl: 'https://server10.mp3quran.net/minsh_teacher/'
  }
];
