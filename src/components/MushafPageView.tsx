import React, {
useState,
useEffect,
useRef
} from 'react';

import {
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

import {
BgThemeType,
AppLangType,
SurahItem
} from '../types';

import {
ALL_RECITERS_DIRECTORY,
ReciterItem
} from '../data/recitersList';

import {
ALL_TAFSIRS_DIRECTORY,
TafsirItem
} from '../data/tafsirList';

import { RecitersModal } from './RecitersModal';
import { TafsirSelectorModal } from './TafsirSelectorModal';

import {
getAyahAudio,
saveAyahAudio,
getSurahAudio,
saveSurahAudio,
deleteSurahAudio,
getDownloadedAyahCount,
isSurahAudioDownloaded
} from '../utils/audioStorage';

interface MushafPageViewProps {
currentPage: number;
onNextPage: () => void;
onPrevPage: () => void;
onBackToIndex: () => void;
bgStyle: BgThemeType;
appLang: AppLangType;
showNumbers: boolean;
surahsList?: SurahItem[];
onJumpToPage?: (page: number) => void;
}

const formatPageNum = (n: number) =>
String(n).padStart(3, '0');

const pageImgUrl = (n: number) =>
https://android.quran.com/data/width_1260/page${formatPageNum(n)}.png`;

const AYAH_CANVAS_WIDTH = 1260;
const AYAH_CANVAS_HEIGHT = 2020;

type AyahBoxObj = {
s: number;
a: number;
l: number;
x0: number;
x1: number;
y0: number;
y1: number;
};

type SurahDownloadState = {
downloaded: number;
total: number;
downloading: boolean;
paused: boolean;
error?: boolean;
};

type AudioSource = {
url: string;
startTime?: number;
endTime?: number;
};

type Mp3QuranTiming = {
ayah: number;
start_time: number;
end_time: number;
};

type Mp3QuranRead = {
id: number;
server: string;
surah_total?: number;
surah_list?: string;
};

const LONG_PRESS_MS = 550;

const TAFSIR_API_EDITION: Record<
string,
string
= {
ku_asan: 'ku.asan',
ar_muyassar: 'ar.muyassar',
ar_jalalayn: 'ar.jalalayn',
en_sahih: 'en.sahih',
en_pickthall: 'en.pickthall',
en_yusuf_ali: 'en.yusufali',
en_hilali_khan: 'en.hilali',
en_maududi: 'en.maududi',
en_transliteration: 'en.transliteration',
fa_ahsan_kalam: 'fa.ansarian',
tr_diyanet: 'tr.diyanet',
tr_elmali: 'tr.yazir',
de_bubenheim: 'de.bubenheim',
fr_hamidullah: 'fr.hamidullah',
ru_kuliev: 'ru.kuliev',
ru_abu_adel: 'ru.abuadel',
es_cortes: 'es.cortes',
ur_maududi: 'ur.maududi',
ur_junagarhi: 'ur.junagarhi',
id_sabeq: 'id.indonesian',
ms_basmeih: 'ms.basmeih',
sq_nahi: 'sq.nahi',
am_sadiq: 'am.sadiq',
az_musayev: 'az.musayev',
bn_zakaria: 'bn.bengali',
bs_korkut: 'bs.korkut',
zh_majian: 'zh.jian',
nl_abdalsalaam: 'nl.keyzer',
ha_gumi: 'ha.gumi',
hi_umari: 'hi.hindi',
it_piccardo: 'it.piccardo',
ja_mita: 'ja.japanese',
ko_choi: 'ko.korean',
ml_parappoor: 'ml.abdulhameed',
ps_abdulsalam: 'ps.abdulsalam',
so_abduh: 'so.abduh',
sw_barwani: 'sw.barwani',
sv_bernstrom: 'sv.bernstrom',
tg_rowwad: 'tg.ayati',
th_kingfahad: 'th.thai',
ug_saleh: 'ug.saleh',
uz_yusuf: 'uz.sodik'
};

/* =========================================================
INITIAL RECITER
========================================================= */

const getInitialReciter =
(): ReciterItem => {
try {
const savedId =
localStorage.getItem(
'quran_selected_reciter'
);

if (savedId) {
const savedReciter =
ALL_RECITERS_DIRECTORY.find(
r => r.id === savedId
);

if (savedReciter) {
return savedReciter;
}
}
} catch {
// Ignore
}

return (
ALL_RECITERS_DIRECTORY[18] ||
ALL_RECITERS_DIRECTORY[0]
);
};

/* =========================================================
NORMALIZE
========================================================= */

const normalizeUrl = (
value: string
) =>
value
.trim()
.replace(//+`$/, '')
.toLowerCase();

/* =========================================================
EVERYAYAH
========================================================= */

const makeEveryAyahUrl = (
reciter: ReciterItem,
surahNumber: number,
ayahNumber: number
) => {
const surah =
String(surahNumber).padStart(3, '0');

const ayah =
String(ayahNumber).padStart(3, '0');

return (
https://everyayah.com/data/ +
${reciter.serverKey}/+ ``${surah}${ayah}.mp3`
);
};

/* =========================================================
MP3QURAN SURAH
========================================================= */

const makeMp3QuranSurahUrl = (
reciter: ReciterItem,
surahNumber: number
) => {
if (!reciter.audioBaseUrl) {
return null;
}

const base =
reciter.audioBaseUrl.endsWith('/')
? reciter.audioBaseUrl
: ``${reciter.audioBaseUrl}/`;

return (
${base}${String( surahNumber ).padStart(3, '0')}.mp3
);
};

/* =========================================================
TIME NORMALIZER
========================================================= */

const normalizeTimingValue = (
value: number
) => {
if (!Number.isFinite(value)) {
return 0;
}

/*
• MP3Quran usually returns milliseconds.
• Some endpoints/versions may return seconds.
• Large values => milliseconds.
• Small values => seconds.
*/
if (value > 10000) {
return value / 1000;
}

return value;
};

/* =========================================================
COMPONENT
========================================================= */

export const MushafPageView: React.FC<
MushafPageViewProps
= ({
currentPage,
onNextPage,
onPrevPage,
onBackToIndex,
bgStyle,
appLang,
showNumbers,
surahsList = [],
onJumpToPage
}) => {
const [
viewMode,
setViewMode
 ] = useState<
'mushaf' | 'tafsir'
>('mushaf');

const [
showControls,
setShowControls
 ] = useState(true);

const [
isRecitersModalOpen,
setIsRecitersModalOpen
 ] = useState(false);

const [
isTafsirSelectorOpen,
setIsTafsirSelectorOpen
 ] = useState(false);

const [
selectedReciter,
setSelectedReciter
 ] = useState<ReciterItem>(
getInitialReciter
);

const [
selectedTafsir,
setSelectedTafsir
 ] = useState<TafsirItem>(
ALL_TAFSIRS_DIRECTORY[0]
);

const [
pageAyahsData,
setPageAyahsData
 ] = useState<any[]>([]);

const [
loadingTafsir,
setLoadingTafsir
 ] = useState(false);

const [
ayahApiError,
setAyahApiError
 ] = useState<string | null>(null);

const [
tafsirApiError,
setTafsirApiError
 ] = useState<string | null>(null);

const [
bookmarks,
setBookmarks
 ] = useState<number[]>(
() => {
try {
const saved =
localStorage.getItem(
'quran_bookmarks'
);

return saved
? JSON.parse(saved)
: [];
} catch {
return [];
}
}
);

const [
isPlayingAudio,
setIsPlayingAudio
 ] = useState(false);

const audioRef =
useRef<HTMLAudioElement | null>(
null
);

const [
playingAyahKey,
setPlayingAyahKey
 ] = useState<string | null>(
null
);

const audioObjectUrlRef =
useRef<string | null>(null);

const audioRequestIdRef =
useRef(0);

/* =========================================================
MP3QURAN CACHE
========================================================= */

const mp3TimingCacheRef =
useRef<
Record<
string,
Mp3QuranTiming[]
>
>({});

const mp3ReadCacheRef =
useRef<
Record<
string,
Mp3QuranRead | null
>
>({});

const activeSegmentRef =
useRef<{
endTime: number | null;
requestId: number;
} | null>(null);

/* =========================================================
DOWNLOAD
========================================================= */

const [
surahDownloadState,
setSurahDownloadState
 ] = useState<SurahDownloadState>({
downloaded: 0,
total: 0,
downloading: false,
paused: false,
error: false
});

const downloadAbortControllerRef =
useRef<AbortController | null>(null);

const downloadSessionRef =
useRef(0);

/* =========================================================
AUDIO URL CLEANUP
========================================================= */

const clearAudioObjectUrl =
() => {
if (
audioObjectUrlRef.current
) {
try {
URL.revokeObjectURL(
audioObjectUrlRef.current
);
} catch {
// Ignore
}

audioObjectUrlRef.current =
null;
}
};

/* =========================================================
STOP AUDIO COMPLETELY
========================================================= */

const stopAudioCompletely =
() => {
audioRequestIdRef.current++;

activeSegmentRef.current =
null;

if (
audioRef.current
) {
try {
audioRef.current.pause();
audioRef.current.currentTime = 0;
audioRef.current.removeAttribute(
'src'
);
audioRef.current.load();
} catch {
// Ignore
}
}

clearAudioObjectUrl();

setIsPlayingAudio(false);
setPlayingAyahKey(null);

pageAudioIndexRef.current =
-1;

setPageAudioIndex(-1);
};

/* =========================================================
GET MP3QURAN READ
========================================================= */

const getMp3QuranRead =
async (
reciter: ReciterItem
): Promise<Mp3QuranRead | null> => {
const cacheKey =
reciter.id;

if (
Object.prototype.hasOwnProperty.call(
mp3ReadCacheRef.current,
cacheKey
)
) {
return (
mp3ReadCacheRef.current[
cacheKey
 ]
);
}

if (
!reciter.audioBaseUrl
) {
mp3ReadCacheRef.current[
cacheKey
 ] = null;

return null;
}

try {
const response =
await fetch(
'https://mp3quran.net/api/v3/reciters?language=eng'
);

if (!response.ok) {
throw new Error(
MP3Quran API HTTP ${response.status}`
);
}

const data =
await response.json();

const remoteReciters =
Array.isArray(
data?.reciters
)
? data.reciters
: [];

const localBase =
normalizeUrl(
reciter.audioBaseUrl
);

let found:
| Mp3QuranRead
| null = null;

for (
const remoteReciter of remoteReciters
) {
const moshafs =
Array.isArray(
remoteReciter?.moshaf
)
? remoteReciter.moshaf
: [];

for (
const moshaf of moshafs
) {
const server =
String(
moshaf?.server || ''
);

const remoteServer =
normalizeUrl(server);

if (
!remoteServer ||
!localBase
) {
continue;
}

const matches =
localBase ===
remoteServer ||
localBase.includes(
remoteServer
) ||
remoteServer.includes(
localBase
);

if (!matches) {
continue;
}

const id =
Number(moshaf?.id);

if (
!Number.isFinite(id)
) {
continue;
}

found = {
id,
server,
surah_total:
Number(
moshaf?.surah_total
),
surah_list:
String(
moshaf?.surah_list ||
''
)
};

break;
}

if (found) {
break;
}
}

mp3ReadCacheRef.current[
cacheKey
 ] = found;

return found;
} catch (error) {
console.error(
'MP3Quran read lookup failed:',
error
);

mp3ReadCacheRef.current[
cacheKey
 ] = null;

return null;
}
};

/* =========================================================
GET MP3QURAN TIMING
========================================================= */

const getMp3QuranTiming =
async (
reciter: ReciterItem,
surahNumber: number
): Promise<
Mp3QuranTiming[]
> => {
const cacheKey =
``${reciter.id}_${surahNumber};

if (
mp3TimingCacheRef.current[
cacheKey
 ]
) {
return (
mp3TimingCacheRef.current[
cacheKey
 ]
);
}

const read =
await getMp3QuranRead(
reciter
);

if (!read) {
return [];
}

try {
const response =
await fetch(
https://mp3quran.net/api/v3/ayat_timing?surah=${surahNumber}&read=${read.id}
);

if (!response.ok) {
throw new Error(
MP3Quran timing HTTP${response.status}`
);
}

const data =
await response.json();

/*
* Different API responses can expose
* the timing array under different names.
*/
let raw: any[] = [];

if (
Array.isArray(data)
) {
raw = data;
} else if (
Array.isArray(data?.ayat)
) {
raw = data.ayat;
} else if (
Array.isArray(data?.data)
) {
raw = data.data;
} else if (
Array.isArray(
data?.timing
)
) {
raw = data.timing;
} else if (
Array.isArray(
data?.ayahs
)
) {
raw = data.ayahs;
}

const timings =
raw
.map(
(item: any) => {
const ayah =
Number(
item?.ayah ??
item?.ayah_number ??
item?.number
);

const startRaw =
Number(
item?.start_time ??
item?.start ??
item?.startTime
);

const endRaw =
Number(
item?.end_time ??
item?.end ??
item?.endTime
);

return {
ayah,
start_time:
normalizeTimingValue(
startRaw
),
end_time:
normalizeTimingValue(
endRaw
)
};
}
)
.filter(
(
item: Mp3QuranTiming
) =>
Number.isFinite(
item.ayah
) &&
item.ayah > 0 &&
Number.isFinite(
item.start_time
) &&
Number.isFinite(
item.end_time
) &&
item.end_time >
item.start_time
);

mp3TimingCacheRef.current[
cacheKey
 ] = timings;

return timings;
} catch (error) {
console.error(
'MP3Quran timing error:',
error
);

mp3TimingCacheRef.current[
cacheKey
 ] = [];

return [];
}
};

/* =========================================================
GET AUDIO SOURCE
========================================================= */

const getAudioSource =
async (
reciter: ReciterItem,
surahNumber: number,
ayahNumber: number
): Promise<AudioSource> => {
/*
* ===============================================
* MP3QURAN
* ===============================================
*/

if (
reciter.audioSource ===
'mp3quran'
) {
const timings =
await getMp3QuranTiming(
reciter,
surahNumber
);

const timing =
timings.find(
item =>
item.ayah ===
ayahNumber
);

/*
* VERY IMPORTANT:
*
* If timing does not exist, DO NOT
* play the whole surah from second 0.
*/
if (!timing) {
throw new Error(
Timing بۆ ${surahNumber}:${ayahNumber} نەدۆزرایەوە
);
}

/*
* First try offline audio.
*/
try {
const localSurah =
await getSurahAudio(
reciter.id,
surahNumber
);

if (localSurah) {
clearAudioObjectUrl();

const localUrl =
URL.createObjectURL(
localSurah
);

audioObjectUrlRef.current =
localUrl;

return {
url: localUrl,
startTime:
timing.start_time,
endTime:
timing.end_time
};
}
} catch (error) {
console.warn(
'Local MP3Quran audio unavailable:',
error
);
}

/*
* Online MP3Quran.
*/
const onlineUrl =
makeMp3QuranSurahUrl(
reciter,
surahNumber
);

if (!onlineUrl) {
throw new Error(
URL ـی MP3Quran بۆ ${reciter.name} نەدۆزرایەوە`
);
}

return {
url: onlineUrl,
startTime:
timing.start_time,
endTime:
timing.end_time
};
}

/*
* ===============================================
* EVERYAYAH
* ===============================================
*/

const localBlob =
await getAyahAudio(
reciter.id,
surahNumber,
ayahNumber
).catch(
() => null
);

if (localBlob) {
clearAudioObjectUrl();

const localUrl =
URL.createObjectURL(
localBlob
);

audioObjectUrlRef.current =
localUrl;

return {
url: localUrl
};
}

const onlineUrl =
makeEveryAyahUrl(
reciter,
surahNumber,
ayahNumber
);

if (!onlineUrl) {
throw new Error(
EveryAyah URL نەدروست بوو بۆ${reciter.name}`
);
}

return {
url: onlineUrl
};
};

/* =========================================================
PAGE AUDIO
========================================================= */

const [
pageAudioIndex,
setPageAudioIndex
 ] = useState(-1);

const pageAudioIndexRef =
useRef(-1);

const [
pressingBox,
setPressingBox
 ] = useState<string | null>(
null
);

const [
highlightedAyah,
setHighlightedAyah
 ] = useState<{
ayah: any;
topPercent: number;
} | null>(null);

const [
tafsirSheetOpen,
setTafsirSheetOpen
 ] = useState(false);

const longPressTimer =
useRef<
ReturnType<
typeof setTimeout
> | null
>(null);

const [
allAyahData,
setAllAyahData
 ] = useState<
Record<
string,
AyahBoxObj[]
>
>({});

/* =========================================================
AYAH DATA
========================================================= */

useEffect(() => {
fetch(
${import.meta.env.BASE_URL}ayahdata/ayahdata.json`
)
.then(res => {
if (!res.ok) {
throw new Error(
'ayahdata.json not found'
);
}

return res.json();
})
.then(data => {
setAllAyahData(data);
})
.catch(() => {
setAllAyahData({});
});
}, []);

const ayahBoxes: AyahBoxObj[] =
allAyahData[
String(currentPage)
 ] || [];

/* =========================================================
AYAH BOOKMARKS
========================================================= */

const [
ayahBookmarks,
setAyahBookmarks
 ] = useState<string[]>(
() => {
try {
const saved =
localStorage.getItem(
'quran_ayah_bookmarks'
);

return saved
? JSON.parse(saved)
: [];
} catch {
return [];
}
}
);

const ayahKey = (
a: any
) =>
``${a.surahNumber}:${a.numberInSurah};

const isAyahBookmarked = (
a: any
) =>
ayahBookmarks.includes(
ayahKey(a)
);

const toggleAyahBookmark = (
a: any
) => {
const key =
ayahKey(a);

const updated =
isAyahBookmarked(a)
? ayahBookmarks.filter(
k => k !== key
)
: [
...ayahBookmarks,
key
 ];

setAyahBookmarks(
updated
);

localStorage.setItem(
'quran_ayah_bookmarks',
JSON.stringify(
updated
)
);

navigator.vibrate?.(35);
};

/* =========================================================
SAVE RECITER
========================================================= */

useEffect(() => {
try {
localStorage.setItem(
'quran_selected_reciter',
selectedReciter.id
);
} catch {
// Ignore
}
}, [
selectedReciter.id
 ]);

/* =========================================================
RECITER SYNC
========================================================= */

useEffect(() => {
const handleReciterChanged =
(
event: Event
) => {
const customEvent =
event as CustomEvent<string>;

const reciterId =
customEvent.detail;

if (!reciterId) {
return;
}

const reciter =
ALL_RECITERS_DIRECTORY.find(
r =>
r.id ===
reciterId
);

if (reciter) {
setSelectedReciter(
reciter
);
}
};

window.addEventListener(
'quran-reciter-changed',
handleReciterChanged
);

return () => {
window.removeEventListener(
'quran-reciter-changed',
handleReciterChanged
);
};
}, []);

/* =========================================================
TAFSIR
========================================================= */

const getTafsirApiEdition =
(
tafsir: TafsirItem
): string | null =>
TAFSIR_API_EDITION[
tafsir.id
 ] || null;

/* =========================================================
CURRENT SURAH
========================================================= */

const currentSurah =
surahsList
.slice()
.reverse()
.find(
s =>
currentPage >=
s.startPage
) ||
surahsList[0];

const currentSurahNumber =
currentSurah?.number ||
0;

const currentSurahAyahCount =
currentSurah?.ayahs ||
0;

/* =========================================================
REFRESH DOWNLOAD
========================================================= */

const refreshCurrentSurahDownload =
async () => {
if (
!currentSurahNumber ||
!currentSurahAyahCount
) {
setSurahDownloadState({
downloaded: 0,
total: 0,
downloading: false,
paused: false,
error: false
});

return;
}

try {
if (
selectedReciter.audioSource ===
'mp3quran'
) {
const downloaded =
await isSurahAudioDownloaded(
selectedReciter.id,
currentSurahNumber
);

setSurahDownloadState(
previous => ({
...previous,
downloaded:
downloaded
? currentSurahAyahCount
: 0,
total:
currentSurahAyahCount,
downloading: false,
paused:
previous.paused,
error: false
})
);

return;
}

const downloaded =
await getDownloadedAyahCount(
selectedReciter.id,
currentSurahNumber,
currentSurahAyahCount
);

setSurahDownloadState(
previous => ({
...previous,
downloaded,
total:
currentSurahAyahCount,
downloading: false,
error: false
})
);
} catch (error) {
console.error(
'Refresh download state error:',
error
);

setSurahDownloadState(
previous => ({
...previous,
total:
currentSurahAyahCount,
downloading: false
})
);
}
};

/* =========================================================
SURAH / RECITER CHANGED
========================================================= */

useEffect(() => {
downloadSessionRef.current++;

downloadAbortControllerRef.current?.abort();

downloadAbortControllerRef.current =
null;

setSurahDownloadState({
downloaded: 0,
total:
currentSurahAyahCount,
downloading: false,
paused: false,
error: false
});

void refreshCurrentSurahDownload();
}, [
currentSurahNumber,
currentSurahAyahCount,
selectedReciter.id
 ]);

/* =========================================================
DOWNLOAD CURRENT SURAH
========================================================= */

const downloadCurrentSurah =
async () => {
if (
!currentSurahNumber ||
!currentSurahAyahCount
) {
return;
}

if (
surahDownloadState.downloading
) {
return;
}

const reciterAtStart =
selectedReciter;

const surahNumberAtStart =
currentSurahNumber;

const ayahCountAtStart =
currentSurahAyahCount;

const session =
++downloadSessionRef.current;

const controller =
new AbortController();

downloadAbortControllerRef.current =
controller;

try {
/*
* ===============================================
* MP3QURAN
* ===============================================
*/

if (
reciterAtStart.audioSource ===
'mp3quran'
) {
const alreadyDownloaded =
await isSurahAudioDownloaded(
reciterAtStart.id,
surahNumberAtStart
);

if (
alreadyDownloaded
) {
if (
session ===
downloadSessionRef.current &&
selectedReciter.id ===
reciterAtStart.id
) {
setSurahDownloadState({
downloaded:
ayahCountAtStart,
total:
ayahCountAtStart,
downloading:
false,
paused: false,
error: false
});
}

return;
}

const url =
makeMp3QuranSurahUrl(
reciterAtStart,
surahNumberAtStart
);

if (!url) {
throw new Error(
'MP3Quran audioBaseUrl نەدۆزرایەوە'
);
}

setSurahDownloadState({
downloaded: 0,
total:
ayahCountAtStart,
downloading: true,
paused: false,
error: false
});

const response =
await fetch(url, {
signal:
controller.signal
});

if (!response.ok) {
throw new Error(
HTTP${response.status}`
);
}

const blob =
await response.blob();

if (
controller.signal.aborted
) {
throw new DOMException(
'Download paused',
'AbortError'
);
}

if (
blob.size === 0
) {
throw new Error(
'فایلی دەنگ بەتاڵە'
);
}

await saveSurahAudio(
reciterAtStart.id,
surahNumberAtStart,
blob
);

if (
session ===
downloadSessionRef.current &&
selectedReciter.id ===
reciterAtStart.id
) {
setSurahDownloadState({
downloaded:
ayahCountAtStart,
total:
ayahCountAtStart,
downloading:
false,
paused: false,
error: false
});

navigator.vibrate?.([
40,
60,
40
 ]);
}

return;
}

/*
* ===============================================
* EVERYAYAH
* ===============================================
*/

let currentCount =
await getDownloadedAyahCount(
reciterAtStart.id,
surahNumberAtStart,
ayahCountAtStart
);

if (
session !==
downloadSessionRef.current
) {
return;
}

setSurahDownloadState({
downloaded:
currentCount,
total:
ayahCountAtStart,
downloading: true,
paused: false,
error: false
});

for (
let ayah = 1;
ayah <=
ayahCountAtStart;
ayah++
) {
if (
controller.signal.aborted
) {
throw new DOMException(
'Download paused',
'AbortError'
);
}

if (
session !==
downloadSessionRef.current
) {
return;
}

const existing =
await getAyahAudio(
reciterAtStart.id,
surahNumberAtStart,
ayah
);

if (existing) {
continue;
}

const url =
makeEveryAyahUrl(
reciterAtStart,
surahNumberAtStart,
ayah
);

const response =
await fetch(url, {
signal:
controller.signal
});

if (!response.ok) {
throw new Error(
HTTP ${response.status} — ${url}
);
}

const blob =
await response.blob();

if (
controller.signal.aborted
) {
throw new DOMException(
'Download paused',
'AbortError'
);
}

if (
blob.size === 0
) {
throw new Error(
فایلی ئایەتی ${ayah} بەتاڵە`
);
}

await saveAyahAudio(
reciterAtStart.id,
surahNumberAtStart,
ayah,
blob
);

currentCount++;

if (
session ===
downloadSessionRef.current &&
selectedReciter.id ===
reciterAtStart.id
) {
setSurahDownloadState({
downloaded:
currentCount,
total:
ayahCountAtStart,
downloading: true,
paused: false,
error: false
});
}
}

const finalCount =
await getDownloadedAyahCount(
reciterAtStart.id,
surahNumberAtStart,
ayahCountAtStart
);

if (
session ===
downloadSessionRef.current &&
selectedReciter.id ===
reciterAtStart.id
) {
setSurahDownloadState({
downloaded:
finalCount,
total:
ayahCountAtStart,
downloading: false,
paused: false,
error: false
});

navigator.vibrate?.([
40,
60,
40
 ]);
}
} catch (error: any) {
if (
error?.name ===
'AbortError'
) {
let current = 0;

if (
reciterAtStart.audioSource ===
'mp3quran'
) {
const downloaded =
await isSurahAudioDownloaded(
reciterAtStart.id,
surahNumberAtStart
).catch(
() => false
);

current =
downloaded
? ayahCountAtStart
: 0;
} else {
current =
await getDownloadedAyahCount(
reciterAtStart.id,
surahNumberAtStart,
ayahCountAtStart
).catch(
() => 0
);
}

if (
session ===
downloadSessionRef.current &&
selectedReciter.id ===
reciterAtStart.id
) {
setSurahDownloadState({
downloaded:
current,
total:
ayahCountAtStart,
downloading:
false,
paused: true,
error: false
});
}
} else {
console.error(
'Audio download error:',
error
);

let current = 0;

if (
reciterAtStart.audioSource ===
'mp3quran'
) {
const downloaded =
await isSurahAudioDownloaded(
reciterAtStart.id,
surahNumberAtStart
).catch(
() => false
);

current =
downloaded
? ayahCountAtStart
: 0;
} else {
current =
await getDownloadedAyahCount(
reciterAtStart.id,
surahNumberAtStart,
ayahCountAtStart
).catch(
() => 0
);
}

if (
session ===
downloadSessionRef.current &&
selectedReciter.id ===
reciterAtStart.id
) {
setSurahDownloadState({
downloaded:
current,
total:
ayahCountAtStart,
downloading:
false,
paused: false,
error: true
});

alert(
'دابەزاندنی دەنگ سەرکەوتوو نەبوو.\n\nلەوانەیە سەرچاوەی دەنگی ئەم قارییە بەردەست نەبێت یان ڕێگە بە دابەزاندنی ڕاستەوخۆ نەدات.'
);
}
}
} finally {
if (
downloadAbortControllerRef.current ===
controller
) {
downloadAbortControllerRef.current =
null;
}
}
};

/* =========================================================
PAUSE
========================================================= */

const pauseCurrentSurahDownload =
() => {
downloadAbortControllerRef.current?.abort();
};

/* =========================================================
DELETE
========================================================= */

const removeCurrentSurahAudio =
async () => {
if (
!currentSurahNumber ||
!currentSurahAyahCount
) {
return;
}

if (
surahDownloadState.downloading
) {
downloadAbortControllerRef.current?.abort();
}

const confirmed =
window.confirm(
appLang === 'ar'
? 'هل تريد حذف صوت هذه السورة؟'
: appLang === 'en'
? 'Delete downloaded audio for this surah?'
: 'دڵنیایت دەتەوێت دەنگی ئەم سورەتە بسڕیتەوە؟'
);

if (!confirmed) {
return;
}

try {
await deleteSurahAudio(
selectedReciter.id,
currentSurahNumber,
currentSurahAyahCount
);

downloadSessionRef.current++;

setSurahDownloadState({
downloaded: 0,
total:
currentSurahAyahCount,
downloading: false,
paused: false,
error: false
});
} catch (error) {
console.error(
'Delete audio error:',
error
);

alert(
'سڕینەوەی دەنگ سەرکەوتوو نەبوو.'
);
}
};

/* =========================================================
DOWNLOAD PROGRESS
========================================================= */

const downloadProgress =
surahDownloadState.total >
0
? Math.round(
(surahDownloadState.downloaded /
surahDownloadState.total) *
100
)
: 0;

const isSurahDownloadComplete =
surahDownloadState.total >
0 &&
surahDownloadState.downloaded >=
surahDownloadState.total;

/* =========================================================
DOWNLOAD UI
========================================================= */

const renderCurrentSurahDownload =
() => {
if (
!currentSurah ||
!currentSurahNumber ||
!currentSurahAyahCount
) {
return null;
}

if (
surahDownloadState.downloading
) {
return (
<div className="flex items-center gap-2">
<button
type="button"
onClick={e => {
e.stopPropagation();

pauseCurrentSurahDownload();
}}
className="h-9 px-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.97] transition-all"
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
surahDownloadState.downloaded
}
/
{
surahDownloadState.total
}
</div>
</div>
</div>
);
}

if (
isSurahDownloadComplete
) {
return (
<div className="flex items-center gap-1.5">
<div className="h-9 px-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center gap-1.5">
<Check className="w-3.5 h-3.5" />

<span className="text-[9px] font-bold">
دابەزێندراوە
</span>
</div>

<button
type="button"
onClick={e => {
e.stopPropagation();

void removeCurrentSurahAudio();
}}
className="h-9 px-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.97] transition-all"
>
<Trash2 className="w-3.5 h-3.5" />

<span className="text-[9px] font-bold">
سڕینەوە
</span>
</button>
</div>
);
}

if (
surahDownloadState.downloaded >
0
) {
return (
<div className="flex items-center gap-2">
<button
type="button"
onClick={e => {
e.stopPropagation();

void downloadCurrentSurah();
}}
className="h-9 px-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.97] transition-all"
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
surahDownloadState.downloaded
}
/
{
surahDownloadState.total
}
</div>
</div>
</div>
);
}

return (
<button
type="button"
onClick={e => {
e.stopPropagation();

void downloadCurrentSurah();
}}
className="h-9 px-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.97] transition-all"
>
<Download className="w-3.5 h-3.5" />

<span className="text-[9px] font-bold">
دابەزاندن
</span>
</button>
);
};

/* =========================================================
PLAY SINGLE AYAH
========================================================= */

const playAyahAudio =
async (
a: any
) => {
const key =
ayahKey(a);

if (
playingAyahKey === key
) {
stopAudioCompletely();
return;
}

const requestId =
++audioRequestIdRef.current;

activeSegmentRef.current =
null;

pageAudioIndexRef.current =
-1;

setPageAudioIndex(-1);

const ayahBox =
ayahBoxes.find(
b =>
b.s ===
a.surahNumber &&
b.a ===
a.numberInSurah
);

if (ayahBox) {
const topPct =
(ayahBox.y0 /
AYAH_CANVAS_HEIGHT) *
100;

setHighlightedAyah({
ayah: a,
topPercent:
topPct
});
}

if (
!audioRef.current
) {
return;
}

audioRef.current.pause();
clearAudioObjectUrl();

try {
const source =
await getAudioSource(
selectedReciter,
a.surahNumber,
a.numberInSurah
);

if (
requestId !==
audioRequestIdRef.current
) {
return;
}

const audio =
audioRef.current;

audio.src =
source.url;

activeSegmentRef.current =
{
endTime:
source.endTime ??
null,
requestId
};

/*
* MP3Quran segment.
*/
if (
source.startTime !==
undefined
) {
await new Promise<void>(
(
resolve,
reject
) => {
const audio =
audioRef.current;

if (!audio) {
reject(
new Error(
'Audio element نەدۆزرایەوە'
)
);

return;
}

if (
audio.readyState >=
1
) {
resolve();
return;
}

const onLoaded =
() => {
cleanup();
resolve();
};

const onError =
() => {
cleanup();

reject(
new Error(
'Audio metadata load failed'
)
);
};

const cleanup =
() => {
audio.removeEventListener(
'loadedmetadata',
onLoaded
);

audio.removeEventListener(
'error',
onError
);
};

audio.addEventListener(
'loadedmetadata',
onLoaded
);

audio.addEventListener(
'error',
onError
);
}
);

if (
requestId !==
audioRequestIdRef.current
) {
return;
}

audio.currentTime =
source.startTime;
}

setPlayingAyahKey(
key
);

await audio.play();

if (
requestId ===
audioRequestIdRef.current
) {
setIsPlayingAudio(true);
}
} catch (error) {
console.error(
'Ayah audio error:',
{
reciter:
selectedReciter,
surah:
a.surahNumber,
ayah:
a.numberInSurah,
error
}
);

if (
requestId ===
audioRequestIdRef.current
) {
setPlayingAyahKey(
null
);

setIsPlayingAudio(
false
);

activeSegmentRef.current =
null;
}
}
};

/* =========================================================
PAGE AUDIO
========================================================= */

const playPageAyahAtIndex =
async (
index: number
) => {
if (
index < 0 ||
index >=
pageAyahsData.length
) {
pageAudioIndexRef.current =
-1;

setPageAudioIndex(-1);

setPlayingAyahKey(
null
);

setIsPlayingAudio(
false
);

setHighlightedAyah(
null
);

activeSegmentRef.current =
null;

return;
}

const ayah =
pageAyahsData[index];

if (!ayah) {
return;
}

const requestId =
++audioRequestIdRef.current;

activeSegmentRef.current =
null;

pageAudioIndexRef.current =
index;

setPageAudioIndex(
index
);

const key =
ayahKey(ayah);

setPlayingAyahKey(
key
);

const ayahBox =
ayahBoxes.find(
b =>
b.s ===
ayah.surahNumber &&
b.a ===
ayah.numberInSurah
);

if (ayahBox) {
const topPct =
(ayahBox.y0 /
AYAH_CANVAS_HEIGHT) *
100;

setHighlightedAyah({
ayah,
topPercent:
topPct
});
}

if (
!audioRef.current
) {
return;
}

audioRef.current.pause();
clearAudioObjectUrl();

try {
const source =
await getAudioSource(
selectedReciter,
ayah.surahNumber,
ayah.numberInSurah
);

if (
requestId !==
audioRequestIdRef.current
) {
return;
}

const audio =
audioRef.current;

audio.src =
source.url;

activeSegmentRef.current =
{
endTime:
source.endTime ??
null,
requestId
};

if (
source.startTime !==
undefined
) {
await new Promise<void>(
(
resolve,
reject
) => {
const audio =
audioRef.current;

if (!audio) {
reject(
new Error(
'Audio element نەدۆزرایەوە'
)
);

return;
}

if (
audio.readyState >=
1
) {
resolve();
return;
}

const onLoaded =
() => {
cleanup();
resolve();
};

const onError =
() => {
cleanup();

reject(
new Error(
'Audio metadata load failed'
)
);
};

const cleanup =
() => {
audio.removeEventListener(
'loadedmetadata',
onLoaded
);

audio.removeEventListener(
'error',
onError
);
};

audio.addEventListener(
'loadedmetadata',
onLoaded
);

audio.addEventListener(
'error',
onError
);
}
);

if (
requestId !==
audioRequestIdRef.current
) {
return;
}

audio.currentTime =
source.startTime;
}

await audio.play();

if (
requestId ===
audioRequestIdRef.current &&
pageAudioIndexRef.current ===
index
) {
setIsPlayingAudio(true);
}
} catch (error) {
console.error(
'Page audio error:',
{
reciter:
selectedReciter,
surah:
ayah.surahNumber,
ayah:
ayah.numberInSurah,
error
}
);

if (
requestId ===
audioRequestIdRef.current
) {
setIsPlayingAudio(
false
);

setPlayingAyahKey(
null
);

activeSegmentRef.current =
null;
}
}
};

/* =========================================================
SHARE
========================================================= */

const shareAyah = async (
a: any
) => {
const text =
``${a.arabic}\n\n+( {a.numberInSurah})\n\n+${a.tafsir};

try {
if (
navigator.share
) {
await navigator.share({
text
});
} else {
await navigator.clipboard.writeText(
text
);
}
} catch {
// Cancelled
}
};

/* =========================================================
LONG PRESS
========================================================= */

const startLongPress = (
boxKey: string,
ayah: any,
topPercent: number
) => {
setPressingBox(
boxKey
);

if (
longPressTimer.current
) {
clearTimeout(
longPressTimer.current
);
}

longPressTimer.current =
setTimeout(() => {
setHighlightedAyah({
ayah,
topPercent
});

setPressingBox(
null
);

setTafsirSheetOpen(
false
);

navigator.vibrate?.(40);
}, LONG_PRESS_MS);
};

const cancelLongPress =
() => {
if (
longPressTimer.current
) {
clearTimeout(
longPressTimer.current
);

longPressTimer.current =
null;
}

setPressingBox(
null
);
};

const closeHighlight =
() => {
setHighlightedAyah(
null
);

setTafsirSheetOpen(
false
);
};

/* =========================================================
SCROLL
========================================================= */

const scrollContainerRef =
useRef<HTMLDivElement | null>(
null
);

const isUpdating =
useRef(false);

const pageRefs =
useRef<
Record<
number,
HTMLDivElement | null
>
>({});

const isFirstScroll =
useRef(true);

const scrollInitiatedByUser =
useRef(false);

const isBookmarked =
bookmarks.includes(
currentPage
);

const currentJuz =
Math.ceil(
currentPage / 20
);

/* =========================================================
PAGE DATA
========================================================= */

useEffect(() => {
let cancelled =
false;

async function loadPageVerses() {
setLoadingTafsir(
true
);

setAyahApiError(
null
);

setTafsirApiError(
null
);

let arabicAyahs:
any[] = [];

try {
const resAr =
await fetch(
https://api.alquran.cloud/v1/page/${currentPage}/quran-uthmani`
);

const dataAr =
await resAr.json();

if (
dataAr.code ===
200 &&
dataAr.data?.ayahs
) {
arabicAyahs =
dataAr.data.ayahs;
} else {
setAyahApiError(
arabic code:${dataAr.code}`
);
}
} catch (e: any) {
setAyahApiError(
e?.message ||
'arabic fetch failed'
);
}

let tafsirAyahs:
any[] = [];

const selectedEdition =
getTafsirApiEdition(
selectedTafsir
);

if (
selectedEdition
) {
try {
const resTf =
await fetch(
https://api.alquran.cloud/v1/page/${currentPage}/${selectedEdition}
);

const dataTf =
await resTf.json();

if (
dataTf.code ===
200 &&
dataTf.data?.ayahs
) {
tafsirAyahs =
dataTf.data.ayahs;
} else {
setTafsirApiError(
tafsir code:${dataTf.code}`
);
}
} catch (e: any) {
setTafsirApiError(
e?.message ||
'tafsir fetch failed'
);
}
} else {
setTafsirApiError(
'ئەم تەفسیرە هێشتا سەرچاوەی API ـی ئەپەکە نییە.'
);
}

if (cancelled) {
return;
}

if (
arabicAyahs.length >
0
) {
const combined =
arabicAyahs.map(
(a: any) => {
const matchingTafsir =
tafsirAyahs.find(
(t: any) =>
t.surah?.number ===
a.surah.number &&
t.numberInSurah ===
a.numberInSurah
);

return {
surahNumber:
a.surah.number,
numberInSurah:
a.numberInSurah,
arabic:
a.text,
tafsir:
matchingTafsir?.text ||
(selectedEdition
? 'دەقی ئەم تەفسیرە بۆ ئەم ئایەتە بەردەست نییە.'
: 'ئەم تەفسیرە هێشتا بە سەرچاوەی API ـی ئەپەکە نەبەستراوەتەوە.')
};
}
);

setPageAyahsData(
combined
);
} else {
setPageAyahsData(
[]
);
}

setLoadingTafsir(
false
);
}

loadPageVerses();

return () => {
cancelled = true;
};
}, [
currentPage,
selectedTafsir.id
 ]);

/* =========================================================
UPDATE HIGHLIGHT
========================================================= */

useEffect(() => {
if (
!highlightedAyah
) {
return;
}

const updatedAyah =
pageAyahsData.find(
a =>
a.surahNumber ===
highlightedAyah.ayah
.surahNumber &&
a.numberInSurah ===
highlightedAyah.ayah
.numberInSurah
);

if (
updatedAyah
) {
setHighlightedAyah(
previous =>
previous
? {
...previous,
ayah:
updatedAyah
}
: null
);
}
}, [
pageAyahsData
 ]);

/* =========================================================
PAGE AUDIO RESET
========================================================= */

useEffect(() => {
stopAudioCompletely();

closeHighlight();
cancelLongPress();
}, [
currentPage
 ]);

/* =========================================================
RECITER RESET
========================================================= */

useEffect(() => {
stopAudioCompletely();

/*
* Timing cache stays available,
* but the currently playing source
* must always stop.
*/
}, [
selectedReciter.id
 ]);

/* =========================================================
CLEANUP
========================================================= */

useEffect(() => {
return () => {
audioRequestIdRef.current++;

activeSegmentRef.current =
null;

if (
audioRef.current
) {
try {
audioRef.current.pause();
audioRef.current.removeAttribute(
'src'
);
audioRef.current.load();
} catch {
// Ignore
}
}

clearAudioObjectUrl();

downloadAbortControllerRef.current?.abort();

if (
longPressTimer.current
) {
clearTimeout(
longPressTimer.current
);
}
};
}, []);

/* =========================================================
SCROLL TO CURRENT PAGE
========================================================= */

useEffect(() => {
if (
scrollInitiatedByUser.current
) {
scrollInitiatedByUser.current =
false;

return;
}

const scrollToTarget =
() => {
const el =
pageRefs.current[
currentPage
 ];

if (el) {
isUpdating.current =
true;

el.scrollIntoView({
behavior:
isFirstScroll.current
? 'auto'
: 'smooth',
inline: 'center',
block: 'nearest'
});

isFirstScroll.current =
false;

setTimeout(
() => {
isUpdating.current =
false;
},
400
);
}
};

if (
isFirstScroll.current
) {
const raf1 =
requestAnimationFrame(
() => {
requestAnimationFrame(
() => {
scrollToTarget();

setTimeout(
() => {
const el =
pageRefs.current[
currentPage
 ];

const container =
scrollContainerRef.current;

if (
el &&
container
) {
const elRect =
el.getBoundingClientRect();

const containerRect =
container.getBoundingClientRect();

const isVisible =
elRect.left >=
containerRect.left -
5 &&
elRect.right <=
containerRect.
