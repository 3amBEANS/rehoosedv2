"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";

interface ConversationRow {
  conversationId: number;
  user1: string;
  user2: string;
  otherUser: string;
  otherUserPhoto: string | null;
  lastMessage: string | null;
  lastMessageTime: string | null;
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
    <Suspense fallback={<div className="max-w-6xl mx-auto px-4 py-20 text-center text-gray-400">Loading...</div>}>
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
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [currentUser, setCurrentUser] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  const loadMessages = async (convId: number) => {
    setActiveConv(convId);
    const res = await fetch(`/api/messages/${convId}`);
    if (res.ok) {
      const data = await res.json();
      setMessages(data.messages);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConv) return;

    const res = await fetch(`/api/messages/${activeConv}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newMessage }),
    });

    if (res.ok) {
      setNewMessage("");
      loadMessages(activeConv);
      // Refresh conversations to update last message
      const convRes = await fetch("/api/messages/conversations");
      if (convRes.ok) setConversations(await convRes.json());
    }
  };

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

  const activeConversation = conversations.find(
    (c) => c.conversationId === activeConv
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-navy-dark mb-6">Messages</h1>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm grid md:grid-cols-[320px_1fr] h-[600px]">
        {/* Conversation list */}
        <div className="border-r border-gray-100 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">
              No conversations yet
            </div>
          ) : (
            conversations.map((c) => (
              <button
                key={c.conversationId}
                onClick={() => loadMessages(c.conversationId)}
                className={`w-full text-left px-4 py-4 border-b border-gray-50 hover:bg-cream transition-colors ${
                  activeConv === c.conversationId ? "bg-cream" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-navy/10 flex items-center justify-center text-navy flex-shrink-0">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-navy-dark text-sm">
                      {c.otherUser}
                    </p>
                    {c.lastMessage && (
                      <p className="text-xs text-gray-400 truncate">
                        {c.lastMessage}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Message area */}
        <div className="flex flex-col">
          {activeConv && activeConversation ? (
            <>
              {/* Chat header */}
              <div className="px-6 py-4 border-b border-gray-100 bg-cream/50">
                <p className="font-semibold text-navy-dark">
                  {activeConversation.otherUser}
                </p>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                {messages.map((m) => {
                  const isMine = m.senderUser === currentUser;
                  return (
                    <div
                      key={m.messageId}
                      className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${
                          isMine
                            ? "bg-navy text-white rounded-br-md"
                            : "bg-gray-100 text-gray-800 rounded-bl-md"
                        }`}
                      >
                        <p>{m.content}</p>
                        <p
                          className={`text-[10px] mt-1 ${
                            isMine ? "text-white/50" : "text-gray-400"
                          }`}
                        >
                          {new Date(m.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form
                onSubmit={handleSend}
                className="px-4 py-3 border-t border-gray-100 bg-white"
              >
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl bg-cream focus:outline-none focus:ring-2 focus:ring-orange/50"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-navy text-white rounded-xl font-medium hover:bg-navy-light transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
              Select a conversation to start chatting
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
