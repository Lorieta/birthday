export interface ImportedMedia {
  id: string;
  kind: "image" | "video";
  src: string;
  poster?: string;
  width: number;
  height: number;
  duration?: number;
  alt: string;
}

export const importedPhotos: ImportedMedia[] = [];

export const importedVideos: ImportedMedia[] = [];
