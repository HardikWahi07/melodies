import React, { useState, useContext, useEffect } from "react";
import { Play, Plus, Heart, MoreHorizontal, Check, Loader2, UserPlus, UserCheck } from "lucide-react";
import { rdb } from "../firebase";
import { AuthCtx } from "../context/AuthCtx";
import { ref, push, set, get, remove } from "firebase/database";
export default function TrackRow({ t, onPlay, showAdd, blendBadge }) {
  const { me } = useContext(AuthCtx);
  const [showPicker, setShowPicker] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [lists, setLists] = useState([]);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [following, setFollowing] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);
  useEffect(() => {
    if (!me || !t?.artist) return;
    const artistKey = t.artist.replace(/[.#$[\]]/g, "_");
    const followRef = ref(rdb, `users/${me.uid}/following/${artistKey}`);
    get(followRef).then((snap) => {
      setFollowing(snap.exists());
    });
  }, [me, t?.artist, t?.id]);
  const toggleFollow = async (e) => {
    e.stopPropagation();
    if (!me || !t?.artist) return;
    setFollowBusy(true);
    const artistKey = t.artist.replace(/[.#$[\]]/g, "_");
    const followRef = ref(rdb, `users/${me.uid}/following/${artistKey}`);
    if (following) {
      await remove(followRef);
      setFollowing(false);
    } else {
      await set(followRef, { name: t.artist, followedAt: Date.now() });
      setFollowing(true);
    }
    setFollowBusy(false);
  };
  const loadLists = async () => {
    if (!me) return;
    const plRef = ref(rdb, "playlists");
    const snap = await get(plRef);
    const data = snap.val();
    if (data) {
      const allLists = Object.keys(data).map(key => ({ id: key, ...data[key] }));
      setLists(allLists.filter((l) => l.uid === me.uid));
    } else {
      setLists([]);
    }
  };
  const addTo = async (id) => {
    setBusy(id);
    const trackRef = push(ref(rdb, `playlists/${id}/tracks`));
    await set(trackRef, t);
    setBusy(false);
    setDone(true);
    setTimeout(() => {
      setDone(false);
      setShowPicker(false);
    }, 1500);
  };
  const copySongLink = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`https://www.youtube.com/watch?v=${t.videoId}`);
    setShowMore(false);
  };
  return (
    <div
      className="trRow"
      style={{
        display: 'flex', alignItems: 'center', gap: '16px', padding: '10px 16px',
        borderRadius: '12px', transition: '0.2s', cursor: 'pointer', background: 'transparent',
        position: 'relative', width: '100%', minWidth: 0
      }}
      onClick={onPlay}
    >
      <div style={{ position: 'relative', width: '48px', height: '48px', flexShrink: 0 }}>
        <img
          src={t.coverUrl}
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
        />
        <div className="playHover">
          <Play size={18} fill="#fff" color="#fff" />
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 0, width: '100%', overflow: 'hidden' }}>
        <div style={{ 
          fontWeight: '800', 
          fontSize: '14px', 
          color: '#fff', 
          whiteSpace: 'nowrap', 
          overflow: 'hidden', 
          textOverflow: 'ellipsis',
          width: '100%' 
        }}>
          {t.title}
        </div>
        <div style={{ 
          fontSize: '12px', 
          color: 'var(--mut)', 
          fontWeight: '700',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          width: '100%'
        }}>
          {t.artist}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {blendBadge && (
          <div style={{
            padding: "4px 10px", borderRadius: 20, fontSize: "10px", fontWeight: 800,
            background: blendBadge.bg, color: blendBadge.color, border: `1px solid ${blendBadge.border}`,
            whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px'
          }}>
            {blendBadge.text}
          </div>
        )}
        <button
          className="btnFollow"
          onClick={toggleFollow}
          style={{
             display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 12px',
             borderRadius: '20px', border: `1px solid ${following ? 'var(--pink)' : 'var(--glass-border)'}`,
             background: following ? 'rgba(0,230,118,0.1)' : 'transparent',
             color: following ? 'var(--pink)' : '#aaa', fontSize: '11px', fontWeight: '800'
          }}
        >
          {followBusy ? <Loader2 size={12} className="spin" /> : following ? <UserCheck size={12} /> : <UserPlus size={12} />}
          <span>{following ? "Artist Followed" : "Follow"}</span>
        </button>
        {showAdd && (
          <div style={{ position: 'relative' }}>
            <button
              className="icoBtn hovPink"
              onClick={(e) => {
                e.stopPropagation();
                if (!showPicker) loadLists();
                setShowPicker(!showPicker);
              }}
            >
              {done ? <Check size={18} color="var(--pink)" /> : <Plus size={18} />}
            </button>
            {showPicker && (
              <div className="popMenu" style={{ bottom: '40px' }} onClick={(e) => e.stopPropagation()}>
                <div className="menuTitle">ADD TO PLAYLIST</div>
                <div style={{ maxHeight: '160px', overflowY: 'auto' }}>
                  {lists.length === 0 && <div className="muted" style={{ padding: '8px', fontSize: '12px' }}>No playlists yet.</div>}
                  {lists.map((l) => (
                    <div key={l.id} className="menuItem" onClick={() => addTo(l.id)}>
                      <span>{l.name}</span>
                      {busy === l.id && <Loader2 size={12} className="spin" />}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        <div style={{ position: 'relative' }}>
          <button className="icoBtn hovPink" onClick={(e) => { e.stopPropagation(); setShowMore(!showMore); }}>
            <MoreHorizontal size={18} />
          </button>
          {showMore && (
            <div className="popMenu" style={{ top: '30px' }} onClick={(e) => e.stopPropagation()}>
              <div className="menuItem" onClick={copySongLink}>Copy Link</div>
              <div className="menuItem" onClick={() => window.open(`https://youtu.be/${t.videoId}`, '_blank')}>YouTube</div>
              <div className="menuItem" onClick={() => { onPlay(); setShowMore(false); }}>Play Now</div>
            </div>
          )}
        </div>
      </div>
      <style>{`
        .trRow:hover { background: var(--bg-card) !important; }
        .trRow:hover .playHover { opacity: 1 !important; display: grid !important; }
        .playHover { position: absolute; inset: 0; display: none; place-items: center; background: rgba(0,0,0,0.5); border-radius: 8px; opacity: 0; transition: 0.2s; }
        .hovPink:hover { color: var(--pink) !important; transform: scale(1.1); }
        .popMenu { position: absolute; right: 0; background: #181818; border: 1px solid var(--glass-border); border-radius: 12px; padding: 8px; z-index: 1000; width: 180px; box-shadow: 0 15px 30px rgba(0,0,0,0.5); }
        .menuTitle { font-size: 9px; font-weight: 900; color: var(--pink); padding: 4px 8px; letter-spacing: 1px; }
        .menuItem { padding: 8px 12px; border-radius: 8px; font-size: 13px; font-weight: 700; cursor: pointer; color: #ccc; display: flex; align-items: center; justify-content: space-between; }
        .menuItem:hover { background: var(--glass-thick); color: #fff; }
        .spin { animation: rotate 1s linear infinite; }
        @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
