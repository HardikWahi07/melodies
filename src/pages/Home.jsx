import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiGet } from "../api.js";
import { PlayerCtx } from "../context/PlayerCtx.jsx";
import { AuthCtx } from "../context/AuthCtx.jsx";
import TrackRow from "../components/TrackRow.jsx";
import { Play, Forward, Heart, Plus, Sparkles, Loader2, Globe, Users, TrendingUp } from "lucide-react";
import { ref, get, limitToLast, query } from "firebase/database";
import { rdb } from "../firebase.js";
export default function Home() {
  const { playTrack } = useContext(PlayerCtx);
  const { me } = useContext(AuthCtx);
  const navigate = useNavigate();
  const [trending, setTrending] = useState([]);
  const [newReleases, setNewReleases] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [recLabel, setRecLabel] = useState("");
  const [recLoading, setRecLoading] = useState(true);
  const [globalTrends, setGlobalTrends] = useState([]);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  useEffect(() => {
    Promise.all([
      apiGet("/api/music/trending"),
      apiGet("/api/music/search?q=new releases 2024")
    ]).then(([trend, news]) => {
      setTrending(trend.tracks || []);
      setNewReleases(news.tracks?.slice(0, 5) || []);
    });
  }, []);
  useEffect(() => {
    if (!me) return;
    setRecLoading(true);
    const buildRecs = async () => {
      const streamSnap = await get(ref(rdb, `streamData/${me.uid}`));
      const streamData = streamSnap.val();
      if (streamData) {
        const artists = Object.values(streamData)
          .filter((v) => v.meta?.artist && v.seconds > 0)
          .sort((a, b) => (b.seconds || 0) - (a.seconds || 0))
          .map((v) => v.meta.artist);
        const unique = [...new Set(artists)].slice(0, 2);
        if (unique.length > 0) {
          const res = await apiGet(`/api/music/search?q=${encodeURIComponent(unique[0])}`);
          const tracks = (res.tracks || []).slice(0, 6);
          if (tracks.length > 0) {
            setRecommended(tracks);
            setRecLabel(`Inspired by ${unique[0]}`);
            setRecLoading(false);
            return;
          }
        }
      }
      const res = await apiGet("/api/music/search?q=top hits pop 2024");
      setRecommended((res.tracks || []).slice(0, 6));
      setRecLabel("Popular right now");
      setRecLoading(false);
    };
    buildRecs().catch(() => setRecLoading(false));
  }, [me]);
  useEffect(() => {
    if (!me) return;
    get(ref(rdb, "streamData")).then(snap => {
      const data = snap.val();
      if (data && typeof data === 'object') {
        const totals = {};
        Object.values(data).forEach((userStreams) => {
          if (!userStreams || typeof userStreams !== 'object') return;
          Object.values(userStreams).forEach((s) => {
            if (s && s.meta && s.meta.id) {
              if (!totals[s.meta.id]) totals[s.meta.id] = { seconds: 0, meta: s.meta };
              totals[s.meta.id].seconds += (s.seconds || 0);
            }
          });
        });
        const sorted = Object.values(totals)
          .sort((a, b) => b.seconds - a.seconds)
          .slice(0, 5)
          .map(x => x.meta);
        setGlobalTrends(sorted);
      }
    }).catch(err => console.error("Global trends error:", err));
    const usersRef = query(ref(rdb, "users"), limitToLast(20));
    get(usersRef).then(async (snap) => {
      const allUsers = snap.val();
      if (allUsers && typeof allUsers === 'object') {
        const myFollowingSnap = await get(ref(rdb, `users/${me.uid}/userFollowing`));
        const myFollowing = myFollowingSnap.exists() ? Object.keys(myFollowingSnap.val()) : [];
        const possible = Object.keys(allUsers)
          .filter(u => u !== me.uid && !myFollowing.includes(u))
          .map(u => ({ uid: u, email: allUsers[u]?.profile?.email }))
          .filter(u => u.email)
          .sort(() => 0.5 - Math.random())
          .slice(0, 6);
        setSuggestedUsers(possible);
      }
    }).catch(err => console.error("Discovery error:", err));
  }, [me]);
  const featured = trending[0];
  return (
    <div className="main" style={{ padding: '0' }}>
      <div className="hero" style={{
        backgroundImage: `url(${featured?.coverUrl || "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=2070&auto=format&fit=crop"})`,
        backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative', minHeight: '380px', display: 'flex', alignItems: 'flex-end', padding: 'clamp(24px, 6vw, 60px)', borderRadius: '0'
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.6) 50%, rgba(0,0,0,0.2) 100%)' }} />
        <div style={{ position: 'relative', zIndex: 2, maxWidth: '600px' }}>
          <div style={{ background: 'var(--pink)', color: '#fff', fontSize: '10px', fontWeight: '900', padding: '4px 10px', borderRadius: '4px', width: 'fit-content', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '2px' }}>Trending Global</div>
          <div style={{ fontSize: 'clamp(32px, 5vw, 64px)', fontWeight: '900', lineHeight: 1.1, marginBottom: '20px' }}>{featured?.title || "Music is Life"}</div>
          <p className="muted" style={{ fontSize: '16px', marginBottom: '32px', opacity: 0.8 }}>Start your day with the most viral hits curated specifically for your vibe.</p>
          <div style={{ display: 'flex', gap: '16px' }}>
            <button className="btn" onClick={() => featured && playTrack(featured, trending)}>
              <Play size={20} fill="#fff" />
              <span>Listen Now</span>
            </button>
            <button className="btnGhost" onClick={() => navigate("/search")}>Discover More</button>
          </div>
        </div>
      </div>
      <div style={{ padding: 'clamp(24px, 5vw, 48px) clamp(16px, 4vw, 60px)' }}>
        <div className="respGrid" style={{ gap: 'clamp(24px, 5vw, 64px)' }}>
          <div className="contentSection">
            <div className="section">
              <div className="secTop">
                <div>
                  <div className="h1" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Sparkles size={24} color="var(--pink)" />
                    Personal <span style={{ color: 'var(--pink)' }}>Mix</span>
                  </div>
                  <div className="muted" style={{ fontSize: '13px', fontWeight: '700', marginTop: '4px' }}>{recLabel || "Updating..."}</div>
                </div>
              </div>
              {recLoading ? (
                <div style={{ padding: '40px 0', textAlign: 'center' }}><Loader2 size={32} className="spin" color="var(--pink)" /></div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(clamp(200px, 100%, 280px), 1fr))', gap: '12px' }}>
                  {recommended.map(t => (
                    <TrackRow key={t.id} t={t} onPlay={() => playTrack(t, recommended)} showAdd />
                  ))}
                </div>
              )}
            </div>
            <div className="section" style={{ marginTop: '48px' }}>
              <div className="secTop">
                <div className="h1" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <TrendingUp size={24} color="var(--pink)" />
                  Weekly <span style={{ color: 'var(--pink)' }}>Top</span>
                </div>
              </div>
              <div className="plGrid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
                {trending.slice(1, 7).map(t => (
                  <div key={t.id} className="plCard" onClick={() => playTrack(t, trending)}>
                    <img src={t.coverUrl} alt="" style={{ borderRadius: '12px', marginBottom: '12px' }} />
                    <div style={{ fontWeight: '800', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.title}</div>
                    <div className="muted" style={{ fontSize: '12px' }}>{t.artist}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <aside style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
            {globalTrends.length > 0 && (
              <div style={{ background: 'var(--bg-card)', borderRadius: '24px', padding: '24px', border: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                  <Globe size={18} color="var(--pink)" />
                  <div style={{ fontWeight: '900', fontSize: '15px', textTransform: 'uppercase', letterSpacing: '1px' }}>Global Charts</div>
                </div>
                {globalTrends.map((t, i) => (
                  <div key={t.id} onClick={() => playTrack(t, globalTrends)} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', cursor: 'pointer' }}>
                    <div style={{ width: '20px', fontWeight: '900', color: 'var(--pink)', fontSize: '14px' }}>{i + 1}</div>
                    <img src={t.coverUrl} alt="" style={{ width: '40px', height: '40px', borderRadius: '6px' }} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: '800', fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.title}</div>
                      <div className="muted" style={{ fontSize: '11px' }}>{t.artist}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {suggestedUsers.length > 0 && (
              <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '24px', padding: '24px', border: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                  <Users size={18} color="var(--pink)" />
                  <div style={{ fontWeight: '900', fontSize: '15px' }}>Meet Artists</div>
                </div>
                {suggestedUsers.map(u => (
                  <div key={u.uid} onClick={() => navigate(`/profile/${u.uid}`)} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', cursor: 'pointer' }}>
                    <div style={{ width: '36px', height: '36px', background: 'var(--pink)', borderRadius: '50%', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                      <Plus size={16} color="#fff" />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: '800', fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.email.split("@")[0]}</div>
                      <div className="muted" style={{ fontSize: '11px' }}>Vibing on Melodies</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </aside>
        </div>
      </div>
      <style>{`
        .spin { animation: rotate 1s linear infinite; }
        @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
