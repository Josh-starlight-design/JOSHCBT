"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { isAdmin } from "@/lib/auth-client";

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <nav className="bg-[#1e3a5f] text-white shadow-lg sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center">
              <span className="text-[#1e3a5f] font-black text-sm">CBT</span>
            </div>
            <span className="font-bold text-lg tracking-tight">
              CBT <span className="text-[#0ea5e9]">PRO</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            {!user ? (
              <>
                <Link href="/#features" className="text-blue-200 hover:text-white text-sm transition-colors">
                  Features
                </Link>
                <Link href="/auth/login" className="text-blue-200 hover:text-white text-sm transition-colors">
                  Student Login
                </Link>
                <Link
                  href="/auth/login?role=admin"
                  className="bg-[#0ea5e9] hover:bg-[#0284c7] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                >
                  Admin Login
                </Link>
              </>
            ) : (
              <>
                <Link
                  href={isAdmin(user.role) ? "/admin" : "/dashboard"}
                  className="text-blue-200 hover:text-white text-sm transition-colors"
                >
                  Dashboard
                </Link>
                {isAdmin(user.role) && (
                  <>
                    <Link href="/admin/exams" className="text-blue-200 hover:text-white text-sm transition-colors">
                      Exams
                    </Link>
                    <Link href="/admin/questions" className="text-blue-200 hover:text-white text-sm transition-colors">
                      Questions
                    </Link>
                    <Link href="/admin/students" className="text-blue-200 hover:text-white text-sm transition-colors">
                      Students
                    </Link>
                  </>
                )}
                <div className="flex items-center gap-3 ml-2 pl-4 border-l border-blue-700">
                  <div className="text-right">
                    <p className="text-sm font-semibold">{user.fullName}</p>
                    <p className="text-xs text-blue-300 capitalize">{user.role.replace("_", " ")}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="bg-red-500/20 hover:bg-red-500/40 text-red-200 px-3 py-1.5 rounded-lg text-sm transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-white"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden py-4 border-t border-blue-700 flex flex-col gap-3">
            {!user ? (
              <>
                <Link href="/auth/login" className="text-blue-200 hover:text-white py-2">Student Login</Link>
                <Link href="/auth/login?role=admin" className="text-blue-200 hover:text-white py-2">Admin Login</Link>
                <Link href="/auth/register" className="text-blue-200 hover:text-white py-2">Register</Link>
              </>
            ) : (
              <>
                <Link href={isAdmin(user.role) ? "/admin" : "/dashboard"} className="text-blue-200 hover:text-white py-2">
                  Dashboard
                </Link>
                <button onClick={handleLogout} className="text-red-300 text-left py-2">Logout</button>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
