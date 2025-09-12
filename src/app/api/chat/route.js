import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/mongodb";
import Chat from "@/models/chat";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();

    const chats = await Chat.find({ clerkId: userId }).sort({ updatedAt: -1 });
    return NextResponse.json(chats);
  } catch (err) {
    console.error("GET /api/chat error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const { userId } = await auth();
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();

    const { title } = await req.json();
    if (!title)
      return NextResponse.json({ error: "Title required" }, { status: 400 });

    const chat = await Chat.create({ clerkId: userId, title });
    return NextResponse.json(chat, { status: 201 });
  } catch (err) {
    console.error("POST /api/chat error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
