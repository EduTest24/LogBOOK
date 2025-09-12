import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Log from "@/models/log";
import { auth } from "@clerk/nextjs/server";
import OpenAI from "openai";
import { parseDate } from "chrono-node";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req) {
  try {
    const { userId } = await auth();
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();

    const { prompt } = await req.json();
    if (!prompt)
      return NextResponse.json({ error: "Prompt required" }, { status: 400 });

    // 🔹 Step 1: Try to extract date using chrono-node
    let parsedDate = parseDate(prompt);

    // 🔹 Step 2: If chrono-node fails, fallback to AI
    if (!parsedDate) {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant. Extract a valid date (YYYY-MM-DD) from the user's text. If no date, return today's date.",
          },
          { role: "user", content: prompt },
        ],
      });

      const aiDate = completion.choices[0].message.content.trim();
      if (!aiDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return NextResponse.json(
          { error: "Could not extract a valid date" },
          { status: 400 }
        );
      }
      parsedDate = new Date(aiDate);
    }

    // 🔹 Normalize to YYYY-MM-DD (matches DB schema)
    const date = parsedDate.toISOString().split("T")[0];

    // 🔹 Step 3: Fetch logs for this user and date
    const logDoc = await Log.findOne({ clerkId: userId, date });
    if (!logDoc || logDoc.thoughts.length === 0) {
      return NextResponse.json({
        analysis: `No logs found for ${date}. Try writing some thoughts first.`,
      });
    }

    // 🔹 Step 4: Build logs text for AI
    const logsText = logDoc.thoughts
      .map(
        (t, i) =>
          `Thought ${i + 1} (${new Date(t.timestamp).toLocaleTimeString()}): ${
            t.text
          }`
      )
      .join("\n");

    // 🔹 Step 5: Analyze with OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a friendly assistant summarizing user journal logs. Analyze mood, key activities, and give insights in a natural, helpful way.",
        },
        {
          role: "user",
          content: `Logs for ${date}:\n${logsText}\nSummarize and provide insights.`,
        },
      ],
    });

    const analysis = completion.choices[0].message.content;

    return NextResponse.json({ analysis, date });
  } catch (err) {
    console.error("Agent analysis error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
