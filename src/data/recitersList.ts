export interface ReciterItem {
  id: string;
  name: string;
  subName: string;
  category: 'kurdish' | 'famous' | 'riwayat' | 'teaching' | 'iraq' | string;
  riwayah: string;
  serverKey: string;
  audioSource: string;
  baseUrl: string;
}

export const ALL_RECITERS_DIRECTORY: ReciterItem[] = [
  // ==========================================
  // ☀️ قورئانخوێنە کوردەکان (Kurdish Reciters)
  // ==========================================
  {
    id: 'raad_kurdish',
    name: 'رعد الكردي',
    subName: 'Raad Al Kurdi',
    category: 'kurdish',
    riwayah: 'حفص عن عاصم',
    serverKey: 'raad',
    audioSource: 'way2quran',
    baseUrl: 'https://download.way2quran.com/files/kurdish/raad/'
  },
  {
    id: 'rzgar_kurdish',
    name: 'رزكار محمد الكردي',
    subName: 'Razgar Muhammad Al-Kurdi',
    category: 'kurdish',
    riwayah: 'حفص عن عاصم',
    serverKey: 'rzgar',
    audioSource: 'way2quran',
    baseUrl: 'https://download.way2quran.com/files/kurdish/rzgar/'
  },
  {
    id: 'firman_shwani',
    name: 'فرمان شواني',
    subName: 'Firman Shwani',
    category: 'kurdish',
    riwayah: 'حفص عن عاصم',
    serverKey: 'firman',
    audioSource: 'way2quran',
    baseUrl: 'https://download.way2quran.com/files/kurdish/firman/'
  },
  {
    id: 'peshawa_kurdish',
    name: 'پێشەوا قادر الكردي',
    subName: 'Peshawa Qadir Al-Kurdi',
    category: 'kurdish',
    riwayah: 'حفص عن عاصم',
    serverKey: 'peshawa',
    audioSource: 'way2quran',
    baseUrl: 'https://download.way2quran.com/files/kurdish/peshawa/'
  },
  {
    id: 'bisha_kurdish',
    name: 'بيشه الكردي',
    subName: 'Bisha Al Kurdi',
    category: 'kurdish',
    riwayah: 'حفص عن عاصم',
    serverKey: 'bisha',
    audioSource: 'way2quran',
    baseUrl: 'https://download.way2quran.com/files/kurdish/bisha/'
  },
  {
    id: 'yusuf_othman_kurdish',
    name: 'يوسف عثمان الكردي',
    subName: 'Yusuf Othman Al-Kurdi',
    category: 'kurdish',
    riwayah: 'حفص عن عاصم',
    serverKey: 'yusuf_othman',
    audioSource: 'way2quran',
    baseUrl: 'https://download.way2quran.com/files/kurdish/yusuf_othman/'
  },
  {
    id: 'abdul_hadi_kurdish',
    name: 'عبد الهادي الكردي',
    subName: 'Abdul Hadi Al Kurdi',
    category: 'kurdish',
    riwayah: 'حفص عن عاصم',
    serverKey: 'abdul_hadi',
    audioSource: 'way2quran',
    baseUrl: 'https://download.way2quran.com/files/kurdish/abdul_hadi/'
  },
  {
    id: 'ahmed_haji_qasim',
    name: 'أحمد حاجي قاسم',
    subName: 'Ahmed Haji Qasim',
    category: 'kurdish',
    riwayah: 'حفص عن عاصم',
    serverKey: 'ahmed_haji',
    audioSource: 'way2quran',
    baseUrl: 'https://download.way2quran.com/files/kurdish/ahmed_haji/'
  },

  // ==========================================
  // 👑 قورئانخوێنەکانی تر (Other Reciters)
  // ==========================================
  {
    id: 'amer_al_kazemi',
    name: 'عامر الكاظمي',
    subName: 'Amer Al Kazemi',
    category: 'famous',
    riwayah: 'حفص عن عاصم',
    serverKey: 'amer_kazemi',
    audioSource: 'way2quran',
    baseUrl: 'https://download.way2quran.com/files/amer_kazemi/'
  },
  {
    id: 'namah_alhassan',
    name: 'نعمه الحسان',
    subName: 'Namah Alhassan',
    category: 'famous',
    riwayah: 'حفص عن عاصم',
    serverKey: 'namah',
    audioSource: 'way2quran',
    baseUrl: 'https://download.way2quran.com/files/namah/'
  },
  {
    id: 'obaida_mowafq',
    name: 'عبيده موفق',
    subName: 'Obaida Mowafq',
    category: 'famous',
    riwayah: 'حفص عن عاصم',
    serverKey: 'obaida',
    audioSource: 'way2quran',
    baseUrl: 'https://download.way2quran.com/files/obaida/'
  }
];
