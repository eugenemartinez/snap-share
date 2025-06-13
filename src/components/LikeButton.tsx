import React, { useImperativeHandle, useState, useEffect, forwardRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import LoginModal from "@/components/LoginModal";
import { FaHeart, FaRegHeart, FaSpinner } from "react-icons/fa";

type LikeButtonProps = {
    imageId: string;
    onLike?: () => void;
    setToast?: (toast: { message: string; type: "success" | "error" }) => void;
};

const LikeButton = forwardRef<{ refetch: () => void }, LikeButtonProps>(({ imageId, onLike, setToast }, ref) => {
  const { status } = useSession();
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [initializing, setInitializing] = useState(true);

  const fetchLikeState = useCallback(() => {
    fetch(`/api/images/${imageId}/like`)
      .then(res => res.json())
      .then(data => {
        setLiked(data.liked);
        setCount(data.count);
      })
      .finally(() => setInitializing(false));
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
      if (setToast) {
        setToast({
          message: liked ? "Unliked successfully." : "Liked successfully.",
          type: "success",
        });
      }
    } else {
      // Handle like limit error
      if (res.status === 403 && setToast) {
        const data = await res.json();
        setToast({ message: data.message || "Like limit reached.", type: "error" });
      }
    }
    setLoading(false);
  }

  if (liked) {
    return (
      <>
        <button
          onClick={toggleLike}
          disabled={loading}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full font-semibold transition bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/60 dark:text-red-200 dark:hover:bg-red-800/80 cursor-pointer disabled:opacity-60"
          aria-pressed="true"
          aria-label="Unlike image"
          type="button"
        >
          {loading ? (
            <FaSpinner className="w-5 h-5 animate-spin" />
          ) : (
            <FaHeart className="w-5 h-5 fill-red-500" />
          )}
          {!initializing && <span>{count}</span>}
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
        className="flex items-center gap-1 px-3 py-1.5 rounded-full font-semibold transition bg-gray-100 text-gray-500 hover:bg-red-200 dark:bg-white/10 dark:text-gray-300 dark:hover:bg-red-800/80 cursor-pointer disabled:opacity-60"
        aria-pressed="false"
        aria-label="Like image"
        type="button"
      >
        {loading ? (
          <FaSpinner className="w-5 h-5 animate-spin" />
        ) : (
          <FaRegHeart className="w-5 h-5 stroke-red-500" />
        )}
        {!initializing && <span>{count}</span>}
      </button>
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </>
  );
});

LikeButton.displayName = "LikeButton";
export default LikeButton;