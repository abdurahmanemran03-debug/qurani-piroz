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
   *
   * everyayah:
   * Per-ayah MP3:
   * 001001.mp3, 001002.mp3, ...
   *
   * mp3quran:
   * Per-surah MP3:
   * 001.mp3, 002.mp3, ...
   *
   * The second source is handled by MushafPageView.
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
    serverKey: 'Alafasy_128kbps',
    audioSource: 'everyayah'
  },

  {
    id: 'abdul_basit_murattal',
    name: 'عبد الباسط عبد الصمد (مرتل)',
    subName: 'Abdul Basit (Murattal)',
    category: 'famous',
    riwayah: 'حفص عن عاصم',
    serverKey: 'Abdul_Basit_Murattal_192kbps',
    audioSource: 'everyayah'
  },

  {
    id: 'abdul_basit_mujawwad',
    name: 'عبد الباسط عبد الصمد (مجود)',
    subName: 'Abdul Basit (Mujawwad)',
    category: 'famous',
    riwayah: 'حفص عن عاصم',
    serverKey: 'Abdul_Basit_Mujawwad_128kbps',
    audioSource: 'everyayah'
  },

  {
    id: 'minshawy_murattal',
    name: 'محمد صديق المنشاوي (مرتل)',
    subName: 'Al-Minshawy (Murattal)',
    category: 'famous',
    riwayah: 'حفص عن عاصم',
    serverKey: 'Minshawy_Murattal_128kbps',
    audioSource: 'everyayah'
  },

  {
    id: 'minshawy_mujawwad',
    name: 'محمد صديق المنشاوي (مجود)',
    subName: 'Al-Minshawy (Mujawwad)',
    category: 'famous',
    riwayah: 'حفص عن عاصم',
    serverKey: 'Minshawy_Mujawwad_192kbps',
    audioSource: 'everyayah'
  },

  {
    id: 'husary_murattal',
    name: 'محمود خليل الحصري (مرتل)',
    subName: 'Al-Husary (Murattal)',
    category: 'famous',
    riwayah: 'حفص عن عاصم',
    serverKey: 'Husary_128kbps',
    audioSource: 'everyayah'
  },

  {
    id: 'husary_mujawwad',
    name: 'محمود خليل الحصري (مجود)',
    subName: 'Al-Husary (Mujawwad)',
    category: 'famous',
    riwayah: 'حفص عن عاصم',
    serverKey: 'Husary_Mujawwad_128kbps',
    audioSource: 'everyayah'
  },

  {
    id: 'maher_muaiqly',
    name: 'ماهر المعيقلي',
    subName: 'Maher Al-Muaiqly',
    category: 'famous',
    riwayah: 'حفص عن عاصم',
    serverKey: 'Maher_AlMuaiqly_64kbps',
    audioSource: 'everyayah'
  },

  {
    id: 'saad_ghamdi',
    name: 'سعد الغامدي',
    subName: 'Saad Al-Ghamdi',
    category: 'famous',
    riwayah: 'حفص عن عاصم',
    serverKey: 'Ghamadi_40kbps',
    audioSource: 'everyayah'
  },

  {
    id: 'yasser_dosari',
    name: 'ياسر الدوسري',
    subName: 'Yasser Al-Dosari',
    category: 'famous',
    riwayah: 'حفص عن عاصم',
    serverKey: 'Yasser_Ad-Dussary_128kbps',
    audioSource: 'everyayah'
  },

  {
    id: 'sudais',
    name: 'عبد الرحمن السديس',
    subName: 'Abdurrahman As-Sudais',
    category: 'famous',
    riwayah: 'حفص عن عاصم',
    serverKey: 'Abdurrahmaan_As-Sudais_192kbps',
    audioSource: 'everyayah'
  },

  {
    id: 'shuraim',
    name: 'سعود الشريم',
    subName: 'Saud Ash-Shuraim',
    category: 'famous',
    riwayah: 'حفص عن عاصم',
    serverKey: 'Saood_ash-Shuraym_128kbps',
    audioSource: 'everyayah'
  },

  {
    id: 'ahmed_ajamy',
    name: 'أحمد بن علي العجمي',
    subName: 'Ahmed Al-Ajamy',
    category: 'famous',
    riwayah: 'حفص عن عاصم',
    serverKey: 'Ahmed_ibn_Ali_al-Ajamy_128kbps',
    audioSource: 'everyayah'
  },

  {
    id: 'abu_bakr_shatri',
    name: 'أبو بكر الشاطري',
    subName: 'Abu Bakr Al-Shatri',
    category: 'famous',
    riwayah: 'حفص عن عاصم',
    serverKey: 'Abu_Bakr_Ash-Shaatree_128kbps',
    audioSource: 'everyayah'
  },

  {
    id: 'idrees_abkar',
    name: 'إدريس أبكر',
    subName: 'Idrees Abkar',
    category: 'famous',
    riwayah: 'حفص عن عاصم',
    serverKey: 'Idrees_Abkar_128kbps',
    audioSource: 'everyayah'
  },

  {
    id: 'nasser_qatami',
    name: 'ناصر القطامي',
    subName: 'Nasser Al-Qatami',
    category: 'famous',
    riwayah: 'حفص عن عاصم',
    serverKey: 'Nasser_Alqatami_128kbps',
    audioSource: 'everyayah'
  },

  {
    id: 'ali_jaber',
    name: 'علي عبد الله جابر',
    subName: 'Ali Jaber',
    category: 'famous',
    riwayah: 'حفص عن عاصم',
    serverKey: 'Ali_Jaber_64kbps',
    audioSource: 'everyayah'
  },

  {
    id: 'muhammad_ayyub',
    name: 'محمد أيوب',
    subName: 'Muhammad Ayyub',
    category: 'famous',
    riwayah: 'حفص عن عاصم',
    serverKey: 'Muhammad_Ayyoob_128kbps',
    audioSource: 'everyayah'
  },

  {
    id: 'muhammad_jibreel',
    name: 'محمد جبريل',
    subName: 'Muhammad Jibreel',
    category: 'famous',
    riwayah: 'حفص عن عاصم',
    serverKey: 'Muhammad_Jibreel_128kbps',
    audioSource: 'everyayah'
  },

  {
    id: 'khalid_jalil',
    name: 'خالد الجليل',
    subName: 'Khalid Al-Jaleel',
    category: 'famous',
    riwayah: 'حفص عن عاصم',
    serverKey: 'Khalid_AlJaleel_128kbps',
    audioSource: 'everyayah'
  },

  {
    id: 'khalid_qahtani',
    name: 'خالد القحطاني',
    subName: 'Khalid Al-Qahtani',
    category: 'famous',
    riwayah: 'حفص عن عاصم',
    serverKey: 'Khaalid_Al-Qahtaanee_192kbps',
    audioSource: 'everyayah'
  },

  {
    id: 'abdullah_juhany',
    name: 'عبد الله الجهني',
    subName: 'Abdullah Al-Juhany',
    category: 'famous',
    riwayah: 'حفص عن عاصم',
    serverKey: 'Abdullah_Al-Juhany_128kbps',
    audioSource: 'everyayah'
  },

  {
    id: 'abdullah_basfar',
    name: 'عبد الله بصفر',
    subName: 'Abdullah Basfar',
    category: 'famous',
    riwayah: 'حفص عن عاصم',
    serverKey: 'Abdullah_Basfar_192kbps',
    audioSource: 'everyayah'
  },

  {
    id: 'abdulmohsen_qasim',
    name: 'عبد المحسن القاسم',
    subName: 'Abdulmohsen Al-Qasim',
    category: 'famous',
    riwayah: 'حفص عن عاصم',
    serverKey: 'Abdulmohsen_Al-Qasim_192kbps',
    audioSource: 'everyayah'
  },

  {
    id: 'fares_abbad',
    name: 'فارس عباد',
    subName: 'Fares Abbad',
    category: 'famous',
    riwayah: 'حفص عن عاصم',
    serverKey: 'Fares_Abbad_64kbps',
    audioSource: 'everyayah'
  },

  {
    id: 'hudhaify',
    name: 'علي بن عبد الرحمن الحذيفي',
    subName: 'Ali Al-Hudhaify',
    category: 'famous',
    riwayah: 'حفص عن عاصم',
    serverKey: 'Hudhaify_128kbps',
    audioSource: 'everyayah'
  },

  {
    id: 'hani_rifai',
    name: 'هاني الرفاعي',
    subName: 'Hani Ar-Rifai',
    category: 'famous',
    riwayah: 'حفص عن عاصم',
    serverKey: 'Hani_Rifai_192kbps',
    audioSource: 'everyayah'
  },

  {
    id: 'ayman_suwaid',
    name: 'د. أيمن سويد',
    subName: 'Dr. Ayman Suwaid',
    category: 'famous',
    riwayah: 'حفص عن عاصم',
    serverKey: 'Ayman_Sowaid_64kbps',
    audioSource: 'everyayah'
  },

  {
    id: 'tariq_ibrahim',
    name: 'إبراهيم الأخضر',
    subName: 'Ibrahim Al-Akhdar',
    category: 'famous',
    riwayah: 'حفص عن عاصم',
    serverKey: 'Ibrahim_Akhdar_32kbps',
    audioSource: 'everyayah'
  },

  {
    id: 'wadih_yamani',
    name: 'وديع اليمني',
    subName: 'Wadih Al-Yamani',
    category: 'famous',
    riwayah: 'حفص عن عاصم',
    serverKey: 'Wadih_Al-Yamani_128kbps',
    audioSource: 'everyayah'
  },

  {
    id: 'nourin_siddeeq',
    name: 'نورين محمد صديق',
    subName: 'Nourin Mohamed Siddiq',
    category: 'famous',
    riwayah: 'الدوري عن أبي عمرو',
    serverKey: 'Nourin_Siddiq_128kbps',
    audioSource: 'everyayah'
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
    serverKey: 'Yassin_AlJazaery_Warsh_64kbps',
    audioSource: 'everyayah'
  },

  {
    id: 'khamiri_shubah',
    name: 'فؤاد الخامري (رواية شعبة)',
    subName: "Fouad Al-Khamiri (Shu'bah)",
    category: 'riwayat',
    riwayah: 'شعبة عن عاصم',
    serverKey: 'Khamiri_Shubah_128kbps',
    audioSource: 'everyayah'
  },

  {
    id: 'miftah_saltany_duri',
    name: 'مفتاح السلطني (رواية الدوري)',
    subName: 'Miftah As-Saltany (Al-Duri)',
    category: 'riwayat',
    riwayah: 'الدوري عن أبي عمرو',
    serverKey: 'Saltany_Duri_128kbps',
    audioSource: 'everyayah'
  },

  {
    id: 'abdulrashid_sofi_susi',
    name: 'عبد الرشيد صوفي (رواية السوسي)',
    subName: 'Abdulrasheed Soufi (Al-Susi)',
    category: 'riwayat',
    riwayah: 'السوسي عن أبي عمرو',
    serverKey: 'Soufi_Susi_128kbps',
    audioSource: 'everyayah'
  },

  {
    id: 'abdulrashid_sofi_khalaf',
    name: 'عبد الرشيد صوفي (رواية خلف عن حمزة)',
    subName: 'Abdulrasheed Soufi (Khalaf)',
    category: 'riwayat',
    riwayah: 'خلف عن حمزة',
    serverKey: 'Soufi_Khalaf_128kbps',
    audioSource: 'everyayah'
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
    serverKey: 'Husary_Muallim_128kbps',
    audioSource: 'everyayah'
  },

  {
    id: 'minshawy_children',
    name: 'المنشاوي (مع الأطفال - ترديد)',
    subName: 'Al-Minshawy (With Children)',
    category: 'teaching',
    riwayah: 'حفص (ترديد)',
    serverKey: 'Minshawy_Teacher_128kbps',
    audioSource: 'everyayah'
  }
];
