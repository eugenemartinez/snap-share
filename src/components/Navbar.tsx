import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Spinner from "./Spinner";
import DarkModeToggle from "./DarkModeToggle";

export default function Navbar() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [avatar, setAvatar] = useState<string>("/avatar.png");

  useEffect(() => {
    if (session) {
      fetch("/api/profile")
        .then((res) => res.json())
        .then((data) => {
          if (data?.avatar) setAvatar(data.avatar);
          else setAvatar("/avatar.png");
        })
        .catch(() => setAvatar("/avatar.png"));
    }
  }, [session]);

  useEffect(() => {
    const handleStart = () => setLoading(true);
    const handleStop = () => setLoading(false);
    router.events.on("routeChangeStart", handleStart);
    router.events.on("routeChangeComplete", handleStop);
    router.events.on("routeChangeError", handleStop);
    return () => {
      router.events.off("routeChangeStart", handleStart);
      router.events.off("routeChangeComplete", handleStop);
      router.events.off("routeChangeError", handleStop);
    };
  }, [router]);

  return (
    <>
      {loading && <Spinner />}
      <nav className="w-full py-3 px-6 flex justify-between items-center mb-8 bg-[var(--sidebar)] text-[var(--sidebar-foreground)] shadow-lg sticky top-0 z-40">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="font-extrabold text-2xl tracking-tight flex items-center gap-2 hover:opacity-90 transition"
          >
            <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
              SnapShare
            </span>
          </Link>
          <Link
            href="/"
            className="hover:text-[var(--primary)] font-medium transition"
          >
            Public Gallery
          </Link>
          {session && (
            <>
              <Link
                href="/upload"
                className="hover:text-[var(--primary)] font-medium transition"
              >
                Upload
              </Link>
            </>
          )}
        </div>
        <div className="flex items-center gap-4">
          {!session && (
            <>
              <Link
                href="/login"
                className="hover:text-[var(--primary)] font-medium transition"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="hover:text-[var(--primary)] font-medium transition"
              >
                Register
              </Link>
            </>
          )}
          {session && (
            <>
              <button
                type="button"
                onClick={() => router.push("/profile")}
                className="flex items-center gap-2 px-4 py-1 rounded-full bg-[var(--card)] shadow border border-[var(--border)] cursor-pointer transition hover:bg-[var(--primary)] hover:text-white focus:outline-none"
                title="Go to profile"
              >
                <Image
                  src={avatar}
                  alt="Avatar"
                  width={32}
                  height={32}
                  className="rounded-full aspect-square object-cover border"
                  priority={false}
                />
                <span className="font-semibold text-sm truncate max-w-[120px]">
                  {session.user?.name || session.user?.email}
                </span>
              </button>
              <button
                onClick={() =>
                  signOut({
                    callbackUrl: "/login?toast=Logged%20out%20successfully!",
                  })
                }
                className="text-[var(--destructive)] hover:bg-[var(--destructive)] hover:text-white px-3 py-1 rounded-full font-semibold transition cursor-pointer focus:outline-none"
              >
                Logout
              </button>
            </>
          )}
          <DarkModeToggle />
        </div>
      </nav>
    </>
  );
}