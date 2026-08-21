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

export type BgThemeType = 'white' | 'cream' | 'dark';
export type AppLangType = 'ku' | 'ar' | 'en';
export type AccentColorType = 'gold' | 'emerald' | 'blue';
