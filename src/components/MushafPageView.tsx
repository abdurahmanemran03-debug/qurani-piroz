// MushafPageView.tsx
// Full replacement file for the Quran page viewer.
// NOTE: This file expects audioStorage.ts to export:
// getAyahAudio, saveAyahAudio, getSurahAudio, saveSurahAudio,
// deleteSurahAudio, getDownloadedAyahCount, isSurahAudioDownloaded.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  deleteSurahAudio,
  getAyahAudio,
  getDownloadedAyahCount,
  getSurahAudio,
  isSurahAudioDownloaded,
  saveAyahAudio,
  saveSurahAudio,
} from '../utils/audioStorage';

export interface ReciterItem {
  id: string;
  name: string;
  subName?: string;
  category:
    | 'kurdish'
    | 'kurdish_tafsir'
    | 'famous'
    | 'riwayat'
    | 'teaching';
  riwayah: string;
  serverKey: string;
  audioSource?: 'everyayah' | 'mp3quran';
  audioBaseUrl?: string;
}

export interface TafsirItem {
  id: string;
  name?: string;
  title?: string;
  author?: string;
  language?: string;
  source?: string;
  edition?: string;
  [key: string]: unknown;
}

interface AyahData {
  number?: number;
  ayah?: number;
  globalAyah?: number;
  text?: string;
  surahNumber?: number;
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

interface SurahItem {
  number?: number;
  id?: number;
  name?: string;
  englishName?: string;
  startPage?: number;
  page?: number;
  ayahs?: number;
  numberOfAyahs?: number;
  [key: string]: unknown;
}

interface MushafPageViewProps {
  currentPage: number;
  onNextPage: () => void;
  onPrevPage: () => void;
  onBackToIndex: () => void;
  bgStyle?: React.CSSProperties;
  appLang: string;
  showNumbers: boolean;
  surahsList?: SurahItem[];
  onJumpToPage?: (page: number) => void;
}

const AYAH_CANVAS_WIDTH = 1260;
const AYAH_CANVAS_HEIGHT = 2020;
const AUDIO_EVENT = 'quran-reciter-changed';

const ALL_RECITERS_DIRECTORY: ReciterItem[] = [
  { id: 'peshawa_kurdi', name: 'پێشەوا هەڵەبجەیی', subName: 'کوردی', category: 'kurdish', riwayah: 'حفص', serverKey: 'Peshawa_Kurdi', audioSource: 'mp3quran', audioBaseUrl: 'https://server16.mp3quran.net/peshawa/Rewayat-Hafs-A-n-Assem/' },
  { id: 'raad_kurdi', name: 'ڕەعد کوردی', subName: 'کوردی', category: 'kurdish', riwayah: 'حفص', serverKey: 'Raad_Al_Kurdi', audioSource: 'mp3quran', audioBaseUrl: 'https://server6.mp3quran.net/kurdi/' },
  { id: 'rizgar_kurdi', name: 'ڕزگار کوردی', subName: 'کوردی', category: 'kurdish', riwayah: 'حفص', serverKey: 'Rizgar_Kurdi' },
  { id: 'abdulhadi_kurdi', name: 'عەبدولهادی کوردی', subName: 'کوردی', category: 'kurdish', riwayah: 'حفص', serverKey: 'Abdulhadi_Kurdi' },
  { id: 'dilshad_kurdi', name: 'دڵشاد کوردی', subName: 'کوردی', category: 'kurdish', riwayah: 'حفص', serverKey: 'Dilshad_Kurdi' },
  { id: 'farman_shwani', name: 'فەرمان شوێنی', subName: 'کوردی', category: 'kurdish', riwayah: 'حفص', serverKey: 'Farman_Shwani' },
  { id: 'hamza_barzanji', name: 'حەمزە بارزنجی', subName: 'کوردی', category: 'kurdish', riwayah: 'حفص', serverKey: 'Hamza_Barzanji' },
  { id: 'sherzad_kurdi', name: 'شێرزاد کوردی', subName: 'کوردی', category: 'kurdish', riwayah: 'حفص', serverKey: 'Sherzad_Kurdi' },
  { id: 'ubaydah_kurdi', name: 'عوبەیدە کوردی', subName: 'کوردی', category: 'kurdish', riwayah: 'حفص', serverKey: 'Ubaydah_Kurdi' },
  { id: 'ramazan_shukur', name: 'ڕەمەزان شکور', subName: 'کوردی', category: 'kurdish', riwayah: 'حفص', serverKey: 'Ramazan_Shukur', audioSource: 'mp3quran', audioBaseUrl: 'https://server6.mp3quran.net/shakoor/' },

  { id: 'handren_tafsir', name: 'هەندرێن', subName: 'تەفسیر', category: 'kurdish_tafsir', riwayah: 'حفص', serverKey: 'Handren_Tafsir' },
  { id: 'ghamdi_handren_asan', name: 'غەمیدی - هەندرێن ئاسان', subName: 'تەفسیر', category: 'kurdish_tafsir', riwayah: 'حفص', serverKey: 'Ghamdi_Handren_Asan' },
  { id: 'ghamdi_tahsin_badini', name: 'تەحسین دۆسکی سەنەحی', subName: 'بادینی', category: 'kurdish_tafsir', riwayah: 'حفص', serverKey: 'Tahsin_Doski_Sanahi' },
  { id: 'naqshbandi_badini', name: 'نەقشبەندی بادینی', subName: 'بادینی', category: 'kurdish_tafsir', riwayah: 'حفص', serverKey: 'Naqshbandi_Badini' },

  { id: 'alafasy', name: 'مشاری العفاسی', category: 'famous', riwayah: 'حفص', serverKey: 'Alafasy_128kbps' },
  { id: 'abdul_basit_murattal', name: 'عبدالباسط - مرتل', category: 'famous', riwayah: 'حفص', serverKey: 'Abdul_Basit_Murattal_192kbps' },
  { id: 'abdul_basit_mujawwad', name: 'عبدالباسط - مجود', category: 'famous', riwayah: 'حفص', serverKey: 'Abdul_Basit_Mujawwad_128kbps' },
  { id: 'minshawy_murattal', name: 'محمد صدیق المنشاوی - مرتل', category: 'famous', riwayah: 'حفص', serverKey: 'Minshawy_Murattal_128kbps' },
  { id: 'minshawy_mujawwad', name: 'محمد صدیق المنشاوی - مجود', category: 'famous', riwayah: 'حفص', serverKey: 'Minshawy_Mujawwad_192kbps' },
  { id: 'husary_murattal', name: 'محمود خلیل الحصری - مرتل', category: 'famous', riwayah: 'حفص', serverKey: 'Husary_128kbps' },
  { id: 'husary_mujawwad', name: 'محمود خلیل الحصری - مجود', category: 'famous', riwayah: 'حفص', serverKey: 'Husary_128kbps_Mujawwad' },
  { id: 'maher_muaiqly', name: 'ماهر المعیقلی', category: 'famous', riwayah: 'حفص', serverKey: 'Maher_AlMuaiqly_64kbps' },
  { id: 'saad_ghamdi', name: 'سعد الغامدی', category: 'famous', riwayah: 'حفص', serverKey: 'Ghamadi_40kbps' },
  { id: 'yasser_dosari', name: 'یاسر الدوسری', category: 'famous', riwayah: 'حفص', serverKey: 'Yasser_Ad-Dussary_128kbps' },
  { id: 'sudais', name: 'عبدالرحمن السدیس', category: 'famous', riwayah: 'حفص', serverKey: 'Abdurrahmaan_As-Sudais_192kbps' },
  { id: 'shuraim', name: 'سعود الشریم', category: 'famous', riwayah: 'حفص', serverKey: 'Saood_ash-Shuraym_128kbps' },
  { id: 'ahmed_ajamy', name: 'احمد العجمی', category: 'famous', riwayah: 'حفص', serverKey: 'Ahmed_ibn_Ali_al-Ajamy_128kbps' },
  { id: 'abu_bakr_shatri', name: 'ابوبکر الشاطری', category: 'famous', riwayah: 'حفص', serverKey: 'Abu_Bakr_Ash-Shaatree_128kbps' },
  { id: 'idrees_abkar', name: 'ادریس ابکر', category: 'famous', riwayah: 'حفص', serverKey: 'Idrees_Abkar_128kbps' },
  { id: 'nasser_qatami', name: 'ناصر القطامی', category: 'famous', riwayah: 'حفص', serverKey: 'Nasser_Alqatami_128kbps' },
  { id: 'ali_jaber', name: 'علی جابر', category: 'famous', riwayah: 'حفص', serverKey: 'Ali_Jaber_64kbps' },
  { id: 'muhammad_ayyub', name: 'محمد ایوب', category: 'famous', riwayah: 'حفص', serverKey: 'Muhammad_Ayyoub_128kbps' },
  { id: 'muhammad_jibreel', name: 'محمد جبریل', category: 'famous', riwayah: 'حفص', serverKey: 'Muhammad_Jibreel_128kbps' },
  { id: 'khalid_jalil', name: 'خالد الجلیل', category: 'famous', riwayah: 'حفص', serverKey: 'Khalid_AlJaleel_128kbps' },
  { id: 'khalid_qahtani', name: 'خالد القحطانی', category: 'famous', riwayah: 'حفص', serverKey: 'Khaalid_Abdullaah_al-Qahtaanee_192kbps' },
  { id: 'abdullah_juhany', name: 'عبدالله الجهني', category: 'famous', riwayah: 'حفص', serverKey: 'Abdullaah_3awwaad_Al-Juhaynee_128kbps' },
  { id: 'abdullah_basfar', name: 'عبدالله بصفر', category: 'famous', riwayah: 'حفص', serverKey: 'Abdullah_Basfar_192kbps' },
  { id: 'abdulmohsen_qasim', name: 'عبدالمحسن القاسم', category: 'famous', riwayah: 'حفص', serverKey: 'Muhsin_Al_Qasim_192kbps' },
  { id: 'fares_abbad', name: 'فارس عباد', category: 'famous', riwayah: 'حفص', serverKey: 'Fares_Abbad_64kbps' },
  { id: 'hudhaify', name: 'علی الحذیفی', category: 'famous', riwayah: 'حفص', serverKey: 'Hudhaify_128kbps' },
  { id: 'hani_rifai', name: 'هانی الرفاعی', category: 'famous', riwayah: 'حفص', serverKey: 'Hani_Rifai_192kbps' },
  { id: 'ayman_suwaid', name: 'ایمن سوید', category: 'famous', riwayah: 'teaching', serverKey: 'Ayman_Sowaid_64kbps' },
  { id: 'tariq_ibrahim', name: 'ابراهیم اخضر', category: 'famous', riwayah: 'حفص', serverKey: 'Ibrahim_Akhdar_32kbps' },
  { id: 'wadih_yamani', name: 'وضیح الیمنی', category: 'famous', riwayah: 'حفص', serverKey: 'Wadih_Al-Yamani_128kbps' },
  { id: 'nourin_siddeeq', name: 'نورین صدیق', category: 'famous', riwayah: 'حفص', serverKey: 'Nourin_Siddiq_128kbps' },

  { id: 'yassin_aljazairi_warsh', name: 'یاسین الجزائری', category: 'riwayat', riwayah: 'ورش', serverKey: 'Yassin_AlJazaery_Warsh_64kbps' },
  { id: 'khamiri_shubah', name: 'خمیری', category: 'riwayat', riwayah: 'شعبة', serverKey: 'Khamiri_Shubah_128kbps' },
  { id: 'miftah_saltany_duri', name: 'مفتاح السلطانی', category: 'riwayat', riwayah: 'الدوری', serverKey: 'Saltany_Duri_128kbps' },
  { id: 'abdulrashid_sofi_susi', name: 'عبدالرشید صوفی', category: 'riwayat', riwayah: 'السوسی', serverKey: 'Soufi_Susi_128kbps' },
  { id: 'abdulrashid_sofi_khalaf', name: 'عبدالرشید صوفی', category: 'riwayat', riwayah: 'خلف', serverKey: 'Soufi_Khalaf_128kbps' },

  { id: 'husary_muallim', name: 'الحصری - معلم', category: 'teaching', riwayah: 'حفص', serverKey: 'Husary_Muallim_128kbps' },
  { id: 'minshawy_children', name: 'المنشاوی - معلم', category: 'teaching', riwayah: 'حفص', serverKey: 'Minshawy_Teacher_128kbps' },
];

const ALL_TAFSIRS_DIRECTORY: TafsirItem[] = [
  { id: 'asan', name: 'تەفسیری ئاسان', title: 'تەفسیری ئاسان', language: 'ku' },
];

const formatPageNum = (n: number) => String(n).padStart(3, '0');

const pageImgUrl = (n: number) =>
  `https://android.quran.com/data/width_1260/page${formatPageNum(n)}.png`;

const normalizeUrl = (url: string) => (url.endsWith('/') ? url : `${url}/`);

const makeEveryAyahUrl = (reciter: ReciterItem, globalAyah: number) =>
  `https://everyayah.com/data/${reciter.serverKey}/${String(globalAyah).padStart(6, '0')}.mp3`;

const makeMp3QuranSurahUrl = (reciter: ReciterItem, surahNumber: number) =>
  `${normalizeUrl(reciter.audioBaseUrl || '')}${String(surahNumber).padStart(3, '0')}.mp3`;

const normalizeTimingValue = (value: unknown): number => {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;

  // MP3Quran normally returns milliseconds.
  return n > 10000 ? n / 1000 : n;
};

const getInitialReciter = () => {
  try {
    const saved = localStorage.getItem('quran_selected_reciter');

    if (saved) {
      const found = ALL_RECITERS_DIRECTORY.find((r) => r.id === saved);
      if (found) return found;
    }
  } catch {}

  return ALL_RECITERS_DIRECTORY[18];
};

const getGlobalAyahNumber = (
  ayah: AyahData | undefined,
  fallback: number,
) => Number(ayah?.globalAyah ?? ayah?.number ?? fallback);

const getAyahNumber = (
  ayah: AyahData | undefined,
  fallback: number,
) => Number(ayah?.ayah ?? ayah?.number ?? fallback);

const getBoxAyahNumber = (
  box: AyahBox | undefined,
  fallback: number,
) =>
  Number(
    box?.ayahNumber ??
      box?.number ??
      (Number(box?.index ?? fallback) + 1),
  );

async function getMp3QuranRead(reciter: ReciterItem) {
  if (!reciter.audioBaseUrl) {
    throw new Error('MP3Quran audio base URL is missing.');
  }

  const response = await fetch(
    'https://mp3quran.net/api/v3/reciters?language=eng',
  );

  if (!response.ok) {
    throw new Error(
      `MP3Quran reciters request failed: ${response.status}`,
    );
  }

  const json = await response.json();

  const reciters = Array.isArray(json)
    ? json
    : json?.reciters ?? json?.data ?? [];

  for (const item of reciters) {
    for (const moshaf of item?.moshaf ?? []) {
      const folder = normalizeUrl(
        String(moshaf?.server ?? moshaf?.folder_url ?? ''),
      );

      if (
        folder === normalizeUrl(reciter.audioBaseUrl) ||
        folder.includes(normalizeUrl(reciter.audioBaseUrl)) ||
        normalizeUrl(reciter.audioBaseUrl).includes(folder)
      ) {
        return {
          id: String(moshaf?.id ?? item?.id ?? ''),
          folder,
        };
      }
    }
  }

  throw new Error(`MP3Quran read not found for ${reciter.name}`);
}

async function getMp3QuranTiming(
  readId: string | number,
  surahNumber: number,
) {
  const url = new URL(
    'https://mp3quran.net/api/v3/ayat_timing',
  );

  url.searchParams.set('surah', String(surahNumber));
  url.searchParams.set('read', String(readId));

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(
      `MP3Quran timing request failed: ${response.status}`,
    );
  }

  const json = await response.json();

  const rows = Array.isArray(json)
    ? json
    : json?.ayat ??
      json?.data ??
      json?.timing ??
      json?.ayahs ??
      [];

  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error(
      'No ayah timing was returned by MP3Quran.',
    );
  }

  return rows.map((row: any, index: number) => ({
    ayah: Number(
      row?.ayah ??
        row?.ayah_number ??
        row?.number ??
        index,
    ),
    start: normalizeTimingValue(
      row?.start_time ?? row?.start ?? 0,
    ),
    end: normalizeTimingValue(
      row?.end_time ?? row?.end ?? 0,
    ),
  }));
}

const getSurahNumberForPage = (
  page: number,
  surahsList: SurahItem[] | undefined,
  fallback = 1,
) => {
  if (!surahsList?.length) return fallback;

  const sorted = [...surahsList]
    .filter(
      (s) => Number(s.startPage ?? s.page) > 0,
    )
    .sort(
      (a, b) =>
        Number(a.startPage ?? a.page) -
        Number(b.startPage ?? b.page),
    );

  let selected = sorted[0];

  for (const surah of sorted) {
    if (
      Number(surah.startPage ?? surah.page) <= page
    ) {
      selected = surah;
    }
  }

  return Number(
    selected?.number ??
      selected?.id ??
      fallback,
  );
}

export function MushafPageView({
  currentPage,
  onNextPage,
  onPrevPage,
  onBackToIndex,
  bgStyle,
  appLang,
  showNumbers,
  surahsList,
  onJumpToPage,
}: MushafPageViewProps) {
  const [viewMode, setViewMode] = useState<
    'mushaf' | 'scroll'
  >('mushaf');

  const [showControls, setShowControls] =
    useState(true);

  const [recitersOpen, setRecitersOpen] =
    useState(false);

  const [tafsirOpen, setTafsirOpen] =
    useState(false);

  const [selectedReciter, setSelectedReciter] =
    useState<ReciterItem>(getInitialReciter);

  const [selectedTafsir, setSelectedTafsir] =
    useState<TafsirItem>(
      ALL_TAFSIRS_DIRECTORY[0],
    );

  const [pageAyahsData, setPageAyahsData] =
    useState<AyahData[]>([]);

  const [ayahBoxes, setAyahBoxes] =
    useState<AyahBox[]>([]);

  const [selectedAyahIndex, setSelectedAyahIndex] =
    useState<number | null>(null);

  const [playingAyahIndex, setPlayingAyahIndex] =
    useState<number | null>(null);

  const [tafsirText, setTafsirText] =
    useState('');

  const [tafsirLoading, setTafsirLoading] =
    useState(false);

  const [tafsirVisible, setTafsirVisible] =
    useState(false);

  const [isPlaying, setIsPlaying] =
    useState(false);

  const [downloadedCount, setDownloadedCount] =
    useState(0);

  const [surahDownloaded, setSurahDownloaded] =
    useState(false);

  const [downloadProgress, setDownloadProgress] =
    useState(0);

  const [downloadBusy, setDownloadBusy] =
    useState(false);

  const [errorText, setErrorText] =
    useState('');

  const audioRef =
    useRef<HTMLAudioElement | null>(null);

  const scrollRef =
    useRef<HTMLDivElement | null>(null);

  const longPressTimerRef =
    useRef<number | null>(null);

  const currentBlobUrlRef =
    useRef<string | null>(null);

  const pageAudioTokenRef =
    useRef(0);

  const pages = useMemo(
    () =>
      Array.from(
        { length: 604 },
        (_, i) => 604 - i,
      ),
    [],
  );

  const currentSurahNumber = useMemo(
    () =>
      getSurahNumberForPage(
        currentPage,
        surahsList,
      ),
    [currentPage, surahsList],
  );

  const currentSurah = useMemo(() => {
    const list = surahsList ?? [];

    return list.find(
      (s) =>
        Number(s.number ?? s.id) ===
        currentSurahNumber,
    );
  }, [
    surahsList,
    currentSurahNumber,
  ]);

  const currentSurahAyahCount = Number(
    currentSurah?.numberOfAyahs ??
      currentSurah?.ayahs ??
      0,
  );

  const cleanupBlobUrl = useCallback(() => {
    if (currentBlobUrlRef.current) {
      URL.revokeObjectURL(
        currentBlobUrlRef.current,
      );

      currentBlobUrlRef.current = null;
    }
  }, []);

  const stopAudio = useCallback(() => {
    pageAudioTokenRef.current += 1;

    const audio = audioRef.current;

    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      audio.removeAttribute('src');
      audio.load();
    }

    cleanupBlobUrl();

    setIsPlaying(false);
    setPlayingAyahIndex(null);
  }, [cleanupBlobUrl]);

  const refreshDownloadInfo = useCallback(
    async () => {
      try {
        const count =
          await getDownloadedAyahCount(
            selectedReciter.id,
            currentPage,
          );

        setDownloadedCount(
          Number(count) || 0,
        );

        setSurahDownloaded(
          await isSurahAudioDownloaded(
            selectedReciter.id,
            currentSurahNumber,
          ),
        );
      } catch {
        setDownloadedCount(0);
        setSurahDownloaded(false);
      }
    },
    [
      selectedReciter.id,
      currentPage,
      currentSurahNumber,
    ],
  );

  useEffect(() => {
    try {
      localStorage.setItem(
        'quran_selected_reciter',
        selectedReciter.id,
      );

      window.dispatchEvent(
        new CustomEvent(AUDIO_EVENT, {
          detail: selectedReciter.id,
        }),
      );
    } catch {}
  }, [selectedReciter]);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail =
        (event as CustomEvent).detail;

      const id =
        typeof detail === 'string'
          ? detail
          : detail?.id;

      if (!id) return;

      const found =
        ALL_RECITERS_DIRECTORY.find(
          (r) => r.id === id,
        );

      if (found) {
        setSelectedReciter(found);
      }
    };

    window.addEventListener(
      AUDIO_EVENT,
      handler,
    );

    return () =>
      window.removeEventListener(
        AUDIO_EVENT,
        handler,
      );
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadPageData = async () => {
      try {
        const response = await fetch(
          `https://api.alquran.cloud/v1/page/${currentPage}/editions/quran-uthmani,ku.asan`,
        );

        if (!response.ok) {
          throw new Error(
            `Quran API failed: ${response.status}`,
          );
        }

        const json =
          await response.json();

        const editions =
          json?.data ?? [];

        const arabic =
          editions.find(
            (x: any) =>
              x?.edition?.identifier ===
              'quran-uthmani',
          );

        const data =
          arabic?.ayahs ?? [];

        if (!cancelled) {
          setPageAyahsData(data);
          setErrorText('');
        }
      } catch (error) {
        if (!cancelled) {
          setPageAyahsData([]);
          setErrorText(
            error instanceof Error
              ? error.message
              : 'Quran data failed',
          );
        }
      }
    };

    loadPageData();

    return () => {
      cancelled = true;
    };
  }, [currentPage]);

  useEffect(() => {
    let cancelled = false;

    const loadBoxes = async () => {
      try {
        const base =
          import.meta.env.BASE_URL || '/';

        const url =
          `${base.replace(/\/?$/, '/')}` +
          'ayahdata/ayahdata.json';

        const response =
          await fetch(url);

        if (!response.ok) {
          throw new Error(
            'Ayah coordinate file not found',
          );
        }

        const json =
          await response.json();

        const raw =
          json?.[String(currentPage)] ??
          json?.[currentPage] ??
          [];

        const boxes: AyahBox[] =
          Array.isArray(raw)
            ? raw
            : raw?.boxes ??
              raw?.ayahs ??
              [];

        if (!cancelled) {
          setAyahBoxes(boxes);
        }
      } catch {
        if (!cancelled) {
          setAyahBoxes([]);
        }
      }
    };

    loadBoxes();

    return () => {
      cancelled = true;
    };
  }, [currentPage]);

  useEffect(() => {
    refreshDownloadInfo();
  }, [refreshDownloadInfo]);

  useEffect(() => {
    return () => {
      stopAudio();

      if (longPressTimerRef.current) {
        window.clearTimeout(
          longPressTimerRef.current,
        );
      }
    };
  }, [stopAudio]);

  const getAyahForIndex = (index: number) =>
    pageAyahsData[index];

  const playAyah = useCallback(
    async (
      index: number,
      autoAdvance = false,
    ) => {
      const ayah =
        getAyahForIndex(index);

      if (!ayah) return;

      const token =
        ++pageAudioTokenRef.current;

      setErrorText('');
      setPlayingAyahIndex(index);
      setIsPlaying(true);

      try {
        let src: string | null = null;

        const globalAyah =
          getGlobalAyahNumber(
            ayah,
            index + 1,
          );

        const localAyah =
          getAyahNumber(
            ayah,
            index + 1,
          );

        const localBlob =
          await getAyahAudio(
            selectedReciter.id,
            currentSurahNumber,
            localAyah,
          );

        if (
          token !==
          pageAudioTokenRef.current
        ) {
          return;
        }

        if (localBlob) {
          cleanupBlobUrl();

          currentBlobUrlRef.current =
            URL.createObjectURL(
              localBlob,
            );

          src =
            currentBlobUrlRef.current;
        } else if (
          selectedReciter.audioSource ===
          'mp3quran'
        ) {
          const read =
            await getMp3QuranRead(
              selectedReciter,
            );

          const timing =
            await getMp3QuranTiming(
              read.id,
              currentSurahNumber,
            );

          const segment =
            timing.find(
              (t) =>
                t.ayah ===
                  localAyah ||
                t.ayah === index,
            );

          if (
            !segment ||
            segment.end <=
              segment.start
          ) {
            throw new Error(
              'کاتی دەستپێک و کۆتایی ئەم ئایەتە نەدۆزرایەوە.',
            );
          }

          src =
            read.folder +
            `${String(
              currentSurahNumber,
            ).padStart(3, '0')}.mp3`;

          cleanupBlobUrl();

          const audio =
            audioRef.current;

          if (!audio) {
            throw new Error(
              'Audio element not ready.',
            );
          }

          audio.src = src;
          audio.currentTime =
            segment.start;

          await audio.play();

          const stopAt = () => {
            if (
              token !==
              pageAudioTokenRef.current
            ) {
              return;
            }

            if (
              audio.currentTime >=
              segment.end - 0.08
            ) {
              audio.removeEventListener(
                'timeupdate',
                stopAt,
              );

              audio.pause();

              if (
                autoAdvance &&
                index + 1 <
                  pageAyahsData.length
              ) {
                void playAyah(
                  index + 1,
                  true,
                );
              } else {
                setIsPlaying(false);
                setPlayingAyahIndex(
                  null,
                );
              }
            }
          };

          audio.addEventListener(
            'timeupdate',
            stopAt,
          );

          return;
        } else {
          src =
            makeEveryAyahUrl(
              selectedReciter,
              globalAyah,
            );
        }

        if (
          token !==
          pageAudioTokenRef.current
        ) {
          return;
        }

        const audio =
          audioRef.current;

        if (!audio) {
          throw new Error(
            'Audio element not ready.',
          );
        }

        audio.src = src;
        audio.currentTime = 0;

        await audio.play();

        if (autoAdvance) {
          const onEnded = () => {
            audio.removeEventListener(
              'ended',
              onEnded,
            );

            if (
              index + 1 <
              pageAyahsData.length
            ) {
              void playAyah(
                index + 1,
                true,
              );
            } else {
              setIsPlaying(false);
              setPlayingAyahIndex(
                null,
              );
            }
          };

          audio.addEventListener(
            'ended',
            onEnded,
          );
        }
      } catch (error) {
        setIsPlaying(false);
        setPlayingAyahIndex(null);

        setErrorText(
          error instanceof Error
            ? error.message
            : 'دەنگ نەدۆزرایەوە.',
        );
      }
    },
    [
      currentSurahNumber,
      pageAyahsData,
      selectedReciter,
      cleanupBlobUrl,
    ],
  );

  const handleAyahPointerDown = (
    index: number,
  ) => {
    if (longPressTimerRef.current) {
      window.clearTimeout(
        longPressTimerRef.current,
      );
    }

    longPressTimerRef.current =
      window.setTimeout(() => {
        setSelectedAyahIndex(index);
        setShowControls(true);
      }, 450);
  };

  const handleAyahPointerUp = () => {
    if (longPressTimerRef.current) {
      window.clearTimeout(
        longPressTimerRef.current,
      );

      longPressTimerRef.current =
        null;
    }
  };

  const handleAyahClick = (
    index: number,
  ) => {
    setSelectedAyahIndex(index);
  };

  const fetchTafsir = useCallback(
    async (index: number) => {
      const ayah =
        getAyahForIndex(index);

      if (!ayah) return;

      setTafsirLoading(true);
      setTafsirVisible(true);
      setTafsirText('');

      try {
        const response =
          await fetch(
            `https://api.alquran.cloud/v1/page/${currentPage}/editions/quran-uthmani,ku.asan`,
          );

        if (!response.ok) {
          throw new Error(
            'Tafsir API failed',
          );
        }

        const json =
          await response.json();

        const editions =
          json?.data ?? [];

        const tafsirEdition =
          editions.find(
            (x: any) =>
              x?.edition?.identifier ===
                'ku.asan' ||
              x?.edition?.language ===
                'ku',
          );

        const text =
          tafsirEdition?.ayahs?.[
            index
          ]?.text;

        setTafsirText(
          text ||
            'تەفسیر بۆ ئەم ئایەتە بەردەست نییە.',
        );
      } catch {
        setTafsirText(
          'نەتوانرا تەفسیر بهێنرێت.',
        );
      } finally {
        setTafsirLoading(false);
      }
    },
    [currentPage, pageAyahsData],
  );

  const toggleBookmark = (
    index: number,
  ) => {
    const ayah =
      getAyahForIndex(index);

    if (!ayah) return;

    const globalAyah =
      getGlobalAyahNumber(
        ayah,
        index + 1,
      );

    try {
      const key =
        'quran_ayah_bookmarks';

      const existing =
        JSON.parse(
          localStorage.getItem(
            key,
          ) || '[]',
        );

      const list =
        Array.isArray(existing)
          ? existing
          : [];

      const already =
        list.some(
          (item: any) =>
            Number(
              item?.globalAyah ??
                item?.number,
            ) === globalAyah,
        );

      const next = already
        ? list.filter(
            (item: any) =>
              Number(
                item?.globalAyah ??
                  item?.number,
              ) !== globalAyah,
          )
        : [
            ...list,
            {
              globalAyah,
              page: currentPage,
              ayah: index + 1,
            },
          ];

      localStorage.setItem(
        key,
        JSON.stringify(next),
      );
    } catch {}
  };

  const downloadCurrentAyah =
    async () => {
      if (
        selectedAyahIndex == null
      ) {
        return;
      }

      const ayah =
        getAyahForIndex(
          selectedAyahIndex,
        );

      if (!ayah) return;

      setDownloadBusy(true);
      setErrorText('');

      try {
        const globalAyah =
          getGlobalAyahNumber(
            ayah,
            selectedAyahIndex + 1,
          );

        const localAyah =
          getAyahNumber(
            ayah,
            selectedAyahIndex + 1,
          );

        const url =
          selectedReciter.audioSource ===
          'mp3quran'
            ? (() => {
                throw new Error(
                  'MP3Quran بۆ دانلودی تاکە ئایەت پێویستی بە timing هەیە؛ لە ئێستادا تەنها دانلودی سۆرە بەکاربهێنە.',
                );
              })()
            : makeEveryAyahUrl(
                selectedReciter,
                globalAyah,
              );

        const response =
          await fetch(url);

        if (!response.ok) {
          throw new Error(
            `Audio download failed: ${response.status}`,
          );
        }

        const blob =
          await response.blob();

        await saveAyahAudio(
          selectedReciter.id,
          currentSurahNumber,
          localAyah,
          blob,
        );

        await refreshDownloadInfo();
      } catch (error) {
        setErrorText(
          error instanceof Error
            ? error.message
            : 'دانلود سەرکەوتوو نەبوو.',
        );
      } finally {
        setDownloadBusy(false);
      }
    };

  const downloadCurrentSurah =
    async () => {
      if (
        selectedReciter.audioSource !==
          'mp3quran' ||
        !selectedReciter.audioBaseUrl
      ) {
        setErrorText(
          'دانلودی سۆرە لەم قارییەدا بە شێوەی MP3Quran بەردەست نییە.',
        );
        return;
      }

      setDownloadBusy(true);
      setDownloadProgress(0);
      setErrorText('');

      try {
        const response =
          await fetch(
            makeMp3QuranSurahUrl(
              selectedReciter,
              currentSurahNumber,
            ),
          );

        if (!response.ok) {
          throw new Error(
            `Surah download failed: ${response.status}`,
          );
        }

        const total =
          Number(
            response.headers.get(
              'content-length',
            ),
          ) || 0;

        const reader =
          response.body?.getReader();

        if (!reader) {
          const blob =
            await response.blob();

          await saveSurahAudio(
            selectedReciter.id,
            currentSurahNumber,
            blob,
          );

          setDownloadProgress(100);

          await refreshDownloadInfo();

          return;
        }

        const chunks: Uint8Array[] =
          [];

        let received = 0;

        while (true) {
          const {
            done,
            value,
          } = await reader.read();

          if (done) break;

          if (value) {
            chunks.push(value);

            received +=
              value.length;

            if (total > 0) {
              setDownloadProgress(
                Math.round(
                  (received /
                    total) *
                    100,
                ),
              );
            }
          }
        }

        const blob =
          new Blob(chunks, {
            type: 'audio/mpeg',
          });

        await saveSurahAudio(
          selectedReciter.id,
          currentSurahNumber,
          blob,
        );

        setDownloadProgress(100);

        await refreshDownloadInfo();
      } catch (error) {
        setErrorText(
          error instanceof Error
            ? error.message
            : 'دانلودی سۆرە سەرکەوتوو نەبوو.',
        );
      } finally {
        setDownloadBusy(false);
      }
    };

  const deleteCurrentSurah =
    async () => {
      try {
        await deleteSurahAudio(
          selectedReciter.id,
          currentSurahNumber,
        );

        await refreshDownloadInfo();
      } catch (error) {
        setErrorText(
          error instanceof Error
            ? error.message
            : 'سڕینەوە سەرکەوتوو نەبوو.',
        );
      }
    };

  const handlePageScroll = () => {
    const el =
      scrollRef.current;

    if (
      !el ||
      !onJumpToPage
    ) {
      return;
    }

    const pageIndex =
      Math.round(
        el.scrollLeft /
          el.clientWidth,
      );

    const targetPage =
      604 - pageIndex;

    if (
      targetPage >= 1 &&
      targetPage <= 604
    ) {
      onJumpToPage(
        targetPage,
      );
    }
  };

  const pageImageStyle: React.CSSProperties =
    {
      display: 'block',
      width: '100%',
      height: '100%',
      objectFit: 'contain',
      filter:
        'grayscale(100%) contrast(115%) brightness(102%)',
      mixBlendMode: 'multiply',
      userSelect: 'none',
      pointerEvents: 'none',
    };

  const boxScaleStyle = (
    box: AyahBox,
  ): React.CSSProperties => ({
    position: 'absolute',
    left: `${
      (box.x /
        AYAH_CANVAS_WIDTH) *
      100
    }%`,
    top: `${
      (box.y /
        AYAH_CANVAS_HEIGHT) *
      100
    }%`,
    width: `${
      (box.width /
        AYAH_CANVAS_WIDTH) *
      100
    }%`,
    height: `${
      (box.height /
        AYAH_CANVAS_HEIGHT) *
      100
    }%`,
    background: 'transparent',
    border: 'none',
    padding: 0,
    margin: 0,
    cursor: 'pointer',
    touchAction: 'manipulation',
  });

  const renderPage = (
    page: number,
  ) => {
    const isCurrent =
      page === currentPage;

    const boxes =
      isCurrent
        ? ayahBoxes
        : [];

    return (
      <div
        key={page}
        style={{
          flex: '0 0 100%',
          width: '100%',
          height: '100%',
          position: 'relative',
          scrollSnapAlign: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            maxWidth: 1260,
            maxHeight: 2020,
          }}
        >
          <img
            src={pageImgUrl(page)}
            alt={`Quran page ${page}`}
            draggable={false}
            style={pageImageStyle}
          />

          {isCurrent &&
            boxes.map(
              (box, index) => {
                const boxAyah =
                  getBoxAyahNumber(
                    box,
                    index,
                  );

                const selected =
                  selectedAyahIndex ===
                  boxAyah - 1;

                const playing =
                  playingAyahIndex ===
                  boxAyah - 1;

                return (
                  <button
                    key={`${page}-${index}`}
                    aria-label={`Ayah ${boxAyah}`}
                    style={{
                      ...boxScaleStyle(
                        box,
                      ),
                      outline:
                        selected ||
                        playing
                          ? '2px solid rgba(255,140,0,.65)'
                          : 'none',
                      background:
                        playing
                          ? 'rgba(255,165,0,.10)'
                          : selected
                            ? 'rgba(255,165,0,.06)'
                            : 'transparent',
                    }}
                    onClick={() =>
                      handleAyahClick(
                        boxAyah - 1,
                      )
                    }
                    onPointerDown={() =>
                      handleAyahPointerDown(
                        boxAyah - 1,
                      )
                    }
                    onPointerUp={
                      handleAyahPointerUp
                    }
                    onPointerCancel={
                      handleAyahPointerUp
                    }
                    onPointerLeave={
                      handleAyahPointerUp
                    }
                  />
                );
              },
            )}
        </div>

        {showNumbers && (
          <div
            style={{
              position: 'absolute',
              bottom: 8,
              left: 0,
              right: 0,
              textAlign: 'center',
              fontSize: 12,
              opacity: 0.55,
            }}
          >
            {page}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        background: '#f7f3ea',
        ...bgStyle,
      }}
      dir="rtl"
      onClick={() => {
        if (
          selectedAyahIndex == null
        ) {
          setShowControls(
            (v) => !v,
          );
        }
      }}
    >
      <audio
        ref={audioRef}
        preload="none"
        onPlay={() =>
          setIsPlaying(true)
        }
        onPause={() =>
          setIsPlaying(false)
        }
        onError={() => {
          setIsPlaying(false);
          setPlayingAyahIndex(
            null,
          );

          setErrorText(
            'کێشەیەک لە سەرچاوەی دەنگ ڕوویدا.',
          );
        }}
      />

      {viewMode === 'scroll' ? (
        <div
          ref={scrollRef}
          onScroll={
            handlePageScroll
          }
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            overflowX: 'auto',
            overflowY: 'hidden',
            scrollSnapType:
              'x mandatory',
            direction: 'ltr',
            WebkitOverflowScrolling:
              'touch',
          }}
        >
          {pages.map(
            renderPage,
          )}
        </div>
      ) : (
        <div
          style={{
            width: '100%',
            height: '100%',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {renderPage(
            currentPage,
          )}
        </div>
      )}

      {showControls && (
        <div
          style={{
            position: 'absolute',
            top: 10,
            left: 10,
            right: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent:
              'space-between',
            gap: 8,
            zIndex: 30,
          }}
          onClick={(e) =>
            e.stopPropagation()
          }
        >
          <button
            onClick={
              onBackToIndex
            }
          >
            ☰
          </button>

          <div
            style={{
              display: 'flex',
              gap: 6,
            }}
          >
            <button
              onClick={
                onPrevPage
              }
            >
              →
            </button>

            <button
              onClick={
                onNextPage
              }
            >
              ←
            </button>

            <button
              onClick={() =>
                setViewMode(
                  (v) =>
                    v ===
                    'mushaf'
                      ? 'scroll'
                      : 'mushaf',
                )
              }
            >
              {viewMode ===
              'mushaf'
                ? '📖'
                : '📜'}
            </button>
          </div>

          <button
            onClick={() =>
              setRecitersOpen(
                true,
              )
            }
          >
            🎙️{' '}
            {
              selectedReciter.name
            }
          </button>
        </div>
      )}

      {selectedAyahIndex !=
        null && (
        <div
          style={{
            position:
              'absolute',
            left: 10,
            right: 10,
            bottom: 14,
            zIndex: 40,
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent:
              'center',
            gap: 8,
            padding: 10,
            borderRadius: 16,
            background:
              'rgba(20,20,20,.92)',
          }}
          onClick={(e) =>
            e.stopPropagation()
          }
        >
          <button
            onClick={() =>
              void playAyah(
                selectedAyahIndex,
                false,
              )
            }
          >
            ▶️ پەخش
          </button>

          <button
            onClick={() =>
              void fetchTafsir(
                selectedAyahIndex,
              )
            }
          >
            📚 تەفسیر
          </button>

          <button
            onClick={
              downloadCurrentAyah
            }
            disabled={
              downloadBusy
            }
          >
            ⬇️ دانلود
          </button>

          <button
            onClick={() =>
              toggleBookmark(
                selectedAyahIndex,
              )
            }
          >
            🔖
          </button>

          <button
            onClick={() => {
              const ayah =
                getAyahForIndex(
                  selectedAyahIndex,
                );

              if (!ayah) return;

              const text =
                String(
                  ayah.text ?? '',
                );

              void navigator.clipboard?.writeText(
                text,
              );
            }}
          >
            📋
          </button>

          <button
            onClick={() =>
              setSelectedAyahIndex(
                null,
              )
            }
          >
            ✕
          </button>
        </div>
      )}

      {isPlaying && (
        <button
          style={{
            position:
              'absolute',
            bottom:
              selectedAyahIndex !=
              null
                ? 82
                : 16,
            left: 16,
            zIndex: 45,
          }}
          onClick={(e) => {
            e.stopPropagation();
            stopAudio();
          }}
        >
          ⏸️ وەستاندن
        </button>
      )}

      {errorText && (
        <div
          style={{
            position:
              'absolute',
            top: 58,
            left: 10,
            right: 10,
            zIndex: 50,
            padding: 8,
            borderRadius: 10,
            background:
              'rgba(160,0,0,.88)',
            color: '#fff',
            textAlign: 'center',
            fontSize: 13,
          }}
          onClick={() =>
            setErrorText('')
          }
        >
          {errorText}
        </div>
      )}

      {recitersOpen && (
        <div
          style={{
            position:
              'absolute',
            inset: 0,
            zIndex: 100,
            background:
              'rgba(0,0,0,.55)',
            display: 'flex',
            alignItems:
              'flex-end',
          }}
          onClick={() =>
            setRecitersOpen(
              false,
            )
          }
        >
          <div
            style={{
              width: '100%',
              maxHeight: '82%',
              overflowY: 'auto',
              background: '#fff',
              color: '#111',
              borderRadius:
                '22px 22px 0 0',
              padding: 16,
            }}
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <h3
              style={{
                marginTop: 0,
              }}
            >
              قاری
            </h3>

            {ALL_RECITERS_DIRECTORY.map(
              (reciter) => (
                <button
                  key={reciter.id}
                  onClick={() => {
                    stopAudio();
                    setSelectedReciter(
                      reciter,
                    );
                    setRecitersOpen(
                      false,
                    );
                  }}
                  style={{
                    width: '100%',
                    padding: 12,
                    marginBottom: 6,
                    textAlign: 'right',
                    border:
                      reciter.id ===
                      selectedReciter.id
                        ? '2px solid #d88a00'
                        : '1px solid #ddd',
                    background:
                      reciter.id ===
                      selectedReciter.id
                        ? '#fff4dc'
                        : '#fff',
                  }}
                >
                  <strong>
                    {
                      reciter.name
                    }
                  </strong>

                  <div
                    style={{
                      fontSize: 12,
                      opacity: 0.65,
                    }}
                  >
                    {reciter.subName ||
                      reciter.riwayah}
                  </div>
                </button>
              ),
            )}

            <button
              onClick={() =>
                setRecitersOpen(
                  false,
                )
              }
              style={{
                width: '100%',
                padding: 12,
                marginTop: 8,
              }}
            >
              داخستن
            </button>
          </div>
        </div>
      )}

      {tafsirVisible && (
        <div
          style={{
            position:
              'absolute',
            inset: 0,
            zIndex: 110,
            background:
              'rgba(0,0,0,.55)',
            display: 'flex',
            alignItems:
              'flex-end',
          }}
          onClick={() =>
            setTafsirVisible(
              false,
            )
          }
        >
          <div
            style={{
              width: '100%',
              maxHeight: '78%',
              overflowY: 'auto',
              background: '#fff',
              color: '#111',
              borderRadius:
                '22px 22px 0 0',
              padding: 18,
            }}
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <h3
              style={{
                marginTop: 0,
              }}
            >
              {
                selectedTafsir.title ||
                  selectedTafsir.name ||
                  'تەفسیر'
              }
            </h3>

            {tafsirLoading ? (
              <p>
                چاوەڕوان بە...
              </p>
            ) : (
              <p
                style={{
                  lineHeight: 2,
                }}
              >
                {tafsirText}
              </p>
            )}

            <button
              onClick={() =>
                setTafsirVisible(
                  false,
                )
              }
            >
              داخستن
            </button>
          </div>
        </div>
      )}

      <div
        style={{
          position:
            'absolute',
          bottom: 4,
          right: 8,
          zIndex: 20,
          fontSize: 10,
          opacity: 0.5,
        }}
      >
        {appLang}

        {surahDownloaded
          ? ' • ✓ سۆرە لە ئامێرەکەدا هەیە'
          : ''}

        {downloadedCount > 0
          ? ` • ${downloadedCount} ئایەت`
          : ''}

        {downloadBusy &&
        downloadProgress > 0
          ? ` • ${downloadProgress}%`
          : ''}
      </div>
    </div>
  );
}
