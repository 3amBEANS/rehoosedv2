"use client";

import { Suspense, useEffect, useState, useRef, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

interface ConversationRow {
  conversationId: number;
  user1: string;
  user2: string;
  otherUser: string;
  otherUserPhoto: string | null;
  postId: number | null;
  postTitle: string | null;
  postDeptCode: string | null;
  postCourseNumber: string | null;
  postThumbnail: string | null;
  lastMessage: string | null;
  lastMessageTime: string | null;
}

interface ConversationDetail {
  conversationId: number;
  user1: string;
  user2: string;
  postId: number | null;
  postTitle: string | null;
  postDescription: string | null;
  postIsDigital: number | null;
  postDeptCode: string | null;
  postCourseNumber: string | null;
  postCourseName: string | null;
  postThumbnail: string | null;
}

interface MessageRow {
  messageId: number;
  senderUser: string;
  receiverUser: string;
  content: string;
  timestamp: string;
}

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-6xl mx-auto px-4 py-20 text-center text-gray-400">
          Loading...
        </div>
      }
    >
      <MessagesContent />
    </Suspense>
  );
}

function MessagesContent() {
  const searchParams = useSearchParams();
  const preselectedConv = searchParams.get("conv");

  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [activeConv, setActiveConv] = useState<number | null>(
    preselectedConv ? Number(preselectedConv) : null
  );
  const [activeDetail, setActiveDetail] = useState<ConversationDetail | null>(
    null
  );
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [currentUser, setCurrentUser] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [convSearch, setConvSearch] = useState("");
  const [showListMobile, setShowListMobile] = useState(!preselectedConv);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadMessages = async (convId: number) => {
    setActiveConv(convId);
    setShowListMobile(false);
    const res = await fetch(`/api/messages/${convId}`);
    if (res.ok) {
      const data = await res.json();
      setActiveDetail(data.conversation);
      setMessages(data.messages);
      setTimeout(
        () => messagesEndRef.current?.scrollIntoView({ behavior: "auto" }),
        50
      );
    }
  };

  useEffect(() => {
    const init = async () => {
      const [convRes, userRes] = await Promise.all([
        fetch("/api/messages/conversations"),
        fetch("/api/auth/me"),
      ]);

      if (!convRes.ok) return;

      const convData = await convRes.json();
      const userData = await userRes.json();

      setConversations(convData);
      setCurrentUser(userData.user?.username || "");
      setLoading(false);

      if (preselectedConv) {
        loadMessages(Number(preselectedConv));
      }
    };
    init();
  }, [preselectedConv]);

  const refreshConversations = async () => {
    const convRes = await fetch("/api/messages/conversations");
    if (convRes.ok) setConversations(await convRes.json());
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newMessage.trim();
    if (!trimmed || !activeConv || !activeDetail) return;

    const receiver =
      activeDetail.user1 === currentUser
        ? activeDetail.user2
        : activeDetail.user1;

    // Optimistic append — feels snappy without waiting for round-trip.
    const optimistic: MessageRow = {
      messageId: -Date.now(),
      senderUser: currentUser,
      receiverUser: receiver,
      content: trimmed,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setNewMessage("");
    setTimeout(
      () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }),
      30
    );

    const res = await fetch(`/api/messages/${activeConv}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: trimmed }),
    });

    if (res.ok) {
      // Reconcile with server (also picks up exact server timestamp / id).
      const detailRes = await fetch(`/api/messages/${activeConv}`);
      if (detailRes.ok) {
        const data = await detailRes.json();
        setMessages(data.messages);
      }
      refreshConversations();
    } else {
      // Roll back if it failed.
      setMessages((prev) => prev.filter((m) => m.messageId !== optimistic.messageId));
      setNewMessage(trimmed);
    }
  };

  const filteredConvs = useMemo(() => {
    const q = convSearch.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter(
      (c) =>
        c.otherUser.toLowerCase().includes(q) ||
        (c.postTitle && c.postTitle.toLowerCase().includes(q))
    );
  }, [conversations, convSearch]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-20 text-center text-gray-400">
        Loading messages...
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-20 text-center text-gray-400">
        Please sign in to view messages.
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <h1 className="font-display text-3xl font-bold text-navy-dark mb-5 tracking-tight">
        Messages
      </h1>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm grid md:grid-cols-[320px_1fr] h-[calc(100vh-180px)] min-h-[520px]">
        {/* Conversation list */}
        <aside
          className={`border-r border-gray-100 flex flex-col ${
            showListMobile ? "flex" : "hidden md:flex"
          }`}
        >
          {/* Search */}
          <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={convSearch}
                onChange={(e) => setConvSearch(e.target.value)}
                placeholder="Search conversations..."
                className="w-full pl-9 pr-3 py-2 bg-cream rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange/40 placeholder:text-gray-300"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredConvs.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-400 text-sm mb-2">
                  {conversations.length === 0
                    ? "No conversations yet"
                    : "No matches"}
                </p>
                {conversations.length === 0 && (
                  <Link
                    href="/posts"
                    className="text-sm text-orange hover:underline font-medium"
                  >
                    Browse the catalog →
                  </Link>
                )}
              </div>
            ) : (
              filteredConvs.map((c) => {
                const isActive = activeConv === c.conversationId;
                const youSent =
                  c.lastMessage &&
                  // crude heuristic — server doesn't return sender on the list,
                  // so we leave plain preview. (Could add later.)
                  false;
                return (
                  <button
                    key={c.conversationId}
                    onClick={() => loadMessages(c.conversationId)}
                    className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-cream transition-colors relative ${
                      isActive ? "bg-cream" : ""
                    }`}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-2 bottom-2 w-0.5 bg-orange rounded-r-full" />
                    )}
                    <div className="flex items-start gap-3">
                      <Avatar name={c.otherUser} photo={c.otherUserPhoto} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="font-semibold text-navy-dark text-sm truncate">
                            {c.otherUser}
                          </p>
                          {c.lastMessageTime && (
                            <span className="text-[11px] text-gray-400 flex-shrink-0">
                              {formatRelative(c.lastMessageTime)}
                            </span>
                          )}
                        </div>
                        {c.postTitle && (
                          <p className="text-[11px] text-orange/90 font-medium truncate mt-0.5">
                            {c.postDeptCode} {c.postCourseNumber} ·{" "}
                            {c.postTitle}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 truncate mt-0.5">
                          {c.lastMessage
                            ? `${youSent ? "You: " : ""}${c.lastMessage}`
                            : "No messages yet"}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Chat area */}
        <section
          className={`flex-col ${
            !showListMobile ? "flex" : "hidden md:flex"
          }`}
        >
          {activeConv && activeDetail ? (
            <>
              {/* Chat header */}
              <header className="px-4 sm:px-6 py-3 border-b border-gray-100 flex items-center gap-3">
                <button
                  onClick={() => setShowListMobile(true)}
                  className="md:hidden text-gray-400 hover:text-navy"
                  aria-label="Back to conversations"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <Avatar
                  name={
                    activeDetail.user1 === currentUser
                      ? activeDetail.user2
                      : activeDetail.user1
                  }
                  photo={null}
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-navy-dark truncate">
                    {activeDetail.user1 === currentUser
                      ? activeDetail.user2
                      : activeDetail.user1}
                  </p>
                  {activeDetail.postDeptCode && (
                    <p className="text-xs text-gray-400 truncate">
                      About {activeDetail.postDeptCode}{" "}
                      {activeDetail.postCourseNumber}
                    </p>
                  )}
                </div>
              </header>

              {/* Pinned listing reference */}
              {activeDetail.postId && activeDetail.postTitle && (
                <Link
                  href={`/posts/${activeDetail.postId}`}
                  className="mx-4 sm:mx-6 mt-3 group flex items-center gap-3 p-3 bg-cream/70 hover:bg-cream rounded-xl border border-cream-dark transition-colors"
                >
                  <div className="w-12 h-12 rounded-lg bg-white border border-cream-dark flex items-center justify-center overflow-hidden flex-shrink-0">
                    {activeDetail.postThumbnail ? (
                      <img
                        src={activeDetail.postThumbnail}
                        alt=""
                        className="w-full h-full object-contain p-1"
                      />
                    ) : (
                      <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">
                      About this listing
                    </p>
                    <p className="font-semibold text-navy-dark text-sm truncate">
                      {activeDetail.postTitle}
                    </p>
                    <p className="text-xs text-orange/90 font-medium truncate">
                      {activeDetail.postDeptCode}{" "}
                      {activeDetail.postCourseNumber}
                      {activeDetail.postCourseName && (
                        <>
                          {" "}
                          <span className="text-gray-400 font-normal">
                            · {activeDetail.postCourseName}
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400 group-hover:text-navy transition-colors flex items-center gap-1 flex-shrink-0">
                    View
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </Link>
              )}

              {/* Message stream */}
              <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-1">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <p className="text-sm text-gray-400">
                      No messages yet
                    </p>
                    <p className="text-xs text-gray-300 mt-1">
                      Say hi to start the conversation.
                    </p>
                  </div>
                ) : (
                  groupByDay(messages).map((group) => (
                    <div key={group.day}>
                      <div className="flex items-center gap-3 my-3">
                        <div className="flex-1 h-px bg-gray-100" />
                        <span className="text-[10px] uppercase tracking-widest text-gray-300 font-semibold">
                          {group.label}
                        </span>
                        <div className="flex-1 h-px bg-gray-100" />
                      </div>
                      <div className="space-y-1">
                        {group.messages.map((m, i) => {
                          const isMine = m.senderUser === currentUser;
                          const prev = group.messages[i - 1];
                          const next = group.messages[i + 1];
                          const isFirstInRun =
                            !prev || prev.senderUser !== m.senderUser;
                          const isLastInRun =
                            !next || next.senderUser !== m.senderUser;
                          return (
                            <div
                              key={m.messageId}
                              className={`flex ${
                                isMine ? "justify-end" : "justify-start"
                              }`}
                            >
                              <div
                                className={`max-w-[75%] px-3.5 py-2 text-sm leading-relaxed whitespace-pre-wrap break-words ${
                                  isMine
                                    ? "bg-navy text-white"
                                    : "bg-cream text-navy-dark"
                                } ${bubbleRadius(isMine, isFirstInRun, isLastInRun)}`}
                              >
                                {m.content}
                                {isLastInRun && (
                                  <span
                                    className={`block text-[10px] mt-1 ${
                                      isMine ? "text-white/50" : "text-gray-400"
                                    }`}
                                  >
                                    {new Date(m.timestamp).toLocaleTimeString(
                                      [],
                                      {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      }
                                    )}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Composer */}
              <form
                onSubmit={handleSend}
                className="px-4 sm:px-6 py-3 border-t border-gray-100 bg-white"
              >
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl bg-cream focus:outline-none focus:ring-2 focus:ring-orange/40 focus:bg-white transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="px-4 py-2.5 bg-navy text-white rounded-xl font-medium hover:bg-navy-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="Send"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 hidden md:flex flex-col items-center justify-center text-center px-6">
              <div className="w-14 h-14 rounded-2xl bg-cream flex items-center justify-center text-orange mb-3">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-navy-dark">
                Select a conversation
              </p>
              <p className="text-xs text-gray-400 mt-1 max-w-xs">
                Pick a thread on the left, or start a new one by messaging the
                owner of a listing.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

/* ---------- helpers ---------- */

function Avatar({
  name,
  photo,
  size = "sm",
}: {
  name: string;
  photo: string | null;
  size?: "sm" | "md";
}) {
  const dim = size === "md" ? "w-10 h-10" : "w-10 h-10";
  if (photo) {
    return (
      <img
        src={photo}
        alt={name}
        className={`${dim} rounded-full object-cover flex-shrink-0`}
      />
    );
  }
  const initial = name.charAt(0).toUpperCase();
  return (
    <div
      className={`${dim} rounded-full bg-orange/15 text-orange flex items-center justify-center text-sm font-semibold flex-shrink-0`}
    >
      {initial}
    </div>
  );
}

function formatRelative(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "now";
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function bubbleRadius(
  isMine: boolean,
  isFirstInRun: boolean,
  isLastInRun: boolean
): string {
  // Tail logic: round all corners, but tighten the inner corner of the
  // last bubble in a run so consecutive messages from the same person stack
  // visually as a single thread.
  if (isMine) {
    if (!isFirstInRun && !isLastInRun) return "rounded-2xl rounded-r-md";
    if (!isLastInRun) return "rounded-2xl rounded-br-md";
    if (!isFirstInRun) return "rounded-2xl rounded-tr-md";
    return "rounded-2xl";
  }
  if (!isFirstInRun && !isLastInRun) return "rounded-2xl rounded-l-md";
  if (!isLastInRun) return "rounded-2xl rounded-bl-md";
  if (!isFirstInRun) return "rounded-2xl rounded-tl-md";
  return "rounded-2xl";
}

function groupByDay(messages: MessageRow[]): Array<{
  day: string;
  label: string;
  messages: MessageRow[];
}> {
  const groups: Record<string, MessageRow[]> = {};
  const order: string[] = [];
  for (const m of messages) {
    const d = new Date(m.timestamp);
    const key = d.toISOString().slice(0, 10);
    if (!groups[key]) {
      groups[key] = [];
      order.push(key);
    }
    groups[key].push(m);
  }
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  return order.map((key) => {
    let label: string;
    if (key === today) label = "Today";
    else if (key === yesterday) label = "Yesterday";
    else
      label = new Date(key).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    return { day: key, label, messages: groups[key] };
  });
}
