import mongoose, { Schema, Document } from 'mongoose';

export interface IMatch extends Document {
  homeTeam: mongoose.Types.ObjectId;
  awayTeam: mongoose.Types.ObjectId;
  homeScore: number | null;
  awayScore: number | null;
  groupId?: mongoose.Types.ObjectId;
  round: 'group' | 'round16' | 'quarter' | 'semi' | 'final' | 'third';
  venue: string;
  matchDate: Date;
  matchTime: string;
  status: 'scheduled' | 'live' | 'completed';
}

const MatchSchema = new Schema<IMatch>(
  {
    homeTeam: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
    awayTeam: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
    homeScore: { type: Number, default: null },
    awayScore: { type: Number, default: null },
    groupId: { type: Schema.Types.ObjectId, ref: 'Group' },
    round: {
      type: String,
      enum: ['group', 'round16', 'quarter', 'semi', 'final', 'third'],
      default: 'group',
    },
    venue: { type: String, required: true },
    matchDate: { type: Date, required: true },
    matchTime: { type: String, required: true },
    status: {
      type: String,
      enum: ['scheduled', 'live', 'completed'],
      default: 'scheduled',
    },
  },
  { timestamps: true }
);

export default mongoose.models.Match || mongoose.model<IMatch>('Match', MatchSchema);
