import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, rdb } from "../firebase";
import { ref, set } from "firebase/database";
import { Music, ArrowRight, Loader2, Sparkles } from "lucide-react";
export default function Signup() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const handle = async (e) => {
    e.preventDefault();
    setBusy(true); setErr("");
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      await set(ref(rdb, `users/${cred.user.uid}/profile`), {
        email: cred.user.email,
        joinedAt: Date.now()
      });
      navigate("/");
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="authWrap">
      <div className="authCard">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
          <div style={{ background: 'var(--pink)', padding: '10px', borderRadius: '14px' }}>
            <Music color="#fff" size={24} />
          </div>
          <div style={{ fontWeight: '900', fontSize: '20px', letterSpacing: '1px' }}>MELODIES</div>
        </div>
        <h1 className="authTitle">Join the Studio</h1>
        <p className="muted" style={{ marginBottom: '32px', fontSize: '14px' }}>Create your account to start streaming.</p>
        <form onSubmit={handle} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <div className="muted" style={{ fontSize: '11px', fontWeight: '900', marginBottom: '8px', letterSpacing: '1px' }}>EMAIL ADDRESS</div>
            <input className="inp" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@example.com" required />
          </div>
          <div>
            <div className="muted" style={{ fontSize: '11px', fontWeight: '900', marginBottom: '8px', letterSpacing: '1px' }}>CHOOSE PASSWORD</div>
            <input className="inp" type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="••••••••" required />
          </div>
          {err && <div className="err">{err}</div>}
          <div className="authBot" style={{ marginTop: '12px' }}>
             <Link to="/login" className="link" style={{ color: 'var(--mut)', fontSize: '14px', fontWeight: '700' }}>Already have one?</Link>
             <button className="btn" type="submit" disabled={busy}>
                {busy ? <Loader2 size={18} className="spin" /> : <><span>Get Started</span><Sparkles size={18} /></>}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
}
