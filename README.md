<div align="center">
    <img src="https://raw.githubusercontent.com/minhchi1509/thread_downloader/main/public/thread-logo.svg" width="10%" />
    <br />
     <h1 align="center">Thread Downloader</h1>
</div>

## Features

- Download photos, videos, audios from all user posts

> [!WARNING]
> The above features only apply to public or private thread profiles (you have already followed).

> [!NOTE]
> All downloaded photos and videos will be saved in the Downloads folder (for Windows) on your computer.

## Installation

```bash
npm install @minhchi1509/thread-downloader
```

## Usage

- This is an example:

```js
import { ThreadDownloader } from "@minhchi1509/thread-downloader";

// Cookies of your Thread account. You can get it by using Cookie-Editor extension on Chrome
const cookies = "YOUR_THREAD_COOKIES";
// Username of the Thread account you want to download
const username = "minhchi1509";

const threadDownloader = new ThreadDownloader(cookies);

// Download all posts of the user
threadDownloader.post.downloadAllUserPosts(username);

```

## API Documentation

### Download posts media

```js
threadDownloader.post.downloadAllUserPosts(
  username,
  writeStatisticFile,
  downloadMedia,
  limit
);
```

**Parameters**:
- **username** _(string, required)_: The username of thread user that you want to download their media
- **writeStatisticFile** _(boolean, optional)_: If `true`, it will output a CSV file containing information about the posts. Default value: `true`
- **downloadMedia** _(boolean, optional)_: If `true`, it will download videos, photos about the posts. Default value: `true`
- **limit** _(number, optional)_: The limit number of posts you want to download in one execution and it **MUST** be a multiple of 4. Suitable when a user has too many posts and you only want to download (example: 40 posts) at a time per execution. Default value: `Infinity`

> [!WARNING]
> Note that when you specify the value of `limit` parameter, after the batch download is complete, there will be a folder named **cache_cursor/[username]** and it contains files like **posts.json** to save information for the next posts download. Please **DO NOT** edit anything in these files.
> If you want to download posts again from the beginning, delete **cache_cursor/[username]/posts.json** files.
