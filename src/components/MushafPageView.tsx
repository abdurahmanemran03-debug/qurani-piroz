Import React, {
  useState,
  useEffect,
  useRef
} from 'react';

Import {
  ArrowRight,
  Loader2,
  BookOpen,
  Play,
  Pause,
  Bookmark,
  BookmarkCheck,
  Globe,
  Share2,
  X,
  Download,
  Check,
  Trash2
} from 'lucide-react';

Import {
  BgThemeType,
  AppLangType,
  SurahItem
} from '../types';

Import {
  ALL_RECITERS_DIRECTORY,
  ReciterItem
} from '../data/recitersList';

Import {
  ALL_TAFSIRS_DIRECTORY,
  TafsirItem
} from '../data/tafsirList';

Import { RecitersModal } from './RecitersModal';
import { TafsirSelectorModal } from './TafsirSelectorModal';

Import {
  getAyahAudio,
  saveAyahAudio,
  getSurahAudio,
  saveSurahAudio,
  deleteSurahAudio,
  getDownloadedAyahCount,
  isSurahAudioDownloaded
} from '../utils/audioStorage';

Interface MushafPageViewProps {
  CurrentPage: number;
  OnNextPage: () => void;
  OnPrevPage: () => void;
  OnBackToIndex: () => void;
  BgStyle: BgThemeType;
  AppLang: AppLangType;
  ShowNumbers: boolean;
  SurahsList?: SurahItem[];
  OnJumpToPage?: (page: number) => void;
}

Const formatPageNum = (n: number) =>
  String(n).padStart(3, '0');

Const pageImgUrl = (n: number) =>
  `https://android.quran.com/data/width_1260/page${formatPageNum(n)}.png`;

Const AYAH_CANVAS_WIDTH = 1260;
const AYAH_CANVAS_HEIGHT = 2020;

Type AyahBoxObj = {
  S: number;
  A: number;
  L: number;
  X0: number;
  X1: number;
  Y0: number;
  Y1: number;
};

Type SurahDownloadState = {
  Downloaded: number;
  Total: number;
  Downloading: boolean;
  Paused: boolean;
  Error?: boolean;
};

Type AudioSource = {
  Url: string;
  StartTime?: number;
  EndTime?: number;
};

Type Mp3QuranTiming = {
  Ayah: number;
  Start_time: number;
  End_time: number;
};

Type Mp3QuranRead = {
  Id: number;
  Server: string;
  Surah_total?: number;
  Surah_list?: string;
};

Type EstimatedAyahRange = {
  Ayah: number;
  Start: number;
  End: number;
};

Type EstimatedTiming = {
  ReciterId: string;
  SurahNumber: number;
  Ranges: EstimatedAyahRange[];
};

Const surahWordCountsCache: Record<
  Number,
  Number[]
> = {};

Const getSurahWordCounts = async (
  SurahNumber: number
): Promise<number[]> => {
  If (
    SurahWordCountsCache[surahNumber]
  ) {
    Return surahWordCountsCache[
      SurahNumber
    ];
  }

  Try {
    Const res = await fetch(
      `https://api.alquran.cloud/v1/surah/${surahNumber}/quran-uthmani`
    );

    Const data = await res.json();

    Const ayahs = Array.isArray(
      Data?.data?.ayahs
    )
      ? Data.data.ayahs
      : [];

    Const counts = ayahs.map(
      (a: any) => {
        Const text = String(
          A?.text || ''
        ).trim();

        Const words = text
          .split(/\s+/)
          .filter(Boolean);

        Return Math.max(
          1,
          Words.length
        );
      }
    );

    SurahWordCountsCache[
      SurahNumber
    ] = counts;

    Return counts;
  } catch (error) {
    Console.warn(
      'Estimated timing: surah word counts fetch failed',
      Error
    );

    Return [];
  }
};

Const buildEstimatedRanges = (
  Counts: number[],
  Duration: number
): EstimatedAyahRange[] => {
  Const totalWords = counts.reduce(
    (sum, c) => sum + c,
    0
  );

  If (
    !totalWords ||
    !Number.isFinite(duration) ||
    Duration <= 0
  ) {
    Return [];
  }

  Let elapsed = 0;

  Return counts.map(
    (count, idx) => {
      Const share =
        (count / totalWords) *
        Duration;

      Const start = elapsed;
      Const end = elapsed + share;

      Elapsed = end;

      Return {
        Ayah: idx + 1,
        Start,
        End
      };
    }
  );
};

Const LONG_PRESS_MS = 550;

Const TAFSIR_API_EDITION: Record<
  String,
  String
> = {
  Ku_asan: 'ku.asan',
  Ar_muyassar: 'ar.muyassar',
  Ar_jalalayn: 'ar.jalalayn',
  En_sahih: 'en.sahih',
  En_pickthall: 'en.pickthall',
  En_yusuf_ali: 'en.yusufali',
  En_hilali_khan: 'en.hilali',
  En_maududi: 'en.maududi',
  En_transliteration: 'en.transliteration',
  Fa_ahsan_kalam: 'fa.ansarian',
  Tr_diyanet: 'tr.diyanet',
  Tr_elmali: 'tr.yazir',
  De_bubenheim: 'de.bubenheim',
  Fr_hamidullah: 'fr.hamidullah',
  Ru_kuliev: 'ru.kuliev',
  Ru_abu_adel: 'ru.abuadel',
  Es_cortes: 'es.cortes',
  Ur_maududi: 'ur.maududi',
  Ur_junagarhi: 'ur.junagarhi',
  Id_sabeq: 'id.indonesian',
  Ms_basmeih: 'ms.basmeih',
  Sq_nahi: 'sq.nahi',
  Am_sadiq: 'am.sadiq',
  Az_musayev: 'az.musayev',
  Bn_zakaria: 'bn.bengali',
  Bs_korkut: 'bs.korkut',
  Zh_majian: 'zh.jian',
  Nl_abdalsalaam: 'nl.keyzer',
  Ha_gumi: 'ha.gumi',
  Hi_umari: 'hi.hindi',
  It_piccardo: 'it.piccardo',
  Ja_mita: 'ja.japanese',
  Ko_choi: 'ko.korean',
  Ml_parappoor: 'ml.abdulhameed',
  Ps_abdulsalam: 'ps.abdulsalam',
  So_abduh: 'so.abduh',
  Sw_barwani: 'sw.barwani',
  Sv_bernstrom: 'sv.bernstrom',
  Tg_rowwad: 'tg.ayati',
  Th_kingfahad: 'th.thai',
  Ug_saleh: 'ug.saleh',
  Uz_yusuf: 'uz.sodik'
};

Const getInitialReciter =
  (): ReciterItem => {
    Try {
      Const savedId =
        LocalStorage.getItem(
          'quran_selected_reciter'
        );

      If (savedId) {
        Const savedReciter =
          ALL_RECITERS_DIRECTORY.find(
            R => r.id === savedId
          );

        If (savedReciter) {
          Return savedReciter;
        }
      }
    } catch {
      // Ignore
    }

    Return (
      ALL_RECITERS_DIRECTORY[18] ||
      ALL_RECITERS_DIRECTORY[0]
    );
  };

Const normalizeUrl = (
  Value: string
) =>
  Value
    .trim()
    .replace(/\/+$/, '')
    .toLowerCase();

Const makeEveryAyahUrl = (
  Reciter: ReciterItem,
  SurahNumber: number,
  AyahNumber: number
) => {
  Const surah =
    String(surahNumber).padStart(3, '0');

  Const ayah =
    String(ayahNumber).padStart(3, '0');

  Return (
    `https://everyayah.com/data/` +
    `${reciter.serverKey}/` +
    `${surah}${ayah}.mp3`
  );
};

Const makeMp3QuranSurahUrl = (
  Reciter: ReciterItem,
  SurahNumber: number
) => {
  If (!reciter.audioBaseUrl) {
    Return null;
  }

  Const base =
    Reciter.audioBaseUrl.endsWith('/')
      ? Reciter.audioBaseUrl
      : `${reciter.audioBaseUrl}/`;

  Return (
    `${base}${String(
      SurahNumber
    ).padStart(3, '0')}.mp3`
  );
};

Const normalizeTimingValue = (
  Value: number
) => {
  If (!Number.isFinite(value)) {
    Return 0;
  }

  If (value > 10000) {
    Return value / 1000;
  }

  Return value;
};

Export const MushafPageView: React.FC<
  MushafPageViewProps
> = ({
  CurrentPage,
  OnNextPage,
  OnPrevPage,
  OnBackToIndex,
  BgStyle,
  AppLang,
  ShowNumbers,
  SurahsList = [],
  OnJumpToPage
}) => {
  Const [
    ViewMode,
    SetViewMode
  ] = useState<
    'mushaf' | 'tafsir'
  >('mushaf');

  Const [
    ShowControls,
    SetShowControls
  ] = useState(true);

  Const [
    IsRecitersModalOpen,
    SetIsRecitersModalOpen
  ] = useState(false);

  Const [
    IsTafsirSelectorOpen,
    SetIsTafsirSelectorOpen
  ] = useState(false);

  Const [
    SelectedReciter,
    SetSelectedReciter
  ] = useState<ReciterItem>(
    GetInitialReciter
  );

  Const [
    SelectedTafsir,
    SetSelectedTafsir
  ] = useState<TafsirItem>(
    ALL_TAFSIRS_DIRECTORY[0]
  );

  Const [
    PageAyahsData,
    SetPageAyahsData
  ] = useState<any[]>([]);

  Const [
    LoadingTafsir,
    SetLoadingTafsir
  ] = useState(false);

  Const [
    AyahApiError,
    SetAyahApiError
  ] = useState<string | null>(null);

  Const [
    TafsirApiError,
    SetTafsirApiError
  ] = useState<string | null>(null);

  Const [
    Bookmarks,
    SetBookmarks
  ] = useState<number[]>(
    () => {
      Try {
        Const saved =
          LocalStorage.getItem(
            'quran_bookmarks'
          );

        Return saved
          ? JSON.parse(saved)
          : [];
      } catch {
        Return [];
      }
    }
  );

  Const [
    IsPlayingAudio,
    SetIsPlayingAudio
  ] = useState(false);

  Const audioRef =
    UseRef<HTMLAudioElement | null>(
      Null
    );

  Const [
    PlayingAyahKey,
    SetPlayingAyahKey
  ] = useState<string | null>(
    Null
  );

  Const audioObjectUrlRef =
    UseRef<string | null>(null);

  Const audioRequestIdRef =
    UseRef(0);

  Const mp3TimingCacheRef =
    UseRef<
      Record<
        String,
        Mp3QuranTiming[]
      >
    >({});

  Const mp3ReadCacheRef =
    UseRef<
      Record<
        String,
        Mp3QuranRead | null
      >
    >({});

  Const activeSegmentRef =
    UseRef<{
      EndTime: number | null;
      RequestId: number;
    } | null>(null);

  Const estimatedTimingRef =
    UseRef<EstimatedTiming | null>(
      Null
    );

  Const [
    SurahDownloadState,
    SetSurahDownloadState
  ] = useState<SurahDownloadState>({
    Downloaded: 0,
    Total: 0,
    Downloading: false,
    Paused: false,
    Error: false
  });

  Const downloadAbortControllerRef =
    UseRef<AbortController | null>(null);

  Const downloadSessionRef =
    UseRef(0);

  Const clearAudioObjectUrl =
    () => {
      If (
        AudioObjectUrlRef.current
      ) {
        Try {
          URL.revokeObjectURL(
            AudioObjectUrlRef.current
          );
        } catch {
          // Ignore
        }

        AudioObjectUrlRef.current =
          Null;
      }
    };

  Const stopAudioCompletely =
    () => {
      AudioRequestIdRef.current++;

      ActiveSegmentRef.current =
        Null;

      EstimatedTimingRef.current =
        Null;

      If (
        AudioRef.current
      ) {
        Try {
          AudioRef.current.pause();
          AudioRef.current.currentTime = 0;
          AudioRef.current.removeAttribute(
            'src'
          );
          AudioRef.current.load();
        } catch {
          // Ignore
        }
      }

      ClearAudioObjectUrl();

      SetIsPlayingAudio(false);
      SetPlayingAyahKey(null);

      PageAudioIndexRef.current =
        -1;

      SetPageAudioIndex(-1);
    };

  Const getMp3QuranRead =
    Async (
      Reciter: ReciterItem
    ): Promise<Mp3QuranRead | null> => {
      Const cacheKey =
        Reciter.id;

      If (
        Object.prototype.hasOwnProperty.call(
          Mp3ReadCacheRef.current,
          CacheKey
        )
      ) {
        Return (
          Mp3ReadCacheRef.current[
            CacheKey
          ]
        );
      }

      If (
        !reciter.audioBaseUrl
      ) {
        Mp3ReadCacheRef.current[
          CacheKey
        ] = null;

        Return null;
      }

      Try {
        Const response =
          Await fetch(
            'https://mp3quran.net/api/v3/reciters?language=eng'
          );

        If (!response.ok) {
          Throw new Error(
            `MP3Quran API HTTP ${response.status}`
          );
        }

        Const data =
          Await response.json();

        Const remoteReciters =
          Array.isArray(
            Data?.reciters
          )
            ? Data.reciters
            : [];

        Const localBase =
          NormalizeUrl(
            Reciter.audioBaseUrl
          );

        Let found:
          | Mp3QuranRead
          | null = null;

        For (
          Const remoteReciter of remoteReciters
        ) {
          Const moshafs =
            Array.isArray(
              RemoteReciter?.moshaf
            )
              ? RemoteReciter.moshaf
              : [];

          For (
            Const moshaf of moshafs
          ) {
            Const server =
              String(
                Moshaf?.server || ''
              );

            Const remoteServer =
              NormalizeUrl(server);

            If (
              !remoteServer ||
              !localBase
            ) {
              Continue;
            }

            Const matches =
              LocalBase ===
                RemoteServer ||
              LocalBase.includes(
                RemoteServer
              ) ||
              RemoteServer.includes(
                LocalBase
              );

            If (!matches) {
              Continue;
            }

            Const id =
              Number(moshaf?.id);

            If (
              !Number.isFinite(id)
            ) {
              Continue;
            }

            Found = {
              Id,
              Server,
              Surah_total:
                Number(
                  Moshaf?.surah_total
                ),
              Surah_list:
                String(
                  Moshaf?.surah_list ||
                    ''
                )
            };

            Break;
          }

          If (found) {
            Break;
          }
        }

        Mp3ReadCacheRef.current[
          CacheKey
        ] = found;

        Return found;
      } catch (error) {
        Console.error(
          'MP3Quran read lookup failed:',
          Error
        );

        Mp3ReadCacheRef.current[
          CacheKey
        ] = null;

        Return null;
      }
    };

  Const getMp3QuranTiming =
    Async (
      Reciter: ReciterItem,
      SurahNumber: number
    ): Promise<
      Mp3QuranTiming[]
    > => {
      Const cacheKey =
        `${reciter.id}_${surahNumber}`;

      If (
        Mp3TimingCacheRef.current[
          CacheKey
        ]
      ) {
        Return (
          Mp3TimingCacheRef.current[
            CacheKey
          ]
        );
      }

      Const read =
        Await getMp3QuranRead(
          Reciter
        );

      If (!read) {
        Return [];
      }

      Try {
        Const response =
          Await fetch(
            `https://mp3quran.net/api/v3/ayat_timing?surah=${surahNumber}&read=${read.id}`
          );

        If (!response.ok) {
          Throw new Error(
            `MP3Quran timing HTTP ${response.status}`
          );
        }

        Const data =
          Await response.json();

        Let raw: any[] = [];

        If (
          Array.isArray(data)
        ) {
          Raw = data;
        } else if (
          Array.isArray(data?.ayat)
        ) {
          Raw = data.ayat;
        } else if (
          Array.isArray(data?.data)
        ) {
          Raw = data.data;
        } else if (
          Array.isArray(
            Data?.timing
          )
        ) {
          Raw = data.timing;
        } else if (
          Array.isArray(
            Data?.ayahs
          )
        ) {
          Raw = data.ayahs;
        }

        Const timings =
          Raw
            .map(
              (item: any) => {
                Const ayah =
                  Number(
                    Item?.ayah ??
                      Item?.ayah_number ??
                      Item?.number
                  );

                Const startRaw =
                  Number(
                    Item?.start_time ??
                      Item?.start ??
                      Item?.startTime
                  );

                Const endRaw =
                  Number(
                    Item?.end_time ??
                      Item?.end ??
                      Item?.endTime
                  );

                Return {
                  Ayah,
                  Start_time:
                    NormalizeTimingValue(
                      StartRaw
                    ),
                  End_time:
                    NormalizeTimingValue(
                      EndRaw
                    )
                };
              }
            )
            .filter(
              (
                Item: Mp3QuranTiming
              ) =>
                Number.isFinite(
                  Item.ayah
                ) &&
                Item.ayah > 0 &&
                Number.isFinite(
                  Item.start_time
                ) &&
                Number.isFinite(
                  Item.end_time
                ) &&
                Item.end_time >
                  Item.start_time
            );

        Mp3TimingCacheRef.current[
          CacheKey
        ] = timings;

        Return timings;
      } catch (error) {
        Console.error(
          'MP3Quran timing error:',
          Error
        );

        Mp3TimingCacheRef.current[
          CacheKey
        ] = [];

        Return [];
      }
    };

  Const getAudioSource =
    Async (
      Reciter: ReciterItem,
      SurahNumber: number,
      AyahNumber: number
    ): Promise<AudioSource> => {
      If (
        Reciter.audioSource ===
        'mp3quran'
      ) {
        Const timings =
          Await getMp3QuranTiming(
            Reciter,
            SurahNumber
          );

        Const timing =
          Timings.find(
            Item =>
              Item.ayah ===
              AyahNumber
          );

        Try {
          Const localSurah =
            Await getSurahAudio(
              Reciter.id,
              SurahNumber
            );

          If (localSurah) {
            ClearAudioObjectUrl();

            Const localUrl =
              URL.createObjectURL(
                LocalSurah
              );

            AudioObjectUrlRef.current =
              LocalUrl;

            Return {
              Url: localUrl,
              StartTime:
                Timing?.start_time,
              EndTime:
                Timing?.end_time
            };
          }
        } catch (error) {
          Console.warn(
            'Local MP3Quran audio unavailable:',
            Error
          );
        }

        Const onlineUrl =
          MakeMp3QuranSurahUrl(
            Reciter,
            SurahNumber
          );

        If (!onlineUrl) {
          Throw new Error(
            `URL ـی MP3Quran بۆ ${reciter.name} نەدۆزرایەوە`
          );
        }

        Return {
          Url: onlineUrl,
          StartTime:
            Timing?.start_time,
          EndTime:
            Timing?.end_time
        };
      }

      Const localBlob =
        Await getAyahAudio(
          Reciter.id,
          SurahNumber,
          AyahNumber
        ).catch(
          () => null
        );

      If (localBlob) {
        ClearAudioObjectUrl();

        Const localUrl =
          URL.createObjectURL(
            LocalBlob
          );

        AudioObjectUrlRef.current =
          LocalUrl;

        Return {
          Url: localUrl
        };
      }

      Const onlineUrl =
        MakeEveryAyahUrl(
          Reciter,
          SurahNumber,
          AyahNumber
        );

      If (!onlineUrl) {
        Throw new Error(
          `EveryAyah URL نەدروست بوو بۆ ${reciter.name}`
        );
      }

      Return {
        Url: onlineUrl
      };
    };

  Const [
    PageAudioIndex,
    SetPageAudioIndex
  ] = useState(-1);

  Const pageAudioIndexRef =
    UseRef(-1);

  Const [
    PressingBox,
    SetPressingBox
  ] = useState<string | null>(
    Null
  );

  Const [
    HighlightedAyah,
    SetHighlightedAyah
  ] = useState<{
    Ayah: any;
    TopPercent: number;
  } | null>(null);

  Const [
    TafsirSheetOpen,
    SetTafsirSheetOpen
  ] = useState(false);

  Const longPressTimer =
    UseRef<
      ReturnType<
        Typeof setTimeout
      > | null
    >(null);

  Const [
    AllAyahData,
    SetAllAyahData
  ] = useState<
    Record<
      String,
      AyahBoxObj[]
    >
  >({});

  UseEffect(() => {
    Fetch(
      `${import.meta.env.BASE_URL}ayahdata/ayahdata.json`
    )
      .then(res => {
        If (!res.ok) {
          Throw new Error(
            'ayahdata.json not found'
          );
        }

        Return res.json();
      })
      .then(data => {
        SetAllAyahData(data);
      })
      .catch(() => {
        SetAllAyahData({});
      });
  }, []);

  Const ayahBoxes: AyahBoxObj[] =
    AllAyahData[
      String(currentPage)
    ] || [];

  Const [
    AyahBookmarks,
    SetAyahBookmarks
  ] = useState<string[]>(
    () => {
      Try {
        Const saved =
          LocalStorage.getItem(
            'quran_ayah_bookmarks'
          );

        Return saved
          ? JSON.parse(saved)
          : [];
      } catch {
        Return [];
      }
    }
  );

  Const ayahKey = (
    A: any
  ) =>
    `${a.surahNumber}:${a.numberInSurah}`;

  Const isAyahBookmarked = (
    A: any
  ) =>
    AyahBookmarks.includes(
      AyahKey(a)
    );

  Const toggleAyahBookmark = (
    A: any
  ) => {
    Const key =
      AyahKey(a);

    Const updated =
      IsAyahBookmarked(a)
        ? AyahBookmarks.filter(
            K => k !== key
          )
        : [
            ...ayahBookmarks,
            Key
          ];

    SetAyahBookmarks(
      Updated
    );

    LocalStorage.setItem(
      'quran_ayah_bookmarks',
      JSON.stringify(
        Updated
      )
    );

    Navigator.vibrate?.(35);
  };

  UseEffect(() => {
    Try {
      LocalStorage.setItem(
        'quran_selected_reciter',
        SelectedReciter.id
      );
    } catch {
      // Ignore
    }
  }, [
    SelectedReciter.id
  ]);

  UseEffect(() => {
    Const handleReciterChanged =
      (
        Event: Event
      ) => {
        Const customEvent =
          Event as CustomEvent<string>;

        Const reciterId =
          CustomEvent.detail;

        If (!reciterId) {
          Return;
        }

        Const reciter =
          ALL_RECITERS_DIRECTORY.find(
            R =>
              R.id ===
              ReciterId
          );

        If (reciter) {
          SetSelectedReciter(
            Reciter
          );
        }
      };

    Window.addEventListener(
      'quran-reciter-changed',
      HandleReciterChanged
    );

    Return () => {
      Window.removeEventListener(
        'quran-reciter-changed',
        HandleReciterChanged
      );
    };
  }, []);

  Const getTafsirApiEdition =
    (
      Tafsir: TafsirItem
    ): string | null =>
      TAFSIR_API_EDITION[
        Tafsir.id
      ] || null;

  Const currentSurah =
    SurahsList
      .slice()
      .reverse()
      .find(
        S =>
          CurrentPage >=
          S.startPage
      ) ||
    SurahsList[0];

  Const currentSurahNumber =
    CurrentSurah?.number ||
    0;

  Const currentSurahAyahCount =
    CurrentSurah?.ayahs ||
    0;

  Const refreshCurrentSurahDownload =
    Async () => {
      If (
        !currentSurahNumber ||
        !currentSurahAyahCount
      ) {
        SetSurahDownloadState({
          Downloaded: 0,
          Total: 0,
          Downloading: false,
          Paused: false,
          Error: false
        });

        Return;
      }

      Try {
        If (
          SelectedReciter.audioSource ===
          'mp3quran'
        ) {
          Const downloaded =
            Await isSurahAudioDownloaded(
              SelectedReciter.id,
              CurrentSurahNumber
            );

          SetSurahDownloadState(
            Previous => ({
              ...previous,
              Downloaded:
                Downloaded
                  ? CurrentSurahAyahCount
                  : 0,
              Total:
                CurrentSurahAyahCount,
              Downloading: false,
              Paused:
                Previous.paused,
              Error: false
            })
          );

          Return;
        }

        Const downloaded =
          Await getDownloadedAyahCount(
            SelectedReciter.id,
            CurrentSurahNumber,
            CurrentSurahAyahCount
          );

        SetSurahDownloadState(
          Previous => ({
            ...previous,
            Downloaded,
            Total:
              CurrentSurahAyahCount,
            Downloading: false,
            Error: false
          })
        );
      } catch (error) {
        Console.error(
          'Refresh download state error:',
          Error
        );

        SetSurahDownloadState(
          Previous => ({
            ...previous,
            Total:
              CurrentSurahAyahCount,
            Downloading: false
          })
        );
      }
    };

  UseEffect(() => {
    DownloadSessionRef.current++;

    DownloadAbortControllerRef.current?.abort();

    DownloadAbortControllerRef.current =
      Null;

    SetSurahDownloadState({
      Downloaded: 0,
      Total:
        CurrentSurahAyahCount,
      Downloading: false,
      Paused: false,
      Error: false
    });

    Void refreshCurrentSurahDownload();
  }, [
    CurrentSurahNumber,
    CurrentSurahAyahCount,
    SelectedReciter.id
  ]);

  Const downloadCurrentSurah =
    Async () => {
      If (
        !currentSurahNumber ||
        !currentSurahAyahCount
      ) {
        Return;
      }

      If (
        SurahDownloadState.downloading
      ) {
        Return;
      }

      Const reciterAtStart =
        SelectedReciter;

      Const surahNumberAtStart =
        CurrentSurahNumber;

      Const ayahCountAtStart =
        CurrentSurahAyahCount;

      Const session =
        ++downloadSessionRef.current;

      Const controller =
        New AbortController();

      DownloadAbortControllerRef.current =
        Controller;

      Try {
        If (
          ReciterAtStart.audioSource ===
          'mp3quran'
        ) {
          Const alreadyDownloaded =
            Await isSurahAudioDownloaded(
              ReciterAtStart.id,
              SurahNumberAtStart
            );

          If (
            AlreadyDownloaded
          ) {
            If (
              Session ===
                DownloadSessionRef.current &&
              SelectedReciter.id ===
                ReciterAtStart.id
            ) {
              SetSurahDownloadState({
                Downloaded:
                  AyahCountAtStart,
                Total:
                  AyahCountAtStart,
                Downloading:
                  False,
                Paused: false,
                Error: false
              });
            }

            Return;
          }

          Const url =
            MakeMp3QuranSurahUrl(
              ReciterAtStart,
              SurahNumberAtStart
            );

          If (!url) {
            Throw new Error(
              'MP3Quran audioBaseUrl نەدۆزرایەوە'
            );
          }

          SetSurahDownloadState({
            Downloaded: 0,
            Total:
              AyahCountAtStart,
            Downloading: true,
            Paused: false,
            Error: false
          });

          Const response =
            Await fetch(url, {
              Signal:
                Controller.signal
            });

          If (!response.ok) {
            Throw new Error(
              `HTTP ${response.status}`
            );
          }

          Const blob =
            Await response.blob();

          If (
            Controller.signal.aborted
          ) {
            Throw new DOMException(
              'Download paused',
              'AbortError'
            );
          }

          If (
            Blob.size === 0
          ) {
            Throw new Error(
              'فایلی دەنگ بەتاڵە'
            );
          }

          Await saveSurahAudio(
            ReciterAtStart.id,
            SurahNumberAtStart,
            Blob
          );

          If (
            Session ===
              DownloadSessionRef.current &&
            SelectedReciter.id ===
              ReciterAtStart.id
          ) {
            SetSurahDownloadState({
              Downloaded:
                AyahCountAtStart,
              Total:
                AyahCountAtStart,
              Downloading:
                False,
              Paused: false,
              Error: false
            });

            Navigator.vibrate?.([
              40,
              60,
              40
            ]);
          }

          Return;
        }

        Let currentCount =
          Await getDownloadedAyahCount(
            ReciterAtStart.id,
            SurahNumberAtStart,
            AyahCountAtStart
          );

        If (
          Session !==
          DownloadSessionRef.current
        ) {
          Return;
        }

        SetSurahDownloadState({
          Downloaded:
            CurrentCount,
          Total:
            AyahCountAtStart,
          Downloading: true,
          Paused: false,
          Error: false
        });

        For (
          Let ayah = 1;
          Ayah <=
          AyahCountAtStart;
          Ayah++
        ) {
          If (
            Controller.signal.aborted
          ) {
            Throw new DOMException(
              'Download paused',
              'AbortError'
            );
          }

          If (
            Session !==
            DownloadSessionRef.current
          ) {
            Return;
          }

          Const existing =
            Await getAyahAudio(
              ReciterAtStart.id,
              SurahNumberAtStart,
              Ayah
            );

          If (existing) {
            Continue;
          }

          Const url =
            MakeEveryAyahUrl(
              ReciterAtStart,
              SurahNumberAtStart,
              Ayah
            );

          Const response =
            Await fetch(url, {
              Signal:
                Controller.signal
            });

          If (!response.ok) {
            Throw new Error(
              `HTTP ${response.status} — ${url}`
            );
          }

          Const blob =
            Await response.blob();

          If (
            Controller.signal.aborted
          ) {
            Throw new DOMException(
              'Download paused',
              'AbortError'
            );
          }

          If (
            Blob.size === 0
          ) {
            Throw new Error(
              `فایلی ئایەتی ${ayah} بەتاڵە`
            );
          }

          Await saveAyahAudio(
            ReciterAtStart.id,
            SurahNumberAtStart,
            Ayah,
            Blob
          );

          CurrentCount++;

          If (
            Session ===
              DownloadSessionRef.current &&
            SelectedReciter.id ===
              ReciterAtStart.id
          ) {
            SetSurahDownloadState({
              Downloaded:
                CurrentCount,
              Total:
                AyahCountAtStart,
              Downloading: true,
              Paused: false,
              Error: false
            });
          }
        }

        Const finalCount =
          Await getDownloadedAyahCount(
            ReciterAtStart.id,
            SurahNumberAtStart,
            AyahCountAtStart
          );

        If (
          Session ===
            DownloadSessionRef.current &&
          SelectedReciter.id ===
            ReciterAtStart.id
        ) {
          SetSurahDownloadState({
            Downloaded:
              FinalCount,
            Total:
              AyahCountAtStart,
            Downloading: false,
            Paused: false,
            Error: false
          });

          Navigator.vibrate?.([
            40,
            60,
            40
          ]);
        }
      } catch (error: any) {
        If (
          Error?.name ===
          'AbortError'
        ) {
          Let current = 0;

          If (
            ReciterAtStart.audioSource ===
            'mp3quran'
          ) {
            Const downloaded =
              Await isSurahAudioDownloaded(
                ReciterAtStart.id,
                SurahNumberAtStart
              ).catch(
                () => false
              );

            Current =
              Downloaded
                ? AyahCountAtStart
                : 0;
          } else {
            Current =
              Await getDownloadedAyahCount(
                ReciterAtStart.id,
                SurahNumberAtStart,
                AyahCountAtStart
              ).catch(
                () => 0
              );
          }

          If (
            Session ===
              DownloadSessionRef.current &&
            SelectedReciter.id ===
              ReciterAtStart.id
          ) {
            SetSurahDownloadState({
              Downloaded:
                Current,
              Total:
                AyahCountAtStart,
              Downloading:
                False,
              Paused: true,
              Error: false
            });
          }
        } else {
          Console.error(
            'Audio download error:',
            Error
          );

          Let current = 0;

          If (
            ReciterAtStart.audioSource ===
            'mp3quran'
          ) {
            Const downloaded =
              Await isSurahAudioDownloaded(
                ReciterAtStart.id,
                SurahNumberAtStart
              ).catch(
                () => false
              );

            Current =
              Downloaded
                ? AyahCountAtStart
                : 0;
          } else {
            Current =
              Await getDownloadedAyahCount(
                ReciterAtStart.id,
                SurahNumberAtStart,
                AyahCountAtStart
              ).catch(
                () => 0
              );
          }

          If (
            Session ===
              DownloadSessionRef.current &&
            SelectedReciter.id ===
              ReciterAtStart.id
          ) {
            SetSurahDownloadState({
              Downloaded:
                Current,
              Total:
                AyahCountAtStart,
              Downloading:
                False,
              Paused: false,
              Error: true
            });

            Alert(
              'دابەزاندنی دەنگ سەرکەوتوو نەبوو.\n\nلەوانەیە سەرچاوەی دەنگی ئەم قارییە بەردەست نەبێت یان ڕێگە بە دابەزاندنی ڕاستەوخۆ نەدات.'
            );
          }
        }
      } finally {
        If (
          DownloadAbortControllerRef.current ===
          Controller
        ) {
          DownloadAbortControllerRef.current =
            Null;
        }
      }
    };

  Const pauseCurrentSurahDownload =
    () => {
      DownloadAbortControllerRef.current?.abort();
    };

  Const removeCurrentSurahAudio =
    Async () => {
      If (
        !currentSurahNumber ||
        !currentSurahAyahCount
      ) {
        Return;
      }

      If (
        SurahDownloadState.downloading
      ) {
        DownloadAbortControllerRef.current?.abort();
      }

      Const confirmed =
        Window.confirm(
          AppLang === 'ar'
            ? 'هل تريد حذف صوت هذه السورة؟'
            : AppLang === 'en'
              ? 'Delete downloaded audio for this surah?'
              : 'دڵنیایت دەتەوێت دەنگی ئەم سورەتە بسڕیتەوە؟'
        );

      If (!confirmed) {
        Return;
      }

      Try {
        Await deleteSurahAudio(
          SelectedReciter.id,
          CurrentSurahNumber,
          CurrentSurahAyahCount
        );

        DownloadSessionRef.current++;

        SetSurahDownloadState({
          Downloaded: 0,
          Total:
            CurrentSurahAyahCount,
          Downloading: false,
          Paused: false,
          Error: false
        });
      } catch (error) {
        Console.error(
          'Delete audio error:',
          Error
        );

        Alert(
          'سڕینەوەی دەنگ سەرکەوتوو نەبوو.'
        );
      }
    };

  Const downloadProgress =
    SurahDownloadState.total >
    0
      ? Math.round(
          (surahDownloadState.downloaded /
            SurahDownloadState.total) *
            100
        )
      : 0;

  Const isSurahDownloadComplete =
    SurahDownloadState.total >
      0 &&
    SurahDownloadState.downloaded >=
      SurahDownloadState.total;

  Const renderCurrentSurahDownload =
    () => {
      If (
        !currentSurah ||
        !currentSurahNumber ||
        !currentSurahAyahCount
      ) {
        Return null;
      }

      If (
        SurahDownloadState.downloading
      ) {
        Return (
          <div className="flex items-center gap-2">
            <button
              Type="button"
              OnClick={e => {
                E.stopPropagation();

                PauseCurrentSurahDownload();
              }}
              ClassName="h-9 px-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.97] transition-all"
            >
              <Pause className="w-3.5 h-3.5" />

              <span className="text-[10px] font-bold">
                وەستاندن
              </span>
            </button>

            <div className="min-w-[64px] text-center">
              <div className="text-[10px] font-bold text-amber-700">
                {downloadProgress}%
              </div>

              <div className="text-[8px] text-slate-400">
                {
                  SurahDownloadState.downloaded
                }
                /
                {
                  SurahDownloadState.total
                }
              </div>
            </div>
          </div>
        );
      }

      If (
        IsSurahDownloadComplete
      ) {
        Return (
          <div className="flex items-center gap-1.5">
            <div className="h-9 px-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center gap-1.5">
              <Check className="w-3.5 h-3.5" />

              <span className="text-[9px] font-bold">
                دابەزێندراوە
              </span>
            </div>

            <button
              Type="button"
              OnClick={e => {
                E.stopPropagation();

                Void removeCurrentSurahAudio();
              }}
              ClassName="h-9 px-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.97] transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />

              <span className="text-[9px] font-bold">
                سڕینەوە
              </span>
            </button>
          </div>
        );
      }

      If (
        SurahDownloadState.downloaded >
        0
      ) {
        Return (
          <div className="flex items-center gap-2">
            <button
              Type="button"
              OnClick={e => {
                E.stopPropagation();

                Void downloadCurrentSurah();
              }}
              ClassName="h-9 px-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.97] transition-all"
            >
              <Play className="w-3.5 h-3.5" />

              <span className="text-[9px] font-bold">
                بەردەوامکردن
              </span>
            </button>

            <div className="min-w-[58px] text-center">
              <div className="text-[10px] font-bold text-blue-700">
                {downloadProgress}%
              </div>

              <div className="text-[8px] text-slate-400">
                {
                  SurahDownloadState.downloaded
                }
                /
                {
                  SurahDownloadState.total
                }
              </div>
            </div>
          </div>
        );
      }

      Return (
        <button
          Type="button"
          OnClick={e => {
            E.stopPropagation();

            Void downloadCurrentSurah();
          }}
          ClassName="h-9 px-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.97] transition-all"
        >
          <Download className="w-3.5 h-3.5" />

          <span className="text-[9px] font-bold">
            دابەزاندن
          </span>
        </button>
      );
    };

  Const playAyahAudio =
    Async (
      A: any
    ) => {
      Const key =
        AyahKey(a);

      If (
        PlayingAyahKey === key
      ) {
        StopAudioCompletely();
        Return;
      }

      Const requestId =
        ++audioRequestIdRef.current;

      ActiveSegmentRef.current =
        Null;

      PageAudioIndexRef.current =
        -1;

      SetPageAudioIndex(-1);

      Const ayahBox =
        AyahBoxes.find(
          B =>
            B.s ===
              A.surahNumber &&
            B.a ===
              A.numberInSurah
        );

      If (ayahBox) {
        Const topPct =
          (ayahBox.y0 /
            AYAH_CANVAS_HEIGHT) *
          100;

        SetHighlightedAyah({
          Ayah: a,
          TopPercent:
            TopPct
        });
      }

      If (
        !audioRef.current
      ) {
        Return;
      }

      AudioRef.current.pause();
      ClearAudioObjectUrl();

      Try {
        Const source =
          Await getAudioSource(
            SelectedReciter,
            A.surahNumber,
            A.numberInSurah
          );

        If (
          RequestId !==
          AudioRequestIdRef.current
        ) {
          Return;
        }

        Const audio =
          AudioRef.current;

        Audio.src =
          Source.url;

        ActiveSegmentRef.current =
          {
            EndTime:
              Source.endTime ??
              Null,
            RequestId
          };

        If (
          Source.startTime !==
          Undefined
        ) {
          Await new Promise<void>(
            (
              Resolve,
              Reject
            ) => {
              Const audio =
                AudioRef.current;

              If (!audio) {
                Reject(
                  New Error(
                    'Audio element نەدۆزرایەوە'
                  )
                );

                Return;
              }

              If (
                Audio.readyState >=
                1
              ) {
                Resolve();
                Return;
              }

              Const onLoaded =
                () => {
                  Cleanup();
                  Resolve();
                };

              Const onError =
                () => {
                  Cleanup();

                  Reject(
                    New Error(
                      'Audio metadata load failed'
                    )
                  );
                };

              Const cleanup =
                () => {
                  Audio.removeEventListener(
                    'loadedmetadata',
                    OnLoaded
                  );

                  Audio.removeEventListener(
                    'error',
                    OnError
                  );
                };

              Audio.addEventListener(
                'loadedmetadata',
                OnLoaded
              );

              Audio.addEventListener(
                'error',
                OnError
              );
            }
          );

          If (
            RequestId !==
            AudioRequestIdRef.current
          ) {
            Return;
          }

          Audio.currentTime =
            Source.startTime;
        } else if (
          SelectedReciter.audioSource ===
          'mp3quran'
        ) {
          Await new Promise<void>(
            Resolve => {
              Const waitAudio =
                AudioRef.current;

              If (!waitAudio) {
                Resolve();
                Return;
              }

              If (
                WaitAudio.readyState >=
                  1 &&
                Number.isFinite(
                  WaitAudio.duration
                )
              ) {
                Resolve();
                Return;
              }

              Const onLoaded =
                () => {
                  Cleanup();
                  Resolve();
                };

              Const onError =
                () => {
                  Cleanup();
                  Resolve();
                };

              Const cleanup =
                () => {
                  WaitAudio.removeEventListener(
                    'loadedmetadata',
                    OnLoaded
                  );

                  WaitAudio.removeEventListener(
                    'error',
                    OnError
                  );
                };

              WaitAudio.addEventListener(
                'loadedmetadata',
                OnLoaded
              );

              WaitAudio.addEventListener(
                'error',
                OnError
              );
            }
          );

          If (
            RequestId !==
            AudioRequestIdRef.current
          ) {
            Return;
          }

          Const estAudio =
            AudioRef.current;

          Const duration =
            EstAudio?.duration;

          If (
            EstAudio &&
            Number.isFinite(
              Duration
            ) &&
            (duration as number) >
              0
          ) {
            Const counts =
              Await getSurahWordCounts(
                A.surahNumber
              );

            If (
              RequestId ===
                AudioRequestIdRef.current &&
              Counts.length
            ) {
              Const ranges =
                BuildEstimatedRanges(
                  Counts,
                  Duration as number
                );

              If (
                Ranges.length
              ) {
                EstimatedTimingRef.current =
                  {
                    ReciterId:
                      SelectedReciter.id,
                    SurahNumber:
                      A.surahNumber,
                    Ranges
                  };

                Const targetRange =
                  Ranges.find(
                    R =>
                      R.ayah ===
                      A.numberInSurah
                  );

                If (
                  TargetRange &&
                  AudioRef.current
                ) {
                  Try {
                    AudioRef.current.currentTime =
                      TargetRange.start;
                  } catch {
                    // Ignore
                  }
                }
              }
            }
          }
        }

        SetPlayingAyahKey(
          Key
        );

        Await audio.play();

        If (
          RequestId ===
          AudioRequestIdRef.current
        ) {
          SetIsPlayingAudio(true);
        }
      } catch (error) {
        Console.error(
          'Ayah audio error:',
          {
            Reciter:
              SelectedReciter,
            Surah:
              A.surahNumber,
            Ayah:
              A.numberInSurah,
            Error
          }
        );

        If (
          RequestId ===
          AudioRequestIdRef.current
        ) {
          SetPlayingAyahKey(
            Null
          );

          SetIsPlayingAudio(
            False
          );

          ActiveSegmentRef.current =
            Null;
        }
      }
    };

  Const playPageAyahAtIndex =
    Async (
      Index: number
    ) => {
      If (
        Index < 0 ||
        Index >=
          PageAyahsData.length
      ) {
        PageAudioIndexRef.current =
          -1;

        SetPageAudioIndex(-1);

        SetPlayingAyahKey(
          Null
        );

        SetIsPlayingAudio(
          False
        );

        SetHighlightedAyah(
          Null
        );

        ActiveSegmentRef.current =
          Null;

        Return;
      }

      Const ayah =
        PageAyahsData[index];

      If (!ayah) {
        Return;
      }

      Const requestId =
        ++audioRequestIdRef.current;

      ActiveSegmentRef.current =
        Null;

      PageAudioIndexRef.current =
        Index;

      SetPageAudioIndex(
        Index
      );

      Const key =
        AyahKey(ayah);

      SetPlayingAyahKey(
        Key
      );

      Const ayahBox =
        AyahBoxes.find(
          B =>
            B.s ===
              Ayah.surahNumber &&
            B.a ===
              Ayah.numberInSurah
        );

      If (ayahBox) {
        Const topPct =
          (ayahBox.y0 /
            AYAH_CANVAS_HEIGHT) *
          100;

        SetHighlightedAyah({
          Ayah,
          TopPercent:
            TopPct
        });
      }

      If (
        !audioRef.current
      ) {
        Return;
      }

      AudioRef.current.pause();
      ClearAudioObjectUrl();

      Try {
        Const source =
          Await getAudioSource(
            SelectedReciter,
            Ayah.surahNumber,
            Ayah.numberInSurah
          );

        If (
          RequestId !==
          AudioRequestIdRef.current
        ) {
          Return;
        }

        Const audio =
          AudioRef.current;

        Audio.src =
          Source.url;

        ActiveSegmentRef.current =
          {
            EndTime:
              Source.endTime ??
              Null,
            RequestId
          };

        If (
          Source.startTime !==
          Undefined
        ) {
          Await new Promise<void>(
            (
              Resolve,
              Reject
            ) => {
              Const audio =
                AudioRef.current;

              If (!audio) {
                Reject(
                  New Error(
                    'Audio element نەدۆزرایەوە'
                  )
                );

                Return;
              }

              If (
                Audio.readyState >=
                1
              ) {
                Resolve();
                Return;
              }

              Const onLoaded =
                () => {
                  Cleanup();
                  Resolve();
                };

              Const onError =
                () => {
                  Cleanup();

                  Reject(
                    New Error(
                      'Audio metadata load failed'
                    )
                  );
                };

              Const cleanup =
                () => {
                  Audio.removeEventListener(
                    'loadedmetadata',
                    OnLoaded
                  );

                  Audio.removeEventListener(
                    'error',
                    OnError
                  );
                };

              Audio.addEventListener(
                'loadedmetadata',
                OnLoaded
              );

              Audio.addEventListener(
                'error',
                OnError
              );
            }
          );

          If (
            RequestId !==
            AudioRequestIdRef.current
          ) {
            Return;
          }

          Audio.currentTime =
            Source.startTime;
        }

        Await audio.play();

        If (
          RequestId ===
            AudioRequestIdRef.current &&
          PageAudioIndexRef.current ===
            Index
        ) {
          SetIsPlayingAudio(true);
        }

        If (
          Source.startTime ===
            Undefined &&
          SelectedReciter.audioSource ===
            'mp3quran'
        ) {
          Const surahNumberForEstimate =
            Ayah.surahNumber;

          Const reciterIdForEstimate =
            SelectedReciter.id;

          Const applyEstimated =
            () => {
              Const durationAudio =
                AudioRef.current;

              Const duration =
                DurationAudio?.duration;

              If (
                !durationAudio ||
                !Number.isFinite(
                  Duration
                ) ||
                (duration as number) <=
                  0
              ) {
                Return;
              }

              Void getSurahWordCounts(
                SurahNumberForEstimate
              ).then(counts => {
                If (
                  RequestId !==
                  AudioRequestIdRef.current
                ) {
                  Return;
                }

                Const ranges =
                  BuildEstimatedRanges(
                    Counts,
                    Duration as number
                  );

                If (
                  !ranges.length
                ) {
                  Return;
                }

                EstimatedTimingRef.current =
                  {
                    ReciterId:
                      ReciterIdForEstimate,
                    SurahNumber:
                      SurahNumberForEstimate,
                    Ranges
                  };
              });
            };

          If (
            Audio.readyState >=
              1 &&
            Number.isFinite(
              Audio.duration
            )
          ) {
            ApplyEstimated();
          } else {
            Audio.addEventListener(
              'loadedmetadata',
              ApplyEstimated,
              { once: true }
            );
          }
        } else {
          EstimatedTimingRef.current =
            Null;
        }
      } catch (error) {
        Console.error(
          'Page audio error:',
          {
            Reciter:
              SelectedReciter,
            Surah:
              Ayah.surahNumber,
            Ayah:
              Ayah.numberInSurah,
            Error
          }
        );

        If (
          RequestId ===
          AudioRequestIdRef.current
        ) {
          SetIsPlayingAudio(
            False
          );

          SetPlayingAyahKey(
            Null
          );

          ActiveSegmentRef.current =
            Null;
        }
      }
    };

  Const shareAyah = async (
    A: any
  ) => {
    Const text =
      `${a.arabic}\n\n` +
      `(${a.surahNumber}:${a.numberInSurah})\n\n` +
      `${a.tafsir}`;

    Try {
      If (
        Navigator.share
      ) {
        Await navigator.share({
          Text
        });
      } else {
        Await navigator.clipboard.writeText(
          Text
        );
      }
    } catch {
      // Cancelled
    }
  };

  Const startLongPress = (
    BoxKey: string,
    Ayah: any,
    TopPercent: number
  ) => {
    SetPressingBox(
      BoxKey
    );

    If (
      LongPressTimer.current
    ) {
      ClearTimeout(
        LongPressTimer.current
      );
    }

    LongPressTimer.current =
      SetTimeout(() => {
        SetHighlightedAyah({
          Ayah,
          TopPercent
        });

        SetPressingBox(
          Null
        );

        SetTafsirSheetOpen(
          False
        );

        Navigator.vibrate?.(40);
      }, LONG_PRESS_MS);
  };

  Const cancelLongPress =
    () => {
      If (
        LongPressTimer.current
      ) {
        ClearTimeout(
          LongPressTimer.current
        );

        LongPressTimer.current =
          Null;
      }

      SetPressingBox(
        Null
      );
    };

  Const closeHighlight =
    () => {
      SetHighlightedAyah(
        Null
      );

      SetTafsirSheetOpen(
        False
      );
    };

  Const scrollContainerRef =
    UseRef<HTMLDivElement | null>(
      Null
    );

  Const isUpdating =
    UseRef(false);

  Const pageRefs =
    UseRef<
      Record<
        Number,
        HTMLDivElement | null
      >
    >({});

  Const isFirstScroll =
    UseRef(true);

  Const scrollInitiatedByUser =
    UseRef(false);

  Const isBookmarked =
    Bookmarks.includes(
      CurrentPage
    );

  Const currentJuz =
    Math.ceil(
      CurrentPage / 20
    );

  UseEffect(() => {
    Let cancelled =
      False;

    Async function loadPageVerses() {
      SetLoadingTafsir(
        True
      );

      SetAyahApiError(
        Null
      );

      SetTafsirApiError(
        Null
      );

      Let arabicAyahs:
        Any[] = [];

      Try {
        Const resAr =
          Await fetch(
            `https://api.alquran.cloud/v1/page/${currentPage}/quran-uthmani`
          );

        Const dataAr =
          Await resAr.json();

        If (
          DataAr.code ===
            200 &&
          DataAr.data?.ayahs
        ) {
          ArabicAyahs =
            DataAr.data.ayahs;
        } else {
          SetAyahApiError(
            `arabic code:${dataAr.code}`
          );
        }
      } catch (e: any) {
        SetAyahApiError(
          E?.message ||
            'arabic fetch failed'
        );
      }

      Let tafsirAyahs:
        Any[] = [];

      Const selectedEdition =
        GetTafsirApiEdition(
          SelectedTafsir
        );

      If (
        SelectedEdition
      ) {
        Try {
          Const resTf =
            Await fetch(
              `https://api.alquran.cloud/v1/page/${currentPage}/${selectedEdition}`
            );

          Const dataTf =
            Await resTf.json();

          If (
            DataTf.code ===
              200 &&
            DataTf.data?.ayahs
          ) {
            TafsirAyahs =
              DataTf.data.ayahs;
          } else {
            SetTafsirApiError(
              `tafsir code:${dataTf.code}`
            );
          }
        } catch (e: any) {
          SetTafsirApiError(
            E?.message ||
              'tafsir fetch failed'
          );
        }
      } else {
        SetTafsirApiError(
          'ئەم تەفسیرە هێشتا سەرچاوەی API ـی ئەپەکە نییە.'
        );
      }

      If (cancelled) {
        Return;
      }

      If (
        ArabicAyahs.length >
        0
      ) {
        Const combined =
          ArabicAyahs.map(
            (a: any) => {
              Const matchingTafsir =
                TafsirAyahs.find(
                  (t: any) =>
                    T.surah?.number ===
                      A.surah.number &&
                    T.numberInSurah ===
                      A.numberInSurah
                );

              Return {
                SurahNumber:
                  A.surah.number,
                NumberInSurah:
                  A.numberInSurah,
                Arabic:
                  A.text,
                Tafsir:
                  MatchingTafsir?.text ||
                  (selectedEdition
                    ? 'دەقی ئەم تەفسیرە بۆ ئەم ئایەتە بەردەست نییە.'
                    : 'ئەم تەفسیرە هێشتا بە سەرچاوەی API ـی ئەپەکە نەبەستراوەتەوە.')
              };
            }
          );

        SetPageAyahsData(
          Combined
        );
      } else {
        SetPageAyahsData(
          []
        );
      }

      SetLoadingTafsir(
        False
      );
    }

    LoadPageVerses();

    Return () => {
      Cancelled = true;
    };
  }, [
    CurrentPage,
    SelectedTafsir.id
  ]);

  UseEffect(() => {
    If (
      !highlightedAyah
    ) {
      Return;
    }

    Const updatedAyah =
      PageAyahsData.find(
        A =>
          A.surahNumber ===
            HighlightedAyah.ayah
              .surahNumber &&
          A.numberInSurah ===
            HighlightedAyah.ayah
              .numberInSurah
      );

    If (
      UpdatedAyah
    ) {
      SetHighlightedAyah(
        Previous =>
          Previous
            ? {
                ...previous,
                Ayah:
                  UpdatedAyah
              }
            : null
      );
    }
  }, [
    PageAyahsData
  ]);

  UseEffect(() => {
    StopAudioCompletely();

    CloseHighlight();
    CancelLongPress();
  }, [
    CurrentPage
  ]);

  UseEffect(() => {
    StopAudioCompletely();
  }, [
    SelectedReciter.id
  ]);

  UseEffect(() => {
    Return () => {
      AudioRequestIdRef.current++;

      ActiveSegmentRef.current =
        Null;

      If (
        AudioRef.current
      ) {
        Try {
          AudioRef.current.pause();
          AudioRef.current.removeAttribute(
            'src'
          );
          AudioRef.current.load();
        } catch {
          // Ignore
        }
      }

      ClearAudioObjectUrl();

      DownloadAbortControllerRef.current?.abort();

      If (
        LongPressTimer.current
      ) {
        ClearTimeout(
          LongPressTimer.current
        );
      }
    };
  }, []);

  UseEffect(() => {
    If (
      ScrollInitiatedByUser.current
    ) {
      ScrollInitiatedByUser.current =
        False;

      Return;
    }

    Const scrollToTarget =
      () => {
        Const el =
          PageRefs.current[
            CurrentPage
          ];

        If (el) {
          IsUpdating.current =
            True;

          El.scrollIntoView({
            Behavior:
              IsFirstScroll.current
                ? 'auto'
                : 'smooth',
            Inline: 'center',
            Block: 'nearest'
          });

          IsFirstScroll.current =
            False;

          SetTimeout(
            () => {
              IsUpdating.current =
                False;
            },
            400
          );
        }
      };

    If (
      IsFirstScroll.current
    ) {
      Const raf1 =
        RequestAnimationFrame(
          () => {
            RequestAnimationFrame(
              () => {
                ScrollToTarget();

                SetTimeout(
                  () => {
                    Const el =
                      PageRefs.current[
                        CurrentPage
                      ];

                    Const container =
                      ScrollContainerRef.current;

                    If (
                      El &&
                      Container
                    ) {
                      Const elRect =
                        El.getBoundingClientRect();

                      Const containerRect =
                        Container.getBoundingClientRect();

                      Const isVisible =
                        ElRect.left >=
                          ContainerRect.left -
                            5 &&
                        ElRect.right <=
                          ContainerRect.right +
                            5;

                      If (
                        !isVisible
                      ) {
                        El.scrollIntoView(
                          {
                            Behavior:
                              'auto',
                            Inline:
                              'center',
                            Block:
                              'nearest'
                          }
                        );
                      }
                    }
                  },
                  250
                );
              }
            );
          }
        );

      Return () =>
        CancelAnimationFrame(
          Raf1
        );
    }

    ScrollToTarget();
  }, [
    CurrentPage
  ]);

  Const togglePageAudio =
    () => {
      If (
        IsPlayingAudio
      ) {
        AudioRef.current?.pause();

        SetIsPlayingAudio(
          False
        );

        Return;
      }

      If (
        PageAudioIndexRef.current >=
          0 &&
        PageAudioIndexRef.current <
          PageAyahsData.length
      ) {
        Const index =
          PageAudioIndexRef.current;

        If (
          AudioRef.current &&
          AudioRef.current.src
        ) {
          AudioRef.current
            .play()
            .then(() => {
              SetIsPlayingAudio(
                True
              );
            })
            .catch(() => {
              SetIsPlayingAudio(
                False
              );
            });

          Return;
        }

        Void playPageAyahAtIndex(
          Index
        );

        Return;
      }

      If (
        PageAyahsData.length >
        0
      ) {
        Void playPageAyahAtIndex(
          0
        );
      }
    };

  Const handleAudioTimeUpdate =
    () => {
      Const segment =
        ActiveSegmentRef.current;

      Const audio =
        AudioRef.current;

      If (!audio) {
        Return;
      }

      If (
        Segment &&
        Segment.endTime !==
          Null
      ) {
        If (
          Audio.currentTime >=
          Segment.endTime -
            0.05
        ) {
          Audio.pause();

          Try {
            Audio.currentTime =
              Segment.endTime;
          } catch {
            // Ignore
          }

          ActiveSegmentRef.current =
            Null;

          HandleAudioEnded();
        }

        Return;
      }

      Const estimated =
        EstimatedTimingRef.current;

      If (!estimated) {
        Return;
      }

      Const t =
        Audio.currentTime;

      Const match =
        Estimated.ranges.find(
          R =>
            T >= r.start &&
            T < r.end
        ) ||
        Estimated.ranges[
          Estimated.ranges
            .length - 1
        ];

      If (!match) {
        Return;
      }

      Const ayahData =
        PageAyahsData.find(
          A =>
            A.surahNumber ===
              Estimated.surahNumber &&
            A.numberInSurah ===
              Match.ayah
        );

      If (!ayahData) {
        Return;
      }

      Const key =
        AyahKey(ayahData);

      If (
        PlayingAyahKey !== key
      ) {
        SetPlayingAyahKey(
          Key
        );

        Const box =
          AyahBoxes.find(
            B =>
              B.s ===
                AyahData.surahNumber &&
              B.a ===
                AyahData.numberInSurah
          );

        If (box) {
          SetHighlightedAyah({
            Ayah: ayahData,
            TopPercent:
              (box.y0 /
                AYAH_CANVAS_HEIGHT) *
              100
          });
        }
      }
    };

  Const handleAudioEnded =
    () => {
      ActiveSegmentRef.current =
        Null;

      Const currentIndex =
        PageAudioIndexRef.current;

      If (
        CurrentIndex < 0
      ) {
        SetIsPlayingAudio(
          False
        );

        SetPlayingAyahKey(
          Null
        );

        Return;
      }

      Const nextIndex =
        CurrentIndex + 1;

      If (
        NextIndex <
        PageAyahsData.length
      ) {
        Void playPageAyahAtIndex(
          NextIndex
        );

        Return;
      }

      PageAudioIndexRef.current =
        -1;

      SetPageAudioIndex(
        -1
      );

      SetIsPlayingAudio(
        False
      );

      SetPlayingAyahKey(
        Null
      );

      If (
        PageAyahsData.length >
        0
      ) {
        Const lastAyah =
          PageAyahsData[
            PageAyahsData.length -
              1
          ];

        Const lastBox =
          AyahBoxes.find(
            B =>
              B.s ===
                LastAyah.surahNumber &&
              B.a ===
                LastAyah.numberInSurah
          );

        If (lastBox) {
          SetHighlightedAyah({
            Ayah: lastAyah,
            TopPercent:
              (lastBox.y0 /
                AYAH_CANVAS_HEIGHT) *
              100
          });
        }
      }
    };

  Const handleAudioError =
    () => {
      Const audio =
        AudioRef.current;

      If (!audio) {
        Return;
      }

      Console.error(
        'HTML Audio Error:',
        {
          Src: audio.src,
          Code:
            Audio.error?.code,
          Message:
            Audio.error?.message
        }
      );

      SetIsPlayingAudio(
        False
      );
    };

  Const handleScroll = (
    E: React.UIEvent<HTMLDivElement>
  ) => {
    If (
      IsUpdating.current
    ) {
      Return;
    }

    Const target =
      E.currentTarget;

    Const scrollLeft =
      Target.scrollLeft;

    Const pageWidth =
      Target.clientWidth;

    If (
      PageWidth > 0
    ) {
      Const pageIndex =
        Math.round(
          ScrollLeft /
            PageWidth
        );

      Const targetPage =
        604 -
        PageIndex;

      If (
        TargetPage >= 1 &&
        TargetPage <= 604 &&
        TargetPage !==
          CurrentPage
      ) {
        IsUpdating.current =
          True;

        ScrollInitiatedByUser.current =
          True;

        StopAudioCompletely();

        If (
          OnJumpToPage
        ) {
          OnJumpToPage(
            TargetPage
          );
        } else if (
          TargetPage >
          CurrentPage
        ) {
          OnNextPage();
        } else {
          OnPrevPage();
        }

        SetTimeout(
          () => {
            IsUpdating.current =
              False;
          },
          300
        );
      }
    }
  };

  Const toggleBookmark =
    () => {
      Let updated:
        Number[];

      If (
        IsBookmarked
      ) {
        Updated =
          Bookmarks.filter(
            P =>
              P !==
              CurrentPage
          );
      } else {
        Updated = [
          ...bookmarks,
          CurrentPage
        ];
      }

      SetBookmarks(
        Updated
      );

      LocalStorage.setItem(
        'quran_bookmarks',
        JSON.stringify(
          Updated
        )
      );

      Navigator.vibrate?.(35);
    };

  Const selectedTafsirName =
    (selectedTafsir as any)
      .nameKu ||
    SelectedTafsir.title ||
    SelectedTafsir.id;

  Return (
    <div
      ClassName="relative h-screen max-w-lg mx-auto flex flex-col justify-between select-none bg-stone-100 text-slate-900 overflow-hidden"
      Dir="rtl"
    >
      <audio
        Ref={audioRef}
        Preload="none"
        OnTimeUpdate={
          HandleAudioTimeUpdate
        }
        OnEnded={
          HandleAudioEnded
        }
        OnError={
          HandleAudioError
        }
        OnPause={() => {
          SetIsPlayingAudio(
            False
          );
        }}
        OnPlay={() => {
          SetIsPlayingAudio(
            True
          );
        }}
      />

      {/* HEADER */}
      <header
        ClassName={`absolute top-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-2.5 flex items-center justify-between shadow-xs transition-all duration-300 ${
          ShowControls
            ? 'translate-y-0 opacity-100'
            : '-translate-y-full opacity-0 pointer-events-none'
        }`}
      >
        <button
          OnClick={
            OnBackToIndex
          }
          ClassName="p-1.5 rounded-xl hover:bg-slate-100 text-slate-700 transition-colors"
          Title="گەڕانەوە"
        >
          <ArrowRight className="w-5 h-5" />
        </button>

        <div className="text-center min-w-0">
          <h2 className="font-bold text-sm text-slate-800 truncate">
            سووڕه‌تی{' '}
            {currentSurah?.nameAr ||
              'الفاتحة'}
          </h2>

          <p className="text-[11px] text-slate-500 font-medium">
            په‌ڕه‌ی{' '}
            {currentPage} ، جوزئی{' '}
            {currentJuz}
          </p>
        </div>

        <div className="flex items-center gap-1 text-slate-700">
          <button
            OnClick={() =>
              SetViewMode(
                Prev =>
                  Prev ===
                  'mushaf'
                    ? 'tafsir'
                    : 'mushaf'
              )
            }
            ClassName={`p-2 rounded-xl transition-colors ${
              ViewMode ===
              'tafsir'
                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                : 'hover:bg-slate-100'
            }`}
            Title="تەفسیر"
          >
            <BookOpen className="w-4 h-4" />
          </button>

          <button
            OnClick={
              ToggleBookmark
            }
            ClassName={`p-2 rounded-xl transition-colors ${
              IsBookmarked
                ? 'text-amber-600'
                : 'hover:bg-slate-100'
            }`}
            Title="نیشانەکردن"
          >
            {isBookmarked ? (
              <BookmarkCheck className="w-4 h-4 fill-amber-500 text-amber-600" />
            ) : (
              <Bookmark className="w-4 h-4" />
            )}
          </button>

          <button
            OnClick={() =>
              SetIsTafsirSelectorOpen(
                True
              )
            }
            ClassName="p-2 rounded-xl hover:bg-slate-100 text-slate-700"
            Title="تەفسیرەکان"
          >
            <Globe className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* MUSHAF VIEW */}
      {viewMode === 'mushaf' && (
        <div
          ClassName="relative flex-1 flex items-center justify-center bg-stone-200/60 overflow-hidden"
          OnClick={() => {
            SetShowControls(prev => !prev);
            CloseHighlight();
          }}
        >
          <div
            Ref={scrollContainerRef}
            OnScroll={handleScroll}
            ClassName="flex w-full h-full overflow-x-auto snap-x snap-mandatory scrollbar-none items-center"
            Style={{ direction: 'ltr' }}
          >
            {Array.from({ length: 604 }, (_, i) => {
              Const pageNum = 604 - i;
              Const isActivePage = pageNum === currentPage;

              Return (
                <div
                  Key={pageNum}
                  Ref={el => { pageRefs.current[pageNum] = el; }}
                  ClassName="min-w-full h-full flex flex-col items-center justify-center snap-center snap-always p-2 shrink-0"
                  Style={{ direction: 'rtl' }}
                >
                  <div
                    ClassName="relative max-h-[76vh]"
                    Style={{ aspectRatio: `${AYAH_CANVAS_WIDTH} / ${AYAH_CANVAS_HEIGHT}` }}
                  >
                    <img
                      Src={pageImgUrl(pageNum)}
                      Alt={`Page ${pageNum}`}
                      Loading="lazy"
                      Draggable={false}
                      OnContextMenu={e => e.preventDefault()}
                      ClassName="w-full h-full max-h-[76vh] object-contain select-none shadow-xl rounded-lg bg-white border border-stone-300"
                      Style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none', userSelect: 'none' }}
                    />

                    {isActivePage && ayahApiError && (
                      <div className="absolute top-1 inset-x-0 text-center text-[10px] font-bold bg-red-700/80 text-white py-1 z-50 pointer-events-none">
                        هەڵە: {ayahApiError}
                      </div>
                    )}

                    {isActivePage && ayahBoxes.length > 0 && (
                      <div className="absolute inset-0">
                        {ayahBoxes.map((box, idx) => {
                          Const matchedAyah = pageAyahsData.find(x => x.surahNumber === box.s && x.numberInSurah === box.a);
                          If (!matchedAyah) return null;

                          Const boxKey = `${box.s}-${box.a}-${box.l}-${idx}`;
                          Const leftPct = (box.x0 / AYAH_CANVAS_WIDTH) * 100;
                          Const widthPct = ((box.x1 - box.x0) / AYAH_CANVAS_WIDTH) * 100;
                          Const topPct = (box.y0 / AYAH_CANVAS_HEIGHT) * 100;
                          Const heightPct = ((box.y1 - box.y0) / AYAH_CANVAS_HEIGHT) * 100;

                          Const isHighlighted = !!highlightedAyah &&
                            HighlightedAyah.ayah.surahNumber === box.s &&
                            HighlightedAyah.ayah.numberInSurah === box.a;

                          Return (
                            <div
                              Key={boxKey}
                              OnPointerDown={e => {
                                E.stopPropagation();
                                StartLongPress(boxKey, matchedAyah, topPct);
                              }}
                              OnPointerUp={cancelLongPress}
                              OnPointerLeave={cancelLongPress}
                              OnPointerCancel={cancelLongPress}
                              OnContextMenu={e => e.preventDefault()}
                              Style={{
                                Position: 'absolute',
                                Left: `${leftPct}%`,
                                Top: `${topPct}%`,
                                Width: `${widthPct}%`,
                                Height: `${heightPct}%`,
                                Background: isHighlighted
                                  ? 'rgba(56,189,248,0.35)'
                                  : pressingBox === boxKey
                                  ? 'rgba(56,189,248,0.15)'
                                  : 'transparent',
                                BorderRadius: '3px',
                                Transition: 'background 0.15s ease'
                              }}
                              ClassName="cursor-pointer touch-none"
                            />
                          );
                        })}
                      </div>
                    )}

                    {isActivePage && highlightedAyah && (
                      <div
                        ClassName="absolute inset-x-0 flex justify-center z-40"
                        Style={{ top: `${Math.min(Math.max(highlightedAyah.topPercent - 7, 2), 88)}%` }}
                        OnClick={e => e.stopPropagation()}
                      >
                        <div className="flex items-center gap-1 bg-emerald-800 text-white rounded-2xl shadow-xl px-1.5 py-1.5">
                          <button
                            OnClick={() => void playAyahAudio(highlightedAyah.ayah)}
                            ClassName="p-2 rounded-xl hover:bg-emerald-700 transition-colors"
                            Title="گوێگرتن"
                          >
                            {playingAyahKey === ayahKey(highlightedAyah.ayah) ? (
                              <Pause className="w-4 h-4" />
                            ) : (
                              <Play className="w-4 h-4 fill-white" />
                            )}
                          </button>

                          <button
                            OnClick={() => setTafsirSheetOpen(true)}
                            ClassName="p-2 rounded-xl hover:bg-emerald-700 transition-colors"
                            Title="تەفسیر"
                          >
                            <Globe className="w-4 h-4" />
                          </button>

                          <button
                            OnClick={() => shareAyah(highlightedAyah.ayah)}
                            ClassName="p-2 rounded-xl hover:bg-emerald-700 transition-colors"
                            Title="ناردن"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>

                          <button
                            OnClick={() => toggleAyahBookmark(highlightedAyah.ayah)}
                            ClassName="p-2 rounded-xl hover:bg-emerald-700 transition-colors"
                            Title="خەزنکردن"
                          >
                            {isAyahBookmarked(highlightedAyah.ayah) ? (
                              <BookmarkCheck className="w-4 h-4 fill-white" />
                            ) : (
                              <Bookmark className="w-4 h-4" />
                            )}
                          </button>

                          <button
                            OnClick={closeHighlight}
                            ClassName="p-2 rounded-xl hover:bg-emerald-700 transition-colors"
                            Title="داخستن"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <span className="text-xs font-bold text-slate-700 mt-2 font-mono bg-white/90 px-3 py-1 rounded-full shadow-xs">
                    {pageNum}
                  </span>
                </div>
              );
            })}
          </div>

          {/* TAFSIR SHEET */}
          {highlightedAyah && tafsirSheetOpen && (
            <div
              ClassName="absolute bottom-0 inset-x-0 z-50 bg-white border-t border-slate-200 rounded-t-3xl shadow-2xl p-5 max-h-[45vh] overflow-y-auto"
              Dir="rtl"
              OnClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800">
                  {highlightedAyah.ayah.surahNumber}:{highlightedAyah.ayah.numberInSurah} {' — '} {selectedTafsirName}
                </span>

                <button
                  OnClick={() => setTafsirSheetOpen(false)}
                  ClassName="p-1.5 rounded-xl bg-slate-100 text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="font-quran text-lg text-slate-900 leading-relaxed mb-3">
                {highlightedAyah.ayah.arabic}
              </p>

              {loadingTafsir ? (
                <div className="flex items-center justify-center gap-2 py-4 text-slate-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-xs">تەفسیر باردەکرێت...</span>
                </div>
              ) : (
                <p className="text-sm text-slate-700 leading-relaxed">
                  {highlightedAyah.ayah.tafsir}
                </p>
              )}

              {tafsirApiError && !loadingTafsir && (
                <p className="mt-3 text-[11px] text-red-600 leading-relaxed">
                  {tafsirApiError}
                </p>
              )}

              <button
                OnClick={() => {
                  SetTafsirSheetOpen(false);
                  SetIsTafsirSelectorOpen(true);
                }}
                ClassName="mt-3 text-xs font-bold text-amber-700 underline"
              >
                گۆڕینی تەفسیر
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAFSIR VIEW */}
      {viewMode === 'tafsir' && (
        <div ClassName="flex-1 overflow-y-auto p-4 pt-16 space-y-6 bg-white" dir="rtl">
          {loadingTafsir ? (
            <div className="text-center py-20">
              <Loader2 className="w-8 h-8 mx-auto text-amber-600 animate-spin" />
              <p className="text-xs text-slate-500 pt-2">{selectedTafsirName} باردەکرێت...</p>
            </div>
          ) : (
            <>
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-right">
                <p className="text-[11px] text-amber-800 font-bold">تەفسیری هەڵبژێردراو:</p>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{selectedTafsirName}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{selectedTafsir.author}</p>
              </div>

              {pageAyahsData.map(ayah => (
                <div
                  Key={`${ayah.surahNumber}:${ayah.numberInSurah}`}
                  ClassName="space-y-3 pb-6 border-b border-slate-200 text-right"
                >
                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 text-xs font-mono font-bold">
                    {ayah.surahNumber}:{ayah.numberInSurah}
                  </span>

                  <p className="font-quran text-slate-900 text-xl sm:text-2xl leading-loose">
                    {ayah.arabic}
                  </p>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-700 leading-relaxed">
                    <strong className="text-amber-800 block mb-1">{selectedTafsirName}:</strong>
                    {ayah.tafsir}
                  </div>
                </div>
              ))}
            </>
          )}

          {tafsirApiError && !loadingTafsir && (
            <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs leading-relaxed text-right">
              {tafsirApiError}
            </div>
          )}
        </div>
      )}

      {/* FOOTER CONTROLS */}
      {showControls && (
        <footer
          ClassName={`absolute bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200 px-3 py-2.5 flex items-center justify-between transition-all duration-300 ${
            ShowControls
              ? 'translate-y-0 opacity-100'
              : 'translate-y-full opacity-0 pointer-events-none'
          }`}
          Dir="rtl"
          OnClick={e => e.stopPropagation()}
        >
          <button
            OnClick={() => setIsRecitersModalOpen(true)}
            ClassName="max-w-[35%] text-xs sm:text-sm font-bold text-slate-800 hover:text-amber-700 transition-colors truncate text-right"
          >
            <span className="truncate">
              {selectedReciter?.name || 'قاری هەڵبژێرە'}
            </span>
          </button>

          <div className="flex items-center gap-2">
            <button
              OnClick={togglePageAudio}
              ClassName="h-9 px-3.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
            >
              {isPlayingAudio ? (
                <>
                  <Pause className="w-4 h-4 fill-white" />
                  <span className="text-xs font-bold">وەستاندن</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span className="text-xs font-bold">خوێندنەوە</span>
                </>
              )}
            </button>

            {renderCurrentSurahDownload()}
          </div>
        </footer>
      )}

      {/* MODALS */}
      {isRecitersModalOpen && (
        <RecitersModal
          IsOpen={isRecitersModalOpen}
          OnClose={() => setIsRecitersModalOpen(false)}
          SelectedReciter={selectedReciter}
          OnSelectReciter={reciter => {
            SetSelectedReciter(reciter);
            SetIsRecitersModalOpen(false);
          }}
        />
      )}

      {isTafsirSelectorOpen && (
        <TafsirSelectorModal
          IsOpen={isTafsirSelectorOpen}
          OnClose={() => setIsTafsirSelectorOpen(false)}
          SelectedTafsir={selectedTafsir}
          OnSelectTafsir={tafsir => {
            SetSelectedTafsir(tafsir);
            SetIsTafsirSelectorOpen(false);
          }}
        />
      )}
    </div>
  );
};

Export default MushafPageView;
