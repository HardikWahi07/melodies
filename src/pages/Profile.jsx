import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { rdb } from "../firebase";
import { ref, onValue, set, remove, get } from "firebase/database";
import { AuthCtx } from "../context/AuthCtx";
import { User, Music, Share2, Check, UserCheck, UserPlus, UserMinus, Users, Loader2, Heart } from "lucide-react";
export default function Profile() {
  const { uid } = useParams();
  const { me } = useContext(AuthCtx);
  const navigate = useNavigate();
  const [lists, setLists] = useState([]);
  const [followedArtists, setFollowedArtists] = useState([]);
  const [userFollowing, setUserFollowing] = useState([]);
  const [userFollowers, setUserFollowers] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);
  const [profileEmail, setProfileEmail] = useState("");
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState("playlists");
  const isOwnProfile = me?.uid === uid;
  useEffect(() => {
    if (!uid) return;
    const plRef = ref(rdb, "playlists");
    return onValue(plRef, (snap) => {
      const data = snap.val();
      if (data) {
        const all = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        let filtered = all.filter(l => l.uid === uid);
        if (!isOwnProfile) filtered = filtered.filter(l => l.isPublic);
        setLists(filtered);
      } else {
        setLists([]);
      }
    });
  }, [uid, isOwnProfile]);
  useEffect(() => {
    if (!uid) return;
    const emailRef = ref(rdb, `users/${uid}/profile/email`);
    get(emailRef).then(snap => {
      if (snap.exists()) setProfileEmail(snap.val());
    });
  }, [uid]);
  useEffect(() => {
    if (!me) return;
    set(ref(rdb, `users/${me.uid}/profile/email`), me.email);
  }, [me]);
  useEffect(() => {
    if (!isOwnProfile || !uid) return;
    return onValue(ref(rdb, `users/${uid}/following`), (snap) => {
      const data = snap.val();
      setFollowedArtists(data ? Object.values(data) : []);
    });
  }, [uid, isOwnProfile]);
  const loadConnections = (path, setter) => {
    if (!uid) return;
    return onValue(ref(rdb, `users/${uid}/${path}`), async (snap) => {
      const data = snap.val();
      if (data) {
        const entries = await Promise.all(
          Object.keys(data).map(async (targetUid) => {
            const emailSnap = await get(ref(rdb, `users/${targetUid}/profile/email`));
            return {
              uid: targetUid,
              email: emailSnap.val() || "Melodies User",
              followedAt: data[targetUid].followedAt
            };
          })
        );
        setter(entries);
      } else {
        setter([]);
      }
    });
  };
  useEffect(() => { if (uid) return loadConnections("userFollowing", setUserFollowing); }, [uid]);
  useEffect(() => { if (uid) return loadConnections("userFollowers", setUserFollowers); }, [uid]);
  useEffect(() => {
    if (!me || !uid || isOwnProfile) return;
    get(ref(rdb, `users/${me.uid}/userFollowing/${uid}`)).then(snap => {
      setIsFollowing(snap.exists());
    });
  }, [me, uid, isOwnProfile]);
  const toggleFollow = async () => {
    if (!me || !uid || isOwnProfile) return;
    setFollowBusy(true);
    const myFollowingRef = ref(rdb, `users/${me.uid}/userFollowing/${uid}`);
    const theirFollowerRef = ref(rdb, `users/${uid}/userFollowers/${me.uid}`);
    if (isFollowing) {
      await remove(myFollowingRef);
      await remove(theirFollowerRef);
      setIsFollowing(false);
    } else {
      const now = Date.now();
      await set(myFollowingRef, { uid, followedAt: now });
      await set(theirFollowerRef, { uid: me.uid, followedAt: now });
      setIsFollowing(true);
    }
    setFollowBusy(false);
  };
  const copyLink = () => {
    navigator.clipboard.writeText(`https://fancy-conkies-6f717f.netlify.app${window.location.pathname}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const displayName = profileEmail ? profileEmail.split("@")[0] : "Melodies User";
  return (
    <div className="main" style={{ padding: '0' }}>
      <div style={{
        minHeight: '280px',
        background: 'linear-gradient(135deg, #0d0d0d, #1a1a1a)',
        position: 'relative',
        display: 'flex',
        alignItems: 'flex-end',
        padding: 'clamp(24px, 5vw, 60px) clamp(20px, 6vw, 60px)',
        gap: 'clamp(16px, 4vw, 32px)',
        flexWrap: 'wrap',
        borderBottom: '1px solid var(--glass-border)'
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, rgba(0,230,118,0.08), transparent)',
          pointerEvents: 'none'
        }} />
        <div style={{
          width: 'clamp(100px, 15vw, 160px)', height: 'clamp(100px, 15vw, 160px)',
          background: 'linear-gradient(135deg, #00E676, #00C853)',
          borderRadius: '50%',
          display: 'grid', placeItems: 'center',
          boxShadow: '0 25px 60px rgba(0,230,118,0.25)',
          flexShrink: 0
        }}>
          <User size={64} color="#fff" />
        </div>
        <div style={{ flex: 1, minWidth: '240px' }}>
          <div style={{ fontSize: '10px', fontWeight: '900', color: 'var(--pink)', textTransform: 'uppercase', letterSpacing: '4px', marginBottom: '8px' }}>
            {isOwnProfile ? "Global Citizen" : "Artist Profile"}
          </div>
          <div style={{ fontSize: 'clamp(28px, 6vw, 64px)', fontWeight: '900', lineHeight: 1, marginBottom: '20px', textTransform: 'capitalize' }}>
            {displayName}
          </div>
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            <div><span style={{ fontWeight: '900', fontSize: '20px' }}>{lists.length}</span><span className="muted" style={{ marginLeft: '8px', fontSize: '12px', fontWeight: '700' }}>Playlists</span></div>
            <div><span style={{ fontWeight: '900', fontSize: '20px' }}>{userFollowing.length}</span><span className="muted" style={{ marginLeft: '8px', fontSize: '12px', fontWeight: '700' }}>Following</span></div>
            <div><span style={{ fontWeight: '900', fontSize: '20px' }}>{userFollowers.length}</span><span className="muted" style={{ marginLeft: '8px', fontSize: '12px', fontWeight: '700' }}>Followers</span></div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignSelf: 'flex-end', marginBottom: '10px', flexWrap: 'wrap' }}>
          {!isOwnProfile && me && (
            <>
              <button
                className="btn"
                onClick={toggleFollow}
                disabled={followBusy}
                style={{
                  background: isFollowing ? 'var(--bg-card)' : 'linear-gradient(90deg, #00E676, #00C853)',
                  border: isFollowing ? '1px solid var(--pink)' : 'none',
                  minWidth: '140px'
                }}
              >
                {followBusy ? <Loader2 size={18} className="spin" /> : isFollowing ? <UserMinus size={18} /> : <UserPlus size={18} />}
                <span>{isFollowing ? "Unfollow" : "Follow"}</span>
              </button>
              <button
                className="btn"
                onClick={() => navigate(`/blend?with=${uid}`)}
                style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)' }}
              >
                <Heart size={18} color="var(--pink)" />
                <span>Blend</span>
              </button>
            </>
          )}
          <button className="btnGhost" onClick={copyLink}>
            {copied ? <Check size={18} color="var(--pink)" /> : <Share2 size={18} />}
            <span>{copied ? "Copied" : "Share"}</span>
          </button>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '8px', padding: '0 60px', background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid var(--glass-border)' }}>
        {[
          { id: "playlists", label: `Playlists` },
          { id: "following", label: `Following` },
          { id: "followers", label: `Followers` },
          ...(isOwnProfile ? [{ id: "artists", label: `Artists` }] : [])
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              background: 'none', border: 'none',
              borderBottom: tab === t.id ? '2px solid var(--pink)' : '2px solid transparent',
              color: tab === t.id ? '#fff' : 'var(--mut)',
              padding: '16px 20px', fontWeight: '800', fontSize: '13px', cursor: 'pointer', transition: '0.2s', textTransform: 'uppercase', letterSpacing: '1px'
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div style={{ padding: '40px 60px' }}>
        {tab === "playlists" && (
          <div className="plGrid">
            {lists.map(list => (
              <div key={list.id} className="plCard" onClick={() => navigate(`/playlist/${list.id}`)}>
                <div style={{ aspectRatio: '1', background: 'var(--bg-card)', borderRadius: '16px', marginBottom: '12px', display: 'grid', placeItems: 'center', border: '1px solid var(--glass-border)' }}>
                  <Music size={40} color="var(--pink)" style={{ opacity: 0.2 }} />
                </div>
                <div style={{ fontWeight: '800', fontSize: '15px' }}>{list.name}</div>
                <div className="muted" style={{ fontSize: '12px' }}>{list.tracks ? Object.keys(list.tracks).length : 0} Tracks</div>
              </div>
            ))}
            {lists.length === 0 && <div className="muted">No public playlists found.</div>}
          </div>
        )}
        {tab === "following" && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' }}>
            {userFollowing.map(user => (
              <div key={user.uid} className="plCard" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', cursor: 'pointer' }}
                onClick={() => navigate(`/profile/${user.uid}`)}>
                <div style={{ width: '48px', height: '48px', background: 'var(--pink)', borderRadius: '50%', display: 'grid', placeItems: 'center' }}>
                  <User size={22} color="#fff" />
                </div>
                <div>
                  <div style={{ fontWeight: '800' }}>{user.email.split("@")[0]}</div>
                  <div className="muted" style={{ fontSize: '12px' }}>Followed {new Date(user.followedAt).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
            {userFollowing.length === 0 && <div className="muted">Not following any users yet.</div>}
          </div>
        )}
        {tab === "followers" && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' }}>
            {userFollowers.map(user => (
              <div key={user.uid} className="plCard" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', cursor: 'pointer' }}
                onClick={() => navigate(`/profile/${user.uid}`)}>
                <div style={{ width: '48px', height: '48px', background: 'var(--glass-thick)', borderRadius: '50%', display: 'grid', placeItems: 'center', border: '1px solid var(--glass-border)' }}>
                  <User size={22} color="var(--pink)" />
                </div>
                <div>
                  <div style={{ fontWeight: '800' }}>{user.email.split("@")[0]}</div>
                  <div className="muted" style={{ fontSize: '12px' }}>Vibing since {new Date(user.followedAt).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
            {userFollowers.length === 0 && <div className="muted">No followers yet. Be the first to build a community!</div>}
          </div>
        )}
        {tab === "artists" && isOwnProfile && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            {followedArtists.map(artist => (
              <div key={artist.name} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: '40px', padding: '10px 24px' }}>
                <span style={{ fontWeight: '800', fontSize: '14px' }}>{artist.name}</span>
                <UserCheck size={16} color="var(--pink)" />
              </div>
            ))}
            {followedArtists.length === 0 && <div className="muted">You haven't followed any artists yet.</div>}
          </div>
        )}
      </div>
      <style>{`
        .spin { animation: rotate 1s linear infinite; }
        @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
