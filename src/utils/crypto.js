function toBase64(bytes) {
  const arr = new Uint8Array(bytes);
  let s = "";
  for (let i = 0; i < arr.length; i++) s += String.fromCharCode(arr[i]);
  return btoa(s);
}
function randomSalt(bytes = 16) {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return toBase64(arr.buffer).replace(/=+$/g, "");
}
async function sha256Base64(input) {
  const enc = new TextEncoder();
  const digest = await crypto.subtle.digest("SHA-256", enc.encode(input));
  return toBase64(digest).replace(/=+$/g, "");
}
export function makeSalt() {
  return randomSalt(16);
}
export async function makeLobbyPassHash(password, salt) {
  return sha256Base64(`${password}:${salt}`);
}
