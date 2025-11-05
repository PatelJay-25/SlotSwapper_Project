import express from 'express';
import Event, { EVENT_STATUS } from '../models/Event.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// All routes protected
router.use(requireAuth);

// List my events
router.get('/', async (req, res, next) => {
  try {
    const events = await Event.find({ userId: req.user.id }).sort({ startTime: 1 });
    return res.json({ events });
  } catch (err) {
    return next(err);
  }
});

// Create event
router.post('/', async (req, res, next) => {
  try {
    const { title, startTime, endTime, status } = req.body;
    if (!title || !startTime || !endTime) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const event = await Event.create({
      title,
      startTime,
      endTime,
      status: status || EVENT_STATUS.BUSY,
      userId: req.user.id
    });
    return res.status(201).json({ event });
  } catch (err) {
    return next(err);
  }
});

// Update event
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const update = req.body || {};
    const event = await Event.findOneAndUpdate({ _id: id, userId: req.user.id }, update, { new: true });
    if (!event) return res.status(404).json({ error: 'Event not found' });
    return res.json({ event });
  } catch (err) {
    return next(err);
  }
});

// Delete event
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const event = await Event.findOneAndDelete({ _id: id, userId: req.user.id });
    if (!event) return res.status(404).json({ error: 'Event not found' });

    // Clean up any pending swaps that referenced this event
    const { default: SwapRequest, SWAP_STATUS } = await import('../models/SwapRequest.js');
    const pendingSwaps = await SwapRequest.find({
      status: 'PENDING',
      $or: [{ requesterEventId: id }, { responderEventId: id }]
    });

    await Promise.all(
      pendingSwaps.map(async (swap) => {
        const otherEventId = String(swap.requesterEventId) === String(id)
          ? swap.responderEventId
          : swap.requesterEventId;
        // Reset the other event to SWAPPABLE if it still exists
        await Event.findByIdAndUpdate(otherEventId, { status: EVENT_STATUS.SWAPPABLE }).catch(() => {});
        // Mark swap as REJECTED
        await SwapRequest.findByIdAndUpdate(swap._id, { status: SWAP_STATUS.REJECTED });
      })
    );

    return res.json({ success: true });
  } catch (err) {
    return next(err);
  }
});

export default router;

