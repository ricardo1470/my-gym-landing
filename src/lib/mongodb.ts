// src/lib/mongodb.ts
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI!;
if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable in .env.local");
}

/**
 * Reuse cached connection across hot reloads in development to avoid
 * creating multiple connections.
 */
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
    cached!.promise = mongoose.connect(MONGODB_URI, {
      // opciones opcionales
      // useNewUrlParser: true, useUnifiedTopology: true // mongoose 6+ ya usa estas por defecto
    }).then((m) => m);
  }
  cached!.conn = await cached!.promise;
  return cached!.conn;
}
