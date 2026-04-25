import { demoTracks } from "./demoCatalog.js";
const YT_KEYS = [
  import.meta.env.VITE_YT_KEY_1,
  import.meta.env.VITE_YT_KEY_2,
  import.meta.env.VITE_YT_KEY_3,
  import.meta.env.VITE_YT_KEY_4,
  import.meta.env.VITE_YT_KEY_5
].filter(Boolean); 
let currentKeyIndex = 0;
async function ytFetch(path, params) {
  const tryFetch = async (retries = 3) => {
    const key = YT_KEYS[currentKeyIndex];
    if (!key || key.startsWith("PASTE_KEY")) {
       console.warn("No valid YouTube API Key found.");
       return null;
    }
    const u = new URL("https://www.googleapis.com/youtube/v3" + path);
    u.searchParams.set("key", key);
    Object.keys(params).forEach(k => u.searchParams.set(k, params[k]));
    try {
      const r = await fetch(u.toString());
      if (r.status === 403 || r.status === 429) {
        console.warn(`Key index ${currentKeyIndex} failed. Rotating...`);
        currentKeyIndex = (currentKeyIndex + 1) % YT_KEYS.length;
        if (retries > 0) return tryFetch(retries - 1);
        return null;
      }
      if (!r.ok) return null;
      return await r.json();
    } catch (e) {
      return null;
    }
  };
  return tryFetch();
}
function mapYT(item) {
  const clean = (str) => {
    const div = document.createElement("div");
    div.innerHTML = str;
    return div.textContent || div.innerText || str;
  };
  return {
    id: item.id.videoId,
    title: clean(item.snippet.title.replace(/official music video/gi, "").replace(/\[.*\]/g, "").trim()),
    artist: clean(item.snippet.channelTitle),
    coverUrl: item.snippet.thumbnails.high.url,
    videoId: item.id.videoId,
    source: "youtube"
  };
}
export async function apiGet(path) {
  if (path === "/api/music/trending") {
    const data = await ytFetch("/search", {
      part: "snippet",
      q: "official music video -shorts -reel -tiktok -parody -funny",
      type: "video",
      videoCategoryId: "10",
      videoDuration: "medium", 
      videoEmbeddable: "true",
      maxResults: 20
    });
    if (!data || !data.items) return { tracks: demoTracks };
    return { tracks: data.items.map(mapYT) };
  }
  if (path.startsWith("/api/music/search")) {
    const u = new URL("http://f.c" + path);
    const q = u.searchParams.get("q") || "";
    const optimizedQuery = `${q} Official`;
    const data = await ytFetch("/search", {
      part: "snippet",
      q: optimizedQuery,
      type: "video",
      videoCategoryId: "10",
      videoEmbeddable: "true",
      relevanceLanguage: "en",
      maxResults: 30
    });
    if (!data || !data.items) return { tracks: [] };
    return { tracks: data.items.map(mapYT) };
  }
  return { tracks: [] };
}
export async function apiPost(path, body) {
  if (path === "/api/ai/create_song") {
    throw new Error("AI Generation is temporarily disabled.");
  }
  return { ok: true };
}
