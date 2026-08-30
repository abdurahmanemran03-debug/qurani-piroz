export interface AyahCoordinate {
  surah: number;
  ayah: number;
  word: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

export const ayahCoordinates: Record<number, AyahCoordinate[]> = {};
