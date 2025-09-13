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
  House,
  User,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function AgentAssistant() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [aiTyping, setAiTyping] = useState(false);

  const router = useRouter();

  // Sidebar responsive
  useEffect(() => {
    if (typeof window === "undefined") return;

    const mq = window.matchMedia("(min-width: 768px)");
    const apply = (matches) => {
      setIsDesktop(matches);
      setSidebarOpen(matches);
    };

    apply(mq.matches);
    const handler = (e) => apply(e.matches);

    if (mq.addEventListener) mq.addEventListener("change", handler);
    else mq.addListener(handler);

    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", handler);
      else mq.removeListener(handler);
    };
  }, []);

  // Fetch chats
  useEffect(() => {
    async function fetchChats() {
      try {
        const res = await fetch("/api/chat");
        const data = await res.json();
        setChats(data);
        if (data.length) setActiveChat(data[0]._id);
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to fetch chats",
          variant: "destructive",
        });
      }
    }
    fetchChats();
  }, [toast]);

  // Fetch messages
  useEffect(() => {
    if (!activeChat) return;
    async function fetchMessages() {
      try {
        const res = await fetch(`/api/chat/${activeChat}/messages`);
        const data = await res.json();
        setMessages(data);
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to fetch messages",
          variant: "destructive",
        });
      }
    }
    fetchMessages();
  }, [activeChat, toast]);

  // Create new chat
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
    } catch {
      toast({
        title: "Error",
        description: "Failed to create chat",
        variant: "destructive",
      });
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
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete chat",
        variant: "destructive",
      });
    }
  }

  // Pin
  async function togglePin(id) {
    try {
      const res = await fetch(`/api/chat/${id}`, { method: "PATCH" });
      const updatedChat = await res.json();
      setChats(chats.map((c) => (c._id === id ? updatedChat : c)));
    } catch {
      toast({
        title: "Error",
        description: "Failed to pin chat",
        variant: "destructive",
      });
    }
  }

  // Send
  async function handleAnalyze() {
    if (!prompt.trim() || !activeChat) return;

    setLoading(true);
    const userMessage = prompt.trim();

    try {
      const userRes = await fetch(`/api/chat/${activeChat}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sender: "user", content: userMessage }),
      });
      const savedUserMsg = await userRes.json();
      setMessages((prev) => [...prev, savedUserMsg]);

      setAiTyping(true);

      const aiRes = await fetch("/api/agent/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: userMessage }),
      });
      const aiData = await aiRes.json();

      if (aiData.analysis) {
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
    } catch {
      toast({
        title: "Error",
        description: "Something went wrong while analyzing.",
        variant: "destructive",
      });
    } finally {
      setPrompt("");
      setLoading(false);
      setAiTyping(false);
    }
  }

  const targetX = isDesktop ? 0 : sidebarOpen ? 0 : "-100%";
  const transition = { duration: isDesktop ? 0 : 0.45, ease: "easeInOut" };

  return (
    <div className="min-h-screen flex bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      {/* Overlay */}
      {!isDesktop && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ x: targetX }}
        transition={transition}
        className="fixed inset-y-0 left-0 w-64 bg-slate-900/95 border-r border-slate-800 z-50 flex flex-col md:static md:z-auto"
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

        {/* Chats */}
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-2">
          {chats
            .sort((a, b) => Number(b.pinned) - Number(a.pinned))
            .map((chat) => (
              <Card
                key={chat._id}
                onClick={() => {
                  setActiveChat(chat._id);
                  setMessages([]);
                  if (!isDesktop) setSidebarOpen(false);
                }}
                className={`cursor-pointer text-sm p-1 ${
                  activeChat === chat._id
                    ? "bg-slate-800 border-indigo-500"
                    : "bg-slate-900/70 hover:bg-slate-800/80"
                }`}
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
            ))}
        </div>
      </motion.aside>

      {/* Main */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md shadow-md flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setSidebarOpen((s) => !s)}
            >
              <Menu size={20} />
            </Button>
            <h1 className="text-xl font-bold text-indigo-300 flex items-center gap-2">
              <Bot className="text-indigo-400" size={22} /> AI Daily Insights
            </h1>
          </div>

          <div>
            <Button
              size="icon"
              variant="ghost"
              className="md:hidden bg-indigo-600 hover:bg-indigo-500 text-white"
              onClick={() => router.push("/")}
            >
              <House size={22} />
            </Button>
            <Button
              onClick={() => router.push("/")}
              className="hidden md:flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white"
            >
              <House size={18} /> Home
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-4">
          {messages.length ? (
            <>
              {messages.map((m) => {
                const isUser = m.sender === "user";

                return (
                  <motion.div
                    key={m._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`flex items-start gap-3 ${
                      isUser ? "justify-end" : "justify-start"
                    }`}
                  >
                    {/* Agent icon (left) */}
                    {!isUser && (
                      <div className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-800 text-indigo-300">
                        <Bot size={18} />
                      </div>
                    )}

                    {/* Message box */}
                    <div
                      className={`max-w-md px-4 py-2 rounded-lg shadow-sm text-sm ${
                        isUser
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-800/80 text-slate-200"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{m.content}</p>
                      <div className="text-xs mt-1 flex items-center gap-1 opacity-60">
                        <Calendar size={12} />
                        {new Date(m.createdAt).toLocaleTimeString()}
                      </div>
                    </div>

                    {/* User icon (right) */}
                    {isUser && (
                      <div className="w-9 h-9 flex items-center justify-center rounded-full bg-indigo-600 text-white">
                        <User size={18} />
                      </div>
                    )}
                  </motion.div>
                );
              })}

              {/* AI typing state */}
              {aiTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-3 self-start"
                >
                  <div className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-800 text-indigo-300">
                    <Bot size={18} />
                  </div>
                  <div className="bg-slate-800/80 text-slate-300 px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                    <span className="flex gap-1">
                      <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                      <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150" />
                      <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-300" />
                    </span>
                    <span className="text-xs opacity-70">AI is typing…</span>
                  </div>
                </motion.div>
              )}
            </>
          ) : (
            // Empty state
            <div className="flex flex-col items-center justify-center text-center text-slate-500 mt-12">
              <AlertCircle className="mb-2 text-indigo-400" size={32} />
              <p className="mb-4">No conversations yet. Start by asking:</p>
              <div className="flex flex-col gap-2">
                {[
                  "What was my productivity yesterday?",
                  "Summarize last week's logs",
                  "Detect trends in my activity",
                ].map((s, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    onClick={() => setPrompt(s)}
                  >
                    {s}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-slate-800 bg-slate-900/80 px-4 py-3">
          <div className="max-w-2xl mx-auto flex items-center gap-2 bg-slate-950/70 rounded-xl px-3 py-2 shadow-inner border border-slate-800">
            <Input
              placeholder="Type your question..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="flex-1 bg-transparent text-slate-100 border-0 focus-visible:ring-0 placeholder-slate-500"
            />
            <motion.div whileTap={{ scale: 0.9 }}>
              <Button
                onClick={handleAnalyze}
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-500 flex items-center gap-2 shadow-md"
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
