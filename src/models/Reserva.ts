// src/models/Reserva.ts
import mongoose, { Schema, models, Model } from "mongoose";

// Interfaz base sin Document (para uso en lógica)
export interface IReservaBase {
  inscripcionId: mongoose.Types.ObjectId;
  clienteNombre: string;
  clienteEmail: string;
  clientePhone: string;
  planId: string;
  planNombre: string;
  fechaHora: Date;
  duracion: number;
  estado: 'pendiente' | 'confirmada' | 'cancelada' | 'completada';
  pagoId?: string;
  paymentSessionToken: string;
  pagoMonto: number;
  pagoMetodo: 'nequi' | 'efectivo' | 'transferencia';
  pagoEstado: 'pendiente' | 'aprobado' | 'rechazado' | 'reembolsado';
  pagoFecha?: Date;
  isMonthlyMembership?: boolean;
  membershipStartDate?: Date;
  membershipEndDate?: Date;
  renewalStatus: 'none' | 'active' | 'due_soon' | 'expired' | 'renewed';
  renewalReminderCount?: number;
  lastRenewalReminderAt?: Date;
  simulationMode?: boolean;
  googleEventId?: string;
  googleCalendarLink?: string;
  notificacionesEnviadas: {
    whatsappCliente: boolean;
    whatsappEntrenador: boolean;
    emailCliente: boolean;
    emailEntrenador: boolean;
  };
  notas?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Interfaz de Mongoose Document
export interface IReservaDocument extends IReservaBase, mongoose.Document {
  _id: mongoose.Types.ObjectId;
}

const ReservaSchema = new Schema<IReservaDocument>({
  inscripcionId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Inscripcion',
    required: true 
  },
  clienteNombre: { type: String, required: true },
  clienteEmail: { type: String, required: true },
  clientePhone: { type: String, required: true },
  planId: { 
    type: String, 
    enum: ['diario', 'basico', 'premium', 'elite'], 
    required: true 
  },
  planNombre: { type: String, required: true },
  
  fechaHora: { type: Date, required: true },
  duracion: { type: Number, default: 60 },
  
  estado: { 
    type: String, 
    enum: ['pendiente', 'confirmada', 'cancelada', 'completada'],
    default: 'pendiente'
  },
  
  pagoId: { type: String },
  paymentSessionToken: { type: String, default: "" },
  pagoMonto: { type: Number, required: true },
  pagoMetodo: { 
    type: String, 
    enum: ['nequi', 'efectivo', 'transferencia'],
    default: 'nequi'
  },
  pagoEstado: {
    type: String,
    enum: ['pendiente', 'aprobado', 'rechazado', 'reembolsado'],
    default: 'pendiente'
  },
  pagoFecha: { type: Date },
  isMonthlyMembership: { type: Boolean, default: false },
  membershipStartDate: { type: Date },
  membershipEndDate: { type: Date },
  renewalStatus: {
    type: String,
    enum: ['none', 'active', 'due_soon', 'expired', 'renewed'],
    default: 'none',
  },
  renewalReminderCount: { type: Number, default: 0 },
  lastRenewalReminderAt: { type: Date },
  simulationMode: { type: Boolean, default: false },
  
  googleEventId: { type: String },
  googleCalendarLink: { type: String },
  
  notificacionesEnviadas: {
    whatsappCliente: { type: Boolean, default: false },
    whatsappEntrenador: { type: Boolean, default: false },
    emailCliente: { type: Boolean, default: false },
    emailEntrenador: { type: Boolean, default: false },
  },
  
  notas: { type: String },
}, { 
  timestamps: true 
});

// Índices para búsquedas eficientes
ReservaSchema.index({ clienteEmail: 1 });
ReservaSchema.index({ fechaHora: 1 });
ReservaSchema.index({ estado: 1 });
ReservaSchema.index({ pagoEstado: 1 });
ReservaSchema.index({ inscripcionId: 1, pagoEstado: 1 });
ReservaSchema.index({ isMonthlyMembership: 1, membershipEndDate: 1 });
ReservaSchema.index({ renewalStatus: 1, membershipEndDate: 1 });

// Modelo con tipo correcto
const Reserva = (models.Reserva as Model<IReservaDocument>) || 
                mongoose.model<IReservaDocument>("Reserva", ReservaSchema);

export default Reserva;
