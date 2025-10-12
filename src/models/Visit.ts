// src/models/Visit.ts
import mongoose, { Schema, Document } from 'mongoose';

// Interfaz para el documento de Visita
export interface IVisit extends Document {
    timestamp: Date;
    country: string;
    city: string;
    userAgent: string;
    planSelection: string | null;
}

const VisitSchema: Schema = new Schema({
    timestamp: {
        type: Date,
        default: Date.now,
        required: true,
    },
    country: {
        type: String,
        required: false,
    },
    city: {
        type: String,
        required: false,
    },
    userAgent: {
        type: String,
        required: true,
    },
    planSelection: {
        type: String,
        required: false,
        enum: ['basico', 'premium', 'elite', null],
    },
});

const Visit = mongoose.models.Visit || mongoose.model<IVisit>('Visit', VisitSchema);

export default Visit;
