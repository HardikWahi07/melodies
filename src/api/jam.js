import { rdb } from "../firebase";
import {
  ref,
  push,
  set,
  update,
  get,
  onDisconnect,
  serverTimestamp,
  remove
} from "firebase/database";
import { makeLobbyPassHash, makeSalt } from "../utils/crypto";
function displayNameForUser(me) {
  return me.displayName || me.email || `User-${me.uid.slice(0, 6)}`;
}
export function defaultJamSong() {
  return {
    title: "Untitled Jam",
    bpm: 120,
    key: "A minor",
    chords: ["Am", "F", "C", "G"],
    melody: ["A4", "C5", "E5", "D5", "C5", "A4", "G4", "E4"],
    bassline: ["A2", "A2", "F2", "F2", "C2", "C2", "G1", "G1"],
    drumStyle: "dance"
  };
}
export async function createLobby(me, name, password) {
  const lobbyRef = push(ref(rdb, "lobbies"));
  const id = lobbyRef.key;
  const now = Date.now();
  const passSalt = makeSalt();
  if (!password || !password.trim()) throw new Error("Lobby password is required.");
  const passHash = await makeLobbyPassHash(password, passSalt);
  const lobby = {
    name: name.trim() || "Jam Lobby",
    hostUid: me.uid,
    createdAt: now,
    maxParticipants: 8,
    passSalt,
    passHash,
    song: defaultJamSong(),
    transport: { playing: false, startedAt: 0 }
  };
  await set(lobbyRef, lobby);
  await joinLobbyWithPassword(me, id, "pad", password);
  return id;
}
async function getLobbySalt(lobbyId) {
  const snap = await get(ref(rdb, `lobbies/${lobbyId}/passSalt`));
  const salt = snap.val();
  if (typeof salt !== "string" || !salt) throw new Error("Lobby is missing password salt.");
  return salt;
}
export async function joinLobbyWithPassword(me, lobbyId, role, password) {
  const salt = await getLobbySalt(lobbyId);
  const joinKey = await makeLobbyPassHash(password, salt);
  const pRef = ref(rdb, `lobbies/${lobbyId}/participants/${me.uid}`);
  const now = Date.now();
  const participant = {
    uid: me.uid,
    name: displayNameForUser(me),
    role,
    joinedAt: now,
    lastSeen: now,
    joinKey
  };
  await set(pRef, participant);
  onDisconnect(pRef).remove();
}
export async function leaveLobby(me, lobbyId) {
  await remove(ref(rdb, `lobbies/${lobbyId}/participants/${me.uid}`));
}
export async function setMyRole(me, lobbyId, role) {
  await update(ref(rdb, `lobbies/${lobbyId}/participants/${me.uid}`), {
    role,
    lastSeen: serverTimestamp()
  });
}
export async function heartbeat(me, lobbyId) {
  await update(ref(rdb, `lobbies/${lobbyId}/participants/${me.uid}`), {
    lastSeen: serverTimestamp()
  });
}
export async function updateSong(lobbyId, patch) {
  await update(ref(rdb, `lobbies/${lobbyId}/song`), patch);
}
export async function updateTrack(lobbyId, track) {
  await update(ref(rdb, `lobbies/${lobbyId}`), { 
    track,
    transport: { playing: true, ts: serverTimestamp(), pos: 0 }
  });
}
export async function addTrackToQueue(lobbyId, track) {
  const qRef = push(ref(rdb, `lobbies/${lobbyId}/queue`));
  await set(qRef, track);
}
export async function playNextInQueue(lobbyId) {
  const snap = await get(ref(rdb, `lobbies/${lobbyId}/queue`));
  const currentQueue = snap.val();
  if (!currentQueue) {
    await update(ref(rdb, `lobbies/${lobbyId}/transport`), { playing: false });
    return;
  }
  const keys = Object.keys(currentQueue).sort();
  if (keys.length === 0) {
    await update(ref(rdb, `lobbies/${lobbyId}/transport`), { playing: false });
    return;
  }
  const nextKey = keys[0];
  const nextTrack = currentQueue[nextKey];
  
  const updates = {};
  updates[`lobbies/${lobbyId}/queue/${nextKey}`] = null;
  updates[`lobbies/${lobbyId}/track`] = nextTrack;
  updates[`lobbies/${lobbyId}/transport`] = { playing: true, ts: serverTimestamp(), pos: 0 };
  
  await update(ref(rdb), updates);
}
export async function startJam(lobbyId, resumePos = 0) {
  await update(ref(rdb, `lobbies/${lobbyId}/transport`), {
    playing: true,
    ts: serverTimestamp(),
    pos: resumePos
  });
}
export async function stopJam(lobbyId, currentPos = 0) {
  await update(ref(rdb, `lobbies/${lobbyId}/transport`), {
    playing: false,
    ts: serverTimestamp(),
    pos: currentPos
  });
}
export async function deleteLobby(lobbyId) {
  await remove(ref(rdb, `lobbies/${lobbyId}`));
}
export async function cleanupIdleLobbies() {
  const snap = await get(ref(rdb, "lobbies"));
  const lobbies = snap.val();
  if (!lobbies) return;
  const now = Date.now();
  const TEN_MINS = 10 * 60 * 1000;
  for (const id in lobbies) {
    const l = lobbies[id];
    const participants = l.participants || {};
    const count = Object.keys(participants).length;
    if (count === 0) {
      const age = now - (l.createdAt || 0);
      if (age > TEN_MINS) {
        await remove(ref(rdb, `lobbies/${id}`));
      }
    }
  }
}
export async function sendChat(me, lobbyId, text) {
  const msg = text.trim();
  if (!msg) return;
  const msgRef = push(ref(rdb, `lobbies/${lobbyId}/chat`));
  await set(msgRef, {
    uid: me.uid,
    name: displayNameForUser(me),
    text: msg,
    ts: serverTimestamp()
  });
}
export async function requestControl(lobbyId, me, cmd) {
  await update(ref(rdb, `lobbies/${lobbyId}/participants/${me.uid}`), {
    cmd: { ...cmd, ts: serverTimestamp() }
  });
}
export async function clearCommand(lobbyId, uid) {
  await update(ref(rdb, `lobbies/${lobbyId}/participants/${uid}`), {
    cmd: null
  });
}
