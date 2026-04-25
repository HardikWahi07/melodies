import React, { useState, useEffect, useContext } from "react";
import { Search as SearchIcon, Loader2, Music } from "lucide-react";
import { apiGet } from "../api.js";
import { PlayerCtx } from "../context/PlayerCtx.jsx";
import TrackRow from "../components/TrackRow.jsx";
export default function Search() {
  const { playTrack } = useContext(PlayerCtx);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const handler = setTimeout(async () => {
      setLoading(true);
      const res = await apiGet(`/api/music/search?q=${encodeURIComponent(query)}`);
      setResults(res.tracks || []);
      setLoading(false);
    }, 600);
    return () => clearTimeout(handler);
  }, [query]);
  return (
    <div className="main" style={{ padding: '0px' }}>
      <div style={{
        padding: '30px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'linear-gradient(to bottom, #0A0A0A 60%, transparent)',
        display: 'flex',
        justifyContent: 'center'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          background: 'var(--bg-card)',
          border: '1px solid var(--glass-border)',
          padding: '12px 24px',
          borderRadius: '500px',
          width: '100%',
          maxWidth: '600px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
        }}>
          <SearchIcon size={20} color="var(--pink)" />
          <input
            type="text"
            placeholder="Search for tracks, artists, or official videos..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              background: 'none',
              border: 'none',
              color: '#fff',
              fontSize: '16px',
              fontWeight: '600',
              width: '100%',
              outline: 'none'
            }}
          />
          {loading && <Loader2 className="spin" size={18} color="var(--pink)" />}
        </div>
      </div>
      <div style={{ padding: '0 40px 40px 40px' }}>
        {!query && (
          <div style={{ textAlign: 'center', marginTop: '100px', opacity: 0.3 }}>
            <Music size={80} style={{ marginBottom: '24px' }} />
            <div style={{ fontSize: '24px', fontWeight: '800' }}>What do you want to hear?</div>
            <div style={{ fontSize: '14px' }}>Search for your favorite official music videos</div>
          </div>
        )}
        {query && results.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '12px', fontWeight: '800', color: 'var(--mut)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '16px', paddingLeft: '16px' }}>
              Search Results
            </div>
            {results.map((t) => (
              <TrackRow
                key={t.id}
                t={t}
                onPlay={() => playTrack(t, results)}
                showAdd
              />
            ))}
          </div>
        )}
        {query && !loading && results.length === 0 && (
          <div style={{ textAlign: 'center', marginTop: '100px', color: 'var(--mut)' }}>
            No official tracks found for "{query}"
          </div>
        )}
      </div>
    </div>
  );
}
