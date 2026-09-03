const DB_NAME = 'quran_audio_db';
const STORE_NAME = 'audio';
const DB_VERSION = 1;

type AudioRecord = {
  key: string;
  blob: Blob;
  reciterId: string;
  surahNumber: number;
  ayahNumber: number;
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

export function makeAudioKey(
  reciterId: string,
  surahNumber: number,
  ayahNumber: number
) {
  return `${reciterId}_${surahNumber}_${ayahNumber}`;
}

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
  });
}

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
        record?.blob ?? null
      );
    };

    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

export async function isAyahDownloaded(
  reciterId: string,
  surahNumber: number,
  ayahNumber: number
): Promise<boolean> {
  const blob = await getAyahAudio(
    reciterId,
    surahNumber,
    ayahNumber
  );

  return !!blob;
}

export async function getDownloadedAyahCount(
  reciterId: string,
  surahNumber: number,
  ayahCount: number
): Promise<number> {
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

    if (ayahCount === 0) {
      db.close();
      resolve(0);
      return;
    }

    for (
      let ayah = 1;
      ayah <= ayahCount;
      ayah++
    ) {
      const request = store.get(
        makeAudioKey(
          reciterId,
          surahNumber,
          ayah
        )
      );

      request.onsuccess = () => {
        checked++;

        if (request.result) {
          count++;
        }

        if (checked === ayahCount) {
          db.close();
          resolve(count);
        }
      };

      request.onerror = () => {
        db.close();
        reject(request.error);
      };
    }
  });
}

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
  });
}

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

  return count === ayahCount;
}
