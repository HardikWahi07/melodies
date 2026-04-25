import { rdb } from "../firebase";
import { ref, push, set, get } from "firebase/database";
import { getUserProfile } from "./profiles";
import { apiGet } from "../api.js";
import { generateBlendRecommendation } from "./ai";

/* ---------- helpers ---------- */
async function getListeningHistory(uid) {
  const snap = await get(ref(rdb, `streamData/${uid}`));
  const data = snap.val();
  if (!data) return [];
  return Object.entries(data)
    .map(([id, val]) => ({
      id,
      ...(val.meta || {}),
      seconds: val.seconds || 0,
      plays: val.plays || 0
    }))
    .filter(t => t.seconds > 0 || t.plays > 0)
    .sort((a, b) => b.seconds - a.seconds);
}

async function getFollowingArtistNames(uid) {
  const snap = await get(ref(rdb, `users/${uid}/followingArtists`));
  const v = snap.val() || {};
  const arr = Object.keys(v).map((id) => ({ name: v[id]?.name || id }));
  const names = arr.map(a => String(a.name || "").trim()).filter(Boolean);

  // also try the "following" path used by TrackRow
  const snap2 = await get(ref(rdb, `users/${uid}/following`));
  const v2 = snap2.val() || {};
  const names2 = Object.values(v2).map(a => String(a?.name || "").trim()).filter(Boolean);

  return [...new Set([...names, ...names2])].slice(0, 12);
}

function extractArtists(tracks) {
  const map = {};
  for (const t of tracks) {
    const a = (t.artist || "").trim();
    if (!a) continue;
    map[a] = (map[a] || 0) + (t.seconds || 0);
  }
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => name);
}

function extractTitles(tracks) {
  return tracks.map(t => `${t.title || ""} – ${t.artist || ""}`).filter(Boolean);
}

/**
 * Compute a musical taste-match percentage between two users
 * based on shared artists, song overlaps, and genre tendencies.
 */
export function computeMatchPercentage(tracks1, tracks2) {
  if (!tracks1.length && !tracks2.length) return 50;
  if (!tracks1.length || !tracks2.length) return 15;

  const artists1 = new Set(tracks1.map(t => (t.artist || "").toLowerCase().trim()).filter(Boolean));
  const artists2 = new Set(tracks2.map(t => (t.artist || "").toLowerCase().trim()).filter(Boolean));

  const allArtists = new Set([...artists1, ...artists2]);
  const commonArtists = [...artists1].filter(a => artists2.has(a));

  const artistOverlap = allArtists.size > 0 ? commonArtists.length / allArtists.size : 0;

  // Song overlap (by title similarity)
  const titles1 = new Set(tracks1.map(t => (t.title || "").toLowerCase().trim()).filter(Boolean));
  const titles2 = new Set(tracks2.map(t => (t.title || "").toLowerCase().trim()).filter(Boolean));
  const allTitles = new Set([...titles1, ...titles2]);
  const commonTitles = [...titles1].filter(t => titles2.has(t));
  const titleOverlap = allTitles.size > 0 ? commonTitles.length / allTitles.size : 0;

  // Weighted score
  const raw = (artistOverlap * 0.65) + (titleOverlap * 0.35);
  // Scale to a nice range (10-98), with a curve that feels natural
  const scaled = Math.round(10 + raw * 88);
  return Math.max(10, Math.min(98, scaled));
}

async function resolveSongToTrack(title, artist) {
  const q = `${title} ${artist} Official`;
  try {
    const res = await apiGet(`/api/music/search?q=${encodeURIComponent(q)}`);
    const tracks = res?.tracks || [];
    if (!tracks.length) return null;
    return tracks[0];
  } catch {
    return null;
  }
}

function blendName(a, b) {
  const n1 = a.replace(/\s+/g, "_");
  const n2 = b.replace(/\s+/g, "_");
  return `${n1} × ${n2} Blend`;
}

/* ---------- main export ---------- */
export async function createBlend(me, otherUid) {
  if (!otherUid || otherUid === me.uid) throw new Error("Pick another user.");

  const myProfile = await getUserProfile(me.uid);
  const otherProfile = await getUserProfile(otherUid);
  if (!otherProfile) throw new Error("User not found. Ask them to login first.");

  const myName = myProfile?.name || (me.email ? me.email.split("@")[0] : `User-${me.uid.slice(0, 6)}`);
  const otherName = otherProfile.name || `User-${otherUid.slice(0, 6)}`;

  // Pull listening histories
  const [myHistory, otherHistory] = await Promise.all([
    getListeningHistory(me.uid),
    getListeningHistory(otherUid)
  ]);

  // Pull followed artists as a fallback signal
  const [myFollowing, otherFollowing] = await Promise.all([
    getFollowingArtistNames(me.uid),
    getFollowingArtistNames(otherUid)
  ]);

  // Compute match
  const matchPercent = computeMatchPercentage(myHistory, otherHistory);

  // Build artist signals from both sources
  const myArtists = [...new Set([...extractArtists(myHistory).slice(0, 8), ...myFollowing.slice(0, 4)])];
  const otherArtists = [...new Set([...extractArtists(otherHistory).slice(0, 8), ...otherFollowing.slice(0, 4)])];

  // Build song signals
  const myTopSongs = extractTitles(myHistory.slice(0, 10));
  const otherTopSongs = extractTitles(otherHistory.slice(0, 10));

  // AI recommendation with enriched context
  const suggestions = await generateBlendRecommendation({
    user1Name: myName,
    user2Name: otherName,
    user1Artists: myArtists,
    user2Artists: otherArtists,
    user1Songs: myTopSongs,
    user2Songs: otherTopSongs,
    count: 24
  });

  // Resolve each song to a playable YouTube track
  const out = {};
  for (const s of suggestions) {
    const tr = await resolveSongToTrack(s.title, s.artist);
    if (!tr) continue;
    const key = tr.videoId || tr.id;
    if (!key || out[key]) continue;
    let recommendedForName = "";
    let recommendedForUid;
    if (s.recommendedFor === "user1") {
      recommendedForName = myName;
      recommendedForUid = me.uid;
    } else if (s.recommendedFor === "user2") {
      recommendedForName = otherName;
      recommendedForUid = otherUid;
    } else {
      recommendedForName = `${myName} + ${otherName}`;
    }
    const withMeta = {
      ...tr,
      recommendedForName
    };
    if (recommendedForUid) withMeta.recommendedForUid = recommendedForUid;
    out[key] = withMeta;
  }

  // Save playlist for the creator
  const playlistRef = push(ref(rdb, "playlists"));
  const pid = playlistRef.key;

  await set(playlistRef, {
    name: blendName(myName, otherName),
    uid: me.uid,
    isPublic: false,
    createdAt: Date.now(),
    type: "blend",
    blendMeta: {
      user1Uid: me.uid,
      user1Name: myName,
      user2Uid: otherUid,
      user2Name: otherName,
      matchPercent,
      createdAt: Date.now()
    },
    members: { [me.uid]: true, [otherUid]: true },
    tracks: out
  });

  // Also save a copy reference for the other user (so it appears in their library)
  const otherPlaylistRef = push(ref(rdb, "playlists"));
  const otherPid = otherPlaylistRef.key;

  await set(otherPlaylistRef, {
    name: blendName(myName, otherName),
    uid: otherUid,
    isPublic: false,
    createdAt: Date.now(),
    type: "blend",
    blendMeta: {
      user1Uid: me.uid,
      user1Name: myName,
      user2Uid: otherUid,
      user2Name: otherName,
      matchPercent,
      createdAt: Date.now()
    },
    members: { [me.uid]: true, [otherUid]: true },
    tracks: out
  });

  return pid;
}
