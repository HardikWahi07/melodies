import { GoogleGenerativeAI } from "@google/generative-ai";
const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY;
const AI_BASE_URL =
  import.meta.env.VITE_AI_BASE_URL ??
  "https://api.groq.com/openai/v1";
const AI_MODEL =
  import.meta.env.VITE_AI_MODEL ??
  "meta-llama/llama-4-scout-17b-16e-instruct";
function stripCodeFences(text) {
  return text.replace(/```(?:json)?\s*/gi, "").replace(/```/g, "").trim();
}
function tryParseJson(text) {
  const cleaned = stripCodeFences(text);
  try {
    return JSON.parse(cleaned);
  } catch {
    const firstObjectStart = cleaned.indexOf("{");
    const firstArrayStart = cleaned.indexOf("[");
    const start =
      firstObjectStart === -1
        ? firstArrayStart
        : firstArrayStart === -1
          ? firstObjectStart
          : Math.min(firstObjectStart, firstArrayStart);
    if (start === -1) throw new Error("Model did not return JSON.");
    const tail = cleaned.slice(start);
    const lastBrace = Math.max(tail.lastIndexOf("}"), tail.lastIndexOf("]"));
    if (lastBrace === -1) throw new Error("Model returned incomplete JSON.");
    const candidate = tail.slice(0, lastBrace + 1).trim();
    return JSON.parse(candidate);
  }
}
function asString(v, fallback = "") {
  return typeof v === "string" ? v : fallback;
}
function asNumber(v, fallback) {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}
function asStringArray(v, fallback = []) {
  if (!Array.isArray(v)) return fallback;
  return v.map(x => (typeof x === "string" ? x : String(x))).filter(Boolean);
}
function normalizeDrumStyle(v) {
  if (v === "dance" || v === "lofi" || v === "rock" || v === "trap") return v;
  return "dance";
}
function normalizeSongGeneration(raw) {
  const obj = raw ?? {};
  const bpm = Math.max(70, Math.min(160, Math.round(asNumber(obj.bpm, 120))));
  return {
    title: asString(obj.title, "Untitled"),
    genre: asString(obj.genre, "Pop"),
    mood: asString(obj.mood, "Upbeat"),
    lyrics: asStringArray(obj.lyrics, ["(No lyrics returned)"]),
    bpm,
    melody: asStringArray(obj.melody, ["C4", "E4", "G4", "C5"]).slice(0, 16),
    bassline: asStringArray(obj.bassline, ["C2", "G1", "F1", "G1"]).slice(0, 16),
    drumStyle: normalizeDrumStyle(obj.drumStyle),
    key: asString(obj.key, ""),
    chords: asStringArray(obj.chords, []).slice(0, 8),
    structure: asStringArray(obj.structure, []).slice(0, 12)
  };
}
async function callAI(prompt) {
  if (!GROQ_KEY) throw new Error("Groq/AI API Key is missing.");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);
  const response = await fetch(`${AI_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${GROQ_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: AI_MODEL,
      messages: [
        { role: "system", content: "You are a professional music synthesizer and songwriter. Return ONLY valid JSON." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7
    }),
    signal: controller.signal
  });
  clearTimeout(timeout);
  const rawText = await response.text();
  let data;
  try {
    data = rawText ? JSON.parse(rawText) : {};
  } catch {
    throw new Error("AI API returned non-JSON response.");
  }
  if (!response.ok) {
    const msg = data?.error?.message || data?.message || `AI API error (${response.status}).`;
    throw new Error(msg);
  }
  if (data?.error) throw new Error(data.error.message || "AI API error.");
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) throw new Error("AI response was empty.");
  return tryParseJson(content);
}
export async function generatePlaylistRecommendation(prompt) {
  const aiPrompt = `Based on the vibe: "${prompt}", generate 10 real songs (Title and Artist). Return JSON: { "songs": [{ "title": "", "artist": "" }] }`;
  try {
    const res = await callAI(aiPrompt);
    const songs = res?.songs;
    if (!Array.isArray(songs)) return [];
    return songs
      .map((s) => ({ title: asString(s?.title), artist: asString(s?.artist) }))
      .filter(s => s.title && s.artist);
  } catch (err) {
    console.error("AI Rec Error:", err);
    if (GEMINI_KEY) {
      const genAI = new GoogleGenerativeAI(GEMINI_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(`Curate 10 real songs for: "${prompt}". Return ONLY a JSON array of objects with "title" and "artist".`);
      const text = result.response.text();
      const jsonStr = text.replace(/```json|```/g, "").trim();
      return JSON.parse(jsonStr);
    }
    throw err;
  }
}
function normalizeBlendSongs(raw) {
  const songs = raw?.songs;
  if (!Array.isArray(songs)) return [];
  return songs
    .map((s) => {
      const title = asString(s?.title).trim();
      const artist = asString(s?.artist).trim();
      const rf = asString(s?.recommendedFor).toLowerCase();
      const recommendedFor =
        rf === "user1" || rf === "user2" || rf === "both" ? rf : "both";
      return { title, artist, recommendedFor };
    })
    .filter((s) => s.title && s.artist);
}
export async function generateBlendRecommendation(params) {
  const count = Math.max(10, Math.min(40, Math.floor(params.count || 24)));
  const a1 = (params.user1Artists || []).filter(Boolean).slice(0, 10).join(", ");
  const a2 = (params.user2Artists || []).filter(Boolean).slice(0, 10).join(", ");
  const s1 = (params.user1Songs || []).filter(Boolean).slice(0, 8).join("; ");
  const s2 = (params.user2Songs || []).filter(Boolean).slice(0, 8).join("; ");
  const aiPrompt = `
Create a Spotify Blend-style list of REAL songs for two people based on their listening histories and followed artists.
User1: "${params.user1Name}"
  Followed/top artists: ${a1 || "(unknown)"}
  Recently listened songs: ${s1 || "(unknown)"}
User2: "${params.user2Name}"
  Followed/top artists: ${a2 || "(unknown)"}
  Recently listened songs: ${s2 || "(unknown)"}
Rules:
- Return ONLY JSON.
- Output exactly ${count} songs.
- Include a mix: songs that match User1's taste, songs that match User2's taste, and songs that bridge both tastes.
- Prioritize songs both users would enjoy based on their overlapping preferences.
- Each song must include "recommendedFor": one of ["user1","user2","both"] meaning who it fits best.
- All songs must be REAL, well-known songs by real artists.
JSON schema:
{
  "songs": [
    { "title": "Song", "artist": "Artist", "recommendedFor": "both" }
  ]
}`;
  const raw = await callAI(aiPrompt);
  return normalizeBlendSongs(raw).slice(0, count);
}
export async function generateLyrics(prompt) {
  const aiPrompt = `
    Create a complete song blueprint based on: "${prompt}".
    Provide ONLY JSON with:
    - "title": A catchy title
    - "genre": Recommended musical style
    - "mood": The overall feeling
    - "lyrics": An array of strings
    - "bpm": A number between 70 and 160
    - "key": Optional musical key (e.g. "A minor", "C major")
    - "chords": Optional chord progression as an array of 4-8 chords (e.g. ["Am","F","C","G"])
    - "structure": Optional sections with bars (e.g. ["intro:4","verse:8","chorus:8","bridge:4","chorus:8"])
    - "melody": An array of 4-8 note strings (e.g. ["C4", "E4", "G4", "C5"])
    - "bassline": An array of 4-8 lower notes (e.g. ["C2", "G1", "F1", "G1"])
    - "drumStyle": One of ["dance", "lofi", "rock", "trap"]
  `;
  const raw = await callAI(aiPrompt);
  return normalizeSongGeneration(raw);
}
