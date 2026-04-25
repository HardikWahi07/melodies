import React, { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { onValue, ref, query, limitToLast } from "firebase/database";
import { Users, Plus, Music2 } from "lucide-react";
import { AuthCtx } from "../context/AuthCtx";
import { rdb } from "../firebase";
import { createLobby, cleanupIdleLobbies } from "../api/jam";
import { Search } from "lucide-react";
export default function Jam() {
  const { me } = useContext(AuthCtx);
  const nav = useNavigate();
  const [name, setName] = useState("My Lobby");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [lobbies, setLobbies] = useState([]);
  const [search, setSearch] = useState("");
  const [err, setErr] = useState("");
  const canUse = Boolean(me);
  useEffect(() => {
    const q = query(ref(rdb, "lobbies"), limitToLast(25));
    const unsub = onValue(q, (snap) => {
      const v = snap.val() || {};
      const arr = Object.keys(v).map((id) => ({ id, ...v[id] }));
      arr.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setLobbies(arr);
    });
    cleanupIdleLobbies().catch(console.error);
    return unsub;
  }, []);
  const filtered = useMemo(() => {
    if (!search.trim()) return lobbies;
    const q = search.toLowerCase();
    return lobbies.filter(l => (l.name || "").toLowerCase().includes(q));
  }, [lobbies, search]);
  const header = useMemo(() => {
    const count = lobbies.length;
    return count ? `${count} lobbies live` : "No lobbies yet";
  }, [lobbies.length]);
  const onCreate = async () => {
    if (!me || busy) return;
    if (!password.trim()) return;
    setBusy(true);
    setErr("");
    try {
      const id = await createLobby(me, name, password);
      nav(`/jam/${id}`);
    } catch (e) {
      console.error(e);
      setErr(e?.message || "Failed to create lobby.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="main" style={{ padding: "48px" }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: "24px" }}>
        <div style={{ flex: 1, display: "flex", gap: 10, alignItems: "center", background: "var(--bg-card)", border: "1px solid var(--glass-border)", padding: "12px 14px", borderRadius: 16 }}>
          <Search size={18} color="var(--pink)" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search jam by name..."
            style={{ flex: 1, background: "transparent", border: "none", color: "#fff", outline: "none", fontWeight: 800 }}
          />
        </div>
      </div>
      {!canUse ? (
        <div className="muted">Login required to create/join a lobby.</div>
      ) : (
        <div style={{ display: "grid", gap: 12, marginBottom: 28 }}>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Lobby name"
              style={{
                flex: 1,
                background: "var(--bg-dark)",
                border: "1px solid var(--glass-border)",
                borderRadius: "14px",
                padding: "12px 14px",
                color: "#fff",
                outline: "none"
              }}
            />
            <button className="btn" onClick={onCreate} disabled={busy || !password.trim()}>
              <Plus size={18} />
              <span>{busy ? "Creating..." : "Create"}</span>
            </button>
          </div>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Lobby password (required)"
            type="password"
            style={{
              background: "var(--bg-dark)",
              border: "1px solid var(--glass-border)",
              borderRadius: "14px",
              padding: "12px 14px",
              color: "#fff",
              outline: "none"
            }}
          />
          <div className="muted" style={{ fontWeight: 800, fontSize: 12 }}>
            Password is required to join. Don’t reuse sensitive passwords (this is client-side).
          </div>
          {err ? (
            <div className="muted" style={{ color: "#ff6b6b", fontWeight: 900 }}>
              {err}
            </div>
          ) : null}
        </div>
      )}
      <div className="plGrid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "18px" }}>
        {filtered.map((l) => (
          <div
            key={l.id}
            className="plCard"
            style={{ minHeight: 150, cursor: "pointer", display: "flex", flexDirection: "column", gap: "10px" }}
            onClick={() => nav(`/jam/${l.id}`)}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontWeight: 900, fontSize: 16 }}>{l.name || "Jam Lobby"}</div>
              <div className="muted" style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
                <Users size={14} />
                <span>{l.maxParticipants || 8}</span>
              </div>
            </div>
            <div className="muted" style={{ fontSize: 13 }}>
              <span style={{ color: "var(--pink)", fontWeight: 900 }}>{l.song?.drumStyle || "dance"}</span>
              {" • "}
              {l.song?.bpm || 120} BPM
            </div>
            <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 12, background: "var(--glass)", display: "grid", placeItems: "center" }}>
                <Music2 size={18} color="var(--pink)" />
              </div>
              <div className="muted" style={{ fontSize: 12 }}>
                Host: {l.hostUid?.slice(0, 6) || "—"}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
