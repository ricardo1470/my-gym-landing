// src/models/Inscripcion.ts
import mongoose, { Schema, models } from "mongoose";

const InscripcionSchema = new Schema({
  nombre: { type: String, required: true },
  email: { type: String, required: true },
  objetivo: { type: String, required: true },
  planId: { type: String, enum: ['basico', 'premium', 'elite'], default: 'premium' },
  discountApplied: { type: Boolean, default: false },
  discountPercentage: { type: Number, default: 0 },
  fecha: { type: Date, default: Date.now },
});

const Inscripcion = models.Inscripcion || mongoose.model("Inscripcion", InscripcionSchema);

export default Inscripcion;
