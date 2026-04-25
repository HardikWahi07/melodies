import React, { useContext, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthCtx } from "../context/AuthCtx";
import { PlayerCtx } from "../context/PlayerCtx";
import { rdb } from "../firebase";
import { ref, onValue, remove, update, push, set } from "firebase/database";
import TrackRow from "../components/TrackRow";
import { Play, ArrowLeft, Trash2, Music, X, Share2, Check, Heart, User, Sparkles } from "lucide-react";

function MatchRing({ percent }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  const color = percent >= 70 ? "#00E676" : percent >= 40 ? "#FFD600" : "#FF6B6B";

  return (
    <div style={{ position: "relative", width: 140, height: 140 }}>
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
        <circle
          cx="70" cy="70" r={r} fill="none"
          stroke={color} strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          transform="rotate(-90 70 70)"
          style={{ transition: "stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)" }}
        />
      </svg>
      <div style={{
        position: "absolute", inset: 0,
        display: "grid", placeItems: "center"
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 36, fontWeight: 900, color, lineHeight: 1 }}>{percent}%</div>
          <div style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1 }}>Match</div>
        </div>
      </div>
    </div>
  );
}

function MatchLabel({ percent }) {
  if (percent >= 85) return "Soul Twins 🔥";
  if (percent >= 70) return "Cosmic Connection ✨";
  if (percent >= 50) return "Vibing Together 🎶";
  if (percent >= 30) return "Different Flavors 🌈";
  return "Musical Opposites 🎭";
}

export default function Playlist() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { me } = useContext(AuthCtx);
  const { playTrack } = useContext(PlayerCtx);
  const [pl, setPl] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;
    const plRef = ref(rdb, `playlists/${id}`);
    return onValue(plRef, (snap) => {
      const val = snap.val();
      if (val) {
        const tracksArr = val.tracks ? Object.values(val.tracks) : [];
        setPl({ id: snap.key, ...val, tracksList: tracksArr });
      } else {
        setPl(null);
      }
    });
  }, [id]);

  const delTrack = async (t, e) => {
    if (e) e.stopPropagation();
    if (!me || !pl || !pl.tracks) return;
    const trackKey = Object.keys(pl.tracks).find(k => pl.tracks[k].id === t.id);
    if (trackKey) {
      await remove(ref(rdb, `playlists/${id}/tracks/${trackKey}`));
    }
  };

  const delPlaylist = async () => {
    if (!confirm("Delete this entire playlist?")) return;
    await remove(ref(rdb, `playlists/${id}`));
    navigate("/library");
  };

  const togglePublic = async () => {
    if (!me || pl.uid !== me.uid) return;
    await update(ref(rdb, `playlists/${id}`), {
      isPublic: !pl.isPublic,
      ownerEmail: me.email
    });
  };

  const copyShare = () => {
    navigator.clipboard.writeText(`https://fancy-conkies-6f717f.netlify.app${window.location.pathname}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!pl) return <div className="main">Loading...</div>;

  const isBlend = pl.type === "blend" && pl.blendMeta;
  const blend = pl.blendMeta || {};

  return (
    <div className="main" style={{ padding: '0' }}>
      {/* Header */}
      {isBlend ? (
        /* ─── Blend header ─── */
        <div style={{
          background: "linear-gradient(135deg, #0a0010 0%, #1a0030 40%, #002D1E 100%)",
          padding: "clamp(30px, 6vw, 60px) clamp(20px, 4vw, 40px)",
          position: "relative",
          overflow: "hidden"
        }}>
          {/* Background effects */}
          <div style={{
            position: "absolute", inset: 0,
            background: "radial-gradient(circle at 25% 50%, rgba(0,230,118,0.12), transparent 50%), radial-gradient(circle at 75% 50%, rgba(255,0,128,0.1), transparent 50%)",
            pointerEvents: "none"
          }} />
          <div style={{
            position: "absolute", width: 250, height: 250, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(0,230,118,0.12), transparent 70%)",
            top: -60, right: -40, filter: "blur(50px)", pointerEvents: "none"
          }} />

          <div style={{ position: "relative", zIndex: 2 }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 8, marginBottom: 20
            }}>
              <div style={{
                background: "linear-gradient(135deg, #00E676, #FF0080)",
                padding: "5px 14px", borderRadius: 40,
                fontSize: 10, fontWeight: 900, letterSpacing: 2, textTransform: "uppercase",
                color: "#fff"
              }}>
                <Sparkles size={10} style={{ marginRight: 4, verticalAlign: -1 }} />
                AI Blend
              </div>
            </div>

            <div style={{
              display: "flex", alignItems: "center", gap: "clamp(20px, 5vw, 48px)", flexWrap: "wrap"
            }}>
              {/* User avatars */}
              <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{
                    width: 72, height: 72, borderRadius: "50%",
                    background: "linear-gradient(135deg, #00E676, #00C853)",
                    display: "grid", placeItems: "center",
                    boxShadow: "0 0 25px rgba(0,230,118,0.3)"
                  }}>
                    <User size={32} color="#fff" />
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 13, marginTop: 8 }}>{blend.user1Name}</div>
                </div>

                <div style={{
                  width: 40, height: 40, borderRadius: "50%",
                  background: "linear-gradient(135deg, #00E676, #FF0080)",
                  display: "grid", placeItems: "center",
                  boxShadow: "0 0 20px rgba(255,0,128,0.2)"
                }}>
                  <Heart size={18} color="#fff" fill="#fff" />
                </div>

                <div style={{ textAlign: "center" }}>
                  <div style={{
                    width: 72, height: 72, borderRadius: "50%",
                    background: "linear-gradient(135deg, #FF0080, #FF6B6B)",
                    display: "grid", placeItems: "center",
                    boxShadow: "0 0 25px rgba(255,0,128,0.3)"
                  }}>
                    <User size={32} color="#fff" />
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 13, marginTop: 8 }}>{blend.user2Name}</div>
                </div>
              </div>

              {/* Match ring */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <MatchRing percent={blend.matchPercent || 0} />
                <div style={{
                  fontWeight: 900, fontSize: 14,
                  color: "rgba(255,255,255,0.7)"
                }}>
                  {MatchLabel({ percent: blend.matchPercent || 0 })}
                </div>
              </div>

              {/* Title & meta */}
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontSize: "clamp(28px, 4vw, 52px)", fontWeight: 900, lineHeight: 1, marginBottom: 12 }}>
                  {pl.name}
                </div>
                <div className="muted" style={{ fontSize: 13, fontWeight: 700, marginBottom: 16 }}>
                  {pl.tracksList.length} tracks • Created {new Date(blend.createdAt || pl.createdAt).toLocaleDateString()}
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button className="btn" onClick={() => playTrack(pl.tracksList[0], pl.tracksList)}
                    style={{ padding: "12px 28px" }}>
                    <Play size={18} fill="#fff" />
                    <span>Play All</span>
                  </button>
                  <button className="btnGhost" onClick={copyShare}>
                    {copied ? <Check size={16} color="var(--pink)" /> : <Share2 size={16} />}
                    <span>{copied ? "Copied" : "Share"}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Match description */}
            <div style={{
              marginTop: 28, padding: "16px 20px",
              background: "rgba(255,255,255,0.04)",
              borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)",
              maxWidth: 600
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.6)", lineHeight: 1.6 }}>
                {blend.matchPercent >= 70
                  ? `${blend.user1Name} and ${blend.user2Name} have incredibly similar music taste! This blend leans into your shared favorites while sprinkling in a few surprises.`
                  : blend.matchPercent >= 40
                    ? `${blend.user1Name} and ${blend.user2Name} share some common ground but also have unique tastes. This blend bridges both worlds with songs you'll both love.`
                    : `${blend.user1Name} and ${blend.user2Name} have quite different musical palettes! This blend is a journey of discovery — expect to find new favorites from each other's world.`
                }
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ─── Normal playlist header ─── */
        <div style={{
          height: '400px',
          background: `linear-gradient(to bottom, var(--pink-glow), #0A0A0A)`,
          padding: '60px',
          display: 'flex', alignItems: 'flex-end', gap: '40px'
        }}>
          <div style={{
            width: '240px', height: '240px', background: '#222',
            borderRadius: '24px', display: 'grid', placeItems: 'center'
          }}>
            <Music size={80} color="var(--pink)" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '80px', fontWeight: '900' }}>{pl.name}</div>
            <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
              <button className="btn" onClick={() => playTrack(pl.tracksList[0], pl.tracksList)}>
                <Play size={18} fill="#fff" />
                <span>Play All</span>
              </button>
              <button className="btnGhost" onClick={copyShare}>
                {copied ? <Check size={16} color="var(--pink)" /> : <Share2 size={16} />}
                <span>{copied ? "Copied" : "Share"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Track list */}
      <div style={{ padding: '40px' }}>
        {isBlend && (
          <div style={{
            display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap"
          }}>
            <div style={{
              padding: "8px 16px", borderRadius: 40,
              background: "rgba(0,230,118,0.08)", border: "1px solid rgba(0,230,118,0.2)",
              fontSize: 12, fontWeight: 800, color: "var(--pink)"
            }}>
              🟢 = {blend.user1Name}
            </div>
            <div style={{
              padding: "8px 16px", borderRadius: 40,
              background: "rgba(255,0,128,0.08)", border: "1px solid rgba(255,0,128,0.2)",
              fontSize: 12, fontWeight: 800, color: "#FF0080"
            }}>
              🩷 = {blend.user2Name}
            </div>
            <div style={{
              padding: "8px 16px", borderRadius: 40,
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
              fontSize: 12, fontWeight: 800, color: "#aaa"
            }}>
              💜 = Both
            </div>
          </div>
        )}

        {pl.tracksList.map(t => {
          const name = t.recommendedForName || "";
          const shortName = name.length > 12 ? name.substring(0, 10) + ".." : name;
          const badge = isBlend && t.recommendedForName ? {
            text: `${t.recommendedForUid === blend.user1Uid ? "🟢" : t.recommendedForUid === blend.user2Uid ? "🩷" : "💜"} ${shortName}`,
            bg: t.recommendedForUid === blend.user1Uid ? "rgba(0,230,118,0.1)" : t.recommendedForUid === blend.user2Uid ? "rgba(255,0,128,0.1)" : "rgba(255,255,255,0.04)",
            color: t.recommendedForUid === blend.user1Uid ? "#00E676" : t.recommendedForUid === blend.user2Uid ? "#FF0080" : "#888",
            border: t.recommendedForUid === blend.user1Uid ? "rgba(0,230,118,0.2)" : t.recommendedForUid === blend.user2Uid ? "rgba(255,0,128,0.2)" : "rgba(255,255,255,0.08)"
          } : null;

          return (
            <TrackRow 
              key={t.id} 
              t={t} 
              onPlay={() => playTrack(t, pl.tracksList)} 
              blendBadge={badge}
            />
          );
        })}
      </div>
    </div>
  );
}
