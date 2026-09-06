import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ALL_RECITERS_DIRECTORY } from '../data/recitersList';

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
