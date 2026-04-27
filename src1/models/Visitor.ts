import mongoose, { Schema, Document } from 'mongoose';

export interface IVisitor extends Document {
    count: number;
    lastReset: Date;
}

const VisitorSchema = new Schema<IVisitor>(
    {
        count: { type: Number, default: 0 },
        lastReset: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

export default mongoose.models.Visitor || mongoose.model<IVisitor>('Visitor', VisitorSchema);