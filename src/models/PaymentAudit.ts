import mongoose, { Schema, models, Model } from "mongoose";

export interface IPaymentAuditDocument extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  source: "nequi-webhook" | "payment-api";
  eventType: string;
  reservaId?: mongoose.Types.ObjectId;
  transactionId?: string;
  statusCode?: string;
  amount?: number;
  payloadHash?: string;
  metadata?: Record<string, unknown>;
  createdAt?: Date;
}

const PaymentAuditSchema = new Schema<IPaymentAuditDocument>(
  {
    source: { type: String, required: true, enum: ["nequi-webhook", "payment-api"] },
    eventType: { type: String, required: true },
    reservaId: { type: Schema.Types.ObjectId, ref: "Reserva" },
    transactionId: { type: String },
    statusCode: { type: String },
    amount: { type: Number },
    payloadHash: { type: String },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

PaymentAuditSchema.index({ createdAt: -1 });
PaymentAuditSchema.index({ source: 1, eventType: 1 });
PaymentAuditSchema.index({ reservaId: 1, createdAt: -1 });
PaymentAuditSchema.index({ transactionId: 1, createdAt: -1 });

const PaymentAudit =
  (models.PaymentAudit as Model<IPaymentAuditDocument>) ||
  mongoose.model<IPaymentAuditDocument>("PaymentAudit", PaymentAuditSchema);

export default PaymentAudit;
