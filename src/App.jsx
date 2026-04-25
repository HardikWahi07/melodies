import React, { useContext, useState, useEffect, useRef } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AuthWrap, AuthCtx } from "./context/AuthCtx";
import { PlayerWrap, PlayerCtx } from "./context/PlayerCtx";
import YTPlayer from "./components/YTPlayer";
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import PlayBar from "./components/PlayBar";
import LyricsPanel from "./components/LyricsPanel";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Home from "./pages/Home";
import Search from "./pages/Search";
import Library from "./pages/Library";
import Playlist from "./pages/Playlist";
import Profile from "./pages/Profile";
import Wrapped from "./pages/Wrapped";
import Jam from "./pages/Jam";
import JamLobbyPage from "./pages/JamLobby";
import Settings from "./pages/Settings";
import Blend from "./pages/Blend";
import { X, Play, Pause, SkipBack, SkipForward } from "lucide-react";
function Gate({ children }) {
  const { me, loading } = useContext(AuthCtx);
  if (loading) return <div className="boot">Loading...</div>;
  if (!me) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
function Shell() {
  const { now, playing, toggle, vol, pos, dur, setPos, setDur, next, prev, rightOpen, setRightOpen, reqSeek, setReqSeek } = useContext(PlayerCtx);
  const [showUI, setShowUI] = useState(true);
  const uiTimer = useRef(null);
  const resetTimer = () => {
    setShowUI(true);
    if (uiTimer.current) window.clearTimeout(uiTimer.current);
    uiTimer.current = window.setTimeout(() => {
      setShowUI(false);
    }, 3000);
  };
  useEffect(() => {
    if (rightOpen) resetTimer();
    return () => { if (uiTimer.current) window.clearTimeout(uiTimer.current); };
  }, [rightOpen]);
  const seek = (e) => {
    setReqSeek(parseFloat(e.target.value));
    resetTimer();
  };
  const fmtTime = (s) => {
    if (!s) return "0:00";
    const m = Math.floor(s / 60);
    const sc = Math.floor(s % 60);
    return `${m}:${sc < 10 ? '0' : ''}${sc}`;
  };
  const isCinema = !!(rightOpen && now?.videoId);
  return (
    <div className="shell">
      <Sidebar />
      <main className="main">
        <TopBar />
        <div className="content">
          <Routes>
            <Route index element={<Home />} />
            <Route path="search" element={<Search />} />
            <Route path="library" element={<Library />} />
            <Route path="playlist/:id" element={<Playlist />} />
            <Route path="profile/:uid" element={<Profile />} />
            <Route path="wrapped" element={<Wrapped />} />
            <Route path="jam" element={<Jam />} />
            <Route path="jam/:id" element={<JamLobbyPage />} />
            <Route path="blend" element={<Blend />} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
      <div 
        onMouseMove={resetTimer}
        style={{
          position: 'fixed', inset: '0',
          background: '#000',
          zIndex: 10000,
          display: isCinema ? 'flex' : 'none', 
          flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          transition: 'opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
          opacity: isCinema ? 1 : 0,
          pointerEvents: isCinema ? 'auto' : 'none',
          color: '#fff',
          overflow: 'hidden',
          visibility: isCinema ? 'visible' : 'hidden' 
        }}
      >
        {now?.videoId ? (
          <div style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}>
            <YTPlayer
              videoId={now.videoId}
              playing={playing}
              volume={vol}
              reqSeek={reqSeek}
              onSeeked={() => setReqSeek(-1)}
              onEnd={next}
              onTimeUpdate={(p, d) => { setPos(p); setDur(d); }}
            />
          </div>
        ) : null}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 20%, transparent 80%, rgba(0,0,0,0.7) 100%)',
          display: 'flex', flexDirection: 'column',
          transition: 'opacity 0.4s ease',
          opacity: showUI ? 1 : 0,
          pointerEvents: showUI ? 'auto' : 'none',
          padding: '60px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: '900', color: 'var(--pink)', letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '8px' }}>NOW PLAYING / CINEMA FOCUS</div>
              <div style={{ fontSize: 'clamp(24px, 5vw, 48px)', fontWeight: '900', lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '80vw' }}>{now?.title}</div>
              <div style={{ fontSize: 'clamp(14px, 2vw, 20px)', fontWeight: '700', color: 'rgba(255,255,255,0.6)', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '80vw' }}>{now?.artist}</div>
            </div>
            <button 
              className="icoBtn" 
              onClick={(e) => { e.stopPropagation(); setRightOpen(false); }}
              style={{ width: '64px', height: '64px', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', borderRadius: '50%', color: '#fff' }}
            >
              <X size={32} />
            </button>
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ width: '100%', maxWidth: '900px', alignSelf: 'center', display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <span style={{ fontSize: '14px', fontWeight: '900', width: '50px', textAlign: 'right' }}>{fmtTime(pos)}</span>
              <input type="range" className="range" style={{ flex: 1 }} min={0} max={dur || 0} step={0.1} value={pos} onChange={seek} />
              <span style={{ fontSize: '14px', fontWeight: '900', width: '50px', textAlign: 'left' }}>{fmtTime(dur)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '48px' }}>
              <button className="icoBtn" onClick={() => { prev(); resetTimer(); }} style={{ color: '#fff' }}><SkipBack size={32} fill="currentColor" /></button>
              <button 
                className="btnPlay pulse" 
                onClick={() => { toggle(); resetTimer(); }}
                style={{ width: '80px', height: '80px', border: 'none' }}
              >
                {playing ? <Pause size={36} fill="currentColor" /> : <Play size={36} fill="currentColor" style={{ marginLeft: '6px' }} />}
              </button>
              <button className="icoBtn" onClick={() => { next(); resetTimer(); }} style={{ color: '#fff' }}><SkipForward size={32} fill="currentColor" /></button>
            </div>
          </div>
        </div>
      </div>
      <LyricsPanel />
      <PlayBar />
      <audio autoPlay loop muted={false}
        src="data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA=="
        style={{ position: 'fixed', left: -100, bottom: -100, width: 1, height: 1, opacity: 0 }}
      />
    </div>
  );
}
export default function App() {
  return (
    <AuthWrap>
      <PlayerWrap>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/*" element={<Gate><Shell /></Gate>} />
        </Routes>
      </PlayerWrap>
    </AuthWrap>
  );
}
