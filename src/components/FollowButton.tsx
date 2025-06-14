import Button from "@/components/Button";
import { useSession } from "next-auth/react";
import { useState } from "react";
import LoginModal from "@/components/LoginModal";

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
  const [showLogin, setShowLogin] = useState(false);

  async function toggleFollow() {
    if (status !== "authenticated") {
      setShowLogin(true); 
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
          message: following ? "Unfollowed successfully" : "Followed successfully",
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
      <Button
        onClick={toggleFollow}
        loading={loading}
        variant={following ? "outline" : "primary"}
        className={following ? "border-[var(--unfollow-bg)] text-[var(--unfollow-fg)] hover:bg-[var(--muted)]" : ""}
      >
        {following ? "Unfollow" : "Follow"}
      </Button>
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} setToast={setToast}/>}
    </div>
  );
}