import React, { useContext, useState, useEffect } from "react";
import { AuthCtx } from "../context/AuthCtx";
import { rdb } from "../firebase";
import { ref, push, set, onValue } from "firebase/database";
import { Music, Plus, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
export default function Library() {
  const { me } = useContext(AuthCtx);
  const [lists, setLists] = useState([]);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    if (!me) return;
    const plRef = ref(rdb, "playlists");
    return onValue(plRef, (snap) => {
      const data = snap.val();
      if (data) {
        const all = Object.keys(data).map(k => ({ id: k, ...data[k] }));
        setLists(all.filter(l => l.uid === me.uid));
      } else {
        setLists([]);
      }
    });
  }, [me]);
  const create = async (e) => {
    e.preventDefault();
    if (!name || busy) return;
    setBusy(true);
    const newRef = push(ref(rdb, "playlists"));
    await set(newRef, {
      name,
      uid: me.uid,
      createdAt: Date.now(),
      ownerEmail: me.email,
      isPublic: false
    });
    setName("");
    setBusy(false);
  };
  return (
    <div className="section">
      <div className="secTop">
        <div className="h1">Library</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '24px' }}>
        <div className="plCard" style={{ border: '2px dashed var(--glass-border)', background: 'none' }}>
           <form onSubmit={create}>
             <input value={name} onChange={e => setName(e.target.value)} placeholder="Playlist Name" className="inp" style={{ marginBottom: '12px' }} />
             <button type="submit" className="btn" disabled={busy} style={{ width: '100%', justifyContent: 'center' }}>
                {busy ? <Loader2 size={18} className="spin" /> : <Plus size={18} />}
                <span>Create</span>
             </button>
           </form>
        </div>
        {lists.map(l => (
          <div key={l.id} className="plCard" onClick={() => navigate(`/playlist/${l.id}`)}>
             <div style={{ aspectRatio: '1/1', background: 'var(--bg-card)', borderRadius: '16px', marginBottom: '16px', display: 'grid', placeItems: 'center' }}>
                <Music size={48} color="var(--pink)" style={{ opacity: 0.3 }} />
             </div>
             <div style={{ fontWeight: '800' }}>{l.name}</div>
             <div className="muted">{l.tracks ? Object.keys(l.tracks).length : 0} Tracks</div>
          </div>
        ))}
      </div>
    </div>
  );
}
