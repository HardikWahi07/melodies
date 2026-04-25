import React, { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, UserPlus, UserMinus, Search as SearchIcon, Music2 } from "lucide-react";
import { AuthCtx } from "../context/AuthCtx";
import { followArtist, unfollowArtist } from "../api/artists";
import { useFollowingArtists } from "../hooks/useFollowingArtists";
import { artistIdFromName } from "../utils/artist";
import { apiGet } from "../api.js";
export default function Artists() {
  const { me } = useContext(AuthCtx);
  const nav = useNavigate();
  const following = useFollowingArtists(me);
  const [newArtist, setNewArtist] = useState("");
  const [busyId, setBusyId] = useState("");
  const [discover, setDiscover] = useState([]);
  const followedSet = useMemo(() => new Set(following.map(a => a.id)), [following]);
  useEffect(() => {
    apiGet("/api/music/trending")
      .then((res) => {
        const tracks = res?.tracks || [];
        const unique = {};
        for (const t of tracks) {
          const name = String(t?.artist || "").trim();
          if (!name) continue;
          const id = artistIdFromName(name);
          if (!unique[id]) unique[id] = { id, name };
        }
        setDiscover(Object.values(unique).slice(0, 18));
      })
      .catch(() => setDiscover([]));
  }, []);
  const onAdd = async () => {
    if (!me) return;
    const name = newArtist.trim();
    if (!name) return;
    const id = artistIdFromName(name);
    setBusyId(id);
    try {
      await followArtist(me, name);
      setNewArtist("");
    } finally {
      setBusyId("");
    }
  };
  const toggleFollow = async (id, name) => {
    if (!me) return;
    setBusyId(id);
    try {
      if (followedSet.has(id)) await unfollowArtist(me, id);
      else await followArtist(me, name);
    } finally {
      setBusyId("");
    }
  };
  return (
    <div className="main" style={{ padding: 48 }}>
      <div className="secTop" style={{ marginBottom: 24 }}>
        <div>
          <div className="h1" style={{ fontSize: 32 }}>
            Artists <span style={{ color: "var(--pink)" }}>You Follow</span>
          </div>
          <div className="muted" style={{ fontWeight: 800 }}>
            Follow artists to change recommendations.
          </div>
        </div>
      </div>
      {!me ? (
        <div className="muted">Login required.</div>
      ) : (
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 24 }}>
          <div style={{ flex: 1, display: "flex", gap: 10, alignItems: "center", background: "var(--bg-card)", border: "1px solid var(--glass-border)", padding: "12px 14px", borderRadius: 16 }}>
            <SearchIcon size={18} color="var(--pink)" />
            <input
              value={newArtist}
              onChange={(e) => setNewArtist(e.target.value)}
              placeholder="Type artist name (e.g. The Weeknd)"
              style={{ flex: 1, background: "transparent", border: "none", color: "#fff", outline: "none", fontWeight: 800 }}
              onKeyDown={(e) => {
                if (e.key === "Enter") onAdd();
              }}
            />
          </div>
          <button className="btn" onClick={onAdd} disabled={!newArtist.trim()}>
            <Plus size={18} />
            <span>Follow</span>
          </button>
        </div>
      )}
      <div className="plGrid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
        {following.map((a) => (
          <div
            key={a.id}
            className="plCard"
            style={{ minHeight: 120, cursor: "pointer", display: "flex", gap: 12, alignItems: "center" }}
            onClick={() => nav(`/artist/${a.id}`)}
          >
            <div style={{ width: 56, height: 56, borderRadius: 18, background: "var(--glass)", border: "1px solid var(--glass-border)", display: "grid", placeItems: "center" }}>
              <Music2 size={22} color="var(--pink)" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 900, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {a.name}
              </div>
              <div className="muted" style={{ fontWeight: 800, fontSize: 12 }}>
                Following
              </div>
            </div>
            <button
              className="icoBtn"
              onClick={(e) => {
                e.stopPropagation();
                toggleFollow(a.id, a.name);
              }}
              disabled={busyId === a.id}
              title="Unfollow"
            >
              <UserMinus size={18} />
            </button>
          </div>
        ))}
      </div>
      <div className="secTop" style={{ marginTop: 36, marginBottom: 14 }}>
        <div className="h1" style={{ fontSize: 22 }}>
          Discover <span style={{ color: "var(--pink)" }}>Artists</span>
        </div>
      </div>
      <div className="plGrid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
        {discover.map((a) => (
          <div
            key={a.id}
            className="plCard"
            style={{ minHeight: 120, cursor: "pointer", display: "flex", gap: 12, alignItems: "center" }}
            onClick={() => nav(`/artist/${a.id}`)}
          >
            <div style={{ width: 56, height: 56, borderRadius: 18, background: "var(--glass)", border: "1px solid var(--glass-border)", display: "grid", placeItems: "center" }}>
              <Music2 size={22} color="var(--pink)" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 900, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {a.name}
              </div>
              <div className="muted" style={{ fontWeight: 800, fontSize: 12 }}>
                From trending
              </div>
            </div>
            {me ? (
              <button
                className="icoBtn"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFollow(a.id, a.name);
                }}
                disabled={busyId === a.id}
                title={followedSet.has(a.id) ? "Unfollow" : "Follow"}
              >
                {followedSet.has(a.id) ? <UserMinus size={18} /> : <UserPlus size={18} />}
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
