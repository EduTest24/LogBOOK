import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/mongodb";
import Log from "@/models/log";

export async function GET(req) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date"); // optional
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    let query = { clerkId: userId };

    if (date) {
      query.date = date;
    } else if (from && to) {
      query.date = { $gte: from, $lte: to };
    }

    const logs = await Log.find(query).sort({ date: -1 });

    return new Response(JSON.stringify(logs), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("GET /api/logs error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
    });
  }
}

export async function POST(req) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    await connectDB();

    const body = await req.json();
    const { text, date } = body;

    if (!text) {
      return new Response(JSON.stringify({ error: "Text is required" }), {
        status: 400,
      });
    }

    // Always store YYYY-MM-DD
    const today = new Date();
    const dayString = date || today.toISOString().split("T")[0]; // "2025-09-13"

    let log = await Log.findOne({ clerkId: userId, date: dayString });

    if (!log) {
      log = await Log.create({
        clerkId: userId,
        date: dayString,
        thoughts: [{ text, timestamp: new Date() }],
      });
    } else {
      log.thoughts.push({ text, timestamp: new Date() });
      log.updatedAt = new Date();
      await log.save();
    }

    return new Response(JSON.stringify(log), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("POST /api/logs error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
    });
  }
}
