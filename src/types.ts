export type AppThemeMode = 'minimalist-dark' | 'madinah-mushaf' | 'soft-modern';
export type BgThemeType = 'white' | 'cream' | 'dark';
export type AppLangType = 'ku' | 'ar' | 'en';
export type AccentColorType = 'gold' | 'emerald' | 'blue';

export interface SurahItem {
  number: number;
  nameAr: string;
  nameKu: string;
  nameEn: string;
  typeKu: string;
  typeAr: string;
  typeEn: string;
  ayahs: number;
  startPage: number;
}

export interface DhikrItem {
  id: string;
  arabic: string;
  kurdish: string;
  count: number;
  virtue?: string;
}

export interface DhikrCategory {
  id: string;
  title: string;
  items: DhikrItem[];
}

export interface CityPrayerData {
  id: string;
  name: string;
  qiblaAngle: number;
}

export interface SeerahChapter {
  id: number;
  title: string;
  era: string;
  summary: string;
  content: string;
}

export interface SahabiBio {
  name: string;
  title: string;
  category: 'khulafa' | 'mubashirun' | 'mothers' | 'commanders' | 'women';
  description: string;
}

export interface ScholarProfile {
  id: string;
  name: string;
  title: string;
  bio: string;
  books: string[];
  audioSeriesTitle: string;
}

export interface QuizItem {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  rewardHasanat: number;
  rewardText: string;
}

export interface ReciterItem {
  id: string;
  name: string;
  subName?: string;
  category: 'kurdish' | 'kurdish_tafsir' | 'famous' | 'riwayat' | 'teaching';
  riwayah: string;
  serverKey: string;
}

export interface TafsirItem {
  id: string;
  title: string;
  author: string;
  category: 'kurdish' | 'arabic' | 'english' | 'persian' | 'global';
  language: string;
}
