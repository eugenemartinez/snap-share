import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import { useRouter } from "next/router";
import Spinner from "./Spinner";
import DarkModeToggle from "./DarkModeToggle";
import Button from "@/components/Button";
import { FaHome, FaInfoCircle, FaUpload, FaSignInAlt, FaUserPlus, FaSignOutAlt, FaBars } from "react-icons/fa";

export type NavbarHandle = {
  refetchAvatar: () => void;
};

const Navbar = forwardRef(function Navbar(props, ref) {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [avatar, setAvatar] = useState<string>("/avatar.png");
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fetch avatar logic
  const fetchAvatar = React.useCallback(() => {
    if (session) {
      fetch("/api/profile")
        .then((res) => res.json())
        .then((data) => {
          if (data?.avatar) {
            setAvatar(`${data.avatar}?t=${Date.now()}`);
          } else {
            setAvatar("/avatar.png");
          }
        })
        .catch(() => setAvatar("/avatar.png"));
    }
  }, [session]);

  // Expose refetchAvatar to parent via ref
  useImperativeHandle(ref, () => ({
    refetchAvatar: fetchAvatar,
  }));

  useEffect(() => {
    fetchAvatar();
  }, [fetchAvatar]);

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

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  return (
    <>
      {loading && <Spinner />}
      <nav className="w-full py-3 px-6 flex justify-between items-center mb-8 bg-[var(--sidebar)] text-[var(--sidebar-foreground)] shadow-lg sticky top-0 z-51">
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
        <div className="hidden lg:flex items-center gap-4">
          <Link href="/" className="hover:text-[var(--primary)] font-medium transition flex items-center gap-2">
            <FaHome className="h-5 w-5" />
            Public Gallery
          </Link>
          <Link href="/about" className="hover:text-[var(--primary)] font-medium transition flex items-center gap-2">
            <FaInfoCircle className="h-5 w-5" />
            About
          </Link>
          {session && (
            <Link href="/upload" className="hover:text-[var(--primary)] font-medium transition flex items-center gap-2">
              <FaUpload className="h-5 w-5" />
              Upload
            </Link>
          )}
          {!session && (
            <>
              <Link href="/login" className="hover:text-[var(--primary)] font-medium transition flex items-center gap-2">
                <FaSignInAlt className="h-5 w-5" />
                Login
              </Link>
              <Link href="/register" className="hover:text-[var(--primary)] font-medium transition flex items-center gap-2">
                <FaUserPlus className="h-5 w-5" />
                Register
              </Link>
            </>
          )}
          {session && (
            <>
              <button
                type="button"
                onClick={() => router.push("/profile")}
                className="flex items-center gap-2 px-4 py-1 rounded-full bg-[var(--card)] shadow border border-[var(--border)] cursor-pointer transition hover:bg-[var(--primary)] hover:text-white focus:outline-none hover:scale-105 hover:shadow-md"
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
              <Button
                type="button"
                variant="outline"
                loading={isLoggingOut}
                onClick={async () => {
                  setIsLoggingOut(true);
                  await signOut({
                    callbackUrl: "/login?toast=Logged%20out%20successfully!",
                  });
                }}
                className="bg-[var(--sidebar)] text-[var(--destructive)] hover:bg-[var(--destructive)] hover:text-white px-3 py-1 rounded-full font-semibold transition cursor-pointer focus:outline-none flex items-center gap-2"
                leftIcon={<FaSignOutAlt className="h-5 w-5" />}
              >
                Logout
              </Button>
            </>
          )}
          <DarkModeToggle />
        </div>
        {/* Hamburger for mobile */}
        <div className="lg:hidden flex items-center">
          <button
            aria-label="Open menu"
            className="p-2 rounded hover:bg-[var(--muted)] transition"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <FaBars className="w-7 h-7" />
          </button>
          {menuOpen && (
            <div
              ref={menuRef}
              className="
                absolute top-16 right-4
                bg-[var(--card)] bg-opacity-95
                backdrop-blur
                text-[var(--card-foreground)]
                rounded-xl
                shadow-2xl
                flex flex-col gap-3
                p-5
                min-w-[220px]
                z-50
                border border-[var(--border)]
                transition-all
                animate-fade-in
              "
            >
              {/* Profile at the top */}
              {session && (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    router.push("/profile");
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--muted)] shadow border border-[var(--border)] cursor-pointer transition hover:bg-[var(--primary)] hover:text-white focus:outline-none justify-center mb-2"
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

              {/* Divider */}
              <div className="border-b border-[var(--border)] my-2" />

              {/* Theme toggle - full width */}
              <DarkModeToggle />

              {/* Navigation links */}
              <div className="flex flex-col gap-2 mt-2">
                <Link
                  href="/"
                  className="hover:text-[var(--primary)] font-medium transition flex items-center justify-center gap-2"
                  onClick={() => setMenuOpen(false)}
                >
                  <FaHome className="h-5 w-5" />
                  Public Gallery
                </Link>
                <Link
                  href="/about"
                  className="hover:text-[var(--primary)] font-medium transition flex items-center justify-center gap-2"
                  onClick={() => setMenuOpen(false)}
                >
                  <FaInfoCircle className="h-5 w-5" />
                  About
                </Link>
                {session && (
                  <Link
                    href="/upload"
                    className="hover:text-[var(--primary)] font-medium transition flex items-center justify-center gap-2"
                    onClick={() => setMenuOpen(false)}
                  >
                    <FaUpload className="h-5 w-5" />
                    Upload
                  </Link>
                )}
                {!session && (
                  <>
                    <Link href="/login" className="hover:text-[var(--primary)] font-medium transition flex items-center justify-center gap-2" onClick={() => setMenuOpen(false)}>
                      <FaSignInAlt className="h-5 w-5" />
                      Login
                    </Link>
                    <Link href="/register" className="hover:text-[var(--primary)] font-medium transition flex items-center justify-center gap-2" onClick={() => setMenuOpen(false)}>
                      <FaUserPlus className="h-5 w-5" />
                      Register
                    </Link>
                  </>
                )}
              </div>

              {/* Divider */}
              <div className="border-b border-[var(--border)] my-2" />

              {/* Logout at the bottom */}
              {session && (
                <Button
                  type="button"
                  variant="outline"
                  loading={isLoggingOut}
                  onClick={async () => {
                    setMenuOpen(false);
                    setIsLoggingOut(true);
                    await signOut({
                      callbackUrl: "/login?toast=Logged%20out%20successfully!",
                    });
                  }}
                  className="text-[var(--destructive)] hover:bg-[var(--destructive)] hover:text-white px-3 py-2 rounded-full font-semibold transition cursor-pointer focus:outline-none flex items-center justify-center gap-2"
                  leftIcon={<FaSignOutAlt className="h-5 w-5" />}
                  fullWidth
                >
                  Logout
                </Button>
              )}
            </div>
          )}
        </div>
      </nav>
    </>
  );
});

export default Navbar;