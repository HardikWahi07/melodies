import React, { useState, useEffect, useContext } from "react";
import { ref, onValue, get } from "firebase/database";
import { rdb } from "../firebase";
import { AuthCtx } from "../context/AuthCtx";
import { PlayerCtx } from "../context/PlayerCtx";
import { Play, Clock, BarChart2, Headphones, Trophy, Sparkles, Loader2, Share2, Music, Timer, Users, Activity } from "lucide-react";
const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY;
function fmtTime(seconds) {
  if (!seconds) return "0m";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${Math.floor(seconds)}s`;
}
export default function Wrapped() {
  const { me } = useContext(AuthCtx);
  const { playTrack } = useContext(PlayerCtx);
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [aiSummary, setAiSummary] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  useEffect(() => {
    if (!me) return;
    return onValue(ref(rdb, `streamData/${me.uid}`), (snap) => {
      const data = snap.val();
      if (data) {
        const list = Object.entries(data)
          .map(([id, val]) => ({ 
            id, 
            ...val.meta, 
            seconds: val.seconds || 0, 
            plays: val.plays || 0 
          }))
          .filter(t => t.seconds > 0 || t.plays > 0)
          .sort((a, b) => b.seconds - a.seconds);
        setTracks(list);
        setTotalSeconds(list.reduce((acc, t) => acc + t.seconds, 0));
      }
      setLoading(false);
    });
  }, [me]);
  const top1 = tracks[0];
  const top5 = tracks.slice(0, 5);
  const topArtists = [...new Map(tracks.map(t => [t.artist, { artist: t.artist, seconds: t.seconds }])).values()]
    .sort((a, b) => b.seconds - a.seconds).slice(0, 5);
  const handleGenerateAI = async () => {
    setAiLoading(true);
    setAiError("");
    const plSnap = await get(ref(rdb, "playlists"));
    const plData = plSnap.val();
    const myPlaylists = plData ? Object.values(plData).filter(p => p.uid === me.uid) : [];
    const plStr = myPlaylists.map(p => p.name).join(", ");
    const topSongsStr = top5.map((t, i) =>
      `${i + 1}. "${t.title}" by ${t.artist} (${fmtTime(t.seconds)}, ${t.plays} plays)`
    ).join(", ");
    const prompt = `You are a professional music trend analyst. Analyze these listening habits:
- Total Time: ${fmtTime(totalSeconds)}
- Total Unique Tracks: ${tracks.length}
- Top Song: "${top1?.title}" by ${top1?.artist}
- Top Artists: ${topArtists.map(a => a.artist).join(", ")}
- Playlists: ${plStr}
Provide a deep, fun analysis in JSON format:
{ 
  "headline": "A short catchy title based on their taste", 
  "characterName": "A creative title for this listener (e.g. The Emo Romantic, The Tech Rave Legend)",
  "personalityDigest": "A 2-sentence summary of what their music says about their personality", 
  "genreVibe": "The dominant genre or atmosphere",
  "funQuote": "A witty quote about their #1 song"
}`;
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${GROQ_KEY}`, 
          "Content-Type": "application/json" 
        },
        body: JSON.stringify({
          model: "meta-llama/llama-4-scout-17b-16e-instruct",
          messages: [
            { role: "system", content: "You are a witty music critic." },
            { role: "user", content: prompt }
          ],
          response_format: { type: "json_object" }
        })
      });
      const data = await res.json();
      setAiSummary(JSON.parse(data.choices[0].message.content));
    } catch (err) {
      setAiError("AI error. Try again!");
    } finally {
      setAiLoading(false);
    }
  };
  if (loading) return <div className="main" style={{ display: 'grid', placeItems: 'center', height: '80vh' }}><Loader2 className="spin" size={40} color="var(--pink)" /></div>;
  return (
    <div className="main" style={{ padding: '0', background: '#050505' }}>
      <div style={{ 
        background: 'linear-gradient(135deg, #0a0010 0%, #1a0030 50%, #002D1E 100%)', 
        padding: '80px 60px', 
        position: 'relative',
        overflow: 'hidden'
      }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 80% 20%, rgba(0,230,118,0.1), transparent)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{ fontSize: '12px', fontWeight: '900', color: 'var(--pink)', letterSpacing: '6px', textTransform: 'uppercase', marginBottom: '16px' }}>Melodies</div>
            <div style={{ fontSize: 'clamp(36px, 8vw, 84px)', fontWeight: '900', lineHeight: 1, marginBottom: '32px', letterSpacing: '-2px' }}>
              Your Music <br />
              <span style={{ color: 'var(--pink)' }}>DNA</span>, Decoded.
            </div>
            <button className="btn" onClick={handleGenerateAI} disabled={aiLoading} style={{ padding: '18px 40px', fontSize: '15px' }}>
              {aiLoading ? <Loader2 size={24} className="spin" /> : <Sparkles size={24} />}
              <span>{aiSummary ? "Refine My DNA" : "Generate AI Wrapped"}</span>
            </button>
          </div>
      </div>
      <div style={{ padding: '60px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', marginBottom: '60px' }}>
           <div className="statCard">
              <Timer className="muted" size={20} style={{ marginBottom: '12px' }} />
              <div className="statVal">{Math.floor(totalSeconds / 60)}</div>
              <div className="statLabel">Minutes Listened</div>
           </div>
           <div className="statCard">
              <Users className="muted" size={20} style={{ marginBottom: '12px' }} />
              <div className="statVal">{[...new Set(tracks.map(t => t.artist))].length}</div>
              <div className="statLabel">Unique Artists</div>
           </div>
           <div className="statCard">
              <Headphones className="muted" size={20} style={{ marginBottom: '12px' }} />
              <div className="statVal">{tracks.length}</div>
              <div className="statLabel">Top Tracks Found</div>
           </div>
           <div className="statCard">
              <Activity className="muted" size={20} style={{ marginBottom: '12px' }} />
              <div className="statVal">{tracks.reduce((a, t) => a + t.plays, 0)}</div>
              <div className="statLabel">Total Stream Sessions</div>
           </div>
        </div>
        {aiSummary && (
          <div style={{ marginBottom: '80px' }}>
            <div style={{ 
              background: 'linear-gradient(135deg, var(--bg-card), #1a1a1a)', 
              borderRadius: '32px', 
              padding: '60px', 
              border: '1px solid var(--glass-border)',
              boxShadow: '0 40px 80px rgba(0,0,0,0.5)',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '60px',
              alignItems: 'center'
            }}>
               <div>
                  <div style={{ background: 'var(--pink)', color: '#000', padding: '6px 16px', borderRadius: '40px', fontSize: '12px', fontWeight: '900', width: 'fit-content', marginBottom: '24px', textTransform: 'uppercase' }}>
                     {aiSummary.characterName}
                  </div>
                  <div style={{ fontSize: '42px', fontWeight: '900', lineHeight: 1.2, marginBottom: '24px' }}>{aiSummary.headline}</div>
                  <p style={{ fontSize: '18px', lineHeight: 1.6, color: '#aaa', fontWeight: '600' }}>{aiSummary.personalityDigest}</p>
                  <div style={{ marginTop: '40px', borderTop: '1px solid var(--glass-border)', paddingTop: '32px' }}>
                     <div className="muted" style={{ fontSize: '12px', fontWeight: '900', marginBottom: '12px' }}>VIBE CHECK</div>
                     <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--pink)' }}>{aiSummary.genreVibe}</div>
                  </div>
               </div>
               <div style={{ textAlign: 'center', background: 'rgba(0,0,0,0.3)', padding: '40px', borderRadius: '24px', border: '1px solid var(--glass-border)' }}>
                  <div style={{ fontSize: '13px', fontWeight: '900', color: 'var(--mut)', marginBottom: '20px' }}>QUOTE OF THE YEAR</div>
                  <div style={{ fontSize: '28px', fontWeight: '700', fontStyle: 'italic', lineHeight: 1.4 }}>"{aiSummary.funQuote}"</div>
               </div>
            </div>
          </div>
        )}
        {tracks.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '80px' }}>
            <div>
              <div className="h1" style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Trophy size={28} color="var(--pink)" />
                Your <span style={{ color: 'var(--pink)' }}>N° 1</span>
              </div>
              <div style={{ 
                background: 'var(--bg-card)', 
                borderRadius: '32px', 
                overflow: 'hidden', 
                border: '1px solid var(--glass-border)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
              }}>
                <img src={top1.coverUrl} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover' }} />
                <div style={{ padding: '32px' }}>
                   <div style={{ fontSize: '32px', fontWeight: '900', marginBottom: '8px' }}>{top1.title}</div>
                   <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--pink)', marginBottom: '24px' }}>{top1.artist}</div>
                   <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '24px', display: 'flex', justifyContent: 'space-between' }}>
                      <div>
                         <div className="muted" style={{ fontSize: '11px', fontWeight: '800' }}>PLAYS</div>
                         <div style={{ fontSize: '20px', fontWeight: '900' }}>{top1.plays}</div>
                      </div>
                      <div>
                         <div className="muted" style={{ fontSize: '11px', fontWeight: '800' }}>TUNE IN TIME</div>
                         <div style={{ fontSize: '20px', fontWeight: '900' }}>{fmtTime(top1.seconds)}</div>
                      </div>
                   </div>
                </div>
              </div>
            </div>
            <div>
               <div className="h1" style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <BarChart2 size={28} color="var(--pink)" />
                Top Tracks
              </div>
              <div>
                {top5.map((t, i) => (
                  <div key={t.id} onClick={() => playTrack(t, top5)} style={{ 
                    display: 'flex', alignItems: 'center', gap: '20px', padding: '16px', 
                    borderRadius: '16px', background: i === 0 ? 'rgba(0,230,118,0.05)' : 'transparent',
                    marginBottom: '8px', cursor: 'pointer', transition: '0.2s', border: '1px solid transparent'
                  }} className="wrapRow">
                    <div style={{ fontSize: '24px', fontWeight: '900', color: i === 0 ? 'var(--pink)' : '#333', width: '32px' }}>{i + 1}</div>
                    <img src={t.coverUrl} style={{ width: '56px', height: '56px', borderRadius: '12px' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '800', fontSize: '15px' }}>{t.title}</div>
                      <div className="muted" style={{ fontSize: '13px' }}>{t.artist}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                       <div style={{ fontSize: '14px', fontWeight: '900' }}>{fmtTime(t.seconds)}</div>
                       <div className="muted" style={{ fontSize: '11px' }}>{t.plays} plays</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '60px' }}>
                <div className="h1" style={{ marginBottom: '24px', fontSize: '18px' }}>Top Artists</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                   {topArtists.map(a => (
                     <div key={a.artist} style={{ padding: '12px 24px', background: 'var(--bg-card)', borderRadius: '40px', border: '1px solid var(--glass-border)', fontSize: '14px', fontWeight: '800' }}>
                       {a.artist}
                     </div>
                   ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <style>{`
        .statCard { background: var(--bg-card); padding: 24px; border-radius: 24px; border: 1px solid var(--glass-border); transition: 0.3s; }
        .statCard:hover { transform: translateY(-4px); border-color: var(--pink); }
        .statVal { fontSize: 32px; fontWeight: 900; marginBottom: 4px; }
        .statLabel { fontSize: 12px; fontWeight: 800; color: var(--mut); text-transform: uppercase; letter-spacing: 1px; }
        .wrapRow:hover { background: var(--bg-card) !important; border-color: var(--glass-border) !important; }
        .spin { animation: rotate 1s linear infinite; }
        @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
