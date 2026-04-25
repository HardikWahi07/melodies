import { useEffect, useState } from "react";
import { subscribeFollowingArtists } from "../api/artists";
export function useFollowingArtists(me) {
  const [artists, setArtists] = useState([]);
  useEffect(() => {
    if (!me) {
      setArtists([]);
      return;
    }
    return subscribeFollowingArtists(me, setArtists);
  }, [me]);
  return artists;
}
