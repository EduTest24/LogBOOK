"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Moon, Menu, X, Calendar, PlusCircle } from "lucide-react";
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

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100 relative overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:24px_24px] opacity-30 pointer-events-none" />

      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 border-r border-slate-800 p-4 space-y-4 z-20">
        <div className="flex items-center gap-2 text-indigo-400 font-bold text-lg">
          <Moon size={20} /> LogBook
        </div>
        <nav className="space-y-2">
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
      </aside>

      {/* Sidebar Mobile */}
      {sidebarOpen && (
        <motion.div
          initial={{ x: -300 }}
          animate={{ x: 0 }}
          exit={{ x: -300 }}
          className="fixed inset-y-0 left-0 w-64 bg-slate-900 border-r border-slate-800 p-4 space-y-4 z-30 md:hidden"
        >
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
          <nav className="space-y-2">
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
        </motion.div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative z-10">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md shadow-md">
          <h1 className="text-xl font-semibold flex items-center gap-2 text-slate-200">
            <span className="p-2 rounded-lg bg-indigo-600/20 text-indigo-400">
              <Moon size={18} />
            </span>
            <span className="tracking-wide">Daily Thoughts</span>
          </h1>

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

        {/* Logs Section */}
        <main className="flex-1 overflow-y-auto p-4 pb-28">
          <h2 className="text-lg font-medium text-slate-400 mb-4">
            {selectedDate}
          </h2>
          <div className="space-y-4">
            {selectedLog?.thoughts?.length > 0 ? (
              selectedLog.thoughts.map((t, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="bg-slate-900 border-slate-800 hover:border-indigo-500 transition">
                    <CardContent className="p-4">
                      <p className="text-slate-200">{t.text}</p>
                      <p className="text-sm text-slate-500 mt-2">
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
              <p className="text-slate-500">No logs for this day.</p>
            )}
          </div>
        </main>

        {/* Writing Area */}
        <div className="sticky bottom-0 left-0 right-0 border-t border-slate-800 bg-slate-900/70 backdrop-blur-md p-4">
          <div className="flex flex-col gap-3">
            <Textarea
              placeholder={
                isSignedIn
                  ? "Write your thought..."
                  : "Login to start writing your thoughts..."
              }
              value={thought}
              onChange={(e) => setThought(e.target.value)}
              disabled={!isSignedIn}
              className={`bg-slate-950/60 text-slate-100 border-slate-700 focus:ring-2 focus:ring-indigo-500 backdrop-blur-sm ${
                !isSignedIn ? "opacity-50 cursor-not-allowed" : ""
              }`}
            />
            <motion.div whileTap={{ scale: 0.97 }}>
              <Button
                onClick={handleSave}
                disabled={!isSignedIn}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600/90 hover:bg-indigo-500/90 backdrop-blur-sm shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PlusCircle size={18} /> Save Thought
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
