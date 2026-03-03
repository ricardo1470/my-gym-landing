// src/lib/mongodb.ts
import mongoose from "mongoose";

type Cached = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  var _mongoose: Cached | undefined;
}

let cached = global._mongoose;

if (!cached) {
  cached = global._mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  if (cached!.conn) {
    return cached!.conn;
  }

  if (!cached!.promise) {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
      throw new Error("Please define the MONGODB_URI environment variable");
    }

    cached!.promise = mongoose
      .connect(uri, {
        serverSelectionTimeoutMS: 10000,
        maxPoolSize: 10,
      })
      .then((m) => m)
      .catch((error: unknown) => {
        cached!.promise = null;

        const message =
          error instanceof Error ? error.message : "Unknown MongoDB connection error";

        throw new Error(
          `MongoDB connection failed. Verify cluster status, network access list, DB user credentials, and SRV host in MONGODB_URI. Root error: ${message}`
        );
      });
  }

  cached!.conn = await cached!.promise;
  return cached!.conn;
}
