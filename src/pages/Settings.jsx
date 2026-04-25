import React, { useState } from "react";
export default function Settings() {
  const [msg, setMsg] = useState("");
  function clearCache() {
    localStorage.clear();
    setMsg("Cache Cleared. Please refresh.");
  }
  return (
    <div className="page" style={{ padding: '24px 32px' }}>
      <div className="h1">Settings</div>
      <p className="muted" style={{ marginBottom: '32px' }}>Personalize your MELODIES experience</p>
      <div className="section" style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '12px' }}>
        <h3 style={{ marginBottom: '12px' }}>Connection & Storage</h3>
        <p className="muted" style={{ fontSize: '14px', marginBottom: '24px' }}>
          MELODIES is running in **Pure React Mode**. No backend is required.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button className="btn" onClick={clearCache} style={{ background: '#333', color: '#fff' }}>
            Clear Local Cache
          </button>
          {msg && <span style={{ color: 'var(--spotify-green)', fontSize: '14px' }}>{msg}</span>}
        </div>
      </div>
      <div className="section" style={{ marginTop: '24px', background: 'var(--bg-card)', padding: '24px', borderRadius: '12px', opacity: 0.5 }}>
        <h3 style={{ marginBottom: '12px' }}>Audio Quality</h3>
        <p className="muted" style={{ fontSize: '14px' }}>Automatic streaming quality based on your YouTube connection.</p>
      </div>
    </div>
  );
}
