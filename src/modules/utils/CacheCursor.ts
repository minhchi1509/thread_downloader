import path from "path";
import { ICachedCursor } from "src/interfaces";
import FileUtils from "src/modules/utils/FileUtils";

class CacheCursor {
  static getSavedCacheCursorPath = (username: string) => {
    return {
      POSTS_CACHE_CURSOR_PATH: path.resolve(
        "cache_cursor",
        username,
        "posts.json"
      ),
    };
  };

  static writeCacheCursor = (
    username: string,
    mediaType: "POSTS",
    cursor: ICachedCursor
  ) => {
    const { POSTS_CACHE_CURSOR_PATH } = this.getSavedCacheCursorPath(username);
    const mappedPath = {
      POSTS: POSTS_CACHE_CURSOR_PATH,
    };
    FileUtils.writeToFile(
      mappedPath[mediaType],
      JSON.stringify(cursor, null, 2)
    );
  };

  static getCacheCursor = (username: string, mediaType: "POSTS") => {
    const { POSTS_CACHE_CURSOR_PATH } = this.getSavedCacheCursorPath(username);
    const mappedPath = {
      POSTS: POSTS_CACHE_CURSOR_PATH,
    };
    return FileUtils.readObjectFromJsonFile<ICachedCursor>(
      mappedPath[mediaType]
    );
  };
}

export default CacheCursor;
