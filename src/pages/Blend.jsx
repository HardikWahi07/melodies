import React, { useContext, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Users, Wand2, Sparkles, Heart, Music, Loader2, ArrowRight, User } from "lucide-react";
import { AuthCtx } from "../context/AuthCtx";
import { createBlend } from "../api/blend";
import { getUserProfile } from "../api/profiles";

function parseUid(input) {
  const s = input.trim();
  const m = s.match(/profile\/([^/?#]+)/i);
  if (m?.[1]) return m[1];
  return s;
}

export default function Blend() {
  const { me } = useContext(AuthCtx);
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const [otherUid, setOtherUid] = useState(sp.get("with") || "");
  const [otherName, setOtherName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [progress, setProgress] = useState("");

  useEffect(() => {
    const uid = parseUid(otherUid);
    if (!uid || uid.length < 4) {
      setOtherName("");
      return;
    }
    getUserProfile(uid).then((p) => setOtherName(p?.name || p?.email?.split("@")[0] || "")).catch(() => setOtherName(""));
  }, [otherUid]);

  const go = async () => {
    if (!me) return;
    setErr("");
    const uid = parseUid(otherUid);
    if (!uid) return setErr("Enter a user UID or paste their profile link.");
    if (uid === me.uid) return setErr("You can't blend with yourself!");
    setBusy(true);
    setProgress("Analyzing listening histories...");
    try {
      setTimeout(() => setProgress("Comparing musical tastes with AI..."), 3000);
      setTimeout(() => setProgress("Resolving tracks on YouTube..."), 8000);
      setTimeout(() => setProgress("Building your blend playlist..."), 14000);
      const pid = await createBlend(me, uid);
      nav(`/playlist/${pid}`);
    } catch (e) {
      setErr(e?.message || "Failed to create blend.");
    } finally {
      setBusy(false);
      setProgress("");
    }
  };

  const myName = me?.email?.split("@")[0] || "You";

  return (
    <div className="main" style={{ padding: 0 }}>
      {/* Hero */}
      <div style={{
        background: "linear-gradient(135deg, #0a0010 0%, #1a0030 40%, #002D1E 100%)",
        padding: "clamp(40px, 8vw, 80px) clamp(20px, 6vw, 60px)",
        position: "relative",
        overflow: "hidden"
      }}>
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(circle at 30% 50%, rgba(0,230,118,0.12), transparent 60%), radial-gradient(circle at 70% 30%, rgba(255,0,128,0.08), transparent 50%)",
          pointerEvents: "none"
        }} />

        {/* Floating orbs */}
        <div style={{
          position: "absolute", width: 300, height: 300, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0,230,118,0.15), transparent 70%)",
          top: -80, right: -60, filter: "blur(60px)", pointerEvents: "none",
          animation: "blendFloat 6s ease-in-out infinite"
        }} />
        <div style={{
          position: "absolute", width: 200, height: 200, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,0,128,0.12), transparent 70%)",
          bottom: -40, left: "20%", filter: "blur(40px)", pointerEvents: "none",
          animation: "blendFloat 8s ease-in-out infinite reverse"
        }} />

        <div style={{ position: "relative", zIndex: 2 }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 12, marginBottom: 16
          }}>
            <div style={{
              background: "linear-gradient(135deg, #00E676, #00C853)",
              padding: "6px 16px", borderRadius: 40,
              fontSize: 11, fontWeight: 900, letterSpacing: 3, textTransform: "uppercase",
              color: "#000"
            }}>
              <Sparkles size={12} style={{ marginRight: 6, verticalAlign: -1 }} />
              AI-Powered
            </div>
          </div>

          <div style={{
            fontSize: "clamp(36px, 6vw, 72px)", fontWeight: 900, lineHeight: 1,
            marginBottom: 20, letterSpacing: -2
          }}>
            Music <span style={{ color: "var(--pink)" }}>Blend</span>
          </div>
          <div style={{
            fontSize: 18, fontWeight: 600, color: "rgba(255,255,255,0.5)",
            maxWidth: 500, lineHeight: 1.6
          }}>
            Combine your listening history with a friend's to discover a unique playlist that bridges both your musical worlds.
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ padding: "clamp(24px, 5vw, 50px) clamp(16px, 4vw, 60px)", maxWidth: 900, margin: "0 auto" }}>
        {!me ? (
          <div className="muted" style={{ textAlign: "center", padding: 40 }}>Login required to use Blend.</div>
        ) : (
          <>
            {/* User cards */}
            <div className="blendGrid" style={{ marginBottom: 40 }}>
              {/* You */}
              <div style={{
                background: "var(--bg-card)", border: "1px solid var(--glass-border)",
                borderRadius: 24, padding: 28, textAlign: "center"
              }}>
                <div style={{
                  width: 80, height: 80, borderRadius: "50%",
                  background: "linear-gradient(135deg, #00E676, #00C853)",
                  display: "grid", placeItems: "center", margin: "0 auto 16px"
                }}>
                  <User size={36} color="#fff" />
                </div>
                <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 4 }}>{myName}</div>
                <div className="muted" style={{ fontSize: 12, fontWeight: 800 }}>You</div>
              </div>

              {/* Connector */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <div style={{
                  width: 56, height: 56, borderRadius: "50%",
                  background: "linear-gradient(135deg, #00E676, #FF0080)",
                  display: "grid", placeItems: "center",
                  boxShadow: "0 0 30px rgba(0,230,118,0.3), 0 0 30px rgba(255,0,128,0.2)"
                }}>
                  <Heart size={24} color="#fff" fill="#fff" />
                </div>
                <div className="muted" style={{ fontSize: 11, fontWeight: 900, letterSpacing: 2, textTransform: "uppercase" }}>
                  Blend
                </div>
              </div>

              {/* Friend */}
              <div style={{
                background: "var(--bg-card)", border: "1px solid var(--glass-border)",
                borderRadius: 24, padding: 28, textAlign: "center"
              }}>
                <div style={{
                  width: 80, height: 80, borderRadius: "50%",
                  background: otherName
                    ? "linear-gradient(135deg, #FF0080, #FF6B6B)"
                    : "var(--glass-thick)",
                  display: "grid", placeItems: "center", margin: "0 auto 16px",
                  border: otherName ? "none" : "2px dashed var(--glass-border)",
                  transition: "0.4s"
                }}>
                  <User size={36} color={otherName ? "#fff" : "#555"} />
                </div>
                <div style={{
                  fontWeight: 900, fontSize: 18, marginBottom: 4,
                  color: otherName ? "#fff" : "#555"
                }}>
                  {otherName || "Friend"}
                </div>
                <div className="muted" style={{ fontSize: 12, fontWeight: 800 }}>
                  {otherName ? "Found ✓" : "Enter below"}
                </div>
              </div>
            </div>

            {/* Input */}
            <div style={{
              background: "var(--bg-card)", border: "1px solid var(--glass-border)",
              borderRadius: 24, padding: 28
            }}>
              <div className="muted" style={{ fontWeight: 900, marginBottom: 12, fontSize: 12, letterSpacing: 1, textTransform: "uppercase" }}>
                Friend's UID or Profile Link
              </div>
              <input
                value={otherUid}
                onChange={(e) => setOtherUid(e.target.value)}
                placeholder="Paste UID or profile link (e.g. /profile/abc123)"
                style={{
                  width: "100%",
                  background: "var(--bg-dark)",
                  border: "1px solid var(--glass-border)",
                  borderRadius: 16,
                  padding: "14px 18px",
                  color: "#fff",
                  outline: "none",
                  fontWeight: 700,
                  fontSize: 15,
                  transition: "0.3s"
                }}
                onFocus={(e) => e.target.style.borderColor = "var(--pink)"}
                onBlur={(e) => e.target.style.borderColor = "var(--glass-border)"}
                onKeyDown={(e) => { if (e.key === "Enter") go(); }}
              />

              {otherName && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 8,
                  marginTop: 12, padding: "10px 16px",
                  background: "rgba(0,230,118,0.08)", borderRadius: 12,
                  border: "1px solid rgba(0,230,118,0.2)"
                }}>
                  <User size={16} color="var(--pink)" />
                  <span style={{ fontWeight: 800, fontSize: 14 }}>
                    Blending with <span style={{ color: "var(--pink)" }}>{otherName}</span>
                  </span>
                </div>
              )}

              {err && (
                <div style={{
                  marginTop: 12, padding: "10px 16px",
                  background: "rgba(255,80,80,0.08)", borderRadius: 12,
                  border: "1px solid rgba(255,80,80,0.2)",
                  color: "#ff6b6b", fontWeight: 800, fontSize: 13
                }}>
                  {err}
                </div>
              )}

              <button
                className="btn"
                onClick={go}
                disabled={busy}
                style={{
                  marginTop: 20, width: "100%",
                  padding: "16px 24px", fontSize: 15,
                  background: busy ? "var(--bg-card)" : "linear-gradient(90deg, #00E676, #00C853)",
                  position: "relative", overflow: "hidden"
                }}
              >
                {busy ? (
                  <>
                    <Loader2 size={20} className="spin" />
                    <span>{progress || "Creating blend..."}</span>
                  </>
                ) : (
                  <>
                    <Wand2 size={20} />
                    <span>Create Blend Playlist</span>
                    <ArrowRight size={18} style={{ marginLeft: 4 }} />
                  </>
                )}
              </button>

              <div className="muted" style={{
                fontWeight: 700, fontSize: 12, marginTop: 14,
                lineHeight: 1.6, textAlign: "center"
              }}>
                AI analyzes both users' listening histories and followed artists to create
                a unique playlist with a taste-match percentage.
              </div>
            </div>

            {/* How it works */}
            <div style={{ marginTop: 40 }}>
              <div className="muted" style={{
                fontWeight: 900, fontSize: 12, letterSpacing: 2,
                textTransform: "uppercase", marginBottom: 20, textAlign: "center"
              }}>
                How Blend Works
              </div>
              <div style={{
                display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16
              }}>
                {[
                  { icon: <Users size={24} />, title: "Compare", desc: "We pull both users' listening history and followed artists" },
                  { icon: <Sparkles size={24} />, title: "AI Match", desc: "AI analyzes taste overlap and generates a curated playlist" },
                  { icon: <Music size={24} />, title: "Enjoy", desc: "A private playlist appears on both profiles with match %" }
                ].map((step, i) => (
                  <div key={i} style={{
                    background: "var(--bg-card)", border: "1px solid var(--glass-border)",
                    borderRadius: 20, padding: 24, textAlign: "center",
                    transition: "0.3s"
                  }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: "50%",
                      background: "rgba(0,230,118,0.1)", display: "grid", placeItems: "center",
                      margin: "0 auto 14px", color: "var(--pink)"
                    }}>
                      {step.icon}
                    </div>
                    <div style={{ fontWeight: 900, fontSize: 15, marginBottom: 6 }}>{step.title}</div>
                    <div className="muted" style={{ fontSize: 12, fontWeight: 700, lineHeight: 1.5 }}>{step.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes blendFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        .spin { animation: rotate 1s linear infinite; }
        @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
