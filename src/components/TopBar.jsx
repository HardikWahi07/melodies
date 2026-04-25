import React, { useContext } from "react";
import { AuthCtx } from "../context/AuthCtx";
import { User, Bell, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
export default function TopBar() {
  const { me } = useContext(AuthCtx);
  const navigate = useNavigate();
  return (
    <div className="topBar">
      <div className="tbNav" style={{ display: 'flex', gap: '8px' }}>
        <button className="icoBtn" onClick={() => navigate(-1)} style={{ background: '#000', borderRadius: '50%', padding: '6px' }}>
          <ChevronLeft size={20} />
        </button>
        <button className="icoBtn" onClick={() => navigate(1)} style={{ background: '#000', borderRadius: '50%', padding: '6px' }}>
          <ChevronRight size={20} />
        </button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(8px, 2vw, 16px)', flex: 1, justifyContent: 'flex-end', minWidth: 0 }}>
        <div className="tbSearch" style={{ position: 'relative', display: 'flex', alignItems: 'center', flex: 1, maxWidth: '300px' }}>
          <Search size={16} color="var(--mut)" style={{ position: 'absolute', left: '12px' }} />
          <input
            type="text"
            placeholder="Search..."
            onFocus={() => navigate("/search")}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--glass-border)',
              borderRadius: '20px',
              padding: '8px 16px 8px 36px',
              color: '#fff',
              fontSize: '13px',
              width: '100%',
              outline: 'none',
              transition: '0.2s'
            }}
          />
        </div>
        <button className="icoBtn"><Bell size={20} /></button>
        {me && (
          <div 
            onClick={() => navigate(`/profile/${me.uid}`)}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              background: 'var(--bg-card)', 
              padding: '4px 8px', 
              borderRadius: '30px', 
              cursor: 'pointer', 
              border: '1px solid var(--glass-border)',
              flexShrink: 0,
              maxWidth: '120px',
              overflow: 'hidden'
            }}>
            <div style={{ width: '24px', height: '24px', background: 'var(--pink)', borderRadius: '50%', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
              <User size={14} color="#fff" />
            </div>
            <span style={{ fontSize: '12px', fontWeight: '800', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {me.email?.split("@")[0]}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
