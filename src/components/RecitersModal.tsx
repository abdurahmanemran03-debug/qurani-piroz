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

  /**
   * Audio source type.
   *
   * everyayah:
   * Per-ayah MP3:
   * 001001.mp3, 001002.mp3, ...
   *
   * mp3quran:
   * Per-surah MP3:
   * 001.mp3, 002.mp3, ...
   *
   * The second source is handled by MushafPageView.
   */
  audioSource?: 'everyayah' | 'mp3quran';

  /**
   * Base URL for MP3Quran reciters.
   * Used when audioSource === 'mp3quran'.
