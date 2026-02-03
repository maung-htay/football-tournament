import mongoose, { Schema, Document } from 'mongoose';

export interface ITeam extends Document {
  name: string;
  shortName: string;
  logoUrl?: string;
  groupId?: mongoose.Types.ObjectId;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
}

const TeamSchema = new Schema<ITeam>(
  {
    name: { type: String, required: true, unique: true },
    shortName: { type: String, required: true, maxlength: 5 },
    logoUrl: { type: String, default: '' },
    groupId: { type: Schema.Types.ObjectId, ref: 'Group' },
    played: { type: Number, default: 0 },
    won: { type: Number, default: 0 },
    drawn: { type: Number, default: 0 },
    lost: { type: Number, default: 0 },
    goalsFor: { type: Number, default: 0 },
    goalsAgainst: { type: Number, default: 0 },
    points: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Virtual for goal difference
TeamSchema.virtual('goalDifference').get(function () {
  return this.goalsFor - this.goalsAgainst;
});

export default mongoose.models.Team || mongoose.model<ITeam>('Team', TeamSchema);
