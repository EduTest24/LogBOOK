"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Moon,
  Menu,
  X,
  Calendar,
  PlusCircle,
  Sparkles,
  Sparkle,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useUser, UserButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function LogBook() {
  const { isSignedIn } = useUser();
  const router = useRouter();

  const [thought, setThought] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logs, setLogs] = useState([]); // full logs from DB
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0] // YYYY-MM-DD
  );
  const [userSynced, setUserSynced] = useState(false);
  const [fabExpanded, setFabExpanded] = useState(false);

  // 🔹 Sync user into DB when signed in
  useEffect(() => {
    if (isSignedIn && !userSynced) {
      fetch("/api/users")
        .then((res) => res.json())
        .then((data) => {
          console.log("✅ User synced to DB:", data);
          setUserSynced(true);
        })
        .catch((err) => console.error("❌ User sync error:", err));
    }
  }, [isSignedIn, userSynced]);

  // 🔹 Fetch logs for the user
  async function fetchLogs() {
    if (!isSignedIn) return;
    try {
      const res = await fetch("/api/logs");
      const data = await res.json();
      setLogs(data);
    } catch (err) {
      console.error("❌ Error fetching logs:", err);
    }
  }

  useEffect(() => {
    fetchLogs();
  }, [isSignedIn]);

  // 🔹 Save a new thought
  async function handleSave() {
    if (!isSignedIn) {
      router.push("/sign-in");
      return;
    }
    if (!thought.trim()) return;

    try {
      const res = await fetch("/api/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: thought, date: selectedDate }),
      });

      if (!res.ok) throw new Error("Failed to save thought");

      const updatedLog = await res.json();

      // merge/update the logs state
      setLogs((prev) => {
        const others = prev.filter((l) => l.date !== updatedLog.date);
        return [...others, updatedLog].sort((a, b) =>
          a.date < b.date ? 1 : -1
        ); // keep sorted
      });

      setThought("");
    } catch (err) {
      console.error("❌ Error saving thought:", err);
    }
  }

  // 🔹 Available dates for sidebar
  const availableDates = logs
    .map((log) => log.date)
    .sort()
    .reverse();

  // 🔹 Thoughts for selected date
  const selectedLog = logs.find((l) => l.date === selectedDate);

  // inside component
  const todayDate = new Date().toISOString().split("T")[0];
  const isToday = selectedDate === todayDate;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 relative overflow-hidden flex">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:24px_24px] opacity-30 pointer-events-none" />

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 border-r border-slate-800 p-4 z-20 fixed inset-y-0 left-0">
        <div className="flex flex-col flex-1 space-y-4">
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-lg">
            <Moon size={20} /> LogBook
          </div>
          <nav className="space-y-2 overflow-y-auto flex-1">
            {availableDates.map((date) => (
              <Button
                key={date}
                variant="ghost"
                className={`w-full justify-start ${
                  selectedDate === date
                    ? "text-indigo-400 bg-slate-800"
                    : "text-slate-300 hover:text-indigo-400"
                }`}
                onClick={() => setSelectedDate(date)}
              >
                <Calendar size={16} className="mr-2" /> {date}
              </Button>
            ))}
          </nav>
        </div>

        {/* Agent Button at Bottom */}
        <Button
          onClick={() => router.push("/agent")}
          className="mt-4 w-full flex items-center justify-center gap-2 bg-indigo-600/90 hover:bg-indigo-500/90"
        >
          <Sparkles size={18} /> Agent
        </Button>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <motion.div
          initial={{ x: -300 }}
          animate={{ x: 0 }}
          exit={{ x: -300 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="fixed inset-y-0 left-0 w-64 bg-slate-900 border-r border-slate-800 p-4 flex flex-col justify-between z-30 md:hidden"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-lg">
                <Moon size={20} /> LogBook
              </div>
              <Button
                variant="ghost"
                onClick={() => setSidebarOpen(false)}
                className="text-slate-300 hover:text-indigo-400"
              >
                <X size={20} />
              </Button>
            </div>
            <nav className="space-y-2 overflow-y-auto flex-1">
              {availableDates.map((date) => (
                <Button
                  key={date}
                  variant="ghost"
                  className={`w-full justify-start ${
                    selectedDate === date
                      ? "text-indigo-400 bg-slate-800"
                      : "text-slate-300 hover:text-indigo-400"
                  }`}
                  onClick={() => {
                    setSelectedDate(date);
                    setSidebarOpen(false);
                  }}
                >
                  <Calendar size={16} className="mr-2" /> {date}
                </Button>
              ))}
            </nav>
          </div>

          {/* Agent Button at Bottom */}
          <Button
            onClick={() => {
              setSidebarOpen(false);
              router.push("/agent");
            }}
            className="mt-4 w-full flex items-center justify-center gap-2 bg-indigo-600/90 hover:bg-indigo-500/90"
          >
            <Sparkles size={18} /> Agent
          </Button>
        </motion.div>
      )}

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col md:ml-64 relative z-10">
        {/* Fixed Header */}
        <header className="fixed top-0 left-0 right-0 md:left-64 z-20 flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md shadow-md">
          <div className="flex items-center gap-3">
            {/* Mobile Sidebar Toggle Button */}
            <Button
              variant="ghost"
              className="md:hidden text-slate-300 hover:text-indigo-400"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={22} />
            </Button>

            <h1 className="text-xl font-semibold flex items-center gap-2 text-slate-200">
              <span className="p-2 rounded-lg bg-indigo-600/20 text-indigo-400">
                <Moon size={18} />
              </span>
              <span className="tracking-wide">Daily Thoughts</span>
            </h1>
          </div>

          {/* Right: Auth */}
          <div>
            {isSignedIn ? (
              <UserButton
                afterSignOutUrl="/sign-in"
                appearance={{
                  elements: {
                    avatarBox:
                      "ring-2 ring-indigo-500 hover:ring-indigo-400 transition-all",
                  },
                }}
              />
            ) : (
              <Button
                className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-md hover:shadow-lg transition-all"
                onClick={() => router.push("/sign-in")}
              >
                Login
              </Button>
            )}
          </div>
        </header>

        {/* Scrollable Main Section */}
        <main className="flex-1 overflow-y-auto p-6 pb-40 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 bg-grid-slate-800/[0.04] mt-[72px]">
          {/* Date Heading */}
          <h2 className="text-2xl font-semibold text-slate-300 mb-6 tracking-wide">
            {selectedDate}
          </h2>

          {/* Logs Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {selectedLog?.thoughts?.length > 0 ? (
              selectedLog.thoughts.map((t, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                >
                  <Card className="bg-slate-900/60 border border-slate-800 hover:border-indigo-400 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300 rounded-xl overflow-hidden p-1">
                    <CardContent className="p-4 flex flex-col justify-between h-full">
                      <p className="text-slate-200 text-sm leading-snug line-clamp-4">
                        {t.text}
                      </p>
                      <p className="text-xs text-slate-500 mt-3 flex items-center gap-2">
                        <span className="inline-block w-2 h-2 rounded-full bg-indigo-500"></span>
                        {new Date(t.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col items-center justify-center h-64 rounded-2xl border border-slate-800/60 bg-slate-900/40 text-center p-6 space-y-3 col-span-full"
              >
                <h3 className="text-lg font-medium text-slate-300">
                  {isSignedIn ? "No logs for this day" : "Welcome!"}
                </h3>
                <p className="text-slate-500 text-sm">
                  {isSignedIn
                    ? "Your thoughts will appear here once you add them."
                    : "Login or sign up to start recording your thoughts and keep your daily journal."}
                </p>

                {/* 🚀 New Write for Today button */}
                {isSignedIn && !isToday && (
                  <Button
                    onClick={() => {
                      setSelectedDate(todayDate);
                      setTimeout(() => {
                        window.scrollTo({
                          top: document.body.scrollHeight,
                          behavior: "smooth",
                        });
                      }, 300);
                    }}
                    className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-md shadow-indigo-600/30 transition"
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Write for Today
                  </Button>
                )}

                {!isSignedIn && (
                  <button
                    onClick={() => router.push("/sign-in")}
                    className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-md shadow-indigo-600/30 transition"
                  >
                    Login to Start
                  </button>
                )}
              </motion.div>
            )}
          </div>
        </main>

        {/* Fixed Writing Area / FAB */}
        {isToday ? (
          <div className="fixed bottom-0 left-0 right-0 md:left-64 z-20 border-t border-slate-800 bg-slate-900/70 backdrop-blur-md p-4">
            <div className="relative max-w-3xl mx-auto">
              <div className="relative">
                <Textarea
                  placeholder={
                    !isSignedIn
                      ? "Login to start writing your thoughts..."
                      : "Write your thought..."
                  }
                  value={thought}
                  onChange={(e) => setThought(e.target.value)}
                  disabled={!isSignedIn}
                  rows={3}
                  className={`w-full pr-14 rounded-2xl px-4 py-3 bg-slate-950/70 text-slate-100 border border-slate-700/70 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 resize-none ${
                    !isSignedIn ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                />

                {/* Floating Send Button */}
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className="absolute bottom-3 right-3"
                >
                  <Button
                    size="icon"
                    onClick={handleSave}
                    disabled={!isSignedIn}
                    className="h-10 w-10 rounded-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 shadow-md shadow-indigo-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send size={18} className="text-white" />
                  </Button>
                </motion.div>
              </div>
            </div>
          </div>
        ) : (
          isSignedIn &&
          !isToday && (
            <div className="fixed bottom-0 left-0 right-0 md:left-64 z-20 border-t border-slate-800 bg-gradient-to-r from-slate-900/90 to-slate-950/90 backdrop-blur-lg p-6 flex justify-center md:justify-end">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                {/* Desktop CTA Button */}
                <Button
                  onClick={() => {
                    setSelectedDate(todayDate);
                    setTimeout(() => {
                      window.scrollTo({
                        top: document.body.scrollHeight,
                        behavior: "smooth",
                      });
                    }, 200);
                  }}
                  className="hidden md:flex px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-400 
                     hover:from-indigo-500 hover:via-indigo-400 hover:to-indigo-300 
                     text-white font-semibold shadow-lg shadow-indigo-600/40 
                     transition-all duration-300 items-center gap-2 group"
                >
                  <PlusCircle
                    size={20}
                    className="transition-transform duration-300 group-hover:rotate-90"
                  />
                  <span className="tracking-wide">Write for Today</span>
                  <Sparkles
                    size={18}
                    className="text-yellow-300 opacity-0 group-hover:opacity-100 transition duration-300"
                  />
                </Button>

                {/* Mobile FAB */}
                <motion.button
                  onClick={() => {
                    if (!fabExpanded) {
                      setFabExpanded(true);
                    } else {
                      setSelectedDate(todayDate);
                      setTimeout(() => {
                        window.scrollTo({
                          top: document.body.scrollHeight,
                          behavior: "smooth",
                        });
                      }, 200);
                      setFabExpanded(false);
                    }
                  }}
                  whileTap={{ scale: 0.95 }}
                  className={`md:hidden fixed bottom-20 right-6 flex items-center justify-center 
                     rounded-full shadow-lg shadow-indigo-600/40 overflow-hidden
                     bg-gradient-to-r from-indigo-600 to-indigo-500 
                     text-white transition-all duration-300`}
                  style={{
                    width: fabExpanded ? "180px" : "56px",
                    height: "56px",
                  }}
                >
                  <motion.div
                    initial={{ opacity: 1 }}
                    animate={{ opacity: fabExpanded ? 0 : 1 }}
                    transition={{ duration: 0.2 }}
                    className="absolute"
                  >
                    <PlusCircle size={26} />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{
                      opacity: fabExpanded ? 1 : 0,
                      x: fabExpanded ? 0 : 20,
                    }}
                    transition={{ duration: 0.3 }}
                    className="flex items-center gap-2"
                  >
                    <PlusCircle size={20} className="flex-shrink-0" />
                    <span className="font-medium tracking-wide">
                      Write for Today
                    </span>
                  </motion.div>
                </motion.button>
              </motion.div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
