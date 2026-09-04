
import React, {
  CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { getAyahBoxesForPage } from '../../data/ayahCoordinates';

const PAGE_COUNT = 604;

const AYAH_CANVAS_WIDTH = 1260;
const AYAH_CANVAS_HEIGHT = 2020;

const MP3QURAN_RECITERS_API =
  'https://mp3quran.net/api/v3/reciters?language=eng';

const MP3QURAN_TIMING_API =
  'https://mp3quran.net/api/v3/ayat_timing';

const AUDIO_EVENT = 'quran-reciter-changed';

type AudioSource = 'mp3quran' | 'everyayah';

interface QuranReaderProps {
  currentPage: number;
  onNextPage: () => void;
  onPrevPage: () => void;
  onBackToIndex: () => void;
  bgStyle?: CSSProperties;
  appLang: string;
  showNumbers: boolean;
  surahsList?: any[];
  onJumpToPage?: (page: number) => void;
}

interface AyahData {
  number?: number;
  ayah?: number;
  globalAyah?: number;
  text?: string;
  surahNumber?: number;
  numberInSurah?: number;
  [key: string]: unknown;
}

interface AyahBox {
  x: number;
  y: number;
  width: number;
  height: number;
  ayahNumber?: number;
  number?: number;
  index?: number;
}

interface ReaderReciter {
  id: string;
  name: string;
  subName?: string;
  source: AudioSource;
  serverKey?: string;
  baseUrl?: string;
  mp3quranId?: string | number;
}

interface TimingItem {
  ayah: number;
  start: number;
  end: number;
}

/*
 * These are the initial Kurdish reciters.
 *
 * The actual MP3Quran read is discovered dynamically from the
 * MP3Quran API using the base URL, so we don't depend only on
 * hard-coded timing IDs.
 */
const KURDISH_RECITERS: ReaderReciter[] = [
  {
    id: 'peshawa_kurdi',
    name: 'پێشەوا کوردی',
    subName: 'کوردی',
    source: 'mp3quran',
    baseUrl:
      'https://server16.mp3quran.net/peshawa/Rewayat-Hafs-A-n-Assem/',
  },
  {
    id: 'raad_kurdi',
    name: 'ڕەعد کوردی',
    subName: 'کوردی',
    source: 'mp3quran',
    baseUrl: 'https://server6.mp3quran.net/kurdi/',
  },
  {
    id: 'rizgar_kurdi',
    name: 'ڕزگار کوردی',
    subName: 'کوردی',
    source: 'everyayah',
    serverKey: 'Rizgar_Kurdi',
  },
  {
    id: 'abdulhadi_kurdi',
    name: 'عەبدولهادی کوردی',
    subName: 'کوردی',
    source: 'everyayah',
    serverKey: 'Abdulhadi_Kurdi',
  },
  {
    id: 'dilshad_kurdi',
    name: 'دڵشاد کوردی',
    subName: 'کوردی',
    source: 'everyayah',
    serverKey: 'Dilshad_Kurdi',
  },
  {
    id: 'farman_shwani',
    name: 'فەرمان شوێنی',
    subName: 'کوردی',
    source: 'everyayah',
    serverKey: 'Farman_Shwani',
  },
  {
    id: 'hamza_barzanji',
    name: 'حەمزە بارزنجی',
    subName: 'کوردی',
    source: 'everyayah',
    serverKey: 'Hamza_Barzanji',
  },
  {
    id: 'sherzad_kurdi',
    name: 'شێرزاد کوردی',
    subName: 'کوردی',
    source: 'everyayah',
    serverKey: 'Sherzad_Kurdi',
  },
  {
    id: 'ubaydah_kurdi',
    name: 'عوبەیدە کوردی',
    subName: 'کوردی',
    source: 'everyayah',
    serverKey: 'Ubaydah_Kurdi',
  },
  {
    id: 'ramadan_shakoor',
    name: 'ڕەمەزان شەکور',
    subName: 'کوردی',
    source: 'everyayah',
    serverKey: 'Ramadan_Shakoor',
  },
];

const formatPageNumber = (page: number) =>
  String(page).padStart(3, '0');

const getPageImageUrl = (page: number) =>
  `https://android.quran.com/data/width_1260/page${formatPageNumber(
    page,
  )}.png`;

const normalizeUrl = (url: string) =>
  url.endsWith('/') ? url : `${url}/`;

const getGlobalAyahNumber = (
  ayah: AyahData | undefined,
  fallback: number,
) =>
  Number(
    ayah?.globalAyah ??
      ayah?.number ??
      fallback,
  );

const getLocalAyahNumber = (
  ayah: AyahData | undefined,
  fallback: number,
) =>
  Number(
    ayah?.numberInSurah ??
      ayah?.ayah ??
      fallback,
  );

const getBoxAyahNumber = (
  box: AyahBox | undefined,
  fallback: number,
) =>
  Number(
    box?.ayahNumber ??
      box?.number ??
      (Number(box?.index ?? fallback) + 1),
  );

const normalizeTime = (value: unknown) => {
  const n = Number(value);

  if (!Number.isFinite(n) || n < 0) {
    return 0;
  }

  /*
   * MP3Quran normally returns milliseconds.
   * Small values are treated as seconds.
   */
  return n > 10000 ? n / 1000 : n;
};

const getEveryAyahUrl = (
  reciter: ReaderReciter,
  globalAyah: number,
) => {
  if (!reciter.serverKey) {
    return null;
  }

  return `https://everyayah.com/data/${
    reciter.serverKey
  }/${String(globalAyah).padStart(6, '0')}.mp3`;
};

const getSurahAudioUrl = (
  reciter: ReaderReciter,
  surahNumber: number,
) => {
  if (!reciter.baseUrl) {
    return null;
  }

  return `${normalizeUrl(reciter.baseUrl)}${String(
    surahNumber,
  ).padStart(3, '0')}.mp3`;
};

async function getMp3QuranRead(
  reciter: ReaderReciter,
) {
  if (!reciter.baseUrl) {
    throw new Error(
      'MP3Quran base URL بۆ ئەم قارییە نییە.',
    );
  }

  const response = await fetch(
    MP3QURAN_RECITERS_API,
  );

  if (!response.ok) {
    throw new Error(
      `MP3Quran API error: ${response.status}`,
    );
  }

  const json = await response.json();

  const reciters = Array.isArray(json)
    ? json
    : json?.reciters ??
      json?.data ??
      [];

  const wanted = normalizeUrl(
    reciter.baseUrl,
  );

  for (const item of reciters) {
    for (const moshaf of item?.moshaf ?? []) {
      const folder = normalizeUrl(
        String(
          moshaf?.server ??
            moshaf?.folder_url ??
            '',
        ),
      );

      if (
        folder === wanted ||
        folder.includes(wanted) ||
        wanted.includes(folder)
      ) {
        return {
          id: String(
            moshaf?.id ??
              item?.id ??
              '',
          ),
          folder,
        };
     
