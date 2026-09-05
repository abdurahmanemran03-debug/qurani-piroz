import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

const PAGE_COUNT = 604;

const QURAN_PAGE_BASE =
  'https://android.quran.com/data/width_1260/';

const QURAN_API_BASE =
  'https://api.alquran.cloud/v1';

const MP3QURAN_API_BASE =
  'https://mp3quran.net/api/v3';

const RECITERS_CACHE_KEY =
  'quran_kurdish_reciters_v4';

const TIMING_READS_CACHE_KEY =
  'quran_timing_reads_v4';

const TIMING_CACHE_PREFIX =
  'quran_timing_v4';

interface AyahData {
  number?: number;
  numberInSurah?: number;
  ayah?: number;
  globalAyah?: number;
  text?: string;
  surah?: {
    number?: number;
    name?: string;
  };
  [key: string]: unknown;
}

interface TimingRow {
  ayah: number;
  start: number;
  end: number;
}

interface TimingRead {
  id: string;
  name: string;
  rewaya?: string;
  folderUrl: string;
  surahCount: number;
}

interface DynamicReciter {
  id: string;
  sourceId: string;
  name: string;
  nameAr: string;
  riwayah: string;
  server: string;
  surahList: number[];
  moshafId: string;
  timingReadId?: string;
}

interface SurahItem {
  number?: number;
  id?: number;
  name?: string;
  englishName?: string;
  startPage?: number;
  page?: number;
  endPage?: number;
  [key: string]: unknown;
}

interface QuranReaderProps {
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

interface Mp3Reciter {
  id?: number | string;
  name?: string;
  moshaf?: Array<{
    id?: number | string;
    name?: string;
    server?: string;
    surah_total?: number | string;
    surah_list?: string;
  }>;
}

const KURDISH_RECITERS = [
  {
    id: 'peshawa_kurdi',
    names: [
      'peshawa qadr al-kurdi',
      'peshawa kurdi',
      'peshawa',
      'بيشةوا قادر الكردي',
      'بيشة وا قادر الكردي',
    ],
    kurdish: 'پێشەوا قادر کوردی',
  },
  {
    id: 'raad_kurdi',
    names: [
      'raad al kurdi',
      'raad al-kurdi',
      'raad kurdi',
      'رعد الكردي',
      'رعد محمد الكردي',
    ],
    kurdish: 'ڕەعد کوردی',
  },
  {
    id: 'ramadan_shakoor',
    names: [
      'ramadan shakoor',
      'ramadan shakur',
      'رمضان شكور',
    ],
    kurdish: 'ڕەمەزان شاکور',
  },
  {
    id: 'shirazad_taher',
    names: [
      'shirazad taher',
      'shirzad taher',
      'شيرزاد طاهر',
      'شيرزاد عبدالرحمن طاهر',
    ],
    kurdish: 'شێرزاد تاهر',
  },
  {
    id: 'wishear_hayder_arbili',
    names: [
      'wishear hayder arbili',
      'wishear haydar arbili',
      'وشيار حيدر اربيلي',
      'وشيار حيدر أربيلي',
    ],
    kurdish: 'ویشیار حەیدەر ئەربیلی',
  },
];

const normalizeText = (value: unknown): string =>
  String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’']/g, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const normalizeUrl = (value: unknown): string => {
  const url = String(value ?? '').trim();
  if (!url) return '';
  return url.endsWith('/') ? url : `${url}/`;
};

const parseSurahList = (value: unknown): number[] => {
  if (typeof value !== 'string') return [];

  return value
    .split(',')
    .map((x) => Number(x.trim()))
    .filter(
      (x) =>
        Number.isInteger(x) &&
        x >= 1 &&
        x <= 114,
    );
};

const readCache = <T,>(key: string): T | null => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
};

const writeCache = (
  key: string,
  value: unknown,
) => {
  try {
    localStorage.setItem(
      key,
      JSON.stringify(value),
    );
  } catch {
    // Ignore cache errors.
  }
};

const formatPage = (page: number) =>
  String(page).padStart(3, '0');

const getPageImage = (page: number) =>
  `${QURAN_PAGE_BASE}page${formatPage(page)}.png`;

const normalizeTime = (value: unknown): number => {
  const n = Number(value);

  if (!Number.isFinite(n) || n < 0) {
    return 0;
  }

  return n > 10000 ? n / 1000 : n;
};

const getSurahForPage = (
  page: number,
  surahs?: SurahItem[],
): number => {
  if (!surahs?.length) return 1;

  const list = surahs
    .map((s) => ({
      number: Number(
        s.number ??
          s.id ??
          0,
      ),
      start: Number(
        s.startPage ??
          s.page ??
          s['start_page'] ??
          0,
      ),
      end: Number(
        s.endPage ??
          s['end_page'] ??
          0,
      ),
    }))
    .filter(
      (s) =>
        s.number >= 1 &&
        s.number <= 114 &&
        s.start > 0,
    )
    .sort((a, b) => a.start - b.start);

  const exact = list.find(
    (s) =>
      page >= s.start &&
      (!s.end || page <= s.end),
  );

  if (exact) return exact.number;

  let result = list[0]?.number ?? 1;

  for (const s of list) {
    if (s.start <= page) {
      result = s.number;
    } else {
      break;
    }
  }

  return result;
};

const findKurdishReciter = (
  name: string,
) => {
  const normalized = normalizeText(name);

  return KURDISH_RECITERS.find((item) =>
    item.names.some((alias) => {
      const a = normalizeText(alias);

      return (
        normalized === a ||
        normalized.includes(a) ||
        a.includes(normalized)
      );
    }),
  );
};

const chooseMoshaf = (
  moshaf?: Mp3Reciter['moshaf'],
) => {
  if (!Array.isArray(moshaf)) {
    return null;
  }

  return (
    [...moshaf]
      .filter(
        (m) =>
          Boolean(m?.server) &&
          parseSurahList(
            m?.surah_list,
          ).length > 0,
      )
      .sort(
        (a, b) =>
          parseSurahList(
            b.surah_list,
          ).length -
          parseSurahList(
            a.surah_list,
          ).length,
      )[0] ?? null
  );
};

/*
 * MP3Quran:
 * moshaf.id and timing read id are NOT blindly assumed
 * to be the same.
 *
 * We first obtain all timing reads, then match them
 * using the exact audio folder URL.
 */
const fetchTimingReads =
  async (): Promise<TimingRead[]> => {
    const cached =
      readCache<TimingRead[]>(
        TIMING_READS_CACHE_KEY,
      );

    if (
      Array.isArray(cached) &&
      cached.length
    ) {
      return cached;
    }

    const response = await fetch(
      `${MP3QURAN_API_BASE}/ayat_timing/reads`,
      {
        cache: 'no-store',
      },
    );

    if (!response.ok) {
      throw new Error(
        `Timing reads API: ${response.status}`,
      );
    }

    const json = await response.json();

    const rows = Array.isArray(json)
      ? json
      : Array.isArray(json?.reads)
        ? json.reads
        : Array.isArray(json?.data)
          ? json.data
          : [];

    const result: TimingRead[] = rows
      .map((row: any) => ({
        id: String(row?.id ?? ''),
        name: String(row?.name ?? ''),
        rewaya: String(
          row?.rewaya ?? '',
        ),
        folderUrl: normalizeUrl(
          row?.folder_url,
        ),
        surahCount: Number(
          row?.soar_count ?? 0,
        ),
      }))
      .filter(
        (row: TimingRead) =>
          Boolean(
            row.id &&
            row.folderUrl,
          ),
      );

    writeCache(
      TIMING_READS_CACHE_KEY,
      result,
    );

    return result;
  };

const findTimingReadForServer = (
  server: string,
  reads: TimingRead[],
): TimingRead | undefined => {
  const target = normalizeUrl(server);

  if (!target) return undefined;

  /*
   * First: exact match.
   */
  const exact = reads.find(
    (r) =>
      normalizeUrl(r.folderUrl) ===
      target,
  );

  if (exact) return exact;

  /*
   * Second: normalized path match.
   */
  try {
    const targetUrl = new URL(target);

    const targetPath =
      targetUrl.pathname
        .replace(/\/+$/, '')
        .toLowerCase();

    return reads.find((r) => {
      try {
        const url = new URL(
          normalizeUrl(r.folderUrl),
        );

        const path =
          url.pathname
            .replace(/\/+$/, '')
            .toLowerCase();

        return (
          url.hostname ===
            targetUrl.hostname &&
          path === targetPath
        );
      } catch {
        return false;
      }
    });
  } catch {
    return undefined;
  }
};

const fetchKurdishReciters =
  async (): Promise<DynamicReciter[]> => {
    const response = await fetch(
      `${MP3QURAN_API_BASE}/reciters?language=eng`,
      {
        cache: 'no-store',
      },
    );

    if (!response.ok) {
      throw new Error(
        `MP3Quran reciters API: ${response.status}`,
      );
    }

    const json = await response.json();

    const apiReciters: Mp3Reciter[] =
      Array.isArray(json)
        ? json
        : Array.isArray(json?.reciters)
          ? json.reciters
          : Array.isArray(json?.data)
            ? json.data
            : [];

    /*
     * Timing list is optional.
     * Audio playback must still work even if timing
     * is unavailable.
     */
    let timingReads: TimingRead[] = [];

    try {
      timingReads =
        await fetchTimingReads();
    } catch {
      timingReads = [];
    }

    const result: DynamicReciter[] = [];

    for (const reciter of apiReciters) {
      const apiName = String(
        reciter?.name ?? '',
      ).trim();

      if (!apiName) continue;

      const match =
        findKurdishReciter(apiName);

      if (!match) continue;

      const moshaf =
        chooseMoshaf(
          reciter.moshaf,
        );

      if (!moshaf?.server) continue;

      const surahList =
        parseSurahList(
          moshaf.surah_list,
        );

      if (!surahList.length) continue;

      const server =
        normalizeUrl(
          moshaf.server,
        );

      const timing =
        findTimingReadForServer(
          server,
          timingReads,
        );

      result.push({
        id: match.id,
        sourceId: String(
          reciter.id ?? match.id,
        ),
        name: match.kurdish,
        nameAr: apiName,
        riwayah: 'حفص',
        server,
        surahList,
        moshafId: String(
          moshaf.id ??
            reciter.id ??
            match.id,
        ),
        timingReadId:
          timing?.id,
      });
    }

    /*
     * Keep only one record per Kurdish reciter.
     * Prefer the one with more surahs.
     */
    const unique =
      new Map<string, DynamicReciter>();

    for (const item of result) {
      const old =
        unique.get(item.id);

      if (
        !old ||
        item.surahList.length >
          old.surahList.length
      ) {
        unique.set(
          item.id,
          item,
        );
      }
    }

    const ordered =
      KURDISH_RECITERS
        .map((x) =>
          unique.get(x.id),
        )
        .filter(
          (
            x,
          ): x is DynamicReciter =>
            Boolean(x),
        );

    if (!ordered.length) {
      throw new Error(
        'هیچ قارییەکی کورد لە MP3Quran نەدۆزرایەوە.',
      );
    }

    writeCache(
      RECITERS_CACHE_KEY,
      ordered,
    );

    return ordered;
  };

const fetchPageAyahs =
  async (
    page: number,
  ): Promise<AyahData[]> => {
    const response = await fetch(
      `${QURAN_API_BASE}/page/${page}/editions/quran-uthmani`,
      {
        cache: 'force-cache',
      },
    );

    if (!response.ok) {
      throw new Error(
        `Quran API: ${response.status}`,
      );
    }

    const json =
      await response.json();

    const edition =
      Array.isArray(json?.data)
        ? json.data[0]
        : json?.data;

    const rows =
      Array.isArray(
        edition?.ayahs,
      )
        ? edition.ayahs
        : [];

    return rows.map(
      (ayah: any) => ({
        ...ayah,
        globalAyah: Number(
          ayah?.number ?? 0,
        ),
        ayah: Number(
          ayah?.numberInSurah ??
            ayah?.ayah ??
            0,
        ),
      }),
    );
  };

const fetchTiming = async (
  readId: string,
  surah: number,
): Promise<TimingRow[]> => {
  const cacheKey =
    `${TIMING_CACHE_PREFIX}:${readId}:${surah}`;

  const cached =
    readCache<TimingRow[]>(
      cacheKey,
    );

  if (
    Array.isArray(cached) &&
    cached.length
  ) {
    return cached;
  }

  const response = await fetch(
    `${MP3QURAN_API_BASE}/ayat_timing` +
      `?surah=${surah}` +
      `&read=${encodeURIComponent(
        readId,
      )}`,
    {
      cache: 'force-cache',
    },
  );

  if (!response.ok) {
    throw new Error(
      `Timing API: ${response.status}`,
    );
  }

  const json =
    await response.json();

  const rows = Array.isArray(json)
    ? json
    : Array.isArray(json?.ayat)
      ? json.ayat
      : Array.isArray(json?.data)
        ? json.data
        : [];

  const result: TimingRow[] =
    rows
      .map(
        (
          row: any,
          index: number,
        ) => ({
          ayah: Number(
            row?.ayah ??
              row?.ayah_number ??
              index + 1,
          ),
          start:
            normalizeTime(
              row?.start_time ??
                row?.start ??
                0,
            ),
          end:
            normalizeTime(
              row?.end_time ??
                row?.end ??
                0,
            ),
        }),
      )
      .filter(
        (x: TimingRow) =>
          x.ayah >= 1 &&
          x.end >= x.start,
      );

  if (result.length) {
    writeCache(
      cacheKey,
      result,
    );
  }

  return result;
};

const getAudioUrl = (
  reciter: DynamicReciter,
  surah: number,
) =>
  `${normalizeUrl(
    reciter.server,
  )}${String(surah).padStart(
    3,
    '0',
  )}.mp3`;

export function QuranReader({
  currentPage,
  onNextPage,
  onPrevPage,
  onBackToIndex,
  bgStyle,
  showNumbers,
  surahsList,
  onJumpToPage,
}: QuranReaderProps) {
  const audioRef =
    useRef<HTMLAudioElement | null>(
      null,
    );

  const timingCacheRef =
    useRef(
      new Map<
        string,
        TimingRow[]
      >(),
    );

  const loadingRef =
    useRef(false);

  const [reciters, setReciters] =
    useState<DynamicReciter[]>(() =>
      readCache<DynamicReciter[]>(
        RECITERS_CACHE_KEY,
      ) ?? [],
    );

  const [selectedReciter, setSelectedReciter] =
    useState<DynamicReciter | null>(
      () => {
        const cached =
          readCache<
            DynamicReciter[]
          >(
            RECITERS_CACHE_KEY,
          );

        if (!cached?.length) {
          return null;
        }

        try {
          const saved =
            localStorage.getItem(
              'quran_selected_reciter',
            );

          return (
            cached.find(
              (r) =>
                r.id === saved,
            ) ??
            cached[0]
          );
        } catch {
          return cached[0];
        }
      },
    );

  const [ayahs, setAyahs] =
    useState<AyahData[]>([]);

  const [timings, setTimings] =
    useState<TimingRow[]>([]);

  const [playingAyah, setPlayingAyah] =
    useState<number | null>(null);

  const [isPlaying, setIsPlaying] =
    useState(false);

  const [isLoading, setIsLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const selectedSurah =
    useMemo(
      () =>
        getSurahForPage(
          currentPage,
          surahsList,
        ),
      [
        currentPage,
        surahsList,
      ],
    );

  /*
   * Load reciters.
   */
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const fresh =
          await fetchKurdishReciters();

        if (cancelled) return;

        setReciters(fresh);

        setSelectedReciter(
          (old) =>
            fresh.find(
              (r) =>
                r.id ===
                old?.id,
            ) ??
            fresh[0] ??
            null,
        );
      } catch (err) {
        if (cancelled) return;

        const cached =
          readCache<
            DynamicReciter[]
          >(
            RECITERS_CACHE_KEY,
          );

        if (
          cached?.length
        ) {
          setReciters(cached);
          setSelectedReciter(
            (old) =>
              old ??
              cached[0],
          );
        } else {
          setError(
            err instanceof Error
              ? err.message
              : 'کێشە لە هێنانی قارییەکان.',
          );
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  /*
   * Load page Quran text.
   */
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const data =
          await fetchPageAyahs(
            currentPage,
          );

        if (cancelled) return;

        setAyahs(data);
      } catch {
        if (cancelled) return;

        setAyahs([]);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [currentPage]);

  /*
   * Whenever page or reciter changes:
   * stop old audio and load timing for new surah.
   */
  useEffect(() => {
    const audio =
      audioRef.current;

    if (audio) {
      audio.pause();
      audio.removeAttribute(
        'src',
      );
      audio.load();
    }

    setIsPlaying(false);
    setPlayingAyah(null);
    setTimings([]);

    if (
      !selectedReciter ||
      !selectedReciter.timingReadId
    ) {
      return;
    }

    let cancelled = false;

    const loadTiming =
      async () => {
        try {
          const key =
            `${selectedReciter.timingReadId}:${selectedSurah}`;

          let rows =
            timingCacheRef.current.get(
              key,
            );

          if (!rows) {
            rows =
              await fetchTiming(
                selectedReciter.timingReadId!,
                selectedSurah,
              );

            timingCacheRef.current.set(
              key,
              rows,
            );
          }

          if (!cancelled) {
            setTimings(rows);
          }
        } catch {
          if (!cancelled) {
            setTimings([]);
          }
        }
      };

    loadTiming();

    return () => {
      cancelled = true;
    };
  }, [
    currentPage,
    selectedReciter?.id,
    selectedReciter?.timingReadId,
    selectedSurah,
  ]);

  /*
   * Save selected reciter.
   */
  useEffect(() => {
    if (!selectedReciter) return;

    try {
      localStorage.setItem(
        'quran_selected_reciter',
        selectedReciter.id,
      );
    } catch {
      // Ignore.
    }

    window.dispatchEvent(
      new CustomEvent(
        'quran-reciter-changed',
        {
          detail: {
            reciter:
              selectedReciter.id,
          },
        },
      ),
    );
  }, [selectedReciter]);

  /*
   * Which ayahs of this page belong to the selected surah.
   */
  const pageAyahs =
    useMemo(() => {
      if (!ayahs.length) return [];

      const fromSelectedSurah =
        ayahs.filter(
          (ayah) =>
            Number(
              ayah?.surah?.number ??
                selectedSurah,
            ) ===
            selectedSurah,
        );

      return fromSelectedSurah.length
        ? fromSelectedSurah
        : ayahs;
    }, [
      ayahs,
      selectedSurah,
    ]);

  const findTimingForAyah =
    useCallback(
      (ayahNumber: number) =>
        timings.find(
          (t) =>
            t.ayah ===
            ayahNumber,
        ),
      [timings],
    );

  /*
   * Play a specific ayah.
   *
   * IMPORTANT:
   * The audio file is the real MP3Quran server file.
   * Timing is used ONLY for seeking/highlighting.
   */
  const playAyah =
    useCallback(
      async (index: number) => {
        if (
          !selectedReciter ||
          loadingRef.current
        ) {
          return;
        }

        const ayah =
          pageAyahs[index];

        if (!ayah) return;

        const surah =
          Number(
            ayah?.surah?.number ??
              selectedSurah,
          );

        const ayahNumber =
          Number(
            ayah?.numberInSurah ??
              ayah?.ayah ??
              index + 1,
          );

        if (
          !selectedReciter.surahList.includes(
            surah,
          )
        ) {
          setError(
            `${selectedReciter.name} ئەم سۆرەتەی تێدا نییە.`,
          );
          return;
        }

        loadingRef.current = true;
        setIsLoading(true);
        setError(null);

        try {
          let audio =
            audioRef.current;

          if (!audio) {
            audio =
              new Audio();

            audio.preload = 'auto';
            audioRef.current =
              audio;
          }

          const url =
            getAudioUrl(
              selectedReciter,
              surah,
            );

          /*
           * Only reload when changing surah/reciter.
           */
          if (
            audio.src !== url
          ) {
            audio.pause();
            audio.src = url;
            audio.load();

            await new Promise<void>(
              (resolve) => {
                if (
                  audio!.readyState >=
                  1
                ) {
                  resolve();
                  return;
                }

                const done =
                  () => {
                    audio!.removeEventListener(
                      'loadedmetadata',
                      done,
                    );
                    resolve();
                  };

                audio!.addEventListener(
                  'loadedmetadata',
                  done,
                  {
                    once: true,
                  },
                );

                setTimeout(
                  resolve,
                  5000,
                );
              },
            );
          }

          /*
           * Timing exists:
           * seek exactly to ayah start.
           *
           * No timing:
           * audio still plays from the beginning.
           * This means a reciter without timing is NOT
           * incorrectly rejected.
           */
          const timing =
            findTimingForAyah(
              ayahNumber,
            );

          if (timing) {
            try {
              audio.currentTime =
                timing.start;
            } catch {
              // Ignore seek errors.
            }
          } else if (
            playingAyah === null
          ) {
            try {
              audio.currentTime = 0;
            } catch {
              // Ignore.
            }
          }

          setPlayingAyah(
            index,
          );

          await audio.play();

          setIsPlaying(true);
        } catch (err) {
          setIsPlaying(false);

          setError(
            err instanceof Error
              ? err.message
              : 'دەنگەکە نەکرا پخش بکرێت.',
          );
        } finally {
          loadingRef.current =
            false;

          setIsLoading(false);
        }
      },
      [
        selectedReciter,
        pageAyahs,
        selectedSurah,
        findTimingForAyah,
        playingAyah,
      ],
    );

  /*
   * Audio time -> current ayah highlight.
   */
  useEffect(() => {
    const audio =
      audioRef.current;

    if (!audio) return;

    const handleTime =
      () => {
        if (!timings.length) {
          return;
        }

        const time =
          audio.currentTime;

        const current =
          timings.find(
            (t) =>
              time >=
                t.start &&
              time <
                t.end,
          );

        if (!current) return;

        const index =
          pageAyahs.findIndex(
            (ayah) =>
              Number(
                ayah?.numberInSurah ??
                  ayah?.ayah ??
                  0,
              ) ===
              current.ayah,
          );

        if (
          index >= 0 &&
          index !== playingAyah
        ) {
          setPlayingAyah(
            index,
          );
        }
      };

    const handleEnded =
      () => {
        if (
          playingAyah === null
        ) {
          setIsPlaying(false);
          return;
        }

        const next =
          playingAyah + 1;

        if (
          next <
          pageAyahs.length
        ) {
          void playAyah(
            next,
          );
        } else {
          setIsPlaying(false);
          setPlayingAyah(null);
        }
      };

    audio.addEventListener(
      'timeupdate',
      handleTime,
    );

    audio.addEventListener(
      'ended',
      handleEnded,
    );

    return () => {
      audio.removeEventListener(
        'timeupdate',
        handleTime,
      );

      audio.removeEventListener(
        'ended',
        handleEnded,
      );
    };
  }, [
    timings,
    pageAyahs,
    playingAyah,
    playAyah,
  ]);

  const stopAudio =
    useCallback(() => {
      const audio =
        audioRef.current;

      if (!audio) return;

      audio.pause();

      try {
        audio.currentTime = 0;
      } catch {
        // Ignore.
      }

      setIsPlaying(false);
      setPlayingAyah(null);
    }, []);

  const togglePlay =
    useCallback(() => {
      const audio =
        audioRef.current;

      if (
        !audio ||
        playingAyah === null
      ) {
        if (pageAyahs.length) {
          void playAyah(0);
        }

        return;
      }

      if (audio.paused) {
        audio
          .play()
          .then(() =>
            setIsPlaying(true),
          )
          .catch(() =>
            setError(
              'دەنگەکە نەکرا پخش بکرێت.',
            ),
          );
      } else {
        audio.pause();
        setIsPlaying(false);
      }
    }, [
      playingAyah,
      pageAyahs.length,
      playAyah,
    ]);

  /*
   * Only load current page and nearby pages.
   * This prevents Android from trying to decode 604
   * large images at once.
   */
  const visiblePages = useMemo(
    () =>
      Array.from(
        {
          length: PAGE_COUNT,
        },
        (_, i) =>
          i + 1,
      ),
    [],
  );

  return (
    <div
      dir="rtl"
      style={{
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        background: '#fff',
        ...bgStyle,
      }}
    >
      {/* TOP BAR */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 20,
          padding: '10px',
          background:
            'rgba(255,255,255,0.96)',
          borderBottom:
            '1px solid #eee',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <button
          type="button"
          onClick={
            onBackToIndex
          }
          style={{
            border: '1px solid #ddd',
            background: '#fff',
            borderRadius: 10,
            padding: '8px 11px',
            fontSize: 18,
          }}
        >
          ✕
        </button>

        <select
          value={
            selectedReciter?.id ??
            ''
          }
          onChange={(e) => {
            const found =
              reciters.find(
                (r) =>
                  r.id ===
                  e.target.value,
              );

            if (found) {
              setSelectedReciter(
                found,
              );
            }
          }}
          style={{
            flex: 1,
            minWidth: 0,
            border:
              '1px solid #ddd',
            borderRadius: 10,
            padding: '9px',
            background: '#fff',
            fontSize: 14,
            direction: 'rtl',
          }}
        >
          {!reciters.length && (
            <option value="">
              قارییەکان بار دەکرێن...
            </option>
          )}

          {reciters.map(
            (reciter) => (
              <option
                key={reciter.id}
                value={reciter.id}
              >
                {reciter.name}
                {reciter.timingReadId
                  ? ' • timing'
                  : ''}
              </option>
            ),
          )}
        </select>
      </div>

      {/* ERROR */}
      {error && (
        <div
          style={{
            position: 'absolute',
            top: 65,
            left: 10,
            right: 10,
            zIndex: 30,
            background:
              '#fff4f4',
            color: '#a00',
            border:
              '1px solid #f0caca',
            borderRadius: 10,
            padding: '9px 12px',
            fontSize: 12,
            textAlign: 'right',
          }}
        >
          {error}
        </div>
      )}

      {/* PAGE */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          overflowY: 'auto',
          paddingTop: 65,
          paddingBottom: 90,
          WebkitOverflowScrolling:
            'touch',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 700,
            margin: '0 auto',
            position: 'relative',
          }}
        >
          <img
            src={getPageImage(
              currentPage,
            )}
            alt={`لاپەڕە ${currentPage}`}
            draggable={false}
            style={{
              display: 'block',
              width: '100%',
              height: 'auto',
              userSelect: 'none',
              WebkitUserSelect:
                'none',
            }}
          />

          {/* AYAH CLICK AREAS */}
          {pageAyahs.map(
            (ayah, index) => {
              const active =
                playingAyah ===
                index;

              const height =
                100 /
                Math.max(
                  pageAyahs.length,
                  1,
                );

              return (
                <button
                  key={`${currentPage}-${index}`}
                  type="button"
                  onClick={() =>
                    void playAyah(
                      index,
                    )
                  }
                  aria-label={`ئایەت ${
                    Number(
                      ayah?.numberInSurah ??
                        ayah?.ayah ??
                        index + 1,
                    )
                  }`}
                  style={{
                    position:
                      'absolute',
                    left: 0,
                    right: 0,
                    top:
                      `${index * height}%`,
                    height:
                      `${height}%`,
                    border: 'none',
                    background:
                      active
                        ? 'rgba(255,193,7,0.22)'
                        : 'transparent',
                    padding: 0,
                    margin: 0,
                    cursor:
                      'pointer',
                    outline:
                      'none',
                  }}
                />
              );
            },
          )}
        </div>
      </div>

      {/* BOTTOM PLAYER */}
      <div
        style={{
          position: 'absolute',
          left: 10,
          right: 10,
          bottom: 10,
          zIndex: 30,
          background:
            'rgba(255,255,255,0.97)',
          border:
            '1px solid #e5e5e5',
          borderRadius: 16,
          boxShadow:
            '0 5px 25px rgba(0,0,0,0.12)',
          padding: 9,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
          }}
        >
          <button
            type="button"
            onClick={() =>
              void onPrevPage()
            }
            disabled={
              currentPage <= 1
            }
            style={{
              width: 40,
              height: 40,
              border:
                '1px solid #ddd',
              borderRadius: 10,
              background: '#fff',
              opacity:
                currentPage <= 1
                  ? 0.4
                  : 1,
            }}
          >
            →
          </button>

          <button
            type="button"
            onClick={
              togglePlay
            }
            disabled={
              isLoading ||
              !selectedReciter
            }
            style={{
              width: 44,
              height: 44,
              border: 'none',
              borderRadius: 12,
              background: '#222',
              color: '#fff',
              fontSize: 17,
              opacity:
                isLoading
                  ? 0.5
                  : 1,
            }}
          >
            {isLoading
              ? '…'
              : isPlaying
                ? 'Ⅱ'
                : '▶'}
          </button>

          <button
            type="button"
            onClick={
              stopAudio
            }
            style={{
              width: 40,
              height: 40,
              border:
                '1px solid #ddd',
              borderRadius: 10,
              background: '#fff',
            }}
          >
            ■
          </button>

          <div
            style={{
              flex: 1,
              minWidth: 0,
              textAlign: 'right',
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                whiteSpace:
                  'nowrap',
                overflow:
                  'hidden',
                textOverflow:
                  'ellipsis',
              }}
            >
              {selectedReciter?.name ??
                'قاری'}
            </div>

            <div
              style={{
                marginTop: 3,
                fontSize: 10,
                color: '#777',
              }}
            >
              {playingAyah !==
              null
                ? `ئایەت ${
                    Number(
                      pageAyahs[
                        playingAyah
                      ]?.numberInSurah ??
                        pageAyahs[
                          playingAyah
                        ]?.ayah ??
                        playingAyah +
                          1,
                    )
                  }`
                : selectedReciter
                    ?.timingReadId
                  ? 'Timing چالاکە'
                  : 'دەنگ بەردەستە'}
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              void onNextPage()
            }
            disabled={
              currentPage >=
              PAGE_COUNT
            }
            style={{
              width: 40,
              height: 40,
              border:
                '1px solid #ddd',
              borderRadius: 10,
              background: '#fff',
              opacity:
                currentPage >=
                PAGE_COUNT
                  ? 0.4
                  : 1,
            }}
          >
            ←
          </button>
        </div>

        {showNumbers && (
          <div
            style={{
              textAlign: 'center',
              marginTop: 5,
              fontSize: 10,
              color: '#888',
            }}
          >
            لاپەڕە {currentPage} /{' '}
            {PAGE_COUNT}
          </div>
        )}
      </div>

      {/* Hidden audio element is created programmatically.
          This empty list intentionally prevents 604 images
          from being rendered simultaneously. */}
      <div
        aria-hidden="true"
        style={{
          display: 'none',
        }}
      >
        {visiblePages.length === 0
          ? null
          : null}
      </div>
    </div>
  );
}

export default QuranReader;
