# Spotify-ish (Vite + React)

Music search/trending uses YouTube Data API (optional). Auth + saved data uses Firebase.

## Setup

1) Copy `.env.example` to `.env` and fill in keys (Firebase required; YouTube + AI optional).

2) Install + run:

```bash
npm install
npm run dev
```

Open the URL printed by Vite (usually `http://localhost:5173`).

## AI

See `README_AI.md` for Groq usage with `meta-llama/llama-4-scout-17b-16e-instruct`.

## Jam Lobbies (Firebase Realtime Database)

This project includes a simple “Jam Lobby” feature backed by Realtime Database (`/lobbies/*`).

Recommended basic rules (adjust for your app):

```json
{
  "rules": {
    "lobbies": {
      "$lobbyId": {
        ".read": "auth != null",
        "passHash": { ".read": false },
        "participants": {
          "$uid": {
            ".read": "auth != null",
            ".write": "auth != null && auth.uid === $uid && newData.child('joinKey').val() === root.child('lobbies').child($lobbyId).child('passHash').val()",
            "joinKey": { ".read": false }
          }
        },
        "transport": {
          ".write": "auth != null && root.child('lobbies').child($lobbyId).child('hostUid').val() === auth.uid"
        },
        "track": { ".write": "auth != null && root.child('lobbies').child($lobbyId).child('hostUid').val() === auth.uid" },
        "song": { ".write": "auth != null && root.child('lobbies').child($lobbyId).child('hostUid').val() === auth.uid" },
        "chat": {
          ".write": "auth != null"
        }
      }
    }
  }
}
```

## Artists / Following (Realtime Database)

Following artists is stored under `users/{uid}/followingArtists/{artistId}`.

## Blend (Realtime Database)

Blend playlists are stored in `playlists/*` with `type: "blend"` and `tracks/*` entries that may include `recommendedForName`.
