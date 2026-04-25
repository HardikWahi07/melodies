import { rdb } from "../firebase";
import { ref, set, remove, onValue } from "firebase/database";
import { artistIdFromName } from "../utils/artist";
export function subscribeFollowingArtists(me, cb) {
  const fRef = ref(rdb, `users/${me.uid}/followingArtists`);
  return onValue(fRef, (snap) => {
    const v = snap.val() || {};
    const arr = Object.keys(v).map((id) => ({
      id,
      name: v[id].name || id,
      followedAt: v[id].followedAt || 0
    }));
    arr.sort((a, b) => (b.followedAt || 0) - (a.followedAt || 0));
    cb(arr);
  });
}
export async function followArtist(me, artistName) {
  const name = artistName.trim();
  if (!name) throw new Error("Artist name required.");
  const id = artistIdFromName(name);
  const artist = { id, name, followedAt: Date.now() };
  await set(ref(rdb, `users/${me.uid}/followingArtists/${id}`), artist);
  return artist;
}
export async function unfollowArtist(me, artistId) {
  await remove(ref(rdb, `users/${me.uid}/followingArtists/${artistId}`));
}
