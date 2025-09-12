import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  clerkId: { type: String, required: true, unique: true },
  username: { type: String },
  email: { type: String },
  imageUrl: { type: String },
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date, default: Date.now },
  device: { type: String },
  ip: { type: String },
});

export default mongoose.models.User || mongoose.model("User", UserSchema);
