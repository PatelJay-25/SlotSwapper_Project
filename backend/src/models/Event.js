import mongoose from 'mongoose';

export const EVENT_STATUS = {
  BUSY: 'BUSY',
  SWAPPABLE: 'SWAPPABLE',
  SWAP_PENDING: 'SWAP_PENDING'
};

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    status: { type: String, enum: Object.values(EVENT_STATUS), default: EVENT_STATUS.BUSY },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
);

eventSchema.index({ userId: 1, startTime: 1 });

const Event = mongoose.model('Event', eventSchema);
export default Event;

