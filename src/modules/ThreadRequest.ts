import axios, { AxiosError, AxiosInstance } from "axios";
import dayjs from "dayjs";
import { ICachedCursor, IMedia, IPost } from "src/interfaces";
import CacheCursor from "src/modules/utils/CacheCursor";

class ThreadRequest {
  private axiosInstance: AxiosInstance;

  constructor(cookies: string) {
    this.axiosInstance = axios.create({
      baseURL: "https://www.threads.net/graphql/query",
      headers: { cookie: cookies },
    });
    this.axiosInstance.interceptors.response.use(
      (res) => res,
      (error: AxiosError) => {
        if (error.response) {
          const responseData = error.response.data;
          throw new Error(
            `❌ Error when making request to Thread: ${JSON.stringify(
              responseData,
              null,
              2
            )}`
          );
        }
        throw new Error(`❌ Unknown error: ${error.message}`);
      }
    );
  }

  getThreadIdByUsername = async (username: string) => {
    const { data } = await this.axiosInstance.get(
      `https://www.threads.net/@${username}`
    );
    const userId = data.match(/"user_id":"(\d+)"/)[1];
    return userId;
  };

  getIgAppId = async () => {
    try {
      const { data } = await this.axiosInstance.get("https://www.threads.net");
      const appId = data.match(/"APP_ID":"(\d+)"/)[1];
      return appId as string;
    } catch (error) {
      throw new Error("❌ Can not find ig app id");
    }
  };

  getUserPosts = async (
    username: string,
    startCursor: string,
    totalFetchedPosts: number,
    limit: number
  ) => {
    let hasMore = true;
    let endCursor = startCursor;
    const originalUserPosts: any[] = [];
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
      __relay_internal__pv__BarcelonaShouldShowFediverseM075Featuresrelayprovider:
        true,
    };

    console.log(
      `🚀 Start getting posts of user ${username}. Fetched: ${totalFetchedPosts}. Maximum: ${limit}`
    );

    do {
      const { data } = await this.axiosInstance.get("/", {
        params: {
          doc_id: "27451289061182391",
          variables: JSON.stringify({
            ...baseQuery,
            after: endCursor,
          }),
        },
        headers: {
          "x-ig-app-id": xIgAppId,
        },
      });

      const posts: any[] = data?.data?.mediaData?.edges;
      const pageInfor = data?.data?.mediaData?.page_info;

      if (!posts || !pageInfor) {
        console.log("😐 There are some errors. Start retrying...");
        continue;
      }
      originalUserPosts.push(...posts);

      console.log(`🔥 Got ${originalUserPosts.length} posts...`);

      hasMore = pageInfor.has_next_page;
      endCursor = pageInfor.end_cursor;
    } while (hasMore && originalUserPosts.length < limit);

    const userPosts: IPost[] = originalUserPosts.map((post) => {
      const postData = post.node.thread_items[0].post;
      const haveMedia =
        postData?.carousel_media ||
        postData?.image_versions2?.candidates?.length > 0 ||
        postData?.video_versions ||
        postData?.audio;
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
          likeCount: postData.like_and_view_counts_disabled
            ? null
            : postData.like_count,
          commentCount: postData.text_post_app_info.direct_reply_count,
          images: [],
          videos: [],
          audios: [],
        };
      }

      const originalMediaList: any[] = Array.from(
        postData.carousel_media || [postData]
      );
      const videos: IMedia[] = originalMediaList
        .filter((media) => !!media.video_versions)
        .map((media) => ({
          uri: media.video_versions[0].url,
          id: media.id,
        }));

      const images: IMedia[] = originalMediaList
        .filter((media) => !!!media.video_versions && !!media.image_versions2)
        .map((media) => ({
          uri: media.image_versions2.candidates[0].url,
          id: media.id,
        }));

      const audios: IMedia[] = originalMediaList
        .filter((media) => !!media.audio)
        .map((media, index) => ({
          id: `audio_${index}`,
          uri: media.audio.audio_src,
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
        likeCount: postData.like_and_view_counts_disabled
          ? null
          : postData.like_count,
        commentCount: postData.text_post_app_info.direct_reply_count,
        videos,
        images,
        audios,
      };
    });
    const cacheCursorInfor: ICachedCursor = {
      nextCursor: hasMore ? endCursor : "",
      totalFetchedItems: hasMore ? totalFetchedPosts + userPosts.length : 0,
    };
    CacheCursor.writeCacheCursor(username, "POSTS", cacheCursorInfor);
    hasMore
      ? console.log(
          `🔃 Got ${userPosts.length} posts and still have posts left`
        )
      : console.log(
          `✅ Get all posts of user ${username} successfully. Total: ${
            userPosts.length + totalFetchedPosts
          }`
        );
    return userPosts;
  };
}

export default ThreadRequest;
