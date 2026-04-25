import React, { useContext } from "react";
import { PlayerCtx } from "../context/PlayerCtx";
import { Music, X, Projector, Info } from "lucide-react";
export default function LyricsPanel() {
  const { now, rightOpen, setRightOpen } = useContext(PlayerCtx);
  if (!rightOpen) return <></>;
  return (
    <div style={{
      position: 'fixed',
      right: 0,
      top: 0,
      width: '420px',
      height: 'calc(100vh - var(--bar-h))',
      background: 'rgba(5,5,5,0.9)',
      backdropFilter: 'blur(60px)',
      zIndex: 500,
      borderLeft: '1px solid var(--glass-border)',
      display: 'flex',
      flexDirection: 'column',
      animation: 'slideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Projector size={20} color="var(--pink)" />
          <div style={{ fontWeight: '900', fontSize: '15px', letterSpacing: '2px', textTransform: 'uppercase' }}>Cinema Mode</div>
        </div>
        <button className="icoBtn" onClick={() => setRightOpen(false)}><X size={24} /></button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 32px 40px' }}>
        <div style={{ marginBottom: '48px', textAlign: 'center' }}>
          <div style={{ 
            width: '100%', 
            aspectRatio: '1', 
            background: '#111', 
            borderRadius: '32px', 
            overflow: 'hidden', 
            boxShadow: '0 40px 80px rgba(0,0,0,0.8)', 
            marginBottom: '32px',
            border: '1px solid var(--glass-border)'
          }}>
            {now?.coverUrl ? (
              <img src={now.coverUrl} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} alt="" />
            ) : (
              <div style={{ height: '100%', display: 'grid', placeItems: 'center' }}><Music size={80} color="#222" /></div>
            )}
          </div>
          <div style={{ fontSize: '26px', fontWeight: '900', marginBottom: '8px', lineHeight: 1.2 }}>{now?.title || "Pick a Vibe"}</div>
          <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--pink)' }}>{now?.artist || "The Studio"}</div>
        </div>
        <div style={{ 
          background: 'var(--glass)', 
          borderRadius: '24px', 
          padding: '24px', 
          border: '1px solid var(--glass-border)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--mut)' }}>
            <Info size={16} />
            <span style={{ fontSize: '12px', fontWeight: '800', letterSpacing: '1px' }}>PRODUCTION INFO</span>
          </div>
          <div style={{ lineHeight: 1.8, fontSize: '14px', fontWeight: '600', color: '#ccc' }}>
            {now?.title ? `Performing "${now.title}" live from the Melodies Cinematic Studio. Experience the soulful depth of high-fidelity official audio.` : "Select a track to enter the cinema focus mode and explore technical production details."}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
      `}</style>
    </div>
  );
}
