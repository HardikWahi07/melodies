import React, { useEffect, useRef } from "react";

export default function YTPlayer({ videoId, playing, volume, reqSeek, onSeeked, onTimeUpdate, onEnd, pointerEvents = 'none' }) {
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const timeInt = useRef(null);

  const cbRef = useRef({ onEnd, onTimeUpdate, onSeeked });
  useEffect(() => {
    cbRef.current = { onEnd, onTimeUpdate, onSeeked };
  }, [onEnd, onTimeUpdate, onSeeked]);

  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      if (firstScriptTag && firstScriptTag.parentNode) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      } else {
        document.head.appendChild(tag);
      }

      const oldReady = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (oldReady) oldReady();
        init();
      };
    } else {
      init();
    }

    function init() {
      if (playerRef.current) return;
      if (!window.YT || typeof window.YT.Player !== 'function') {
        setTimeout(init, 100);
        return;
      }
      if (!containerRef.current) return;

      playerRef.current = new window.YT.Player(containerRef.current, {
        height: '100%',
        width: '100%',
        videoId: videoId || '',
        playerVars: {
          autoplay: playing ? 1 : 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          rel: 0,
          showinfo: 0
        },
        events: {
          onReady: (e) => {
            if (e.target && typeof e.target.setVolume === 'function') {
              e.target.setVolume(volume * 100);
            }
            if (playing && e.target && typeof e.target.playVideo === 'function') {
              e.target.playVideo();
            }
          },
          onStateChange: (e) => {
            if (e.data === window.YT.PlayerState.ENDED) {
              cbRef.current.onEnd?.();
            }
          }
        }
      });
    }

    return () => {
      if (timeInt.current) clearInterval(timeInt.current);
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        try { playerRef.current.destroy(); } catch (e) { }
        playerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (playerRef.current && typeof playerRef.current.loadVideoById === 'function' && videoId) {
      if (playing) {
        playerRef.current.loadVideoById(videoId);
      } else {
        playerRef.current.cueVideoById(videoId);
      }
    }
  }, [videoId]);

  useEffect(() => {
    if (!playerRef.current) return;
    if (playing && typeof playerRef.current.playVideo === 'function') {
      playerRef.current.playVideo();
    } else if (!playing && typeof playerRef.current.pauseVideo === 'function') {
      playerRef.current.pauseVideo();
    }
  }, [playing]);

  useEffect(() => {
    if (playerRef.current && typeof playerRef.current.setVolume === 'function') {
      playerRef.current.setVolume(volume * 100);
    }
  }, [volume]);

  useEffect(() => {
    if (reqSeek !== -1 && playerRef.current && typeof playerRef.current.seekTo === 'function') {
      playerRef.current.seekTo(reqSeek, true);
      cbRef.current.onSeeked?.();
    }
  }, [reqSeek]);

  useEffect(() => {
    if (timeInt.current) clearInterval(timeInt.current);
    timeInt.current = setInterval(() => {
      if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        cbRef.current.onTimeUpdate?.(playerRef.current.getCurrentTime(), playerRef.current.getDuration() || 0);
      }
    }, 500);
    return () => clearInterval(timeInt.current);
  }, []);

  return (
    <div style={{ width: '100%', height: '100%', pointerEvents }}>
      <div ref={containerRef} />
    </div>
  );
}
