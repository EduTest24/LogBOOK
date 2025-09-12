import { auth, currentUser } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/user";

export async function GET(req) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    await connectDB();

    // ✅ Fetch Clerk user profile directly
    const clerkUser = await currentUser();

    if (!clerkUser) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
      });
    }

    const email = clerkUser.emailAddresses?.[0]?.emailAddress || "Unknown";
    const username =
      clerkUser.username ||
      clerkUser.firstName ||
      clerkUser.lastName ||
      email.split("@")[0] ||
      "Unknown";
    const imageUrl = clerkUser.imageUrl || "";

    // Get request metadata
    const userAgent = req.headers.get("user-agent") || "Unknown";
    const ip =
      req.headers.get("x-real-ip") ||
      req.headers.get("x-forwarded-for") ||
      "Unknown";

    // Try to find user in DB
    let user = await User.findOne({ clerkId: userId });

    if (!user) {
      user = await User.create({
        clerkId: userId,
        username,
        email,
        imageUrl,
        createdAt: new Date(),
        lastLogin: new Date(),
        device: userAgent,
        ip,
      });
    } else {
      user.username = username;
      user.email = email;
      user.imageUrl = imageUrl;
      user.lastLogin = new Date();
      user.device = userAgent;
      user.ip = ip;
      await user.save();
    }

    return new Response(JSON.stringify(user), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("User sync error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
    });
  }
}
