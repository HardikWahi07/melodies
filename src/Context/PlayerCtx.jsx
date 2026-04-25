import React, { createContext, useMemo, useState, useEffect, useRef, useContext } from "react";
import { ref, runTransaction, set } from "firebase/database";
import { useLocal } from "../hooks/useLocal";
import { rdb } from "../firebase";
import { AuthCtx } from "./AuthCtx";
export const PlayerCtx = createContext(null);
export function PlayerWrap({ children }) {
  const { me } = useContext(AuthCtx);
  const [now, setNow] = useState(null);
  const [list, setList] = useState([]);
  const [idx, setIdx] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [pos, setPos] = useState(0);
  const [dur, setDur] = useState(0);
  const [vol, setVol] = useLocal("vol", 0.8);
  const [repeat, setRepeat] = useLocal("repeat", 0);
  const [rightOpen, setRightOpen] = useState(false);
  const [reqSeek, setReqSeek] = useState(-1);
  const idxRef = useRef(idx);
  const listRef = useRef(list);
  const repeatRef = useRef(repeat);
  const nowRef = useRef(now);
  useEffect(() => { idxRef.current = idx; }, [idx]);
  useEffect(() => { listRef.current = list; }, [list]);
  useEffect(() => { repeatRef.current = repeat; }, [repeat]);
  useEffect(() => { nowRef.current = now; }, [now]);
  const streamBuf = useRef(0);    
  const lastTick = useRef(null); 
  const streamTrackRef = useRef(null);
  useEffect(() => {
    if (!playing || !now || !me) {
      lastTick.current = null;
      return;
    }
    streamTrackRef.current = now;
    const interval = setInterval(() => {
      const t = Date.now();
      if (lastTick.current) {
        const elapsed = (t - lastTick.current) / 1000;
        streamBuf.current += elapsed;
      }
      lastTick.current = t;
      if (streamBuf.current >= 15 && streamTrackRef.current && me) {
        const toSave = Math.floor(streamBuf.current);
        streamBuf.current = 0;
        const track = streamTrackRef.current;
        const safeId = track.id.replace(/[.#$[\]/]/g, "_");
        set(ref(rdb, `streamData/${me.uid}/${safeId}/meta`), {
          title: track.title,
          artist: track.artist,
          coverUrl: track.coverUrl,
          videoId: track.videoId,
          id: track.id,
        });
        runTransaction(ref(rdb, `streamData/${me.uid}/${safeId}/seconds`), (cur) => (cur || 0) + toSave);
        runTransaction(ref(rdb, `streamData/${me.uid}/${safeId}/plays`), (cur) => (cur || 0) + 0); 
      }
    }, 1000);
    return () => {
      clearInterval(interval);
      lastTick.current = null;
    };
  }, [playing, now?.id, me?.uid]);
  function recordPlay(track) {
    if (!me || !track) return;
    const safeId = track.id.replace(/[.#$[\]/]/g, "_");
    runTransaction(ref(rdb, `streamData/${me.uid}/${safeId}/plays`), (cur) => (cur || 0) + 1);
  }
  function playTrack(tr, arr) {
    const arr2 = Array.isArray(arr) ? arr : list;
    const at = arr2.findIndex((x) => x.id === tr?.id);
    setList(arr2);
    setIdx(at >= 0 ? at : 0);
    setNow(tr);
    setPlaying(true);
    setPos(0);
    setReqSeek(0);
    streamBuf.current = 0;
    recordPlay(tr);
    if ('mediaSession' in navigator && tr) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: tr.title,
        artist: tr.artist,
        artwork: [{ src: tr.coverUrl, sizes: '512x512', type: 'image/png' }]
      });
      navigator.mediaSession.setActionHandler('play', toggle);
      navigator.mediaSession.setActionHandler('pause', toggle);
      navigator.mediaSession.setActionHandler('nexttrack', next);
      navigator.mediaSession.setActionHandler('previoustrack', prev);
    }
  }
  function toggle() {
    if (!now) return;
    setPlaying((p) => !p);
  }
  function seek(to) {
    const val = Number(to || 0);
    setPos(val);
    setReqSeek(val);
  }
  function next() {
    const curIdx = idxRef.current;
    const curList = listRef.current;
    const curRepeat = repeatRef.current;
    if (curRepeat === 2) {
      setReqSeek(0);
      setPos(0);
      setPlaying(true);
      return;
    }
    const n = curIdx + 1;
    if (n < curList.length) {
      const tr = curList[n];
      setIdx(n);
      setNow(tr);
      setPlaying(true);
      setPos(0);
      setReqSeek(0);
      streamBuf.current = 0;
      recordPlay(tr);
    } else if (curRepeat === 1 && curList.length > 0) {
      const tr = curList[0];
      setIdx(0);
      setNow(tr);
      setPlaying(true);
      setPos(0);
      setReqSeek(0);
      streamBuf.current = 0;
      recordPlay(tr);
    } else {
      setPlaying(false);
    }
  }
  function prev() {
    const curIdx = idxRef.current;
    const curList = listRef.current;
    if (!curList.length) return;
    const n = curIdx - 1;
    if (n >= 0) {
      const tr = curList[n];
      setIdx(n);
      setNow(tr);
      setPlaying(true);
      setPos(0);
      setReqSeek(0);
      streamBuf.current = 0;
      recordPlay(tr);
    }
  }
  const val = useMemo(
    () => ({
      now, list, idx, playing, pos, dur, vol,
      repeat, setRepeat, reqSeek, setReqSeek,
      rightOpen, setRightOpen, setVol, setPos,
      setDur, setPlaying, playTrack, toggle, seek, next, prev
    }),
    [now, list, idx, playing, pos, dur, vol, rightOpen, repeat, reqSeek]
  );
  return <PlayerCtx.Provider value={val}>{children}</PlayerCtx.Provider>;
}
