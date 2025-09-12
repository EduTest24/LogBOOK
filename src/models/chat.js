import mongoose from "mongoose";

const ChatSchema = new mongoose.Schema(
  {
    clerkId: { type: String, required: true }, // user from Clerk
    title: { type: String, required: true },
    pinned: { type: Boolean, default: false },
  },
  { timestamps: true } // adds createdAt + updatedAt
);

export default mongoose.models.Chat || mongoose.model("Chat", ChatSchema);
