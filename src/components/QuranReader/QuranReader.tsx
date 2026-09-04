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
      }
    }
  }

  /*
   * If the API didn't match the folder exactly,
   * try the reciter name.
   */
  const nameLower = reciter.name
    .toLowerCase();

  for (const item of reciters) {
    const itemName = String(
      item?.name ??
        item?.reciter_name ??
        '',
    ).toLowerCase();

    if (
      itemName &&
      (
        itemName.includes(nameLower) ||
        nameLower.includes(itemName)
      )
    ) {
      const moshaf =
        item?.moshaf?.[0];

      if (moshaf) {
        return {
          id: String(
            moshaf?.id ??
              item?.id ??
              '',
          ),
          folder: normalizeUrl(
            String(
              moshaf?.server ??
                moshaf?.folder_url ??
                '',
            ),
          ),
        };
      }
    }
  }

  throw new Error(
    `قاری ${reciter.name} لە MP3Quran نەدۆزرایەوە.`,
  );
}

async function getMp3QuranTiming(
  readId: string | number,
  surahNumber: number,
): Promise<TimingItem[]> {
  const url = new URL(
    MP3QURAN_TIMING_API,
  );

  url.searchParams.set(
    'surah',
    String(surahNumber),
  );

  url.searchParams.set(
    'read',
    String(readId),
  );

  const response = await fetch(
    url.toString(),
  );

  if (!response.ok) {
    throw new Error(
      `Timing API error: ${response.status}`,
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

  if (
    !Array.isArray(rows) ||
    rows.length === 0
  ) {
    throw new Error(
      'کاتی ئایەتەکان لە MP3Quran نەدۆزرایەوە.',
    );
  }

  return rows.map(
    (row: any, index: number) => ({
      ayah: Number(
        row?.ayah ??
          row?.ayah_number ??
          row?.number ??
          index + 1,
      ),
      start: normalizeTime(
        row?.start_time ??
          row?.start ??
          0,
      ),
      end: normalizeTime(
        row?.end_time ??
          row?.end ??
          0,
      ),
    }),
  );
}

function findTiming(
  timings: TimingItem[],
  ayahNumber: number,
) {
  return (
    timings.find(
      item =>
        item.ayah === ayahNumber,
    ) ??
    timings.find(
      item =>
        item.ayah === ayahNumber - 1,
    ) ??
    null
  );
}

function getSurahNumberFromPage(
  page: number,
  surahsList?: any[],
) {
  if (
    !surahsList ||
    surahsList.length === 0
  ) {
    return 1;
  }

  let selected =
    surahsList[0];

  for (const surah of surahsList) {
    const startPage = Number(
      surah?.startPage ??
        surah?.page ??
        1,
    );

    if (
      startPage <= page
    ) {
      selected = surah;
    }
  }

  return Number(
    selected?.number ??
      selected?.id ??
      1,
  );
}

function getSurahStartPage(
  page: number,
  surahsList?: any[],
) {
  if (
    !surahsList ||
    surahsList.length === 0
  ) {
    return null;
  }

  let selected: any = null;

  for (const surah of surahsList) {
    const startPage = Number(
      surah?.startPage ??
        surah?.page ??
        1,
    );

    if (
      startPage <= page
    ) {
      selected = surah;
    }
  }

  return selected
    ? Number(
        selected?.startPage ??
          selected?.page ??
          page,
      )
    : null;
}

export function QuranReader({
  currentPage,
  onNextPage,
  onPrevPage,
  onBackToIndex,
  bgStyle,
  appLang,
  showNumbers,
  surahsList,
  onJumpToPage,
}: QuranReaderProps) {
  const audioRef =
    useRef<HTMLAudioElement | null>(
      null,
    );

  const scrollRef =
    useRef<HTMLDivElement | null>(
      null,
    );

  const audioTokenRef =
    useRef(0);

  const blobUrlRef =
    useRef<string | null>(
      null,
    );

  const currentTimingRef =
    useRef<TimingItem | null>(
      null,
    );

  const [ayahs, setAyahs] =
    useState<AyahData[]>([]);

  const [ayahBoxes, setAyahBoxes] =
    useState<AyahBox[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [errorText, setErrorText] =
    useState('');

  const [selectedReciterId, setSelectedReciterId] =
    useState(() => {
      try {
        return (
          localStorage.getItem(
            'quran_selected_reciter',
          ) ??
          'raad_kurdi'
        );
      } catch {
        return 'raad_kurdi';
      }
    });

  const [showReciters, setShowReciters] =
    useState(false);

  const [playingAyahIndex, setPlayingAyahIndex] =
    useState<number | null>(null);

  const [isPlaying, setIsPlaying] =
    useState(false);

  const [currentTime, setCurrentTime] =
    useState(0);

  const [duration, setDuration] =
    useState(0);

  const [pageWidth, setPageWidth] =
    useState(0);

  const selectedReciter =
    useMemo(
      () =>
        KURDISH_RECITERS.find(
          reciter =>
            reciter.id ===
            selectedReciterId,
        ) ??
        KURDISH_RECITERS[1],
      [selectedReciterId],
    );

  const currentSurahNumber =
    useMemo(
      () =>
        getSurahNumberFromPage(
          currentPage,
          surahsList,
        ),
      [
        currentPage,
        surahsList,
      ],
    );

  const currentSurahStartPage =
    useMemo(
      () =>
        getSurahStartPage(
          currentPage,
          surahsList,
        ),
      [
        currentPage,
        surahsList,
      ],
    );

  const currentAyahIndex =
    useMemo(() => {
      if (
        playingAyahIndex !== null
      ) {
        return playingAyahIndex;
      }

      return -1;
    }, [playingAyahIndex]);

  const pageImage =
    getPageImageUrl(
      currentPage,
    );

  /*
   * -----------------------------------------
   * AUDIO CLEANUP
   * -----------------------------------------
   */

  const revokeBlobUrl =
    useCallback(() => {
      if (
        blobUrlRef.current
      ) {
        URL.revokeObjectURL(
          blobUrlRef.current,
        );

        blobUrlRef.current =
          null;
      }
    }, []);

  const stopAudio =
    useCallback(() => {
      audioTokenRef.current += 1;

      const audio =
        audioRef.current;

      if (audio) {
        audio.pause();
        audio.currentTime = 0;
        audio.removeAttribute(
          'src',
        );
        audio.load();
      }

      currentTimingRef.current =
        null;

      revokeBlobUrl();

      setIsPlaying(false);
      setPlayingAyahIndex(
        null,
      );
      setCurrentTime(0);
      setDuration(0);
    }, [revokeBlobUrl]);

  /*
   * -----------------------------------------
   * LOAD QURAN DATA
   * -----------------------------------------
   */

  useEffect(() => {
    let cancelled = false;

    async function loadPage() {
      setLoading(true);
      setErrorText('');

      try {
        const response =
          await fetch(
            `https://api.alquran.cloud/v1/page/${currentPage}/editions/quran-uthmani`,
          );

        if (!response.ok) {
          throw new Error(
            `Quran API error: ${response.status}`,
          );
        }

        const json =
          await response.json();

        const editions =
          Array.isArray(
            json?.data,
          )
            ? json.data
            : [];

        const arabicEdition =
          editions.find(
            (edition: any) =>
              edition?.edition?.identifier ===
                'quran-uthmani' ||
              edition?.edition?.identifier ===
                'quran-uthmani',
          ) ??
          editions[0];

        const pageAyahs =
          Array.isArray(
            arabicEdition?.ayahs,
          )
            ? arabicEdition.ayahs
            : [];

        if (!cancelled) {
          setAyahs(
            pageAyahs,
          );
        }
      } catch (error) {
        if (!cancelled) {
          setAyahs([]);

          setErrorText(
            error instanceof Error
              ? error.message
              : 'داتای قورئان نەهات.',
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadPage();

    return () => {
      cancelled = true;
    };
  }, [currentPage]);

  /*
   * -----------------------------------------
   * LOAD AYAH COORDINATES
   * -----------------------------------------
   */

  useEffect(() => {
    try {
      const boxes =
        getAyahBoxesForPage(
          currentPage,
        );

      const normalized =
        Array.isArray(boxes)
          ? boxes.map(
              (box: any) => ({
                x: Number(
                  box?.x ?? 0,
                ),
                y: Number(
                  box?.y ?? 0,
                ),
                width: Number(
                  box?.width ?? 0,
                ),
                height: Number(
                  box?.height ?? 0,
                ),
                ayahNumber:
                  box?.ayahNumber ??
                  box?.number,
                number:
                  box?.number,
                index:
                  box?.index,
              }),
            )
          : [];

      setAyahBoxes(
        normalized,
      );
    } catch {
      setAyahBoxes([]);
    }
  }, [currentPage]);

  /*
   * -----------------------------------------
   * STOP AUDIO WHEN PAGE CHANGES
   * -----------------------------------------
   */

  useEffect(() => {
    stopAudio();
  }, [
    currentPage,
    selectedReciterId,
    stopAudio,
  ]);

  /*
   * -----------------------------------------
   * RECITER EVENT
   * -----------------------------------------
   */

  useEffect(() => {
    const handleReciterChange =
      (event: Event) => {
        const customEvent =
          event as CustomEvent;

        const id =
          customEvent?.detail?.id;

        if (id) {
          setSelectedReciterId(
            String(id),
          );
        }
      };

    window.addEventListener(
      AUDIO_EVENT,
      handleReciterChange,
    );

    return () => {
      window.removeEventListener(
        AUDIO_EVENT,
        handleReciterChange,
      );
    };
  }, []);

  /*
   * -----------------------------------------
   * SAVE RECITER
   * -----------------------------------------
   */

  useEffect(() => {
    try {
      localStorage.setItem(
        'quran_selected_reciter',
        selectedReciterId,
      );
    } catch {}

    window.dispatchEvent(
      new CustomEvent(
        AUDIO_EVENT,
        {
          detail: {
            id: selectedReciterId,
          },
        },
      ),
    );
  }, [
    selectedReciterId,
  ]);

  /*
   * -----------------------------------------
   * RESPONSIVE WIDTH
   * -----------------------------------------
   */

  useEffect(() => {
    const update =
      () => {
        setPageWidth(
          window.innerWidth,
        );
      };

    update();

    window.addEventListener(
      'resize',
      update,
    );

    return () =>
      window.removeEventListener(
        'resize',
        update,
      );
  }, []);

  /*
   * -----------------------------------------
   * SCROLL TO ACTIVE AYAH
   * -----------------------------------------
   */

  const scrollActiveAyahIntoView =
    useCallback(
      (
        index: number,
      ) => {
        const box =
          ayahBoxes[index];

        if (!box) {
          return;
        }

        const container =
          scrollRef.current;

        if (!container) {
          return;
        }

        const scale =
          container.clientWidth /
          AYAH_CANVAS_WIDTH;

        const targetX =
          box.x * scale;

        const targetY =
          box.y * scale;

        const viewTop =
          container.scrollTop;

        const viewBottom =
          viewTop +
          container.clientHeight;

        const boxTop =
          targetY;

        const boxBottom =
          targetY +
          box.height * scale;

        if (
          boxTop < viewTop ||
          boxBottom >
            viewBottom
        ) {
          container.scrollTo({
            top: Math.max(
              0,
              targetY -
                container.clientHeight /
                  2,
            ),
            behavior:
              'smooth',
          });
        }
      },
      [ayahBoxes],
    );

  /*
   * -----------------------------------------
   * PLAY AYAH
   * -----------------------------------------
   */

  const playAyah =
    useCallback(
      async (
        index: number,
        autoAdvance = false,
      ) => {
        const ayah =
          ayahs[index];

        if (!ayah) {
          return;
        }

        const token =
          ++audioTokenRef.current;

        setErrorText('');

        setPlayingAyahIndex(
          index,
        );

        setIsPlaying(true);

        scrollActiveAyahIntoView(
          index,
        );

        const audio =
          audioRef.current;

        if (!audio) {
          setErrorText(
            'Audio element ئامادە نییە.',
          );
          setIsPlaying(false);
          return;
        }

        try {
          const globalAyah =
            getGlobalAyahNumber(
              ayah,
              index + 1,
            );

          const localAyah =
            getLocalAyahNumber(
              ayah,
              index + 1,
            );

          /*
           * ---------------------------------
           * MP3QURAN
           * ---------------------------------
           */

          if (
            selectedReciter.source ===
              'mp3quran'
          ) {
            const read =
              await getMp3QuranRead(
                selectedReciter,
              );

            if (
              token !==
              audioTokenRef.current
            ) {
              return;
            }

            const timing =
              await getMp3QuranTiming(
                read.id,
                currentSurahNumber,
              );

            if (
              token !==
              audioTokenRef.current
            ) {
              return;
            }

            const segment =
              findTiming(
                timing,
                localAyah,
              );

            if (
              !segment ||
              segment.end <=
                segment.start
            ) {
              throw new Error(
                `Timing بۆ ئایەتی ${localAyah} بەردەست نییە.`,
              );
            }

            const src =
              `${read.folder}${String(
                currentSurahNumber,
              ).padStart(
                3,
                '0',
              )}.mp3`;

            currentTimingRef.current =
              segment;

            audio.src = src;

            audio.currentTime =
              segment.start;

            setDuration(
              Number.isFinite(
                audio.duration,
              )
                ? audio.duration
                : segment.end,
            );

            await audio.play();

            setIsPlaying(
              true,
            );

            return;
          }

          /*
           * ---------------------------------
           * EVERYAYAH
           * ---------------------------------
           */

          const src =
            getEveryAyahUrl(
              selectedReciter,
              globalAyah,
            );

          if (!src) {
            throw new Error(
              'Audio URL بۆ ئەم قارییە نییە.',
            );
          }

          currentTimingRef.current =
            null;

          audio.src = src;
          audio.currentTime = 0;

          await audio.play();

          setIsPlaying(
            true,
          );
        } catch (error) {
          if (
            token !==
            audioTokenRef.current
          ) {
            return;
          }

          setIsPlaying(false);
          setPlayingAyahIndex(
            null,
          );

          setErrorText(
            error instanceof Error
              ? error.message
              : 'دەنگ نەکرایەوە.',
          );
        }
      },
      [
        ayahs,
        currentSurahNumber,
        scrollActiveAyahIntoView,
        selectedReciter,
      ],
    );

  /*
   * -----------------------------------------
   * AUDIO TIME UPDATE
   * -----------------------------------------
   *
   * This is the important part for
   * synchronizing audio + highlight.
   */

  const handleTimeUpdate =
    useCallback(() => {
      const audio =
        audioRef.current;

      if (!audio) {
        return;
      }

      const time =
        audio.currentTime;

      setCurrentTime(
        time,
      );

      const timing =
        currentTimingRef.current;

      if (
        !timing ||
        playingAyahIndex ===
          null
      ) {
        return;
      }

      /*
       * If current audio passed the
       * end time of the current ayah,
       * immediately move to the next one.
       */
      if (
        time >=
        timing.end - 0.06
      ) {
        const nextIndex =
          playingAyahIndex + 1;

        currentTimingRef.current =
          null;

        if (
          nextIndex <
          ayahs.length
        ) {
          void playAyah(
            nextIndex,
            true,
          );
        } else {
          stopAudio();
        }
      }
    }, [
      ayahs.length,
      playAyah,
      playingAyahIndex,
      stopAudio,
    ]);

  /*
   * -----------------------------------------
   * AUDIO EVENTS
   * -----------------------------------------
   */

  const handleLoadedMetadata =
    useCallback(() => {
      const audio =
        audioRef.current;

      if (!audio) {
        return;
      }

      if (
        Number.isFinite(
          audio.duration,
        )
      ) {
        setDuration(
          audio.duration,
        );
      }
    }, []);

  const handleEnded =
    useCallback(() => {
      if (
        playingAyahIndex ===
        null
      ) {
        stopAudio();
        return;
      }

      const nextIndex =
        playingAyahIndex + 1;

      if (
        nextIndex <
        ayahs.length
      ) {
        void playAyah(
          nextIndex,
          true,
        );
      } else {
        stopAudio();
      }
    }, [
      ayahs.length,
      playAyah,
      playingAyahIndex,
      stopAudio,
    ]);

  /*
   * -----------------------------------------
   * CLICK ON AYAH
   * -----------------------------------------
   */

  const handleAyahClick =
    useCallback(
      (
        index: number,
      ) => {
        if (
          playingAyahIndex ===
            index &&
          isPlaying
        ) {
          stopAudio();
          return;
        }

        void playAyah(
          index,
          false,
        );
      },
      [
        isPlaying,
        playAyah,
        playingAyahIndex,
        stopAudio,
      ],
    );

  /*
   * -----------------------------------------
   * PREVIOUS / NEXT
   * -----------------------------------------
   */

  const handlePrevious =
    useCallback(() => {
      stopAudio();
      onPrevPage();
    }, [
      onPrevPage,
      stopAudio,
    ]);

  const handleNext =
    useCallback(() => {
      stopAudio();
      onNextPage();
    }, [
      onNextPage,
      stopAudio,
    ]);

  /*
   * -----------------------------------------
   * SELECT RECITER
   * -----------------------------------------
   */

  const selectReciter =
    useCallback(
      (
        reciter: ReaderReciter,
      ) => {
        stopAudio();

        setSelectedReciterId(
          reciter.id,
        );

        setShowReciters(
          false,
        );
      },
      [stopAudio],
    );

  /*
   * -----------------------------------------
   * PAGE JUMP
   * -----------------------------------------
   */

  const handleScroll =
    useCallback(() => {
      const container =
        scrollRef.current;

      if (
        !container ||
        !onJumpToPage
      ) {
        return;
      }

      const index =
        Math.round(
          container.scrollLeft /
            Math.max(
              1,
              container.clientWidth,
            ),
        );

      /*
       * Pages are displayed 604 -> 1.
       */
      const targetPage =
        PAGE_COUNT - index;

      if (
        targetPage >= 1 &&
        targetPage <=
          PAGE_COUNT
      ) {
        onJumpToPage(
          targetPage,
        );
      }
    }, [
      onJumpToPage,
    ]);

  /*
   * -----------------------------------------
   * CLEANUP
   * -----------------------------------------
   */

  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, [stopAudio]);

  /*
   * -----------------------------------------
   * RENDER AYAH BOXES
   * -----------------------------------------
   */

  const renderAyahBoxes =
    () => {
      if (
        ayahBoxes.length === 0
      ) {
        return null;
      }

      return ayahBoxes.map(
        (
          box,
          index,
        ) => {
          const ayahNumber =
            getBoxAyahNumber(
              box,
              index,
            );

          const matchingIndex =
            ayahs.findIndex(
              (
                ayah,
                ayahIndex,
              ) =>
                getLocalAyahNumber(
                  ayah,
                  ayahIndex + 1,
                ) ===
                ayahNumber,
            );

          const actualIndex =
            matchingIndex >= 0
              ? matchingIndex
              : index;

          const active =
            actualIndex ===
            currentAyahIndex;

          return (
            <button
              key={`ayah-${currentPage}-${index}`}
              type="button"
              aria-label={`ئایەتی ${ayahNumber}`}
              onClick={() =>
                handleAyahClick(
                  actualIndex,
                )
              }
              style={{
                position:
                  'absolute',
                left: `${(
                  (box.x /
                    AYAH_CANVAS_WIDTH) *
                  100
                ).toFixed(5)}%`,
                top: `${(
                  (box.y /
                    AYAH_CANVAS_HEIGHT) *
                  100
                ).toFixed(5)}%`,
                width: `${(
                  (box.width /
                    AYAH_CANVAS_WIDTH) *
                  100
                ).toFixed(5)}%`,
                height: `${(
                  (box.height /
                    AYAH_CANVAS_HEIGHT) *
                  100
                ).toFixed(5)}%`,
                border:
                  active
                    ? '2px solid rgba(255, 174, 0, 0.95)'
                    : '1px solid transparent',
                background:
                  active
                    ? 'rgba(255, 196, 0, 0.28)'
                    : 'transparent',
                boxShadow:
                  active
                    ? '0 0 12px rgba(255, 170, 0, 0.42)'
                    : 'none',
                borderRadius:
                  7,
                padding: 0,
                margin: 0,
                cursor:
                  'pointer',
                zIndex: 10,
                transition:
                  'background 120ms ease, box-shadow 120ms ease, border 120ms ease',
              }}
            />
          );
        },
      );
    };

  /*
   * -----------------------------------------
   * PLAY / PAUSE BUTTON
   * -----------------------------------------
   */

  const toggleCurrentAyah =
    () => {
      if (
        playingAyahIndex !==
        null &&
        isPlaying
      ) {
        const audio =
          audioRef.current;

        if (audio) {
          audio.pause();
        }

        setIsPlaying(
          false,
        );

        return;
      }

      if (
        playingAyahIndex !==
        null
      ) {
        const audio =
          audioRef.current;

        if (audio) {
          void audio.play();
          setIsPlaying(
            true,
          );
        }

        return;
      }

      if (
        ayahs.length > 0
      ) {
        void playAyah(
          0,
          false,
        );
      }
    };

  /*
   * -----------------------------------------
   * PROGRESS
   * -----------------------------------------
   */

  const progress =
    duration > 0
      ? Math.min(
          100,
          Math.max(
            0,
            (currentTime /
              duration) *
              100,
          ),
        )
      : 0;

  /*
   * -----------------------------------------
   * PAGE CSS
   * -----------------------------------------
   */

  const pageShellStyle:
    CSSProperties = {
    position:
      'relative',
    flex:
      '0 0 100%',
    width:
      '100%',
    minWidth:
      '100%',
    height:
      '100%',
    display:
      'flex',
    justifyContent:
      'center',
    alignItems:
      'center',
    scrollSnapAlign:
      'center',
  };

  const canvasStyle:
    CSSProperties = {
    position:
      'relative',
    width:
      'min(94vw, 620px)',
    aspectRatio:
      `${AYAH_CANVAS_WIDTH} / ${AYAH_CANVAS_HEIGHT}`,
    maxHeight:
      'calc(100vh - 150px)',
    display:
      'flex',
    justifyContent:
      'center',
    alignItems:
      'center',
    overflow:
      'hidden',
    borderRadius:
      8,
    boxShadow:
      '0 8px 35px rgba(0,0,0,0.18)',
    background:
      '#f8f3e8',
  };

  return (
    <div
      dir="rtl"
      style={{
        position:
          'relative',
        width:
          '100%',
        height:
          '100%',
        overflow:
          'hidden',
        background:
          bgStyle?.background ??
          '#f3efe5',
        ...bgStyle,
      }}
    >
      {/* ---------------------------------- */}
      {/* AUDIO ELEMENT */}
      {/* ---------------------------------- */}

      <audio
        ref={audioRef}
        preload="auto"
        onTimeUpdate={
          handleTimeUpdate
        }
        onLoadedMetadata={
          handleLoadedMetadata
        }
        onEnded={
          handleEnded
        }
        onPlay={() =>
          setIsPlaying(true)
        }
        onPause={() =>
          setIsPlaying(false)
        }
        style={{
          display:
            'none',
        }}
      />

      {/* ---------------------------------- */}
      {/* TOP BAR */}
      {/* ---------------------------------- */}

      <div
        style={{
          position:
            'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          display:
            'flex',
          alignItems:
            'center',
          justifyContent:
            'space-between',
          gap: 8,
          padding:
            '10px 12px',
          background:
            'rgba(20,20,20,0.82)',
          backdropFilter:
            'blur(12px)',
          color:
            '#fff',
        }}
      >
        <button
          type="button"
          onClick={
            onBackToIndex
          }
          style={{
            border: 'none',
            background:
              'rgba(255,255,255,0.12)',
            color:
              '#fff',
            borderRadius:
              10,
            padding:
              '8px 12px',
            cursor:
              'pointer',
          }}
        >
          ☰
        </button>

        <div
          style={{
            flex: 1,
            textAlign:
              'center',
            fontSize:
              15,
            fontWeight:
              700,
          }}
        >
          لاپەڕەی{' '}
          {currentPage}
        </div>

        <button
          type="button"
          onClick={() =>
            setShowReciters(
              value =>
                !value,
            )
          }
          style={{
            border:
              '1px solid rgba(255,255,255,0.18)',
            background:
              'rgba(255,255,255,0.10)',
            color:
              '#fff',
            borderRadius:
              10,
            padding:
              '8px 10px',
            cursor:
              'pointer',
            maxWidth:
              150,
            overflow:
              'hidden',
            textOverflow:
              'ellipsis',
            whiteSpace:
              'nowrap',
          }}
        >
          🎙️{' '}
          {selectedReciter.name}
        </button>
      </div>

      {/* ---------------------------------- */}
      {/* RECITER PANEL */}
      {/* ---------------------------------- */}

      {showReciters && (
        <div
          style={{
            position:
              'absolute',
            top: 60,
            right: 10,
            zIndex: 200,
            width:
              'min(330px, calc(100vw - 20px))',
            maxHeight:
              '65vh',
            overflowY:
              'auto',
            background:
              'rgba(25,25,25,0.97)',
            color:
              '#fff',
            borderRadius:
              16,
            boxShadow:
              '0 15px 50px rgba(0,0,0,0.4)',
            padding:
              10,
          }}
        >
          <div
            style={{
              padding:
                '8px 10px 12px',
              fontWeight:
                800,
              fontSize:
                16,
            }}
          >
            قورئانخوێن
          </div>

          {KURDISH_RECITERS.map(
            reciter => {
              const active =
                reciter.id ===
                selectedReciterId;

              return (
                <button
                  key={
                    reciter.id
                  }
                  type="button"
                  onClick={() =>
                    selectReciter(
                      reciter,
                    )
                  }
                  style={{
                    width:
                      '100%',
                    display:
                      'flex',
                    alignItems:
                      'center',
                    justifyContent:
                      'space-between',
                    gap: 8,
                    border:
                      'none',
                    borderRadius:
                      12,
                    padding:
                      '11px 12px',
                    marginBottom:
                      5,
                    cursor:
                      'pointer',
                    textAlign:
                      'right',
                    background:
                      active
                        ? 'rgba(255,183,0,0.22)'
                        : 'rgba(255,255,255,0.06)',
                    color:
                      '#fff',
                  }}
                >
                  <span>
                    <strong
                      style={{
                        display:
                          'block',
                      }}
                    >
                      {
                        reciter.name
                      }
                    </strong>

                    <small
                      style={{
                        opacity:
                          0.65,
                      }}
                    >
                      {
                        reciter.subName
                      }
                    </small>
                  </span>

                  {active && (
                    <span>
                      ✓
                    </span>
                  )}
                </button>
              );
            },
          )}
        </div>
      )}

      {/* ---------------------------------- */}
      {/* PAGE VIEW */}
      {/* ---------------------------------- */}

      <div
        ref={scrollRef}
        onScroll={
          handleScroll
        }
        style={{
          position:
            'absolute',
          inset:
            '58px 0 94px',
          display:
            'flex',
          flexDirection:
            'row-reverse',
          overflowX:
            'auto',
          overflowY:
            'auto',
          scrollSnapType:
            'x mandatory',
          WebkitOverflowScrolling:
            'touch',
          overscrollBehaviorX:
            'contain',
          scrollbarWidth:
            'none',
        }}
      >
        {Array.from(
          {
            length:
              PAGE_COUNT,
          },
          (
            _,
            index,
          ) => {
            const page =
              PAGE_COUNT -
              index;

            return (
              <div
                key={page}
                style={
                  pageShellStyle
                }
              >
                <div
                  style={{
                    ...canvasStyle,
                    opacity:
                      page ===
                      currentPage
                        ? 1
                        : 0.88,
                  }}
                >
                  <img
                    src={getPageImageUrl(
                      page,
                    )}
                    alt={`Quran page ${page}`}
                    draggable={
                      false
                    }
                    style={{
                      position:
                        'absolute',
                      inset: 0,
                      width:
                        '100%',
                      height:
                        '100%',
                      objectFit:
                        'contain',
                      userSelect:
                        'none',
                      pointerEvents:
                        'none',
                      filter:
                        'grayscale(100%) contrast(115%) brightness(102%)',
                      mixBlendMode:
                        'multiply',
                    }}
                  />

                  {page ===
                    currentPage &&
                    renderAyahBoxes()}

                  {page ===
                    currentPage &&
                    loading && (
                      <div
                        style={{
                          position:
                            'absolute',
                          inset: 0,
                          display:
                            'flex',
                          alignItems:
                            'center',
                          justifyContent:
                            'center',
                          background:
                            'rgba(255,255,255,0.25)',
                          zIndex: 30,
                        }}
                      >
                        <div>
                          دەخەریکە
                          دێت...
                        </div>
                      </div>
                    )}
                </div>
              </div>
            );
          },
        )}
      </div>

      {/* ---------------------------------- */}
      {/* ERROR */}
      {/* ---------------------------------- */}

      {errorText && (
        <div
          style={{
            position:
              'absolute',
            left: 12,
            right: 12,
            bottom: 102,
            zIndex: 150,
            padding:
              '9px 12px',
            borderRadius:
              10,
            background:
              'rgba(170,30,30,0.92)',
            color:
              '#fff',
            textAlign:
              'center',
            fontSize:
              13,
          }}
        >
          {errorText}
        </div>
      )}

      {/* ---------------------------------- */}
      {/* AUDIO CONTROL BAR */}
      {/* ---------------------------------- */}

      <div
        style={{
          position:
            'absolute',
          left: 10,
          right: 10,
          bottom: 10,
          zIndex: 120,
          borderRadius:
            18,
          padding:
            '10px 12px',
          background:
            'rgba(25,25,25,0.91)',
          backdropFilter:
            'blur(15px)',
          color:
            '#fff',
          boxShadow:
            '0 10px 35px rgba(0,0,0,0.28)',
        }}
      >
        <div
          style={{
            display:
              'flex',
            alignItems:
              'center',
            gap: 10,
          }}
        >
          <button
            type="button"
            onClick={
              toggleCurrentAyah
            }
            style={{
              width: 44,
              height: 44,
              flex:
                '0 0 44px',
              border:
                'none',
              borderRadius:
                '50%',
              background:
                'rgba(255,190,0,0.95)',
              color:
                '#111',
              fontSize:
                18,
              cursor:
                'pointer',
            }}
          >
            {isPlaying
              ? 'Ⅱ'
              : '▶'}
          </button>

          <button
            type="button"
            onClick={
              handlePrevious
            }
            disabled={
              currentPage <= 1
            }
            style={{
              border:
                'none',
              background:
                'rgba(255,255,255,0.09)',
              color:
                '#fff',
              borderRadius:
                10,
              width: 38,
              height: 38,
              cursor:
                currentPage <=
                1
                  ? 'default'
                  : 'pointer',
              opacity:
                currentPage <=
                1
                  ? 0.35
                  : 1,
            }}
          >
            ‹
          </button>

          <div
            style={{
              flex: 1,
              minWidth: 0,
            }}
          >
            <div
              style={{
                display:
                  'flex',
                justifyContent:
                  'space-between',
                gap: 8,
                fontSize:
                  12,
                opacity:
                  0.8,
                marginBottom:
                  5,
              }}
            >
              <span>
                {playingAyahIndex !==
                null
                  ? `ئایەتی ${
                      getLocalAyahNumber(
                        ayahs[
                          playingAyahIndex
                        ],
                        playingAyahIndex +
                          1,
                      )
                    }`
                  : 'ئامادەیە'}
              </span>

              <span>
                {selectedReciter.name}
              </span>
            </div>

            <div
              style={{
                height: 5,
                background:
                  'rgba(255,255,255,0.15)',
                borderRadius:
                  99,
                overflow:
                  'hidden',
              }}
            >
              <div
                style={{
                  width: `${progress}%`,
                  height:
                    '100%',
                  background:
                    '#ffbe00',
                  borderRadius:
                    99,
                  transition:
                    'width 80ms linear',
                }}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={
              handleNext
            }
            disabled={
              currentPage >=
              PAGE_COUNT
            }
            style={{
              border:
                'none',
              background:
                'rgba(255,255,255,0.09)',
              color:
                '#fff',
              borderRadius:
                10,
              width: 38,
              height: 38,
              cursor:
                currentPage >=
                PAGE_COUNT
                  ? 'default'
                  : 'pointer',
              opacity:
                currentPage >=
                PAGE_COUNT
                  ? 0.35
                  : 1,
            }}
          >
            ›
          </button>

          <button
            type="button"
            onClick={
              stopAudio
            }
            style={{
              border:
                'none',
              background:
                'rgba(255,255,255,0.09)',
              color:
                '#fff',
              borderRadius:
                10,
              width: 38,
              height: 38,
              cursor:
                'pointer',
            }}
          >
            ■
          </button>
        </div>
      </div>

      {/* ---------------------------------- */}
      {/* PAGE NUMBER */}
      {/* ---------------------------------- */}

      {showNumbers && (
        <div
          style={{
            position:
              'absolute',
            bottom: 104,
            left: '50%',
            transform:
              'translateX(-50%)',
            zIndex: 110,
            padding:
              '4px 10px',
            borderRadius:
              99,
            background:
              'rgba(0,0,0,0.62)',
            color:
              '#fff',
            fontSize:
              12,
          }}
        >
          {currentPage}
        </div>
      )}
    </div>
  );
}

export default QuranReader;
