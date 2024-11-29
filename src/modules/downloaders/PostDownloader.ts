import path from "path";
import { IMedia, IPost } from "src/interfaces";
import ThreadRequest from "src/modules/ThreadRequest";
import CacheCursor from "src/modules/utils/CacheCursor";
import DownloadUtils from "src/modules/utils/DownloadUtils";
import FileUtils from "src/modules/utils/FileUtils";
import PathUtils from "src/modules/utils/PathUtils";

class PostDownloader {
  private threadRequest: ThreadRequest;

  constructor(threadRequest: ThreadRequest) {
    this.threadRequest = threadRequest;
  }

  private writePostStatisticToCsv = async (
    username: string,
    data: IPost[],
    totalFetchedPosts: number
  ) => {
    const { POSTS_SAVED_DIR } = PathUtils.getSavedUserMediaDirPath(username);
    const formattedData = data.map((item, index) => ({
      ordinal_number: index + totalFetchedPosts + 1,
      post_url: `https://www.threads.net/@${username}/post/${item.code}`,
      taken_at: item.takenAt,
      total_media: item.totalMedia,
      video_count: item.videoCount,
      image_count: item.imageCount,
      audio_count: item.audioCount,
      like_count: item.likeCount,
      comment_count: item.commentCount,
    }));
    const fileName = "posts_statistic.csv";
    FileUtils.appendUserDataToCsv(
      path.resolve(POSTS_SAVED_DIR, fileName),
      formattedData
    );
  };

  private downloadUserPostsMedia = async (
    username: string,
    postsData: IPost[],
    totalFetchedPosts: number
  ) => {
    console.log(`🚀 Start downloading posts media...`);
    const { POSTS_SAVED_DIR } = PathUtils.getSavedUserMediaDirPath(username);
    await DownloadUtils.downloadByBatch(
      postsData,
      async (post: IPost, index: number) => {
        const postDir = path.resolve(
          POSTS_SAVED_DIR,
          `post_${index + totalFetchedPosts}`
        );

        await DownloadUtils.downloadByBatch(
          post.videos,
          async (video: IMedia) => {
            await DownloadUtils.downloadMedia(
              video.uri,
              path.resolve(postDir, `${video.id}.mp4`)
            );
          }
        );
        await DownloadUtils.downloadByBatch(
          post.images,
          async (image: IMedia) => {
            await DownloadUtils.downloadMedia(
              image.uri,
              path.resolve(postDir, `${image.id}.jpg`)
            );
          }
        );
        await DownloadUtils.downloadByBatch(
          post.audios,
          async (audio: IMedia) => {
            await DownloadUtils.downloadMedia(
              audio.uri,
              path.resolve(postDir, `${audio.id}.mp3`)
            );
          }
        );
      },
      true
    );
    console.log(
      `✅ Download posts media successfully and saved to ${POSTS_SAVED_DIR}`
    );
  };

  downloadAllUserPosts = async (
    username: string,
    writeStatisticFile: boolean = true,
    downloadMedia: boolean = true,
    limit: number = Infinity
  ) => {
    if (limit !== Infinity && limit % 4 !== 0) {
      throw new Error("❌ Limit must be a multiple of 4");
    }
    const cursor = CacheCursor.getCacheCursor(username, "POSTS");
    const startCursor = cursor?.nextCursor || "";
    const totalFetchedPosts = cursor?.totalFetchedItems || 0;
    const postsData = await this.threadRequest.getUserPosts(
      username,
      startCursor,
      totalFetchedPosts,
      limit
    );
    if (!postsData.length) {
      console.log(`👀 No posts found for ${username}`);
      return;
    }
    if (writeStatisticFile) {
      this.writePostStatisticToCsv(username, postsData, totalFetchedPosts);
    }
    if (downloadMedia) {
      await this.downloadUserPostsMedia(username, postsData, totalFetchedPosts);
    }
  };
}

export default PostDownloader;
