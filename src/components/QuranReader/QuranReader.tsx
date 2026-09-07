import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ALL_RECITERS_DIRECTORY, ReciterItem } from '../../data/recitersList';
import {
  getSurahAudio,
  saveSurahAudio,
  getAyahAudio,
  saveAyahAudio,
} from '../../utils/quranAudioDb';

const PAGE_COUNT = 604;
const QURAN_PAGE_BASE = 'https://android.quran.com/data/width_1260/';
const QURAN_API_BASE = 'https://api.alquran.cloud/v1';
const MP3QURAN_API_BASE = 'https://mp3quran.net/api/v3';

const RECITERS_CACHE_KEY = 'quran_dynamic_kurdish_reciters_v2';
const TIMING_CACHE_KEY = 'quran_mp3quran_timing_v2';

interface AyahData {
  number?: number;
  ayah?: number;
  globalAyah?: number;
  text?: string;
  surahNumber?: number;
  [key: string]: unknown;
}

interface TimingRow {
  ayah: number;
  start: number;
  end: number;
}

interface DynamicReciter {
  id: string;
  sourceId: string;
  name: string;
  nameAr?: string;
  riwayah: string;
  server: string;
  surahList: number[];
  surahTotal: number;
  moshafId: string;
  source: 'mp3quran' | 'everyayah';
  serverKey?: string;
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

const formatPageNum = (page: number): string => String(page).padStart(3, '0');
const pageImgUrl = (page: number): string => `${QURAN_PAGE_BASE}page${formatPageNum(page)}.png`;

const normalizeUrl = (url: string): string => (url.endsWith('/') ? url : `${url}/`);

const getPageSurahNumber = (page: number, surahsList?: SurahItem[]): number => {
  if (!surahsList?.length) return 1;

  const normalized = surahsList
    .map((surah) => ({
      number: Number(surah.number ?? surah.id ?? 0),
      startPage: Number(surah.startPage ?? surah.page ?? surah['start_page'] ?? 0),
      endPage: Number(surah.endPage ?? surah['end_page'] ?? 0),
    }))
    .filter((surah) => surah.number >= 1 && surah.number <= 114 && surah.startPage > 0)
    .sort((a, b) => a.startPage - b.startPage);

  const inRange = normalized.find((surah) => page >= surah.startPage && (!surah.endPage || page <= surah.endPage));
  if (inRange) return inRange.number;

  let result = normalized[0]?.number ?? 1;
  for (const surah of normalized) {
    if (surah.startPage <= page) {
      result = surah.number;
    } else {
      break;
    }
  }
  return result;
};

const getStaticReciters = (): DynamicReciter[] => {
  return (ALL_RECITERS_DIRECTORY as ReciterItem[]).map((reciter) => {
    let serverUrl = reciter.audioBaseUrl || '';
    if (!serverUrl && reciter.serverKey) {
      serverUrl = `https://everyayah.com/data/${reciter.serverKey}/`;
    }
    const surahs = Array.from({ length: 114 }, (_, i) => i + 1);

    return {
      id: String(reciter.id),
      sourceId: String(reciter.id),
      name: reciter.name,
      riwayah: reciter.riwayah || 'حفص عن عاصم',
      server: normalizeUrl(serverUrl),
      surahList: surahs,
      surahTotal: surahs.length,
      moshafId: String(reciter.serverKey || reciter.id),
      source: reciter.audioSource || 'everyayah',
      serverKey: reciter.serverKey,
    };
  });
};

async function fetchPageAyahs(page: number): Promise<AyahData[]> {
  const response = await fetch(`${QURAN_API_BASE}/page/${page}/editions/quran-uthmani`, { cache: 'force-cache' });

  if (!response.ok) {
    throw new Error(`Quran text API: ${response.status}`);
  }

  const json = await response.json();
  const edition = Array.isArray(json?.data) ? json.data[0] : json?.data;
  const ayahs = Array.isArray(edition?.ayahs) ? edition.ayahs : [];

  return ayahs.map((ayah: any) => ({
    ...ayah,
    globalAyah: Number(ayah?.number ?? 0),
    ayah: Number(ayah?.numberInSurah ?? ayah?.ayah ?? 0),
  }));
}

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
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [reciters] = useState<DynamicReciter[]>(getStaticReciters());
  const [selectedReciter, setSelectedReciter] = useState<DynamicReciter | null>(() => getStaticReciters()[0]);
  const [ayahs, setAyahs] = useState<AyahData[]>([]);
  const [playingAyahIndex, setPlayingAyahIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSurahNumber, setSelectedSurahNumber] = useState<number>(getPageSurahNumber(currentPage, surahsList));

  useEffect(() => {
    setSelectedSurahNumber(getPageSurahNumber(currentPage, surahsList));
  }, [currentPage, surahsList]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setError(null);
        const data = await fetchPageAyahs(currentPage);
        if (cancelled) return;
        setAyahs(data);
      } catch (err) {
        if (cancelled) return;
        setAyahs([]);
        setError(err instanceof Error ? err.message : 'دەقی لاپەڕەکە نەهێنرا.');
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [currentPage]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute('src');
    }
    setPlayingAyahIndex(null);
    setIsPlaying(false);
  }, [currentPage, selectedReciter?.id]);

  /*
   * Construct correct URL based on Reciter Source
   */
  const getAyahAudioUrl = (reciter: DynamicReciter, surah: number, ayah: number): string => {
    const formattedSurah = String(surah).padStart(3, '0');
    if (reciter.source === 'mp3quran') {
      return `${reciter.server}${formattedSurah}.mp3`;
    }
    const formattedAyah = String(ayah).padStart(3, '0');
    return `https://everyayah.com/data/${reciter.serverKey || reciter.moshafId}/${formattedSurah}${formattedAyah}.mp3`;
  };

  const playAyah = useCallback(
    async (index: number) => {
      if (!selectedReciter || !ayahs[index]) return;

      const surahNumber = selectedSurahNumber;
      const ayahNumber = Number(ayahs[index]?.ayah ?? index + 1);

      const audio = audioRef.current;
      if (!audio) return;

      setIsLoading(true);
      setError(null);

      try {
        let audioUrl = '';

        // 1. Check IndexedDB First
        if (selectedReciter.source === 'everyayah') {
          const localBlob = await getAyahAudio(selectedReciter.id, surahNumber, ayahNumber);
          if (localBlob) {
            audioUrl = URL.createObjectURL(localBlob);
          }
        } else {
          const localBlob = await getSurahAudio(selectedReciter.id, surahNumber);
          if (localBlob) {
            audioUrl = URL.createObjectURL(localBlob);
          }
        }

        // 2. Network Fetch if not found locally
        if (!audioUrl) {
          const remoteUrl = getAyahAudioUrl(selectedReciter, surahNumber, ayahNumber);
          const response = await fetch(remoteUrl);
          if (!response.ok) {
            throw new Error(`سێرڤەر وەڵامی نەدایەوە (${response.status})`);
          }
          const blob = await response.blob();
          
          if (selectedReciter.source === 'everyayah') {
            await saveAyahAudio(selectedReciter.id, surahNumber, ayahNumber, blob);
          } else {
            await saveSurahAudio(selectedReciter.id, surahNumber, blob);
          }
          audioUrl = URL.createObjectURL(blob);
        }

        audio.src = audioUrl;
        setPlayingAyahIndex(index);
        await audio.play();
        setIsPlaying(true);
      } catch (err) {
        setIsPlaying(false);
        setError(err instanceof Error ? err.message : 'دەنگەکە بەردەست نییە.');
      } finally {
        setIsLoading(false);
      }
    },
    [ayahs, selectedReciter, selectedSurahNumber]
  );

  const togglePlayPause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      if (playingAyahIndex !== null) {
        audio.play().then(() => setIsPlaying(true));
      } else {
        playAyah(0);
      }
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  }, [playAyah, playingAyahIndex]);

  const stopAudio = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    setIsPlaying(false);
    setPlayingAyahIndex(null);
  }, []);

  const handleEnded = useCallback(() => {
    const nextIndex = (playingAyahIndex ?? -1) + 1;
    if (nextIndex < ayahs.length) {
      playAyah(nextIndex);
    } else {
      setPlayingAyahIndex(null);
      setIsPlaying(false);
      if (currentPage < PAGE_COUNT) {
        onNextPage();
      }
    }
  }, [ayahs.length, currentPage, onNextPage, playAyah, playingAyahIndex]);

  return (
    <div
      dir="rtl"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        background: bgStyle?.background ?? '#fff',
        color: '#111',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        ...bgStyle,
      }}
    >
      <audio
        ref={audioRef}
        preload="auto"
        onEnded={handleEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onError={() => setError('کێشە لە لێدانی دەنگەکە ڕوویدا.')}
      />

      {/* TOP CONTROL BAR */}
      <div
        style={{
          position: 'absolute',
          top: 10,
          left: 10,
          right: 10,
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 10px',
          borderRadius: 16,
          background: 'rgba(255,255,255,0.92)',
          boxShadow: '0 4px 18px rgba(0,0,0,0.10)',
        }}
      >
        <button
          type="button"
          onClick={onBackToIndex}
          style={{ border: 'none', borderRadius: 10, padding: '9px 11px', background: '#222', color: '#fff', cursor: 'pointer' }}
        >
          فهرست
        </button>

        <div style={{ flex: 1, textAlign: 'center', fontWeight: 700, fontSize: 14 }}>لاپەڕە {currentPage}</div>

        <select
          value={selectedReciter?.id ?? ''}
          onChange={(e) => {
            const found = reciters.find((r) => r.id === e.target.value) ?? null;
            setSelectedReciter(found);
          }}
          style={{ border: '1px solid #ddd', borderRadius: 10, padding: '8px 9px', background: '#fff', fontSize: 12 }}
        >
          {reciters.map((reciter) => (
            <option key={reciter.id} value={reciter.id}>
              {reciter.name}
            </option>
          ))}
        </select>
      </div>

      {/* ERROR DISPLAY */}
      {error && (
        <div
          style={{
            position: 'absolute',
            top: 72,
            left: 12,
            right: 12,
            zIndex: 95,
            padding: '9px 12px',
            borderRadius: 12,
            background: 'rgba(180,30,30,0.94)',
            color: '#fff',
            textAlign: 'center',
            fontSize: 12,
          }}
        >
          {error}
        </div>
      )}

      {/* QURAN PAGE CONTAINER */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '90px 8px 110px',
        }}
      >
        <div
          style={{
            position: 'relative',
            width: 'min(92vw, 520px)',
            height: 'calc(100vh - 200px)',
            borderRadius: 8,
            background: '#fff',
            overflow: 'hidden',
            boxShadow: '0 8px 28px rgba(0,0,0,0.14)',
          }}
        >
          <img
            src={pageImgUrl(currentPage)}
            alt={`Quran page ${currentPage}`}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }}
          />

          {/* AYAH HIGHLIGHT & CLICK AREAS */}
          {ayahs.map((ayah, index) => {
            const active = playingAyahIndex === index;
            const topStart = 14;
            const available = 78;
            const rowHeight = available / ayahs.length;
            const top = topStart + index * rowHeight;

            return (
              <button
                key={`ayah-${currentPage}-${index}`}
                type="button"
                onClick={() => playAyah(index)}
                style={{
                  position: 'absolute',
                  left: '5%',
                  right: '5%',
                  top: `${top}%`,
                  height: `${Math.max(1.2, rowHeight - 0.2)}%`,
                  border: active ? '2px solid rgba(255,174,0,0.9)' : 'none',
                  borderRadius: 8,
                  background: active ? 'rgba(255,196,0,0.26)' : 'transparent',
                  cursor: 'pointer',
                  zIndex: 20,
                }}
              />
            );
          })}

          {isLoading && (
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 60,
                padding: '9px 13px',
                borderRadius: 12,
                background: 'rgba(0,0,0,0.72)',
                color: '#fff',
                fontSize: 12,
              }}
            >
              دەنگ بار دەکرێت...
            </div>
          )}
        </div>
      </div>

      {/* AUDIO CONTROL BAR */}
      <div
        style={{
          position: 'absolute',
          bottom: 10,
          left: 10,
          right: 10,
          zIndex: 110,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '9px 10px',
          borderRadius: 16,
          background: 'rgba(255,255,255,0.95)',
          boxShadow: '0 -3px 18px rgba(0,0,0,0.12)',
        }}
      >
        <button
          type="button"
          onClick={togglePlayPause}
          disabled={isLoading}
          style={{
            width: 42,
            height: 42,
            border: 'none',
            borderRadius: 12,
            background: '#222',
            color: '#fff',
            cursor: 'pointer',
            fontSize: 17,
          }}
        >
          {isPlaying ? 'Ⅱ' : '▶'}
        </button>

        <button
          type="button"
          onClick={stopAudio}
          style={{ width: 42, height: 42, border: '1px solid #ddd', borderRadius: 12, background: '#fff', fontSize: 15 }}
        >
          ■
        </button>

        <div style={{ flex: 1, textAlign: 'right' }}>
          <div style={{ fontSize: 12, fontWeight: 700 }}>{selectedReciter?.name ?? 'قاری'}</div>
          <div style={{ fontSize: 11, color: '#777' }}>
            {playingAyahIndex !== null ? `ئایەت ${playingAyahIndex + 1}` : 'ئایەتێک هەڵبژێرە'}
          </div>
        </div>

        <button type="button" onClick={onPrevPage} disabled={currentPage <= 1} style={{ padding: '8px 10px' }}>
          →
        </button>
        <button type="button" onClick={onNextPage} disabled={currentPage >= PAGE_COUNT} style={{ padding: '8px 10px' }}>
          ←
        </button>
      </div>
    </div>
  );
}

export default QuranReader;
