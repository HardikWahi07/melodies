import React, { useContext, useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { Home, Search, Library, Settings, LogOut, User, Gift, Menu, X, Radio, Heart } from "lucide-react";
import { AuthCtx } from "../context/AuthCtx";
import { auth } from "../firebase";
export default function Sidebar() {
  const { me } = useContext(AuthCtx);
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return (
    <>
      <button className="menuToggle" onClick={() => setOpen(true)}>
        <Menu size={24} />
      </button>
      <div className={`sideOverlay ${open ? 'open' : ''}`} onClick={close} />
      <aside className={`side ${open ? 'open' : ''}`}>
        <div className="brand" style={{ position: 'relative' }}>
          <span>MELODIES</span>
          <button className="icoBtn" onClick={close} style={{ position: 'absolute', right: 0, display: open ? 'block' : 'none' }}>
            <X size={20} />
          </button>
        </div>
        <nav className="nav">
          <NavLink to="/" className="navA" onClick={close}>
            <Home size={20} />
            <span>Home</span>
          </NavLink>
          <NavLink to="/search" className="navA" onClick={close}>
            <Search size={20} />
            <span>Discover</span>
          </NavLink>
          <NavLink to="/library" className="navA" onClick={close}>
            <Library size={20} />
            <span>Library</span>
          </NavLink>
          <NavLink to="/jam" className="navA" onClick={close}>
            <Radio size={20} />
            <span>Jams</span>
          </NavLink>
          <NavLink to="/blend" className="navA" onClick={close}>
            <Heart size={20} />
            <span>Blend</span>
          </NavLink>
          <NavLink to="/wrapped" className="navA" onClick={close}>
            <Gift size={20} />
            <span>Wrapped</span>
          </NavLink>
        </nav>
        <div style={{ marginTop: 'auto' }}>
          <NavLink to="/settings" className="navA" onClick={close} style={{ marginBottom: '10px' }}>
            <Settings size={20} />
            <span>Settings</span>
          </NavLink>
          {me && (
            <div style={{ padding: '20px', background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ width: '32px', height: '32px', background: 'var(--pink)', borderRadius: '50%', display: 'grid', placeItems: 'center' }}>
                    <User size={18} color="#fff" />
                </div>
                <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontWeight: '800', fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{me.email?.split("@")[0]}</div>
                </div>
              </div>
              <button className="btnGhost" onClick={() => { auth.signOut(); navigate('/login'); }} style={{ width: '100%', justifyContent: 'center' }}>
                <LogOut size={16} />
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
