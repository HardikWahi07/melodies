import React, { useContext } from "react";
import { PlayerCtx } from "../context/PlayerCtx";
import { Play, Pause, SkipBack, SkipForward, Repeat, Shuffle, Volume2, Monitor, ListMusic, Maximize2 } from "lucide-react";
function fmtTime(s) {
  if (!s) return "0:00";
  const m = Math.floor(s / 60);
  const sc = Math.floor(s % 60);
  return `${m}:${sc < 10 ? '0' : ''}${sc}`;
}
export default function PlayBar() {
  const { now, playing, toggle, next, prev, vol, setVol, pos, dur, setReqSeek, rightOpen, setRightOpen, repeat, setRepeat } = useContext(PlayerCtx);
  const cycleRepeat = () => setRepeat((repeat + 1) % 3);
  const repeatLabel = repeat === 2 ? "1" : "";
  const repeatActive = repeat > 0;
  const seek = (e) => {
    setReqSeek(parseFloat(e.target.value));
  };
  return (
    <div className="playBar">
      <div className="pbLeft" style={{ width: '30%' }}>
        <div className="pbCover" style={{ width: '56px', height: '56px', background: '#111', borderRadius: '12px', overflow: 'hidden', flexShrink: 0, boxShadow: '0 8px 20px rgba(0,0,0,0.5)' }}>
          {now?.coverUrl && <img src={now.coverUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />}
        </div>
        <div className="pbInfo" style={{ minWidth: 0 }}>
          <div style={{ fontWeight: '900', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#fff' }}>{now?.title || "Not Playing"}</div>
          <div style={{ fontSize: '12px', fontWeight: '800', color: 'var(--mut)', marginTop: '2px' }}>{now?.artist || "Melodies Studio"}</div>
        </div>
        {playing && (
          <div style={{ display: 'flex', gap: '3px', alignItems: 'flex-end', height: '16px', marginLeft: '12px', opacity: 0.8 }}>
            <div className="visualizerBar" style={{ animationDelay: '0s', width: '2px' }} />
            <div className="visualizerBar" style={{ animationDelay: '0.2s', width: '2px' }} />
            <div className="visualizerBar" style={{ animationDelay: '0.4s', width: '2px' }} />
          </div>
        )}
      </div>
      <div className="pbMid" style={{ flex: 1, maxWidth: '600px' }}>
        <div className="pbBtns" style={{ gap: '24px' }}>
          <button className="icoBtn" style={{ opacity: 0.4 }}><Shuffle size={18} /></button>
          <button className="icoBtn" onClick={prev} style={{ color: '#fff' }}><SkipBack size={22} fill="currentColor" /></button>
          <button className={`btnPlay ${playing ? 'pulse' : ''}`} onClick={toggle} style={{ width: '48px', height: '48px', border: 'none' }}>
            {playing
              ? <Pause size={22} fill="currentColor" />
              : <Play size={22} fill="currentColor" style={{ marginLeft: '3px' }} />}
          </button>
          <button className="icoBtn" onClick={next} style={{ color: '#fff' }}><SkipForward size={22} fill="currentColor" /></button>
          <button className="icoBtn" onClick={cycleRepeat} style={{ color: repeatActive ? 'var(--pink)' : '#fff', opacity: repeatActive ? 1 : 0.4, position: 'relative' }}>
            <Repeat size={18} />
            {repeat === 2 && <span style={{ position: 'absolute', top: -2, right: -4, fontSize: 9, fontWeight: 900, color: 'var(--pink)' }}>1</span>}
          </button>
        </div>
        <div className="pbSeek" style={{ gap: '14px', marginTop: '4px' }}>
          <span style={{ fontSize: '11px', color: 'var(--mut)', width: '35px', textAlign: 'right', fontWeight: '800' }}>{fmtTime(pos)}</span>
          <input type="range" className="range" style={{ flex: 1 }} min={0} max={dur || 0} step={0.1} value={pos} onChange={seek} />
          <span style={{ fontSize: '11px', color: 'var(--mut)', width: '35px', textAlign: 'left', fontWeight: '800' }}>{fmtTime(dur)}</span>
        </div>
      </div>
      <div className="pbRight" style={{ width: '30%', gap: '24px' }}>
        <button 
          className="btnGhost cinemaBtn" 
          onClick={() => setRightOpen(!rightOpen)} 
          style={{ 
            background: rightOpen ? 'rgba(0,230,118,0.1)' : 'var(--glass)',
            borderColor: rightOpen ? 'var(--pink)' : 'var(--glass-border)',
            color: rightOpen ? 'var(--pink)' : '#fff',
            padding: '8px 16px',
            gap: '10px'
          }}
        >
          <Monitor size={18} />
          <span style={{ fontSize: '11px', fontWeight: '900', letterSpacing: '1px' }}>CINEMA</span>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '120px' }}>
          <Volume2 size={18} style={{ color: 'var(--mut)' }} />
          <input type="range" className="range" style={{ width: '100%' }} min={0} max={1} step={0.01} value={vol} onChange={(e) => setVol(parseFloat(e.target.value))} />
        </div>
        <button className="icoBtn"><Maximize2 size={20} /></button>
      </div>
    </div>
  );
}
