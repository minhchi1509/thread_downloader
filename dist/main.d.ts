interface IMedia {
    id: string;
    uri: string;
}
interface IPost {
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

declare class ThreadRequest {
    private axiosInstance;
    constructor(cookies: string);
    getThreadIdByUsername: (username: string) => Promise<any>;
    getIgAppId: () => Promise<string>;
    getUserPosts: (username: string, startCursor: string, totalFetchedPosts: number, limit: number) => Promise<IPost[]>;
}

declare class PostDownloader {
    private threadRequest;
    constructor(threadRequest: ThreadRequest);
    private writePostStatisticToCsv;
    private downloadUserPostsMedia;
    downloadAllUserPosts: (username: string, writeStatisticFile?: boolean, downloadMedia?: boolean, limit?: number) => Promise<void>;
}

declare class ThreadDownloader {
    private threadRequest;
    post: PostDownloader;
    constructor(cookies: string);
}

export { ThreadDownloader };
