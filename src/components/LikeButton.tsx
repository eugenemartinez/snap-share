import React, { useImperativeHandle, useState, useEffect, forwardRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import LoginModal from "@/components/LoginModal";

type LikeButtonProps = {
    imageId: string;
    onLike?: () => void;
};

const LikeButton = forwardRef<{ refetch: () => void }, LikeButtonProps>(({ imageId, onLike }, ref) => {
  const { status } = useSession();
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  // Use useCallback for a stable function reference
  const fetchLikeState = useCallback(() => {
    fetch(`/api/images/${imageId}/like`)
      .then(res => res.json())
      .then(data => {
        setLiked(data.liked);
        setCount(data.count);
      });
  }, [imageId]);

  useImperativeHandle(ref, () => ({
    refetch: fetchLikeState,
  }));

  useEffect(() => {
    fetchLikeState();
  }, [fetchLikeState]);

  async function toggleLike() {
    if (status !== "authenticated") {
      setShowLogin(true);
      return;
    }
    setLoading(true);
    const method = liked ? "DELETE" : "POST";
    const res = await fetch(`/api/images/${imageId}/like`, { method });
    if (res.ok) {
      setLiked(!liked);
      setCount(c => c + (liked ? -1 : 1));
      if (onLike) onLike();
    }
    setLoading(false);
  }

  if (liked) {
    return (
      <>
        <button
          onClick={toggleLike}
          disabled={loading}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full font-semibold transition bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/60 dark:text-red-200 dark:hover:bg-red-800/80 cursor-pointer"
          aria-pressed="true"
          aria-label="Unlike image"
          type="button"
        >
          <svg
            className="w-5 h-5 fill-red-500"
            viewBox="0 0 20 20"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
            />
          </svg>
          <span>{count}</span>
        </button>
        {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
      </>
    );
  }

  return (
    <>
      <button
        onClick={toggleLike}
        disabled={loading}
        className="flex items-center gap-1 px-3 py-1.5 rounded-full font-semibold transition bg-gray-100 text-gray-500 hover:bg-red-200 dark:bg-white/10 dark:text-gray-300 dark:hover:bg-red-800/80 cursor-pointer"
        aria-pressed="false"
        aria-label="Like image"
        type="button"
      >
        <svg
          className="w-5 h-5 fill-none stroke-red-500"
          viewBox="0 0 20 20"
          fill="currentColor"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
          />
        </svg>
        <span>{count}</span>
      </button>
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </>
  );
});

LikeButton.displayName = "LikeButton";
export default LikeButton;