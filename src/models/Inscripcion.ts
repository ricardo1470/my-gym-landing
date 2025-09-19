import mongoose, { Schema, models } from "mongoose";

const InscripcionSchema = new Schema({
  nombre: { type: String, required: true },
  email: { type: String, required: true },
  objetivo: { type: String, required: true },
  fecha: { type: Date, default: Date.now },
});

const Inscripcion = models.Inscripcion || mongoose.model("Inscripcion", InscripcionSchema);

export default Inscripcion;
