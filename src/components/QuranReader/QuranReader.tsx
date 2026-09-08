Import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
Import { ALL_RECITERS_DIRECTORY } from '../../data/recitersList';

Const PAGE_COUNT = 604;
Const QURAN_PAGE_BASE = 'https://android.quran.com/data/width_1260/';
Const QURAN_API_BASE = 'https://api.alquran.cloud/v1';
Const MP3QURAN_API_BASE = 'https://mp3quran.net/api/v3';

Const RECITERS_CACHE_KEY = 'quran_dynamic_kurdish_reciters_v2';
Const TIMING_CACHE_KEY = 'quran_mp3quran_timing_v2';

Interface AyahData {
  Number?: number;
  Ayah?: number;
  GlobalAyah?: number;
  Text?: string;
  SurahNumber?: number;
  [key: string]: unknown;
}

Interface TimingRow {
  Ayah: number;
  Start: number;
  End: number;
}

Interface DynamicReciter {
  Id: string;
  SourceId: string;
  Name: string;
  NameAr?: string;
  Riwayah: string;
  Server: string;
  SurahList: number[];
  SurahTotal: number;
  MoshafId: string;
  Source: 'mp3quran';
}

Interface SurahItem {
  Number?: number;
  Id?: number;
  Name?: string;
  EnglishName?: string;
  StartPage?: number;
  Page?: number;
  EndPage?: number;
  [key: string]: unknown;
}

Interface QuranReaderProps {
  CurrentPage: number;
  OnNextPage: () => void;
  OnPrevPage: () => void;
  OnBackToIndex: () => void;
  BgStyle?: React.CSSProperties;
  AppLang: string;
  ShowNumbers: boolean;
  SurahsList?: SurahItem[];
  OnJumpToPage?: (page: number) => void;
}

Interface Mp3Reciter {
  Id?: number | string;
  Name?: string;
  Letter?: string;
  Moshaf?: Array<{
    Id?: number | string;
    Name?: string;
    Server?: string;
    Surah_total?: number | string;
    Surah_list?: string;
    Moshaf_type?: number | string;
  }>;
}

Const KURDISH_RECITER_ALIASES: Array<{
  Id: string;
  Aliases: string[];
  KurdishName: string;
}> = [
  { id: 'peshawa_kurdi', aliases: ['peshawa qadr al-kurdi', 'peshawa kurdi', 'peshawa', 'بيشة وا قادر الكردي', 'بيشةوا قادر الكردي'], kurdishName: 'پێشەوا قادر کوردی' },
  { id: 'raad_kurdi', aliases: ['raad al kurdi', 'raad al-kurdi', 'raad kurdi', 'رعد محمد الكردي', 'رعد الكردي'], kurdishName: 'ڕەعد کوردی' },
  { id: 'ramazan_shukur', aliases: ['ramadan shakoor', 'ramadan shakur', 'ramazan shukur', 'رمضان شكور'], kurdishName: 'ڕەمەزان شکوور کوردی' },
  { id: 'farman_shwani', aliases: ['farman shawani', 'farman shwani', 'فِرمان شواني', 'فرمان شواني'], kurdishName: 'فەرمان شوانی کوردی' },
  { id: 'sherzad_kurdi', aliases: ['shirazad taher', 'shirzad taher', 'sherzad abdulrahman', 'شيرزاد عبدالرحمن طاهر', 'شيرزاد طاهر'], kurdishName: 'شێرزاد عەبدولڕەحمان کوردی' },
  { id: 'wishear_hayder_arbili', aliases: ['wishear hayder arbili', 'wishear haydar arbili', 'وشيار حيدر اربيلي', 'وشيار حيدر أربيلي'], kurdishName: 'ویشیار حەیدەر ئەربیلی' },
  { id: 'rizgar_kurdi', aliases: ['rizgar kurdi', 'rizgar muhammad', 'رزكار محمد الكردي', 'رزغار الكردي'], kurdishName: 'ڕزگار محەمەد کوردی' },
  { id: 'dilshad_kurdi', aliases: ['dilshad ahmad', 'dilshad kurdi', 'دلشاد احمد', 'دلشاد کردي'], kurdishName: 'دڵشاد ئەحمەد کوردی' },
];

Const normalizeText = (value: unknown): string =>
  String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’']/g, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

Const normalizeUrl = (url: string): string => (url.endsWith('/') ? Url : `${url}/`);

Const parseSurahList = (value: unknown): number[] => {
  If (typeof value !== 'string') return [];
  Return value
    .split(',')
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isInteger(item) && item >= 1 && item <= 114);
};

Const readJsonCache = <T,>(key: string): T | null => {
  Try {
    Const raw = localStorage.getItem(key);
    If (!raw) return null;
    Return JSON.parse(raw) as T;
  } catch {
    Return null;
  }
};

Const writeJsonCache = (key: string, value: unknown) => {
  Try {
    LocalStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage errors.
  }
};

Const formatPageNum = (page: number): string => String(page).padStart(3, '0');
Const pageImgUrl = (page: number): string => `${QURAN_PAGE_BASE}page${formatPageNum(page)}.png`;

Const normalizeTimingValue = (value: unknown): number => {
  Const n = Number(value);
  If (!Number.isFinite(n) || n < 0) return 0;
  Return n > 10000 ? N / 1000 : n;
};

Const getPageSurahNumber = (page: number, surahsList?: SurahItem[]): number => {
  If (!surahsList?.length) return 1;

  Const normalized = surahsList
    .map((surah) => ({
      Number: Number(surah.number ?? Surah.id ?? 0),
      StartPage: Number(surah.startPage ?? Surah.page ?? Surah['start_page'] ?? 0),
      EndPage: Number(surah.endPage ?? Surah['end_page'] ?? 0),
    }))
    .filter((surah) => surah.number >= 1 && surah.number <= 114 && surah.startPage > 0)
    .sort((a, b) => a.startPage - b.startPage);

  Const inRange = normalized.find((surah) => page >= surah.startPage && (!surah.endPage || page <= surah.endPage));
  If (inRange) return inRange.number;

  Let result = normalized[0]?.number ?? 1;
  For (const surah of normalized) {
    If (surah.startPage <= page) {
      Result = surah.number;
    } else {
      Break;
    }
  }
  Return result;
};

Const findKurdishAlias = (name: string) => {
  Const normalized = normalizeText(name);
  Return KURDISH_RECITER_ALIASES.find((entry) =>
    Entry.aliases.some(
      (alias) =>
        Normalized === normalizeText(alias) ||
        Normalized.includes(normalizeText(alias)) ||
        NormalizeText(alias).includes(normalized)
    )
  );
};

Const chooseBestMoshaf = (moshaf: Mp3Reciter['moshaf']) => {
  If (!Array.isArray(moshaf)) return null;

  Const usable = moshaf
    .filter((item) => item?.server && parseSurahList(item?.surah_list).length > 0)
    .sort((a, b) => parseSurahList(b?.surah_list).length - parseSurahList(a?.surah_list).length);

  Return usable[0] ?? Null;
};

Async function fetchDynamicKurdishReciters(): Promise<DynamicReciter[]> {
  Const response = await fetch(`${MP3QURAN_API_BASE}/reciters?language=eng`, { cache: 'no-store' });
  If (!response.ok) throw new Error(`MP3Quran reciters API: ${response.status}`);

  Const json = await response.json();
  Const reciters: Mp3Reciter[] = Array.isArray(json)
    ? Json
    : Array.isArray(json?.reciters)
    ? Json.reciters
    : Array.isArray(json?.data)
    ? Json.data
    : [];

  Const result: DynamicReciter[] = [];

  For (const reciter of reciters) {
    Const name = String(reciter?.name ?? '').trim();
    If (!name) continue;

    Const alias = findKurdishAlias(name);
    If (!alias) continue;

    Const moshaf = chooseBestMoshaf(reciter?.moshaf);
    If (!moshaf?.server) continue;

    Const surahList = parseSurahList(moshaf.surah_list);
    If (!surahList.length) continue;

    Result.push({
      Id: alias.id,
      SourceId: String(reciter.id ?? Alias.id),
      Name: alias.kurdishName,
      NameAr: name,
      Riwayah: 'حفص',
      Server: normalizeUrl(String(moshaf.server)),
      SurahList,
      SurahTotal: surahList.length,
      MoshafId: String(moshaf.id ?? Reciter.id ?? Alias.id),
      Source: 'mp3quran',
    });
  }

  Const unique = new Map<string, DynamicReciter>();
  For (const item of result) {
    Const old = unique.get(item.id);
    If (!old || item.surahTotal > old.surahTotal) {
      Unique.set(item.id, item);
    }
  }

  Const ordered = KURDISH_RECITER_ALIASES.map((alias) => unique.get(alias.id)).filter(
    (item): item is DynamicReciter => Boolean(item)
  );

  If (!ordered.length) throw new Error('هیچ قارییەکی کورد نەدۆزرایەوە.');
  WriteJsonCache(RECITERS_CACHE_KEY, ordered);
  Return ordered;
}

Const getStaticKurdishReciters = (): DynamicReciter[] => {
  Return ALL_RECITERS_DIRECTORY.filter(
    (reciter) =>
      (reciter.category === 'kurdish' || reciter.category === 'kurdish_tafsir') &&
      Reciter.audioSource === 'mp3quran' &&
      Reciter.audioBaseUrl
  ).map((reciter) => ({
    Id: reciter.id,
    SourceId: reciter.id,
    Name: reciter.name,
    Riwayah: reciter.riwayah,
    Server: normalizeUrl(reciter.audioBaseUrl as string),
    SurahList: reciter.availableSurahs?.length
      ? Reciter.availableSurahs
      : Array.from({ length: 114 }, (_, i) => i + 1),
    SurahTotal: reciter.availableSurahs?.length ?? 114,
    MoshafId: `static-${reciter.id}`,
    Source: 'mp3quran',
  }));
};

Const mergeReciters = (dynamic: DynamicReciter[], staticList: DynamicReciter[]): DynamicReciter[] => {
  Const merged = new Map<string, DynamicReciter>();
  For (const reciter of staticList) merged.set(reciter.id, reciter);
  For (const reciter of dynamic) merged.set(reciter.id, reciter);
  Return Array.from(merged.values());
};

Async function fetchPageAyahs(page: number): Promise<AyahData[]> {
  Const response = await fetch(`${QURAN_API_BASE}/page/${page}/editions/quran-uthmani`, { cache: 'force-cache' });
  If (!response.ok) throw new Error(`Quran API Error`);

  Const json = await response.json();
  Const edition = Array.isArray(json?.data) ? Json.data[0] : json?.data;
  Const ayahs = Array.isArray(edition?.ayahs) ? Edition.ayahs : [];

  Return ayahs.map((ayah: any) => ({
    ...ayah,
    GlobalAyah: Number(ayah?.number ?? 0),
    Ayah: Number(ayah?.numberInSurah ?? Ayah.ayah ?? 0),
  }));
}

Async function fetchMp3QuranTiming(readId: string, surahNumber: number): Promise<TimingRow[]> {
  Const cacheKey = `${TIMING_CACHE_KEY}:${readId}:${surahNumber}`;
  Const cached = readJsonCache<TimingRow[]>(cacheKey);
  If (Array.isArray(cached) && cached.length) return cached;

  Try {
    Const response = await fetch(
      `${MP3QURAN_API_BASE}/ayat_timing?surah=${surahNumber}&read=${readId}`,
      { cache: 'force-cache' }
    );
    If (!response.ok) return [];

    Const json = await response.json();
    Const rows = Array.isArray(json) ? Json : json?.data ?? Json?.ayat ?? [];

    Const timings: TimingRow[] = rows
      .map((row: any, index: number) => ({
        Ayah: Number(row?.ayah ?? Row?.number ?? Index + 1),
        Start: normalizeTimingValue(row?.start_time ?? Row?.start ?? 0),
        End: normalizeTimingValue(row?.end_time ?? Row?.end ?? 0),
      }))
      .filter((row: TimingRow) => Number.isFinite(row.ayah) && row.end >= row.start);

    If (timings.length) writeJsonCache(cacheKey, timings);
    Return timings;
  } catch {
    Return [];
  }
}

Const makeSurahAudioUrl = (reciter: DynamicReciter, surahNumber: number): string =>
  `${normalizeUrl(reciter.server)}${String(surahNumber).padStart(3, '0')}.mp3`;

Const getInitialReciter = (reciters: DynamicReciter[]): DynamicReciter | null => {
  Try {
    Const saved = localStorage.getItem('quran_selected_reciter');
    If (saved) {
      Const found = reciters.find((r) => r.id === saved);
      If (found) return found;
    }
  } catch {}
  Return reciters[0] ?? Null;
};

Export function QuranReader({
  CurrentPage,
  OnNextPage,
  OnPrevPage,
  OnBackToIndex,
  BgStyle,
  ShowNumbers,
  SurahsList,
  OnJumpToPage,
}: QuranReaderProps) {
  Const audioRef = useRef<HTMLAudioElement | null>(null);
  Const timingCacheRef = useRef(new Map<string, TimingRow[]>());
  Const loadingPlayRef = useRef(false);

  Const [reciters, setReciters] = useState<DynamicReciter[]>(() =>
    MergeReciters(readJsonCache<DynamicReciter[]>(RECITERS_CACHE_KEY) ?? [], getStaticKurdishReciters())
  );

  Const [selectedReciter, setSelectedReciter] = useState<DynamicReciter | null>(() =>
    GetInitialReciter(reciters)
  );

  Const [ayahs, setAyahs] = useState<AyahData[]>([]);
  Const [playingAyahIndex, setPlayingAyahIndex] = useState<number | null>(null);
  Const [isPlaying, setIsPlaying] = useState(false);
  Const [isLoading, setIsLoading] = useState(false);
  Const [error, setError] = useState<string | null>(null);
  Const [timingRows, setTimingRows] = useState<TimingRow[]>([]);
  Const [selectedSurahNumber, setSelectedSurahNumber] = useState<number>(getPageSurahNumber(currentPage, surahsList));

  useEffect(() => {
    FetchDynamicKurdishReciters()
      .then((fresh) => {
        Const combined = mergeReciters(fresh, getStaticKurdishReciters());
        SetReciters(combined);
        SetSelectedReciter((old) => old ?? GetInitialReciter(combined));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    SetSelectedSurahNumber(getPageSurahNumber(currentPage, surahsList));
  }, [currentPage, surahsList]);

  useEffect(() => {
    FetchPageAyahs(currentPage)
      .then(setAyahs)
      .catch((err) => setError(err.message));
  }, [currentPage]);

  useEffect(() => {
    Const audio = audioRef.current;
    If (audio) {
      Audio.pause();
      Audio.removeAttribute('src');
    }
    SetPlayingAyahIndex(null);
    SetIsPlaying(false);
    SetTimingRows([]);
  }, [currentPage, selectedReciter?.id]);

  // هەژمارکردنی خودکارانەی کاتی ئایەتەکان ئەگەر تایمینگی فەرمی نەبوو (Fallback Estimator)
  Const getOrGenerateTimings = useCallback(
    Async (reciter: DynamicReciter, surahNumber: number, duration: number) => {
      Const key = `${reciter.moshafId}:${surahNumber}`;
      If (timingCacheRef.current.has(key)) return timingCacheRef.current.get(key)!;

      Let rows = await fetchMp3QuranTiming(reciter.moshafId, surahNumber);

      // ئەگەر تایمینگ لە API نەبوو، بەپێی درێژی دەنگەکە و ژمارەی ئایەتەکان هەژماری بکە:
      If (!rows.length && ayahs.length > 0 && duration > 0) {
        Const avgTime = duration / ayahs.length;
        Rows = ayahs.map((a, i) => ({
          Ayah: Number(a.ayah ?? I + 1),
          Start: i * avgTime,
          End: (i + 1) * avgTime,
        }));
      }

      TimingCacheRef.current.set(key, rows);
      Return rows;
    },
    [ayahs]
  );

  Const playAyah = useCallback(
    Async (index: number) => {
      If (!selectedReciter || !ayahs[index]) return;
      Const audio = audioRef.current;
      If (!audio || loadingPlayRef.current) return;

      LoadingPlayRef.current = true;
      IsLoading(true);
      SetError(null);

      Try {
        Const surahNumber = selectedSurahNumber;
        Const src = makeSurahAudioUrl(selectedReciter, surahNumber);

        If (audio.src !== src) {
          Audio.src = src;
          Audio.load();
        }

        SetPlayingAyahIndex(index);
        Await audio.play();
        SetIsPlaying(true);

        Const rows = await getOrGenerateTimings(selectedReciter, surahNumber, audio.duration || 0);
        SetTimingRows(rows);

        Const currentAyahNum = Number(ayahs[index]?.ayah ?? Index + 1);
        Const timing = rows.find((r) => r.ayah === currentAyahNum);

        If (timing && timing.start >= 0) {
          Audio.currentTime = timing.start;
        }
      } catch (e) {
        SetError('خوێندنەوەی دەنگەکە شکستی هێنا.');
        SetIsPlaying(false);
      } finally {
        LoadingPlayRef.current = false;
        IsLoading(false);
      }
    },
    [ayahs, getOrGenerateTimings, selectedReciter, selectedSurahNumber]
  );

  Const handleTimeUpdate = useCallback(() => {
    Const audio = audioRef.current;
    If (!audio || !timingRows.length || !ayahs.length) return;

    Const currentTime = audio.currentTime;
    Const active = timingRows.find((r) => currentTime >= r.start && currentTime <= r.end);

    If (active) {
      Const idx = ayahs.findIndex((a) => Number(a.ayah) === active.ayah);
      If (idx !== -1 && idx !== playingAyahIndex) {
        SetPlayingAyahIndex(idx);
      }
    }
  }, [ayahs, playingAyahIndex, timingRows]);

  Const renderAyahAreas = useCallback(() => {
    If (!ayahs.length) return null;

    // دابەشکردنی دروستتری لاپەڕەکە بە لابردنی پەراوێزی سەرەوە و خوارەوە
    Const topOffset = 12; // Header Offset
    Const bottomOffset = 8; // Footer Offset
    Const usableHeight = 100 - topOffset - bottomOffset;
    Const itemHeight = usableHeight / ayahs.length;

    Return ayahs.map((ayah, index) => {
      Const active = playingAyahIndex === index;
      Const topPos = topOffset + index * itemHeight;

      Return (
        <button
          Key={`ayah-${currentPage}-${index}`}
          Type="button"
          OnClick={() => playAyah(index)}
          Style={{
            Position: 'absolute',
            Left: '6%',
            Right: '6%',
            Top: `${topPos}%`,
            Height: `${Math.max(1.8, itemHeight - 0.3)}%`,
            Margin: 0,
            Padding: 0,
            Border: active ? '2px solid rgba(255, 174, 0, 0.95)' : 'none',
            BorderRadius: 6,
            Background: active ? 'rgba(255, 215, 0, 0.3)' : 'transparent',
            BoxShadow: active ? '0 0 10px rgba(255,174,0,0.4)' : 'none',
            Cursor: 'pointer',
            ZIndex: 30,
            Transition: 'all 0.15s ease-in-out',
          }}
        />
      );
    });
  }, [ayahs, currentPage, playAyah, playingAyahIndex]);

  Return (
    <div dir="rtl" style={{ position: 'fixed', inset: 0, background: bgStyle?.background ?? '#fff', ...bgStyle }}>
      <audio
        Ref={audioRef}
        Preload="auto"
        OnTimeUpdate={handleTimeUpdate}
        OnEnded={() => {
          If (playingAyahIndex !== null && playingAyahIndex + 1 < ayahs.length) {
            PlayAyah(playingAyahIndex + 1);
          } else if (currentPage < PAGE_COUNT) {
            OnNextPage();
          }
        }}
      />

      {/* Control Bar */}
      <div style={{ position: 'absolute', top: 10, left: 10, right: 10, zIndex: 100, display: 'flex', gap: 8, background: '#fff', padding: 8, borderRadius: 12 }}>
        <button onClick={onBackToIndex}>فهرست</button>
        <div style={{ flex: 1, textAlign: 'center' }}>لاپەڕە {currentPage}</div>
        <select
          Value={selectedReciter?.id ?? ''}
          OnChange={(e) => setSelectedReciter(reciters.find((r) => r.id === e.target.value) ?? Null)}
        >
          {reciters.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
      </div>

      {/* Pages Container */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '60px 0' }}>
        <div style={{ position: 'relative', width: 'min(92vw, 500px)', height: '100%', background: '#fff' }}>
          <img
            Src={pageImgUrl(currentPage)}
            Alt="Quran"
            Style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }}
          />
          {renderAyahAreas()}
        </div>
      </div>
    </div>
  );
}

Export default QuranReader;
