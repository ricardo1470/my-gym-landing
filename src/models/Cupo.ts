// src/models/Cupo.ts
import mongoose, { Schema, models, model } from "mongoose";

interface IPlanDiscount {
  planId: string;
  maxCupos: number;
  usedCupos: number;
  discountPercentage: number;
}

interface ICupo {
  planDiscounts: IPlanDiscount[];
  lastReset: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PlanDiscountSchema = new Schema({
  planId: { type: String, required: true },
  maxCupos: { type: Number, required: true, default: 6 },
  usedCupos: { type: Number, required: true, default: 0 },
  discountPercentage: { type: Number, required: true }
});

const CupoSchema = new Schema({
  planDiscounts: [PlanDiscountSchema],
  lastReset: { type: Date, default: () => new Date() },
}, { timestamps: true });

export default (models.Cupo as mongoose.Model<ICupo>) || model<ICupo>("Cupo", CupoSchema);
