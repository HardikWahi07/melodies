import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { Music, ArrowRight, Loader2 } from "lucide-react";
export default function Login() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const handle = async (e) => {
    e.preventDefault();
    setBusy(true); setErr("");
    try {
      await signInWithEmailAndPassword(auth, email, pass);
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
        <h1 className="authTitle">Welcome Back</h1>
        <p className="muted" style={{ marginBottom: '32px', fontSize: '14px' }}>Log in to your cinematic audio space.</p>
        <form onSubmit={handle} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <div className="muted" style={{ fontSize: '11px', fontWeight: '900', marginBottom: '8px', letterSpacing: '1px' }}>EMAIL ADDRESS</div>
            <input className="inp" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@example.com" required />
          </div>
          <div>
            <div className="muted" style={{ fontSize: '11px', fontWeight: '900', marginBottom: '8px', letterSpacing: '1px' }}>PASSWORD</div>
            <input className="inp" type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="••••••••" required />
          </div>
          {err && <div className="err">{err}</div>}
          <div className="authBot" style={{ marginTop: '12px' }}>
             <Link to="/signup" className="link" style={{ color: 'var(--mut)', fontSize: '14px', fontWeight: '700' }}>Create account</Link>
             <button className="btn" type="submit" disabled={busy}>
                {busy ? <Loader2 size={18} className="spin" /> : <><span>Sign In</span><ArrowRight size={18} /></>}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
}
