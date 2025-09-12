import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/mongodb";
import Chat from "@/models/chat";
import Message from "@/models/message";

export async function GET(req, { params }) {
  try {
    const { userId } = await auth();
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();

    const messages = await Message.find({ chatId: params.chatId }).sort({
      createdAt: 1,
    });
    return NextResponse.json(messages);
  } catch (err) {
    console.error("GET /api/chat/[chatId]/messages error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req, { params }) {
  try {
    const { userId } = await auth();
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();

    const { sender, content, dateContext } = await req.json();
    if (!sender || !content)
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

    // Ensure chat belongs to user
    const chat = await Chat.findOne({ _id: params.chatId, clerkId: userId });
    if (!chat)
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });

    const message = await Message.create({
      chatId: chat._id,
      sender,
      content,
      dateContext,
    });

    // update chat last activity
    chat.updatedAt = new Date();
    await chat.save();

    return NextResponse.json(message, { status: 201 });
  } catch (err) {
    console.error("POST /api/chat/[chatId]/messages error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
