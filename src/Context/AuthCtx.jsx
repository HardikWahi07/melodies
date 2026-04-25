import React, { createContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from "firebase/auth";
import { auth, rdb } from "../firebase";
import { ref, update } from "firebase/database";
export const AuthCtx = createContext(null);
export function AuthWrap({ children }) {
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 5000);
    const unsub = onAuthStateChanged(auth, (u) => {
      clearTimeout(timer);
      setMe(u || null);
      setLoading(false);
      if (u) {
        const name = u.displayName || (u.email ? u.email.split("@")[0] : `User-${u.uid.slice(0, 6)}`);
        update(ref(rdb, `users/${u.uid}/profile`), {
          uid: u.uid,
          name,
          email: u.email || "",
          updatedAt: Date.now()
        }).catch(() => {});
      }
    });
    return () => {
      unsub();
      clearTimeout(timer);
    };
  }, []);
  async function signup(email, pass) {
    const rr = await createUserWithEmailAndPassword(auth, email, pass);
    return rr.user;
  }
  async function login(email, pass) {
    const rr = await signInWithEmailAndPassword(auth, email, pass);
    return rr.user;
  }
  async function logout() {
    await signOut(auth);
  }
  return (
    <AuthCtx.Provider value={{ me, loading, signup, login, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}
