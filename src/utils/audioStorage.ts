const DB_NAME = 'quran_audio_db';
const STORE_NAME = 'audio';
const DB_VERSION = 2;

type AudioRecord = {
  key: string;
  blob: Blob;
  reciterId: string;
  surahNumber: number;
  ayahNumber?: number;
  type: 'ayah' | 'surah';
  createdAt: number;
};

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(
      DB_NAME,
      DB_VERSION
    );

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, {
          keyPath: 'key'
        });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

/*
|--------------------------------------------------------------------------
| AYAH KEY
|--------------------------------------------------------------------------
*/

export function makeAudioKey(
  reciterId: string,
  surahNumber: number,
  ayahNumber: number
) {
  return `ayah::${reciterId}_${surahNumber}_${ayahNumber}`;
}

/*
|--------------------------------------------------------------------------
| SURAH KEY
|--------------------------------------------------------------------------
*/

export function makeSurahAudioKey(
  reciterId: string,
  surahNumber: number
) {
  return `surah::${reciterId}_${surahNumber}`;
}

/*
|--------------------------------------------------------------------------
| SAVE AYAH AUDIO
|--------------------------------------------------------------------------
*/

export async function saveAyahAudio(
  reciterId: string,
  surahNumber: number,
  ayahNumber: number,
  blob: Blob
) {
  const db = await openDB();

  const record: AudioRecord = {
    key: makeAudioKey(
      reciterId,
      surahNumber,
      ayahNumber
    ),
    blob,
    reciterId,
    surahNumber,
    ayahNumber,
    type: 'ayah',
    createdAt: Date.now()
  };

  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(
      STORE_NAME,
      'readwrite'
    );

    tx.objectStore(STORE_NAME).put(record);

    tx.oncomplete = () => {
      db.close();
      resolve();
    };

    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };

    tx.onabort = () => {
      db.close();
      reject(tx.error);
    };
  });
}

/*
|--------------------------------------------------------------------------
| GET AYAH AUDIO
|--------------------------------------------------------------------------
*/

export async function getAyahAudio(
  reciterId: string,
  surahNumber: number,
  ayahNumber: number
): Promise<Blob | null> {
  const db = await openDB();

  const key = makeAudioKey(
    reciterId,
    surahNumber,
    ayahNumber
  );

  return new Promise((resolve, reject) => {
    const tx = db.transaction(
      STORE_NAME,
      'readonly'
    );

    const request =
      tx.objectStore(STORE_NAME).get(key);

    request.onsuccess = () => {
      const record =
        request.result as
          | AudioRecord
          | undefined;

      db.close();

      resolve(
        record?.type === 'ayah'
          ? record.blob
          : null
      );
    };

    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

/*
|--------------------------------------------------------------------------
| IS AYAH DOWNLOADED
|--------------------------------------------------------------------------
*/

export async function isAyahDownloaded(
  reciterId: string,
  surahNumber: number,
  ayahNumber: number
): Promise<boolean> {
  const blob =
    await getAyahAudio(
      reciterId,
      surahNumber,
      ayahNumber
    );

  return !!blob;
}

/*
|--------------------------------------------------------------------------
| SAVE WHOLE SURAH
|--------------------------------------------------------------------------
*/

export async function saveSurahAudio(
  reciterId: string,
  surahNumber: number,
  blob: Blob
) {
  const db = await openDB();

  const record: AudioRecord = {
    key: makeSurahAudioKey(
      reciterId,
      surahNumber
    ),
    blob,
    reciterId,
    surahNumber,
    type: 'surah',
    createdAt: Date.now()
  };

  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(
      STORE_NAME,
      'readwrite'
    );

    tx.objectStore(STORE_NAME).put(record);

    tx.oncomplete = () => {
      db.close();
      resolve();
    };

    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };

    tx.onabort = () => {
      db.close();
      reject(tx.error);
    };
  });
}

/*
|--------------------------------------------------------------------------
| GET WHOLE SURAH
|--------------------------------------------------------------------------
*/

export async function getSurahAudio(
  reciterId: string,
  surahNumber: number
): Promise<Blob | null> {
  const db = await openDB();

  const key =
    makeSurahAudioKey(
      reciterId,
      surahNumber
    );

  return new Promise((resolve, reject) => {
    const tx = db.transaction(
      STORE_NAME,
      'readonly'
    );

    const request =
      tx.objectStore(STORE_NAME).get(key);

    request.onsuccess = () => {
      const record =
        request.result as
          | AudioRecord
          | undefined;

      db.close();

      resolve(
        record?.type === 'surah'
          ? record.blob
          : null
      );
    };

    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

/*
|--------------------------------------------------------------------------
| IS WHOLE SURAH DOWNLOADED
|--------------------------------------------------------------------------
*/

export async function isSurahAudioDownloaded(
  reciterId: string,
  surahNumber: number
): Promise<boolean> {
  const blob =
    await getSurahAudio(
      reciterId,
      surahNumber
    );

  return !!blob;
}

/*
|--------------------------------------------------------------------------
| COUNT DOWNLOADED AYAHS
|--------------------------------------------------------------------------
*/

export async function getDownloadedAyahCount(
  reciterId: string,
  surahNumber: number,
  ayahCount: number
): Promise<number> {
  if (ayahCount <= 0) {
    return 0;
  }

  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(
      STORE_NAME,
      'readonly'
    );

    const store =
      tx.objectStore(STORE_NAME);

    let checked = 0;
    let count = 0;
    let finished = false;

    const finish = (
      value: number
    ) => {
      if (finished) {
        return;
      }

      finished = true;
      db.close();
      resolve(value);
    };

    for (
      let ayah = 1;
      ayah <= ayahCount;
      ayah++
    ) {
      const request =
        store.get(
          makeAudioKey(
            reciterId,
            surahNumber,
            ayah
          )
        );

      request.onsuccess = () => {
        checked++;

        const record =
          request.result as
            | AudioRecord
            | undefined;

        if (
          record &&
          record.type === 'ayah' &&
          record.blob
        ) {
          count++;
        }

        if (
          checked ===
          ayahCount
        ) {
          finish(count);
        }
      };

      request.onerror = () => {
        if (!finished) {
          finished = true;
          db.close();
          reject(
            request.error
          );
        }
      };
    }

    tx.onerror = () => {
      if (!finished) {
        finished = true;
        db.close();
        reject(tx.error);
      }
    };
  });
}

/*
|--------------------------------------------------------------------------
| DELETE SURAH AUDIO
|
| Deletes:
| 1. Whole-surah MP3
| 2. EveryAyah individual MP3 files
|--------------------------------------------------------------------------
*/

export async function deleteSurahAudio(
  reciterId: string,
  surahNumber: number,
  ayahCount: number
) {
  const db = await openDB();

  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(
      STORE_NAME,
      'readwrite'
    );

    const store =
      tx.objectStore(STORE_NAME);

    /*
     * Delete whole-surah file
     */
    store.delete(
      makeSurahAudioKey(
        reciterId,
        surahNumber
      )
    );

    /*
     * Delete EveryAyah files
     */
    for (
      let ayah = 1;
      ayah <= ayahCount;
      ayah++
    ) {
      store.delete(
        makeAudioKey(
          reciterId,
          surahNumber,
          ayah
        )
      );
    }

    tx.oncomplete = () => {
      db.close();
      resolve();
    };

    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };

    tx.onabort = () => {
      db.close();
      reject(tx.error);
    };
  });
}

/*
|--------------------------------------------------------------------------
| IS EVERYAYAH SURAH COMPLETE
|--------------------------------------------------------------------------
*/

export async function isSurahDownloaded(
  reciterId: string,
  surahNumber: number,
  ayahCount: number
): Promise<boolean> {
  const count =
    await getDownloadedAyahCount(
      reciterId,
      surahNumber,
      ayahCount
    );

  return (
    count === ayahCount
  );
}
