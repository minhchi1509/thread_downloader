import PostDownloader from "src/modules/downloaders/PostDownloader";
import ThreadRequest from "src/modules/ThreadRequest";

class ThreadDownloader {
  private threadRequest: ThreadRequest;
  public post: PostDownloader;

  constructor(cookies: string) {
    this.threadRequest = new ThreadRequest(cookies);
    this.post = new PostDownloader(this.threadRequest);
  }
}

export default ThreadDownloader;
