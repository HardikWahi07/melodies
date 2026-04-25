import React, { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, UserPlus, UserMinus, Loader2 } from "lucide-react";
import { AuthCtx } from "../context/AuthCtx";
import { PlayerCtx } from "../context/PlayerCtx";
import TrackRow from "../components/TrackRow";
import { apiGet } from "../api.js";
import { useFollowingArtists } from "../hooks/useFollowingArtists";
import { followArtist, unfollowArtist } from "../api/artists";
export default function ArtistPage() {
  const { id } = useParams();
  const artistId = id;
  const nav = useNavigate();
  const { me } = useContext(AuthCtx);
  const { playTrack } = useContext(PlayerCtx);
  const following = useFollowingArtists(me);
  const [tracks, setTracks] = useState([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [artistName, setArtistName] = useState(artistId);
  const followed = useMemo(() => following.find(a => a.id === artistId), [following, artistId]);
  useEffect(() => {
    setLoading(true);
    const name = followed?.name || artistId;
    setArtistName(name);
    apiGet(`/api/music/search?q=${encodeURIComponent(`${name} Official`)}`)
      .then((res) => setTracks(res?.tracks || []))
      .finally(() => setLoading(false));
  }, [artistId, followed?.name]);
  const toggleFollow = async () => {
    if (!me) return;
    setBusy(true);
    try {
      if (followed) await unfollowArtist(me, artistId);
      else await followArtist(me, artistName);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="main" style={{ padding: 48 }}>
      <div className="secTop" style={{ marginBottom: 18 }}>
        <button className="btnGhost" onClick={() => nav("/artists")}>
          <ArrowLeft size={18} />
          <span>Back</span>
        </button>
        <div style={{ flex: 1 }}>
          <div className="h1" style={{ fontSize: 32 }}>
            {artistName} <span style={{ color: "var(--pink)" }}>Radio</span>
          </div>
          <div className="muted" style={{ fontWeight: 800 }}>Recommendations + official videos.</div>
        </div>
        {me ? (
          <button className="btn" onClick={toggleFollow} disabled={busy}>
            {busy ? <Loader2 size={18} className="spin" /> : followed ? <UserMinus size={18} /> : <UserPlus size={18} />}
            <span>{followed ? "Unfollow" : "Follow"}</span>
          </button>
        ) : null}
      </div>
      {loading ? (
        <div className="muted">Loading…</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {tracks.map((t) => (
            <TrackRow key={t.id} t={t} onPlay={() => playTrack(t, tracks)} showAdd />
          ))}
        </div>
      )}
    </div>
  );
}
