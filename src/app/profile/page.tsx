"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PostCard from "@/components/PostCard";

interface UserProfile {
  username: string;
  email: string;
  joinDate: string;
  profilePhoto: string | null;
}

interface UserPost {
  postId: number;
  title: string;
  description: string;
  createdAt: string;
  courseId: number;
  courseName: string;
  deptCode: string;
  courseNumber: string;
  isDigital: number;
  thumbnail: string | null;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit fields
  const [editing, setEditing] = useState(false);
  const [email, setEmail] = useState("");
  const [profilePhoto, setProfilePhoto] = useState("");
  const [saveStatus, setSaveStatus] = useState("");

  useEffect(() => {
    const init = async () => {
      const meRes = await fetch("/api/auth/me");
      const meData = await meRes.json();

      if (!meData.user) {
        router.push("/");
        return;
      }

      const profileRes = await fetch(`/api/users/${meData.user.username}`);
      const profileData = await profileRes.json();

      setUser(profileData.user);
      setPosts(profileData.posts);
      setEmail(profileData.user.email);
      setProfilePhoto(profileData.user.profilePhoto || "");
      setLoading(false);
    };
    init();
  }, [router]);

  const handleSave = async () => {
    if (!user) return;
    const res = await fetch(`/api/users/${user.username}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, profilePhoto }),
    });

    if (res.ok) {
      setUser((u) => (u ? { ...u, email, profilePhoto } : null));
      setEditing(false);
      setSaveStatus("Saved!");
      setTimeout(() => setSaveStatus(""), 2000);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center text-gray-400">
        Loading...
      </div>
    );
  }

  if (!user) return null;

  const joinDate = new Date(user.joinDate).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-navy-dark mb-8">
        Account Settings
      </h1>

      <div className="bg-white rounded-2xl border border-gray-100 p-8 mb-8 shadow-sm">
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="w-20 h-20 rounded-full bg-orange/10 flex items-center justify-center text-orange">
              <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
              </svg>
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Username
              </label>
              <p className="text-lg font-semibold text-navy-dark">
                {user.username}
              </p>
            </div>

            {editing ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-cream focus:outline-none focus:ring-2 focus:ring-orange/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Profile Photo URL
                  </label>
                  <input
                    type="url"
                    value={profilePhoto}
                    onChange={(e) => setProfilePhoto(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-cream focus:outline-none focus:ring-2 focus:ring-orange/50"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleSave}
                    className="px-6 py-2.5 bg-navy text-white rounded-xl font-semibold hover:bg-navy-light transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="px-6 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Email
                  </label>
                  <p className="text-gray-700">{user.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Member since
                  </label>
                  <p className="text-gray-700">{joinDate}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setEditing(true)}
                    className="px-5 py-2.5 bg-navy text-white rounded-xl text-sm font-semibold hover:bg-navy-light transition-colors"
                  >
                    Edit Profile
                  </button>
                  {saveStatus && (
                    <span className="text-sm text-green-600 font-medium">
                      {saveStatus}
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* User's posts */}
      <h2 className="text-xl font-bold text-navy-dark mb-4">
        Your Listings ({posts.length})
      </h2>

      {posts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 text-gray-400">
          You haven&apos;t posted any resources yet.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {posts.map((p) => (
            <PostCard
              key={p.postId}
              {...p}
              sellerUser={user.username}
              likeCount={0}
            />
          ))}
        </div>
      )}
    </div>
  );
}
