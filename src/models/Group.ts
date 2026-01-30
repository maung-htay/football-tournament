import mongoose, { Schema, Document } from 'mongoose';

export interface IGroup extends Document {
  name: string;
  teams: mongoose.Types.ObjectId[];
}

const GroupSchema = new Schema<IGroup>(
  {
    name: { type: String, required: true, unique: true },
    teams: [{ type: Schema.Types.ObjectId, ref: 'Team' }],
  },
  { timestamps: true }
);

export default mongoose.models.Group || mongoose.model<IGroup>('Group', GroupSchema);
