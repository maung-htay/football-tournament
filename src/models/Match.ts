import mongoose, { Schema, Document } from 'mongoose';

export interface IMatch extends Document {
  homeTeam?: mongoose.Types.ObjectId;
  awayTeam?: mongoose.Types.ObjectId;
  // For knockout rounds - placeholder like "Group A 1st", "Winner M1"
  homePlaceholder?: string;
  awayPlaceholder?: string;
  homeScore: number | null;
  awayScore: number | null;
  groupId?: mongoose.Types.ObjectId;
  round: 'group' | 'round32' | 'round16' | 'quarter' | 'semi' | 'final' | 'third';
  matchName?: string; // e.g., "M1", "QF1", "SF1"
  venue: string;
  matchDate: Date;
  matchTime: string;
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
  startedAt?: Date;
  completedAt?: Date;
}

const MatchSchema = new Schema<IMatch>(
  {
    homeTeam: { type: Schema.Types.ObjectId, ref: 'Team' },
    awayTeam: { type: Schema.Types.ObjectId, ref: 'Team' },
    homePlaceholder: { type: String },
    awayPlaceholder: { type: String },
    homeScore: { type: Number, default: null },
    awayScore: { type: Number, default: null },
    groupId: { type: Schema.Types.ObjectId, ref: 'Group' },
    round: {
      type: String,
      enum: ['group', 'round32', 'round16', 'quarter', 'semi', 'final', 'third'],
      default: 'group',
    },
    matchName: { type: String },
    venue: { type: String, required: true },
    matchDate: { type: Date, required: true },
    matchTime: { type: String, required: true },
    status: {
      type: String,
      enum: ['scheduled', 'live', 'completed', 'cancelled'],
      default: 'scheduled',
    },
    startedAt: { type: Date },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.models.Match || mongoose.model<IMatch>('Match', MatchSchema);
