export interface ICachedCursor {
  totalFetchedItems: number;
  nextCursor: string;
}

export interface IMedia {
  id: string;
  uri: string;
}

export interface IPost {
  id: number;
  code: string;
  title?: string;
  takenAt: string;
  totalMedia: number;
  videoCount: number;
  audioCount: number;
  imageCount: number;
  likeCount: number | null;
  commentCount: number;
  videos: IMedia[];
  images: IMedia[];
  audios: IMedia[];
}
