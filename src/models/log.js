import mongoose from "mongoose";

const ThoughtSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false } // don't auto-generate _id for thoughts
);

const LogSchema = new mongoose.Schema(
  {
    clerkId: { type: String, required: true },
    date: { type: String, required: true }, // e.g. "2025-09-11"
    thoughts: [ThoughtSchema],
  },
  { timestamps: true } // auto adds createdAt & updatedAt
);

// Ensure JSON output is clean
LogSchema.set("toJSON", {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;

    // convert Dates to ISO strings
    if (ret.createdAt) ret.createdAt = ret.createdAt.toISOString();
    if (ret.updatedAt) ret.updatedAt = ret.updatedAt.toISOString();
    if (ret.thoughts) {
      ret.thoughts = ret.thoughts.map((t) => ({
        text: t.text,
        timestamp: t.timestamp ? t.timestamp.toISOString() : null,
      }));
    }
    return ret;
  },
});

export default mongoose.models.Log || mongoose.model("Log", LogSchema);
