"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Send,
  Bot,
  Calendar,
  Plus,
  Trash2,
  Pin,
  Menu,
  X,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export default function AgentAssistant() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Open sidebar on large screens by default
  useEffect(() => {
    if (window.innerWidth >= 768) setSidebarOpen(true);
  }, []);

  // Fetch all chats
  useEffect(() => {
    async function fetchChats() {
      try {
        const res = await fetch("/api/chat");
        const data = await res.json();
        setChats(data);
        if (data.length) setActiveChat(data[0]._id);
      } catch (err) {
        console.error("Failed to fetch chats:", err);
      }
    }
    fetchChats();
  }, []);

  // Fetch messages when active chat changes
  useEffect(() => {
    if (!activeChat) return;
    async function fetchMessages() {
      try {
        const res = await fetch(`/api/chat/${activeChat}/messages`);
        const data = await res.json();
        setMessages(data);
      } catch (err) {
        console.error("Failed to fetch messages:", err);
      }
    }
    fetchMessages();
  }, [activeChat]);

  // Create a new chat
  async function createChat() {
    try {
      const res = await fetch("/api/chat", {
        method: "POST",

        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New Chat" }),
      });
      const newChat = await res.json();
      setChats([newChat, ...chats]);
      setActiveChat(newChat._id);
      setMessages([]);
      setPrompt("");
    } catch (err) {
      console.error("Failed to create chat:", err);
    }
  }

  // Delete chat
  async function deleteChat(id) {
    try {
      await fetch(`/api/chat/${id}`, { method: "DELETE" });
      const updated = chats.filter((c) => c._id !== id);
      setChats(updated);
      if (activeChat === id && updated.length) setActiveChat(updated[0]._id);
      else if (!updated.length) setActiveChat(null);
    } catch (err) {
      console.error("Failed to delete chat:", err);
    }
  }

  // Pin / unpin chat
  async function togglePin(id) {
    try {
      const res = await fetch(`/api/chat/${id}`, {
        method: "PATCH",
      });
      const updatedChat = await res.json();
      setChats(chats.map((c) => (c._id === id ? updatedChat : c)));
    } catch (err) {
      console.error("Failed to pin/unpin chat:", err);
    }
  }

  // Send user message + AI analysis
  async function handleAnalyze() {
    if (!prompt.trim() || !activeChat) return;

    setLoading(true);
    const userMessage = prompt.trim();

    try {
      // 1️⃣ Save user message
      const userRes = await fetch(`/api/chat/${activeChat}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sender: "user", content: userMessage }),
      });
      const savedUserMsg = await userRes.json();
      setMessages((prev) => [...prev, savedUserMsg]);

      // 2️⃣ Call AI endpoint
      const aiRes = await fetch("/api/agent/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: userMessage }),
      });
      const aiData = await aiRes.json();

      if (aiData.analysis) {
        // 3️⃣ Save AI response
        const aiMsgRes = await fetch(`/api/chat/${activeChat}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sender: "ai",
            content: aiData.analysis,
            dateContext: aiData.date,
          }),
        });
        const savedAiMsg = await aiMsgRes.json();
        setMessages((prev) => [...prev, savedAiMsg]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPrompt("");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ x: sidebarOpen ? 0 : "-100%" }}
        transition={{ duration: 0.3 }}
        className="fixed md:static inset-y-0 left-0 w-64 bg-slate-900/95 border-r border-slate-800 z-40 flex flex-col"
      >
        {/* Header */}
        <div className="px-4 py-3 flex justify-between items-center border-b border-slate-800">
          <h2 className="text-base font-semibold text-indigo-300 flex items-center gap-2">
            <Bot size={18} /> Chats
          </h2>
          <div className="flex gap-1">
            <Button
              onClick={createChat}
              size="icon"
              className="bg-indigo-600 hover:bg-indigo-500"
            >
              <Plus size={14} />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="md:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X size={18} />
            </Button>
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-2">
          {chats
            .sort((a, b) => Number(b.pinned) - Number(a.pinned))
            .map((chat) => (
              <motion.div key={chat._id} whileHover={{ scale: 1.01 }}>
                <Card
                  className={`cursor-pointer transition-colors text-sm p-1 ${
                    activeChat === chat._id
                      ? "bg-slate-800 border-indigo-500 shadow-sm"
                      : "bg-slate-900/70 border-slate-800 hover:bg-slate-800/80"
                  }`}
                  onClick={() => {
                    setActiveChat(chat._id);
                    setMessages([]);
                  }}
                >
                  <CardContent className="flex justify-between items-center p-2">
                    <span className="truncate text-white">{chat.title}</span>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePin(chat._id);
                        }}
                      >
                        <Pin
                          size={14}
                          className={chat.pinned ? "text-yellow-400" : ""}
                        />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteChat(chat._id);
                        }}
                      >
                        <Trash2 size={14} className="text-red-400" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md shadow-md flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="ghost"
              className="md:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={20} />
            </Button>
            <h1 className="text-xl font-bold tracking-wide text-indigo-300 flex items-center gap-2">
              <Bot className="text-indigo-400" size={22} /> AI Daily Insights
            </h1>
          </div>
        </div>

        {/* Messages Panel */}
        <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-3">
          {loading ? (
            <div className="text-center text-slate-400 animate-pulse">
              <Loader2
                className="mx-auto animate-spin text-indigo-400"
                size={32}
              />
              <p className="mt-2">Analyzing your logs...</p>
            </div>
          ) : messages.length ? (
            messages.map((m) => (
              <Card
                key={m._id || m.createdAt}
                className={`p-2 max-w-xl ${
                  m.sender === "user"
                    ? "self-end bg-indigo-700/60"
                    : "self-start bg-slate-800/80"
                }`}
              >
                <CardContent>
                  <p className="text-slate-100 whitespace-pre-wrap">
                    {m.content}
                  </p>
                  {m.dateContext && (
                    <span className="text-xs text-indigo-300 mt-1   flex items-center gap-1">
                      <Calendar size={12} /> {m.dateContext}
                    </span>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="text-center text-slate-500">
              No insights yet. Ask me something below 👇
            </p>
          )}
        </div>

        {/* Input Dock */}
        <div className="border-t border-slate-800 bg-slate-900/80 backdrop-blur-md px-4 py-3">
          <div className="max-w-2xl mx-auto flex items-center gap-2 bg-slate-950/70 rounded-xl px-3 py-2 shadow-inner border border-slate-800">
            <Input
              id="chat-input"
              placeholder="Type your question... (e.g. What was my mood yesterday?)"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="flex-1 bg-transparent text-slate-100 border-0 focus-visible:ring-0 placeholder-slate-500"
            />
            <motion.div whileTap={{ scale: 0.9 }}>
              <Button
                onClick={handleAnalyze}
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-500 flex items-center gap-2 shadow-md disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <Send size={16} />
                )}
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
