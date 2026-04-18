import mongoose, { Schema, Document } from 'mongoose';

interface IMatchEvent {
  team: 'home' | 'away';
  jerseyNumber: number;
}

export interface IMatch extends Document {
  homeTeam?: mongoose.Types.ObjectId;
  awayTeam?: mongoose.Types.ObjectId;
  homePlaceholder?: string;
  awayPlaceholder?: string;
  homeScore: number | null;
  awayScore: number | null;
  homePenalty?: number | null;
  awayPenalty?: number | null;
  liveUrl?: string;
  groupId?: mongoose.Types.ObjectId;
  round: 'group' | 'round32' | 'round16' | 'quarter' | 'semi' | 'final' | 'third';
  matchName?: string;
  venue: string;
  matchDate: Date;
  matchTime: string;
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
  startedAt?: Date;
  completedAt?: Date;
  goalScorers: IMatchEvent[];
  yellowCards: IMatchEvent[];
  redCards: IMatchEvent[];
}

const MatchEventSchema = new Schema({
  team: { type: String, enum: ['home', 'away'], required: true },
  jerseyNumber: { type: Number, required: true },
}, { _id: false });

const MatchSchema = new Schema<IMatch>(
  {
    homeTeam: { type: Schema.Types.ObjectId, ref: 'Team' },
    awayTeam: { type: Schema.Types.ObjectId, ref: 'Team' },
    homePlaceholder: { type: String },
    awayPlaceholder: { type: String },
    homeScore: { type: Number, default: null },
    awayScore: { type: Number, default: null },
    homePenalty: { type: Number, default: null },
    awayPenalty: { type: Number, default: null },
    liveUrl: { type: String },
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
    goalScorers: { type: [MatchEventSchema], default: [] },
    yellowCards: { type: [MatchEventSchema], default: [] },
    redCards: { type: [MatchEventSchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.models.Match || mongoose.model<IMatch>('Match', MatchSchema);
