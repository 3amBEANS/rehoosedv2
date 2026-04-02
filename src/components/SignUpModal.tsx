"use client";

import { useState } from "react";

interface Props {
  onClose: () => void;
  onSuccess: () => void;
  onSwitchToSignIn: () => void;
}

export default function SignUpModal({ onClose, onSuccess, onSwitchToSignIn }: Props) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Registration failed");
      return;
    }

    onSuccess();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-navy-dark">Sign Up</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              maxLength={20}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-cream focus:outline-none focus:ring-2 focus:ring-orange/50 focus:border-orange transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@virginia.edu"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-cream focus:outline-none focus:ring-2 focus:ring-orange/50 focus:border-orange transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-cream focus:outline-none focus:ring-2 focus:ring-orange/50 focus:border-orange transition-all"
              required
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-navy hover:bg-navy-light text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <button
            onClick={onSwitchToSignIn}
            className="text-orange font-semibold hover:underline"
          >
            Sign In
          </button>
        </p>
      </div>
    </div>
  );
}
