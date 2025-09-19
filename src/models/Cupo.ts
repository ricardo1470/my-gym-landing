// src/models/Cupo.ts
import mongoose, { Schema, models, model } from "mongoose";

interface ICupo {
  max: number;
  usados: number;
  lastReset: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CupoSchema = new Schema({
  max: { type: Number, required: true, default: 10 },
  usados: { type: Number, required: true, default: 0 },
  lastReset: { type: Date, default: () => new Date() },
}, { timestamps: true });

export default (models.Cupo as mongoose.Model<ICupo>) || model<ICupo>("Cupo", CupoSchema);
