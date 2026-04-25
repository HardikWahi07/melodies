import { rdb } from "../firebase";
import { ref, get } from "firebase/database";
export async function getUserProfile(uid) {
  const snap = await get(ref(rdb, `users/${uid}/profile`));
  const v = snap.val();
  if (!v) return null;
  return {
    uid,
    name: String(v.name || uid.slice(0, 6)),
    email: v.email ? String(v.email) : ""
  };
}
