// src/modules/downloaders/PostDownloader.ts
import path5 from "path";

// src/modules/utils/CacheCursor.ts
import path2 from "path";

// src/modules/utils/FileUtils.ts
import path from "path";
import fs from "fs";
import { parse, write } from "fast-csv";
var _FileUtils = class _FileUtils {
};
_FileUtils.writeToFile = (absolutePath, content) => {
  const dir = path.dirname(absolutePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(absolutePath, content);
};
_FileUtils.readObjectFromJsonFile = (absolutePath) => {
  if (!fs.existsSync(absolutePath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(absolutePath, "utf-8"));
};
_FileUtils.readCSV = (filePath) => new Promise((resolve, reject) => {
  const allData = [];
  fs.createReadStream(filePath).pipe(parse({ headers: true })).on("data", (row) => {
    allData.push(row);
  }).on("end", () => {
    resolve(allData);
  }).on("error", (error) => {
    reject(error);
  });
});
_FileUtils.writeCSV = async (filePath, data, includeHeader = true) => {
  const writeStream = fs.createWriteStream(filePath);
  return new Promise((resolve, reject) => {
    write(data, { headers: includeHeader }).pipe(writeStream).on("finish", resolve).on("error", reject);
  });
};
_FileUtils.appendUserDataToCsv = async (filePath, data) => {
  if (fs.existsSync(filePath)) {
    const oldData = await _FileUtils.readCSV(filePath);
    const newData = [...oldData, ...data];
    await _FileUtils.writeCSV(filePath, newData);
  } else {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    await _FileUtils.writeCSV(filePath, data);
  }
};
var FileUtils = _FileUtils;
var FileUtils_default = FileUtils;

// src/modules/utils/CacheCursor.ts
var _CacheCursor = class _CacheCursor {
};
_CacheCursor.getSavedCacheCursorPath = (username) => {
  return {
    POSTS_CACHE_CURSOR_PATH: path2.resolve(
      "cache_cursor",
      username,
      "posts.json"
    )
  };
};
_CacheCursor.writeCacheCursor = (username, mediaType, cursor) => {
  const { POSTS_CACHE_CURSOR_PATH } = _CacheCursor.getSavedCacheCursorPath(username);
  const mappedPath = {
    POSTS: POSTS_CACHE_CURSOR_PATH
  };
  FileUtils_default.writeToFile(
    mappedPath[mediaType],
    JSON.stringify(cursor, null, 2)
  );
};
_CacheCursor.getCacheCursor = (username, mediaType) => {
  const { POSTS_CACHE_CURSOR_PATH } = _CacheCursor.getSavedCacheCursorPath(username);
  const mappedPath = {
    POSTS: POSTS_CACHE_CURSOR_PATH
  };
  return FileUtils_default.readObjectFromJsonFile(
    mappedPath[mediaType]
  );
};
var CacheCursor = _CacheCursor;
var CacheCursor_default = CacheCursor;

// src/modules/utils/DownloadUtils.ts
import axios from "axios";
import path3 from "path";
import fs2 from "fs";
var DownloadUtils = class {
};
DownloadUtils.downloadByBatch = async (data, downloadFunction, isLogProcess = false, batchSize = 5) => {
  for (let i = 0; i < data.length; i += batchSize) {
    const from = i;
    const to = Math.min(i + batchSize, data.length);
    const sliceData = data.slice(from, to);
    await Promise.all(
      sliceData.map(
        (item, index) => downloadFunction(item, from + index + 1)
      )
    );
    if (isLogProcess) {
      console.log(`\u{1F525}Downloaded ${to}/${data.length} items`);
    }
  }
};
DownloadUtils.downloadMedia = async (mediaDownloadUrl, outputPath) => {
  const dir = path3.dirname(outputPath);
  if (!fs2.existsSync(dir)) {
    fs2.mkdirSync(dir, { recursive: true });
  }
  const writer = fs2.createWriteStream(outputPath);
  try {
    const response = await axios.get(mediaDownloadUrl, {
      responseType: "stream"
    });
    response.data.pipe(writer);
    return new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });
  } catch (error) {
    console.error("\u274C Error downloading file:", error);
    writer.close();
  }
};
var DownloadUtils_default = DownloadUtils;

// src/modules/utils/PathUtils.ts
import { existsSync } from "fs";
import path4 from "path";
var PathUtils = class {
};
PathUtils.getLocalDownloadDir = () => {
  const LOCAL_DOWNLOAD_DIR = path4.resolve(
    process.env.USERPROFILE || "",
    "Downloads"
  );
  if (!existsSync(LOCAL_DOWNLOAD_DIR)) {
    throw new Error("\u274C Cannot find the download directory on your system");
  }
  return LOCAL_DOWNLOAD_DIR;
};
PathUtils.getSavedUserMediaDirPath = (username) => {
  const LOCAL_DOWNLOAD_DIR = path4.resolve(
    process.env.USERPROFILE || "",
    "Downloads"
  );
  if (!existsSync(LOCAL_DOWNLOAD_DIR)) {
    throw new Error("\u274C Cannot find the download directory on your system");
  }
  const BASE_DIR = path4.resolve(
    LOCAL_DOWNLOAD_DIR,
    "thread_downloader",
    username
  );
  return {
    POSTS_SAVED_DIR: path4.resolve(BASE_DIR, "posts")
  };
};
var PathUtils_default = PathUtils;

// src/modules/downloaders/PostDownloader.ts
var PostDownloader = class {
  constructor(threadRequest) {
    this.writePostStatisticToCsv = async (username, data, totalFetchedPosts) => {
      const { POSTS_SAVED_DIR } = PathUtils_default.getSavedUserMediaDirPath(username);
      const formattedData = data.map((item, index) => ({
        ordinal_number: index + totalFetchedPosts + 1,
        post_url: `https://www.threads.net/@${username}/post/${item.code}`,
        taken_at: item.takenAt,
        total_media: item.totalMedia,
        video_count: item.videoCount,
        image_count: item.imageCount,
        audio_count: item.audioCount,
        like_count: item.likeCount,
        comment_count: item.commentCount
      }));
      const fileName = "posts_statistic.csv";
      FileUtils_default.appendUserDataToCsv(
        path5.resolve(POSTS_SAVED_DIR, fileName),
        formattedData
      );
    };
    this.downloadUserPostsMedia = async (username, postsData, totalFetchedPosts) => {
      console.log(`\u{1F680} Start downloading posts media...`);
      const { POSTS_SAVED_DIR } = PathUtils_default.getSavedUserMediaDirPath(username);
      await DownloadUtils_default.downloadByBatch(
        postsData,
        async (post, index) => {
          const postDir = path5.resolve(
            POSTS_SAVED_DIR,
            `post_${index + totalFetchedPosts}`
          );
          await DownloadUtils_default.downloadByBatch(
            post.videos,
            async (video) => {
              await DownloadUtils_default.downloadMedia(
                video.uri,
                path5.resolve(postDir, `${video.id}.mp4`)
              );
            }
          );
          await DownloadUtils_default.downloadByBatch(
            post.images,
            async (image) => {
              await DownloadUtils_default.downloadMedia(
                image.uri,
                path5.resolve(postDir, `${image.id}.jpg`)
              );
            }
          );
          await DownloadUtils_default.downloadByBatch(
            post.audios,
            async (audio) => {
              await DownloadUtils_default.downloadMedia(
                audio.uri,
                path5.resolve(postDir, `${audio.id}.mp3`)
              );
            }
          );
        },
        true
      );
      console.log(
        `\u2705 Download posts media successfully and saved to ${POSTS_SAVED_DIR}`
      );
    };
    this.downloadAllUserPosts = async (username, writeStatisticFile = true, downloadMedia = true, limit = Infinity) => {
      if (limit !== Infinity && limit % 4 !== 0) {
        throw new Error("\u274C Limit must be a multiple of 4");
      }
      const cursor = CacheCursor_default.getCacheCursor(username, "POSTS");
      const startCursor = cursor?.nextCursor || "";
      const totalFetchedPosts = cursor?.totalFetchedItems || 0;
      const postsData = await this.threadRequest.getUserPosts(
        username,
        startCursor,
        totalFetchedPosts,
        limit
      );
      if (!postsData.length) {
        console.log(`\u{1F440} No posts found for ${username}`);
        return;
      }
      if (writeStatisticFile) {
        this.writePostStatisticToCsv(username, postsData, totalFetchedPosts);
      }
      if (downloadMedia) {
        await this.downloadUserPostsMedia(username, postsData, totalFetchedPosts);
      }
    };
    this.threadRequest = threadRequest;
  }
};
var PostDownloader_default = PostDownloader;

// src/modules/ThreadRequest.ts
import axios2 from "axios";
import dayjs from "dayjs";
var ThreadRequest = class {
  constructor(cookies) {
    this.getThreadIdByUsername = async (username) => {
      const { data } = await this.axiosInstance.get(
        `https://www.threads.net/@${username}`
      );
      const userId = data.match(/"user_id":"(\d+)"/)[1];
      return userId;
    };
    this.getIgAppId = async () => {
      try {
        const { data } = await this.axiosInstance.get("https://www.threads.net");
        const appId = data.match(/"APP_ID":"(\d+)"/)[1];
        return appId;
      } catch (error) {
        throw new Error("\u274C Can not find ig app id");
      }
    };
    this.getUserPosts = async (username, startCursor, totalFetchedPosts, limit) => {
      let hasMore = true;
      let endCursor = startCursor;
      const originalUserPosts = [];
      const userID = await this.getThreadIdByUsername(username);
      const xIgAppId = await this.getIgAppId();
      const baseQuery = {
        before: null,
        first: 10,
        last: null,
        userID,
        __relay_internal__pv__BarcelonaIsLoggedInrelayprovider: true,
        __relay_internal__pv__BarcelonaIsInlineReelsEnabledrelayprovider: true,
        __relay_internal__pv__BarcelonaOptionalCookiesEnabledrelayprovider: true,
        __relay_internal__pv__BarcelonaShowReshareCountrelayprovider: true,
        __relay_internal__pv__BarcelonaQuotedPostUFIEnabledrelayprovider: false,
        __relay_internal__pv__BarcelonaIsCrawlerrelayprovider: false,
        __relay_internal__pv__BarcelonaShouldShowFediverseM075Featuresrelayprovider: true
      };
      console.log(
        `\u{1F680} Start getting posts of user ${username}. Fetched: ${totalFetchedPosts}. Maximum: ${limit}`
      );
      do {
        const { data } = await this.axiosInstance.get("/", {
          params: {
            doc_id: "27451289061182391",
            variables: JSON.stringify({
              ...baseQuery,
              after: endCursor
            })
          },
          headers: {
            "x-ig-app-id": xIgAppId
          }
        });
        const posts = data?.data?.mediaData?.edges;
        const pageInfor = data?.data?.mediaData?.page_info;
        if (!posts || !pageInfor) {
          console.log("\u{1F610} There are some errors. Start retrying...");
          continue;
        }
        originalUserPosts.push(...posts);
        console.log(`\u{1F525} Got ${originalUserPosts.length} posts...`);
        hasMore = pageInfor.has_next_page;
        endCursor = pageInfor.end_cursor;
      } while (hasMore && originalUserPosts.length < limit);
      const userPosts = originalUserPosts.map((post) => {
        const postData = post.node.thread_items[0].post;
        const haveMedia = postData?.carousel_media || postData?.image_versions2?.candidates?.length > 0 || postData?.video_versions || postData?.audio;
        if (!haveMedia) {
          return {
            id: postData.pk,
            code: postData.code,
            title: postData.caption?.text,
            takenAt: dayjs.unix(postData.taken_at).format("DD/MM/YYYY HH:mm:ss"),
            totalMedia: 0,
            videoCount: 0,
            imageCount: 0,
            audioCount: 0,
            likeCount: postData.like_and_view_counts_disabled ? null : postData.like_count,
            commentCount: postData.text_post_app_info.direct_reply_count,
            images: [],
            videos: [],
            audios: []
          };
        }
        const originalMediaList = Array.from(
          postData.carousel_media || [postData]
        );
        const videos = originalMediaList.filter((media) => !!media.video_versions).map((media) => ({
          uri: media.video_versions[0].url,
          id: media.id
        }));
        const images = originalMediaList.filter((media) => !!!media.video_versions && !!media.image_versions2).map((media) => ({
          uri: media.image_versions2.candidates[0].url,
          id: media.id
        }));
        const audios = originalMediaList.filter((media) => !!media.audio).map((media, index) => ({
          id: `audio_${index}`,
          uri: media.audio.audio_src
        }));
        return {
          id: postData.pk,
          code: postData.code,
          title: postData.caption?.text,
          takenAt: dayjs.unix(postData.taken_at).format("DD/MM/YYYY HH:mm:ss"),
          totalMedia: originalMediaList.length,
          videoCount: videos.length,
          imageCount: images.length,
          audioCount: audios.length,
          likeCount: postData.like_and_view_counts_disabled ? null : postData.like_count,
          commentCount: postData.text_post_app_info.direct_reply_count,
          videos,
          images,
          audios
        };
      });
      const cacheCursorInfor = {
        nextCursor: hasMore ? endCursor : "",
        totalFetchedItems: hasMore ? totalFetchedPosts + userPosts.length : 0
      };
      CacheCursor_default.writeCacheCursor(username, "POSTS", cacheCursorInfor);
      hasMore ? console.log(
        `\u{1F503} Got ${userPosts.length} posts and still have posts left`
      ) : console.log(
        `\u2705 Get all posts of user ${username} successfully. Total: ${userPosts.length + totalFetchedPosts}`
      );
      return userPosts;
    };
    this.axiosInstance = axios2.create({
      baseURL: "https://www.threads.net/graphql/query",
      headers: { cookie: cookies }
    });
    this.axiosInstance.interceptors.response.use(
      (res) => res,
      (error) => {
        if (error.response) {
          const responseData = error.response.data;
          throw new Error(
            `\u274C Error when making request to Thread: ${JSON.stringify(
              responseData,
              null,
              2
            )}`
          );
        }
        throw new Error(`\u274C Unknown error: ${error.message}`);
      }
    );
  }
};
var ThreadRequest_default = ThreadRequest;

// src/modules/ThreadDownloader.ts
var ThreadDownloader = class {
  constructor(cookies) {
    this.threadRequest = new ThreadRequest_default(cookies);
    this.post = new PostDownloader_default(this.threadRequest);
  }
};
var ThreadDownloader_default = ThreadDownloader;
export {
  ThreadDownloader_default as ThreadDownloader
};
