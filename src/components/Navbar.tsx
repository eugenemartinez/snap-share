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
  const [menuOpen, setMenuOpen] = useState(false);

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

  // Close menu on route change
  useEffect(() => {
    const closeMenu = () => setMenuOpen(false);
    router.events.on("routeChangeStart", closeMenu);
    return () => router.events.off("routeChangeStart", closeMenu);
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
        </div>
        {/* Desktop menu */}
        <div className="hidden md:flex items-center gap-4">
          <Link href="/" className="hover:text-[var(--primary)] font-medium transition flex items-center gap-2">
            {/* Home/Public Gallery Icon */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7m-9 2v8m4-8v8m5 0h-6a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2z" />
            </svg>
            Public Gallery
          </Link>
          {session && (
            <Link href="/upload" className="hover:text-[var(--primary)] font-medium transition flex items-center gap-2">
              {/* Upload Icon */}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5-5m0 0l5 5m-5-5v12" />
              </svg>
              Upload
            </Link>
          )}
          {!session && (
            <>
              <Link href="/login" className="hover:text-[var(--primary)] font-medium transition flex items-center gap-2">
                Login
              </Link>
              <Link href="/register" className="hover:text-[var(--primary)] font-medium transition flex items-center gap-2">
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
                className="text-[var(--destructive)] hover:bg-[var(--destructive)] hover:text-white px-3 py-1 rounded-full font-semibold transition cursor-pointer focus:outline-none flex items-center gap-2"
              >
                {/* Logout Icon */}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h4a2 2 0 012 2v1" />
                </svg>
                Logout
              </button>
            </>
          )}
          <DarkModeToggle />
        </div>
        {/* Hamburger for mobile */}
        <div className="md:hidden flex items-center">
          <button
            aria-label="Open menu"
            className="p-2 rounded hover:bg-[var(--muted)] transition"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <svg width={28} height={28} fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 8h20M4 16h20" />
            </svg>
          </button>
          {/* Mobile menu */}
          {menuOpen && (
            <div className="absolute top-16 right-4 bg-[var(--card)] text-[var(--card-foreground)] rounded shadow-lg flex flex-col gap-2 p-4 min-w-[200px] z-50 border border-[var(--border)]">
              {/* Profile at the top */}
              {session && (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    router.push("/profile");
                  }}
                  className="flex items-center gap-2 px-4 py-1 rounded-full bg-[var(--card)] shadow border border-[var(--border)] cursor-pointer transition hover:bg-[var(--primary)] hover:text-white focus:outline-none justify-center mb-2"
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
              )}

              {/* Theme toggle - full width */}
                <DarkModeToggle />

              {/* Navigation links */}
              <Link
                href="/"
                className="hover:text-[var(--primary)] font-medium transition flex items-center justify-center gap-2"
                onClick={() => setMenuOpen(false)}
              >
                {/* Home/Public Gallery Icon */}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7m-9 2v8m4-8v8m5 0h-6a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2z" />
                </svg>
                Public Gallery
              </Link>
              {session && (
                <Link
                  href="/upload"
                  className="hover:text-[var(--primary)] font-medium transition flex items-center justify-center gap-2"
                  onClick={() => setMenuOpen(false)}
                >
                  {/* Upload Icon */}
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5-5m0 0l5 5m-5-5v12" />
                  </svg>
                  Upload
                </Link>
              )}
              {!session && (
                <>
                  <Link href="/login" className="hover:text-[var(--primary)] font-medium transition flex items-center justify-center gap-2" onClick={() => setMenuOpen(false)}>
                    Login
                  </Link>
                  <Link href="/register" className="hover:text-[var(--primary)] font-medium transition flex items-center justify-center gap-2" onClick={() => setMenuOpen(false)}>
                    Register
                  </Link>
                </>
              )}

              {/* Logout at the bottom */}
              {session && (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    signOut({
                      callbackUrl: "/login?toast=Logged%20out%20successfully!",
                    });
                  }}
                  className="text-[var(--destructive)] hover:bg-[var(--destructive)] hover:text-white px-3 py-1 rounded-full font-semibold transition cursor-pointer focus:outline-none flex items-center justify-center gap-2"
                >
                  {/* Logout Icon */}
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h4a2 2 0 012 2v1" />
                  </svg>
                  Logout
                </button>
              )}
            </div>
          )}
        </div>
      </nav>
    </>
  );
}