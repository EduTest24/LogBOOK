import mongoose from "mongoose";

let isConnected = false; // global cache

export const connectDB = async () => {
  if (isConnected) return;

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: "logbook",
    });
    isConnected = true;
    console.log("MongoDB Connected");
  } catch (error) {
    console.error("MongoDB connection error:", error);
  }
};
