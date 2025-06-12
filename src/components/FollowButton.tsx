import { useSession } from "next-auth/react";
import { useState } from "react";

export default function FollowButton({
  username,
  initialFollowing,
  initialCount,
  setToast,
}: {
  username: string;
  initialFollowing: boolean;
  initialCount: number;
  setToast?: (toast: { message: string; type: "success" | "error" }) => void;
}) {
  const { status } = useSession();
  const [following, setFollowing] = useState(initialFollowing);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  async function toggleFollow() {
    if (status !== "authenticated") {
      // Optionally show login modal
      return;
    }
    setLoading(true);
    const method = following ? "DELETE" : "POST";
    const res = await fetch(`/api/user/${username}/follow`, { method });
    if (res.ok) {
      setFollowing(!following);
      setCount((c) => c + (following ? -1 : 1));
      if (setToast) {
        setToast({
          message: following ? "Unfollowed successfully." : "Followed successfully.",
          type: "success",
        });
      }
    } else {
      // Handle follow limit error
      if (res.status === 403 && setToast) {
        const data = await res.json();
        setToast({ message: data.message || "Follow limit reached.", type: "error" });
      }
    }
    setLoading(false);
  }

  return (
    <div className="flex flex-col items-center">
      <p className="text-gray-500 text-sm mb-4">
        {count} follower{count === 1 ? "" : "s"}
      </p>
      <button
        onClick={toggleFollow}
        disabled={loading}
        className={`px-4 py-1 rounded-full font-semibold transition cursor-pointer
          ${
            following
              ? "bg-[var(--unfollow-bg)] text-[var(--unfollow-fg)] hover:bg-[var(--muted)]"
              : "bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--ring)]"
          }
        `}
      >
        {following ? "Unfollow" : "Follow"}
      </button>
    </div>
  );
}