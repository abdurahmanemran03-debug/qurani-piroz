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
   * everyayah: Per-ayah MP3
   * mp3quran: Per-surah MP3
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
    id: 'husary_mujawwad',
    name: 'محمود خليل الحصري (مجود)',
    subName: 'Al-Husary (Mujawwad)',
    category: 'famous',
    riwayah: 'حفص عن عاصم',
    serverKey: 'Husary_Mujawwad',
    audioSource: 'mp3quran',
    audioBaseUrl: 'https://server13.mp3quran.net/husr_mjwd/'
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
    id: 'ali_jaber',
    name: 'علي عبد الله جابر',
    subName: 'Ali Jaber',
    category: 'famous',
    riwayah: 'حفص عن عاصم',
    serverKey: 'Ali_Jaber',
    audioSource: 'mp3quran',
    audioBaseUrl: 'https://server11.mp3quran.net/a_jbr/'
  },

  {
    id: 'muhammad_ayyub',
    name: 'محمد أيوب',
    subName: 'Muhammad Ayyub',
    category: 'famous',
    riwayah: 'حفص عن عاصم',
    serverKey: 'Muhammad_Ayyoob',
    audioSource: 'mp3quran',
    audioBaseUrl: 'https://server8.mp3quran.net/ayyub/'
  },

  {
    id: 'muhammad_jibreel',
    name: 'محمد جبريل',
    subName: 'Muhammad Jibreel',
    category: 'famous',
    riwayah: 'حفص عن عاصم',
    serverKey: 'Muhammad_Jibreel',
    audioSource: 'mp3quran',
    audioBaseUrl: 'https://server8.mp3quran.net/jbrl/'
  },

  {
    id: 'khalid_jalil',
    name: 'خالد الجليل',
    subName: 'Khalid Al-Jaleel',
    category: 'famous',
    riwayah: 'حفص عن عاصم',
    serverKey: 'Khalid_AlJaleel',
    audioSource: 'mp3quran',
    audioBaseUrl: 'https://server10.mp3quran.net/jleel/'
  },

  {
    id: 'khalid_qahtani',
    name: 'خالد القحطاني',
    subName: 'Khalid Al-Qahtani',
    category: 'famous',
    riwayah: 'حفص عن عاصم',
    serverKey: 'Khaalid_Al-Qahtaanee',
    audioSource: 'mp3quran',
    audioBaseUrl: 'https://server10.mp3quran.net/qht/'
  },

  {
    id: 'abdullah_juhany',
    name: 'عبد الله الجهني',
    subName: 'Abdullah Al-Juhany',
    category: 'famous',
    riwayah: 'حفص عن عاصم',
    serverKey: 'Abdullah_Al-Juhany',
    audioSource: 'mp3quran',
    audioBaseUrl: 'https://server13.mp3quran.net/jhn/'
  },

  {
    id: 'abdullah_basfar',
    name: 'عبد الله بصفر',
    subName: 'Abdullah Basfar',
    category: 'famous',
    riwayah: 'حفص عن عاصم',
    serverKey: 'Abdullah_Basfar',
    audioSource: 'mp3quran',
    audioBaseUrl: 'https://server6.mp3quran.net/bsfr/'
  },

  {
    id: 'abdulmohsen_qasim',
    name: 'عبد المحسن القاسم',
    subName: 'Abdulmohsen Al-Qasim',
    category: 'famous',
    riwayah: 'حفص عن عاصم',
    serverKey: 'Abdulmohsen_Al-Qasim',
    audioSource: 'mp3quran',
    audioBaseUrl: 'https://server8.mp3quran.net/qasm/'
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
    id: 'hani_rifai',
    name: 'هاني الرفاعي',
    subName: 'Hani Ar-Rifai',
    category: 'famous',
    riwayah: 'حفص عن عاصم',
    serverKey: 'Hani_Rifai',
    audioSource: 'mp3quran',
    audioBaseUrl: 'https://server8.mp3quran.net/hani/'
  },

  {
    id: 'tariq_ibrahim',
    name: 'إبراهيم الأخضر',
    subName: 'Ibrahim Al-Akhdar',
    category: 'famous',
    riwayah: 'حفص عن عاصم',
    serverKey: 'Ibrahim_Akhdar',
    audioSource: 'mp3quran',
    audioBaseUrl: 'https://server6.mp3quran.net/akhdr/'
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

  {
    id: 'nourin_siddeeq',
    name: 'نورين محمد صديق',
    subName: 'Nourin Mohamed Siddiq',
    category: 'famous',
    riwayah: 'الدوري عن أبي عمرو',
    serverKey: 'Nourin_Siddiq',
    audioSource: 'mp3quran',
    audioBaseUrl: 'https://server11.mp3quran.net/nourin/'
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

  {
    id: 'miftah_saltany_duri',
    name: 'مفتاح السلطني (رواية الدوري)',
    subName: 'Miftah As-Saltany (Al-Duri)',
    category: 'riwayat',
    riwayah: 'الدوري عن أبي عمرو',
    serverKey: 'Saltany_Duri',
    audioSource: 'mp3quran',
    audioBaseUrl: 'https://server10.mp3quran.net/Alafasy/Rewayat-AlDouri-A-n-Abu-Amr/'
  },

  {
    id: 'abdulrashid_sofi_susi',
    name: 'عبد الرشيد صوفي (رواية السوسي)',
    subName: 'Abdulrasheed Soufi (Al-Susi)',
    category: 'riwayat',
    riwayah: 'السوسي عن أبي عمرو',
    serverKey: 'Soufi_Susi',
    audioSource: 'mp3quran',
    audioBaseUrl: 'https://server16.mp3quran.net/sofi/Rewayat-AlSoosi-A-n-Abi-Amr/'
  },

  {
    id: 'abdulrashid_sofi_khalaf',
    name: 'عبد الرشيد صوفي (رواية خلف عن حمزة)',
    subName: 'Abdulrasheed Soufi (Khalaf)',
    category: 'riwayat',
    riwayah: 'خلف عن حمزة',
    serverKey: 'Soufi_Khalaf',
    audioSource: 'mp3quran',
    audioBaseUrl: 'https://server16.mp3quran.net/sofi/Rewayat-Khalaf-A-n-Hamzah/'
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
