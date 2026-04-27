"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import SignInModal from "./SignInModal";
import SignUpModal from "./SignUpModal";

interface UserInfo {
  username: string;
  email: string;
  profilePhoto: string | null;
}

export default function Header() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [showSignIn, setShowSignIn] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  const navLinkClass = (href: string) =>
    `text-sm font-medium tracking-wide uppercase transition-colors ${
      isActive(href) ? "text-orange" : "text-white/80 hover:text-white"
    }`;

  const fetchUser = async () => {
    const res = await fetch("/api/auth/me");
    const data = await res.json();
    setUser(data.user);
  };

  useEffect(() => {
    fetchUser();
    const onUserUpdated = () => fetchUser();
    window.addEventListener("user-updated", onUserUpdated);
    return () => window.removeEventListener("user-updated", onUserUpdated);
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setMenuOpen(false);
    window.location.href = "/";
  };

  const handleAuthSuccess = () => {
    setShowSignIn(false);
    setShowSignUp(false);
    fetchUser();
  };

  return (
    <>
      <header className="bg-navy-dark sticky top-0 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <span className="font-[Playfair_Display] text-2xl font-bold italic text-white tracking-tight">
                Re<span className="text-orange">Hoo</span>sed
              </span>
            </Link>

            {/* Nav links */}
            <nav className="hidden md:flex items-center gap-8">
              <Link href="/courses" className={navLinkClass("/courses")}>
                Courses
              </Link>
              <Link href="/posts" className={navLinkClass("/posts")}>
                Browse
              </Link>
              {user && (
                <Link href="/messages" className={navLinkClass("/messages")}>
                  Messages
                </Link>
              )}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-3">
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    {user.profilePhoto ? (
                      <img
                        src={user.profilePhoto}
                        alt={user.username}
                        className="w-7 h-7 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-orange flex items-center justify-center text-white">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                        </svg>
                      </div>
                    )}
                    <span className="text-white text-sm font-medium hidden sm:block">
                      {user.username}
                    </span>
                  </button>

                  {menuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                      <Link
                        href="/profile"
                        onClick={() => setMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-cream"
                      >
                        Account Settings
                      </Link>
                      <Link
                        href="/messages"
                        onClick={() => setMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-cream md:hidden"
                      >
                        Messages
                      </Link>
                      <hr className="my-1 border-gray-100" />
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        Log Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setShowSignIn(true)}
                  className="px-5 py-2 bg-orange hover:bg-orange-light text-white text-sm font-semibold rounded-lg transition-colors shadow-md"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {showSignIn && (
        <SignInModal
          onClose={() => setShowSignIn(false)}
          onSuccess={handleAuthSuccess}
          onSwitchToSignUp={() => {
            setShowSignIn(false);
            setShowSignUp(true);
          }}
        />
      )}
      {showSignUp && (
        <SignUpModal
          onClose={() => setShowSignUp(false)}
          onSuccess={handleAuthSuccess}
          onSwitchToSignIn={() => {
            setShowSignUp(false);
            setShowSignIn(true);
          }}
        />
      )}
    </>
  );
}
