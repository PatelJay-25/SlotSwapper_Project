import mongoose from 'mongoose';

export const SWAP_STATUS = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED'
};

const swapRequestSchema = new mongoose.Schema(
  {
    requesterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    responderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    requesterEventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    responderEventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    status: { type: String, enum: Object.values(SWAP_STATUS), default: SWAP_STATUS.PENDING }
  },
  { timestamps: true }
);

swapRequestSchema.index({ requesterId: 1, responderId: 1, status: 1 });

const SwapRequest = mongoose.model('SwapRequest', swapRequestSchema);
export default SwapRequest;

