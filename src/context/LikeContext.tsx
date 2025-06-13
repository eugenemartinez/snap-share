import React, { createContext, useContext, useState, useCallback } from "react";

type LikeState = {
  [imageId: string]: { liked: boolean; count: number };
};

const LikeContext = createContext<{
  likes: LikeState;
  setLike: (imageId: string, liked: boolean, count: number) => void;
  fetchLikeIfNeeded: (imageId: string) => Promise<void>;
}>({
  likes: {},
  setLike: () => {},
  fetchLikeIfNeeded: async () => {},
});

export const useLike = () => useContext(LikeContext);

export const LikeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [likes, setLikes] = useState<LikeState>({});

  function setLike(imageId: string, liked: boolean, count: number) {
    setLikes(prev => ({ ...prev, [imageId]: { liked, count } }));
  }

  // Only fetch if not already cached
  const fetchLikeIfNeeded = useCallback(async (imageId: string) => {
    if (likes[imageId]) return;
    const res = await fetch(`/api/images/${imageId}/like`);
    if (res.ok) {
      const data = await res.json();
      setLike(imageId, data.liked, data.count);
    }
  }, [likes]);

  return (
    <LikeContext.Provider value={{ likes, setLike, fetchLikeIfNeeded }}>
      {children}
    </LikeContext.Provider>
  );
};