import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { onValue, ref } from "firebase/database";
import { ArrowLeft, Link2, MessageSquare, Play, Search as SearchIcon, Square, Users, SkipForward, Trash2 } from "lucide-react";
import { AuthCtx } from "../context/AuthCtx";
import { PlayerCtx } from "../context/PlayerCtx";
import { rdb } from "../firebase";
import { apiGet } from "../api.js";
import YTPlayer from "../components/YTPlayer";
import { heartbeat, joinLobbyWithPassword, leaveLobby, sendChat, setMyRole, startJam, stopJam, updateTrack, deleteLobby,
  cleanupIdleLobbies,
  addTrackToQueue,
  playNextInQueue,
  requestControl,
  clearCommand
} from "../api/jam";
function parseYouTubeId(input) {
  const s = input.trim();
  if (!s) return null;
  if (/^[a-zA-Z0-9_-]{11}$/.test(s)) return s;
  try {
    const u = new URL(s);
    if (u.hostname.includes("youtu.be")) {
      const id = u.pathname.replace("/", "").trim();
      return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    }
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      return v && /^[a-zA-Z0-9_-]{11}$/.test(v) ? v : null;
    }
  } catch {
    return null;
  }
  return null;
}
export default function JamLobbyPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const { me } = useContext(AuthCtx);
  const { vol } = useContext(PlayerCtx);
  const lobbyId = id;
  const [lobby, setLobby] = useState(null);
  const [participants, setParticipants] = useState({});
  const [role, setRole] = useState("pad");
  const [joinPassword, setJoinPassword] = useState("");
  const [joining, setJoining] = useState(false);
  const [chatText, setChatText] = useState("");
  const [chat, setChat] = useState([]);
  const [reqSeek, setReqSeek] = useState(-1);
  const [pos, setPos] = useState(0);
  const [dur, setDur] = useState(0);
  const [err, setErr] = useState("");
  const [linkText, setLinkText] = useState("");
  const [searchText, setSearchText] = useState("");
  const [searchBusy, setSearchBusy] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [serverOffset, setServerOffset] = useState(0);
  const driftTimerRef = useRef(null);
  const chatEndRef = useRef(null);
  const isHost = Boolean(me && lobby && lobby.hostUid === me.uid);
  const participantCount = useMemo(() => Object.keys(participants || {}).length, [participants]);
  const joined = Boolean(me && participants && participants[me.uid]);
  useEffect(() => {
    const offsetRef = ref(rdb, ".info/serverTimeOffset");
    return onValue(offsetRef, (snap) => setServerOffset(snap.val() || 0));
  }, []);
  useEffect(() => {
    if (!lobbyId) return;
    const lRef = ref(rdb, `lobbies/${lobbyId}`);
    return onValue(lRef, (snap) => {
      const v = snap.val();
      setLobby(v ? ({ id: lobbyId, ...v }) : null);
    });
  }, [lobbyId]);
  useEffect(() => {
    if (!lobbyId) return;
    const pRef = ref(rdb, `lobbies/${lobbyId}/participants`);
    return onValue(pRef, (snap) => setParticipants(snap.val() || {}));
  }, [lobbyId]);
  useEffect(() => {
    if (!lobbyId) return;
    const cRef = ref(rdb, `lobbies/${lobbyId}/chat`);
    return onValue(cRef, (snap) => {
      const v = snap.val() || {};
      const arr = Object.keys(v).map((k) => ({ id: k, ...v[k] }));
      arr.sort((a, b) => (a.ts || 0) - (b.ts || 0));
      setChat(arr.slice(-50));
    });
  }, [lobbyId]);
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);
  useEffect(() => {
    if (!me || !lobbyId || !joined) return;
    const t = window.setInterval(() => heartbeat(me, lobbyId).catch(() => {}), 20_000);
    return () => {
      window.clearInterval(t);
      leaveLobby(me, lobbyId).catch(() => {});
    };
  }, [me, lobbyId, joined]);
  useEffect(() => {
    if (!me) return;
    const p = participants?.[me.uid];
    if (p?.role && p.role !== role) setRole(p.role);
  }, [participants, me, role]);
  useEffect(() => {
    if (!lobby?.transport?.playing || !lobby?.track?.videoId) return;
    const ts = Number(lobby.transport.ts || 0);
    const basePos = Number(lobby.transport.pos || 0);
    if (!ts) return;
    const serverNow = Date.now() + serverOffset;
    const elapsed = Math.max(0, (serverNow - ts) / 1000);
    setReqSeek(basePos + elapsed);
  }, [lobby?.transport?.playing, lobby?.transport?.ts, lobby?.transport?.pos, lobby?.track?.videoId, serverOffset]);
  useEffect(() => {
    if (!lobby?.transport?.playing || !lobby?.track?.videoId) return;
    const ts = Number(lobby.transport.ts || 0);
    const basePos = Number(lobby.transport.pos || 0);
    if (!ts) return;
    driftTimerRef.current = window.setInterval(() => {
      if (!lobby.transport.playing) return;
      const serverNow = Date.now() + serverOffset;
      const expected = basePos + Math.max(0, (serverNow - ts) / 1000);
      if (dur > 0 && expected > dur + 2) return;
      if (Math.abs((pos || 0) - expected) > 2.5) setReqSeek(expected);
    }, 5000);
    return () => {
      if (driftTimerRef.current) window.clearInterval(driftTimerRef.current);
      driftTimerRef.current = null;
    };
  }, [lobby?.transport?.playing, lobby?.transport?.ts, lobby?.transport?.pos, lobby?.track?.videoId, pos, dur, serverOffset]);
  useEffect(() => {
    if (!isHost || !lobbyId || !participants) return;
    const serverNow = Date.now() + serverOffset;
    
    Object.keys(participants).forEach(uid => {
      const p = participants[uid];
      if (p?.cmd && p.cmd.ts) {
        const c = p.cmd;
        const cmdTime = Number(c.ts);
        // Increased window to 60s and using serverNow for accurate comparison
        if (Math.abs(serverNow - cmdTime) < 60000) {
          if (c.type === "stop") stopJam(lobbyId, c.pos || 0);
          else if (c.type === "start") startJam(lobbyId, c.pos || 0);
          else if (c.type === "skip") playNextInQueue(lobbyId);
        }
        // Clear immediately so we don't re-process
        clearCommand(lobbyId, uid);
      }
    });
  }, [participants, isHost, lobbyId, serverOffset]);
  const onChangeRole = async (r) => {
    if (!me) return;
    setRole(r);
    if (joined) await setMyRole(me, lobbyId, r);
  };
  const doJoin = async () => {
    if (!me) return;
    setErr("");
    if (!joinPassword.trim()) {
      setErr("Enter the lobby password to join.");
      return;
    }
    setJoining(true);
    try {
      await joinLobbyWithPassword(me, lobbyId, role, joinPassword);
    } catch (e) {
      setErr(e?.message || "Wrong password or join blocked by rules.");
    } finally {
      setJoining(false);
    }
  };
  const onSend = async () => {
    if (!me) return;
    await sendChat(me, lobbyId, chatText);
    setChatText("");
  };
  const setFromLink = async () => {
    setErr("");
    const vid = parseYouTubeId(linkText);
    if (!vid) {
      setErr("Paste a valid YouTube link or video id.");
      return;
    }
    const track = {
      id: vid,
      videoId: vid,
      title: "YouTube Track",
      artist: "YouTube",
      coverUrl: `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`
    };
    if (lobby?.track?.videoId) {
      await addTrackToQueue(lobbyId, track);
    } else {
      await updateTrack(lobbyId, track);
    }
    setLinkText("");
  };
  const runSearch = async () => {
    const q = searchText.trim();
    if (!q) return;
    setErr("");
    setSearchBusy(true);
    try {
      const res = await apiGet(`/api/music/search?q=${encodeURIComponent(q)}`);
      setSearchResults(res?.tracks || []);
    } catch (e) {
      setErr(e?.message || "Search failed.");
    } finally {
      setSearchBusy(false);
    }
  };
  const pickTrack = async (t) => {
    setErr("");
    if (lobby?.track?.videoId) {
      await addTrackToQueue(lobbyId, t);
    } else {
      await updateTrack(lobbyId, t);
    }
  };
  const doDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this lobby? Everyone will be kicked.")) return;
    await deleteLobby(lobbyId);
    nav("/jam");
  };
  if (!lobby) {
    return (
      <div className="main" style={{ padding: "48px" }}>
        <div className="muted">Lobby not found.</div>
        <button className="btnGhost" onClick={() => nav("/jam")} style={{ marginTop: 16 }}>
          <ArrowLeft size={18} />
          <span>Back</span>
        </button>
      </div>
    );
  }
  return (
    <div className="main" style={{ padding: "28px 48px" }}>
      <div className="secTop" style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button className="btnGhost" onClick={() => nav("/jam")}>
            <ArrowLeft size={18} />
            <span>Back</span>
          </button>
          <div style={{ minWidth: 0 }}>
            <div className="h1" style={{ fontSize: 26 }}>
              {lobby.name} <span style={{ color: "var(--pink)" }}>Lobby</span>
            </div>
            <div className="muted" style={{ fontWeight: 700, display: "flex", gap: 10, alignItems: "center" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Users size={14} /> {participantCount}
              </span>
              <span>•</span>
              <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "160px" }}>
                {!joined ? "🔒 Hidden (Join to view)" : (lobby.track?.title ? lobby.track.title : "No track selected")}
              </span>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {joined && (
            <>
              {lobby.transport?.playing ? (
                <button 
                  className="btn" 
                  onClick={() => {
                    if (isHost) stopJam(lobbyId, pos);
                    else requestControl(lobbyId, me, { type: "stop", pos });
                  }} 
                  style={{ background: "var(--bg-card)" }}
                >
                  <Square size={18} />
                  <span>Stop</span>
                </button>
              ) : (
                <button 
                  className="btn" 
                  onClick={() => {
                    const rpos = lobby.transport?.pos || 0;
                    if (isHost) startJam(lobbyId, rpos);
                    else requestControl(lobbyId, me, { type: "start", pos: rpos });
                  }} 
                  disabled={!lobby.track?.videoId}
                >
                  <Play size={18} fill="#fff" />
                  <span>{(lobby.transport?.pos || 0) > 0 ? "Resume" : "Start"}</span>
                </button>
              )}
              <button 
                className="btnGhost" 
                onClick={() => {
                  if (isHost) playNextInQueue(lobbyId);
                  else requestControl(lobbyId, me, { type: "skip" });
                }} 
                disabled={!lobby.queue || Object.keys(lobby.queue).length === 0}
                style={{ padding: "8px 12px" }}
              >
                <SkipForward size={18} />
                <span>Skip</span>
              </button>
            </>
          )}
          {isHost && (
            <button className="icoBtn" onClick={doDelete} style={{ background: "rgba(255,100,100,0.1)", color: "#ff6b6b" }}>
              <Trash2 size={18} />
            </button>
          )}
        </div>
      </div>
      <div className="respGrid">
        <div style={{ background: "var(--bg-card)", borderRadius: 24, border: "1px solid var(--glass-border)", padding: "clamp(12px, 3vw, 24px)" }}>

          {!joined ? (
            <div style={{ background: "var(--bg-dark)", border: "1px solid var(--glass-border)", borderRadius: 18, padding: 14, marginBottom: 14 }}>
              <div className="muted" style={{ fontWeight: 900, marginBottom: 8 }}>Join Lobby</div>
              <input
                value={joinPassword}
                onChange={(e) => setJoinPassword(e.target.value)}
                placeholder="Lobby password"
                type="password"
                style={{
                  width: "100%",
                  background: "transparent",
                  border: "1px solid var(--glass-border)",
                  borderRadius: 14,
                  padding: "10px 12px",
                  color: "#fff",
                  outline: "none"
                }}
              />
              <button className="btn" onClick={doJoin} disabled={joining} style={{ marginTop: 10, width: "100%" }}>
                <Play size={18} fill="#fff" />
                <span>{joining ? "Joining..." : "Join"}</span>
              </button>
              <div className="muted" style={{ fontWeight: 800, fontSize: 12, marginTop: 10 }}>
                After joining, you’ll appear in the players list and the host can start playback.
              </div>
            </div>
          ) : null}
          {joined ? (
            <>
              <div className="muted" style={{ fontWeight: 900, marginBottom: 10 }}>Now Playing</div>
              {lobby.track?.videoId ? (
                <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 14 }}>
                  <img
                    src={lobby.track.coverUrl}
                    alt=""
                    style={{ width: 58, height: 58, borderRadius: 14, objectFit: "cover", border: "1px solid var(--glass-border)" }}
                  />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 900, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {lobby.track.title}
                    </div>
                    <div className="muted" style={{ fontWeight: 800, fontSize: 12 }}>
                      {lobby.track.artist}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="muted" style={{ fontWeight: 800, marginBottom: 14 }}>Host must pick a YouTube track.</div>
              )}
              <div style={{ borderRadius: 18, overflow: "hidden", border: "1px solid var(--glass-border)", background: "#000", aspectRatio: "16/9" }}>
                <YTPlayer
                  videoId={lobby.track?.videoId}
                  playing={Boolean(lobby.transport?.playing && joined)}
                  volume={vol}
                  reqSeek={reqSeek}
                  onSeeked={() => setReqSeek(-1)}
                  onTimeUpdate={(p, d) => {
                    setPos(p);
                    setDur(d);
                  }}
                  onEnd={() => {
                    if (isHost) playNextInQueue(lobbyId);
                  }}
                  pointerEvents="auto"
                />
              </div>
            </>
          ) : (
            <div style={{ background: "var(--bg-dark)", border: "1px dashed var(--glass-border)", borderRadius: 18, padding: 24, textAlign: "center", marginBottom: 14 }}>
              <div className="muted" style={{ fontWeight: 900, marginBottom: 4 }}>Locked Jam</div>
              <div className="muted" style={{ fontWeight: 800, fontSize: 12 }}>Join with the password to see what's playing and listen along.</div>
            </div>
          )}
          {joined && lobby.queue && Object.keys(lobby.queue).length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div className="muted" style={{ fontWeight: 900, marginBottom: 10 }}>Up Next</div>
              <div style={{ display: "grid", gap: 8 }}>
                {Object.keys(lobby.queue).sort().map((qKey) => {
                  const t = lobby.queue[qKey];
                  return (
                    <div key={qKey} style={{ display: "flex", gap: 12, alignItems: "center", padding: "10px", borderRadius: 12, background: "var(--glass)", border: "1px solid var(--glass-border)" }}>
                      <img src={t.coverUrl} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: "cover" }} />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontWeight: 900, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.title}</div>
                        <div className="muted" style={{ fontWeight: 800, fontSize: 11 }}>{t.artist}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {joined ? (
            <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
              <div style={{ display: "flex", gap: 10 }}>
                <input
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="Paste YouTube link or video id"
                  style={{
                    flex: 1,
                    background: "var(--bg-dark)",
                    border: "1px solid var(--glass-border)",
                    borderRadius: 14,
                    padding: "10px 12px",
                    color: "#fff",
                    outline: "none"
                  }}
                />
                <button className="btn" onClick={setFromLink}>
                  <Link2 size={18} />
                  <span>Set</span>
                </button>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <input
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Search tracks"
                  style={{
                    flex: 1,
                    background: "var(--bg-dark)",
                    border: "1px solid var(--glass-border)",
                    borderRadius: 14,
                    padding: "10px 12px",
                    color: "#fff",
                    outline: "none"
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") runSearch();
                  }}
                />
                <button className="btn" onClick={runSearch} disabled={searchBusy}>
                  <SearchIcon size={18} />
                  <span>{searchBusy ? "..." : "Search"}</span>
                </button>
              </div>
              {searchResults.length ? (
                <div style={{ display: "grid", gap: 8, maxHeight: 280, overflowY: "auto" }}>
                  {searchResults.slice(0, 12).map((t) => (
                    <div
                      key={t.id}
                      onClick={() => pickTrack(t)}
                      style={{
                        display: "flex",
                        gap: 12,
                        alignItems: "center",
                        padding: "10px 12px",
                        borderRadius: 16,
                        border: "1px solid var(--glass-border)",
                        background: "var(--glass)",
                        cursor: "pointer"
                      }}
                    >
                      <img src={t.coverUrl} alt="" style={{ width: 44, height: 44, borderRadius: 12, objectFit: "cover" }} />
                      <div style={{ minWidth: 0, flex: 1, overflow: "hidden" }}>
                        <div style={{ fontWeight: 900, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.title}</div>
                        <div className="muted" style={{ fontWeight: 800, fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.artist}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="muted" style={{ marginTop: 14, fontWeight: 800 }}>
              Join the lobby to control the music and search for tracks.
            </div>
          )}
          {err ? (
            <div className="muted" style={{ marginTop: 14, color: "#ff6b6b", fontWeight: 900 }}>
              {err}
            </div>
          ) : null}
        </div>
        <div style={{ display: "grid", gridTemplateRows: "auto 1fr", gap: 18 }}>
          <div style={{ background: "var(--bg-card)", borderRadius: 24, border: "1px solid var(--glass-border)", padding: 18 }}>
            <div className="muted" style={{ fontWeight: 900, display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <Users size={16} />
              <span>Players</span>
            </div>
            <div style={{ display: "grid", gap: 8, maxHeight: 200, overflowY: "auto", paddingRight: 4 }}>
              {Object.keys(participants || {}).map((uid) => {
                const p = participants[uid];
                return (
                  <div
                    key={uid}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      background: "var(--glass)",
                      border: "1px solid var(--glass-border)",
                      borderRadius: 16,
                      padding: "10px 12px"
                    }}
                  >
                    <div style={{ fontWeight: 900 }}>{p?.name || uid.slice(0, 6)}</div>
                    <div className="muted" style={{ fontSize: 12, fontWeight: 900 }}>{p?.role || "—"}</div>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ background: "var(--bg-card)", borderRadius: 24, border: "1px solid var(--glass-border)", padding: 18, display: "flex", flexDirection: "column" }}>
            <div className="muted" style={{ fontWeight: 900, display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <MessageSquare size={16} />
              <span>Chat</span>
            </div>
            <div style={{ height: 400, overflowY: "auto", display: "grid", gap: 10, paddingRight: 6, alignContent: "start" }}>
              {chat.map((m) => (
                <div key={m.id} style={{ background: "var(--glass)", border: "1px solid var(--glass-border)", borderRadius: 16, padding: "10px 12px" }}>
                  <div className="muted" style={{ fontSize: 12, fontWeight: 900 }}>{m.name || m.uid?.slice(0, 6)}</div>
                  <div style={{ fontWeight: 700 }}>{m.text}</div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
              <input
                value={chatText}
                onChange={(e) => setChatText(e.target.value)}
                placeholder="Say something..."
                style={{
                  flex: 1,
                  background: "var(--bg-dark)",
                  border: "1px solid var(--glass-border)",
                  borderRadius: 14,
                  padding: "10px 12px",
                  color: "#fff",
                  outline: "none"
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onSend();
                }}
              />
              <button className="btn" onClick={onSend}>
                <MessageSquare size={18} />
                <span>Send</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
