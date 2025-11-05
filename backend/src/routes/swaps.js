import express from 'express';
import Event, { EVENT_STATUS } from '../models/Event.js';
import SwapRequest, { SWAP_STATUS } from '../models/SwapRequest.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);

// GET /api/swappable-slots - other users' swappable events
router.get('/swappable-slots', async (req, res, next) => {
  try {
    const events = await Event.find({
      userId: { $ne: req.user.id },
      status: EVENT_STATUS.SWAPPABLE
    }).sort({ startTime: 1 });
    return res.json({ events });
  } catch (err) {
    return next(err);
  }
});

// POST /api/swap-request - create a swap request
router.post('/swap-request', async (req, res, next) => {
  try {
    const { mySlotId, theirSlotId } = req.body;
    if (!mySlotId || !theirSlotId) {
      return res.status(400).json({ error: 'Missing mySlotId or theirSlotId' });
    }

    // Verify both slots exist and are SWAPPABLE
    const [myEvent, theirEvent] = await Promise.all([
      Event.findOne({ _id: mySlotId, userId: req.user.id }),
      Event.findById(theirSlotId)
    ]);
    
    if (!myEvent) {
      return res.status(404).json({ error: 'Your slot not found or you do not own it' });
    }
    if (!theirEvent) {
      return res.status(404).json({ error: 'Their slot not found' });
    }
    
    // Verify both are SWAPPABLE
    if (myEvent.status !== EVENT_STATUS.SWAPPABLE) {
      return res.status(400).json({ error: 'Your slot must be SWAPPABLE' });
    }
    if (theirEvent.status !== EVENT_STATUS.SWAPPABLE) {
      return res.status(400).json({ error: 'Their slot must be SWAPPABLE' });
    }
    
    // Cannot swap with own event
    if (String(theirEvent.userId) === String(req.user.id)) {
      return res.status(400).json({ error: 'Cannot request swap with your own event' });
    }

    // Create SwapRequest with PENDING status
    const swap = await SwapRequest.create({
      requesterId: req.user.id,
      responderId: theirEvent.userId,
      requesterEventId: mySlotId,
      responderEventId: theirSlotId
    });

    // Update both slots to SWAP_PENDING to prevent other swaps
    await Promise.all([
      Event.findByIdAndUpdate(mySlotId, { status: EVENT_STATUS.SWAP_PENDING }),
      Event.findByIdAndUpdate(theirSlotId, { status: EVENT_STATUS.SWAP_PENDING })
    ]);

    return res.status(201).json({ swap });
  } catch (err) {
    return next(err);
  }
});

// POST /api/swap-response/:requestId - accept or reject
router.post('/swap-response/:requestId', async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const { accepted } = req.body; // true/false
    
    if (typeof accepted !== 'boolean') {
      return res.status(400).json({ error: 'accepted must be a boolean (true/false)' });
    }
    
    const swap = await SwapRequest.findById(requestId);
    if (!swap) {
      return res.status(404).json({ error: 'Swap request not found' });
    }
    
    // Only responder can respond
    if (String(swap.responderId) !== String(req.user.id)) {
      return res.status(403).json({ error: 'Not authorized to respond to this swap' });
    }
    
    if (swap.status !== SWAP_STATUS.PENDING) {
      return res.status(400).json({ error: 'Swap already resolved' });
    }

    const requesterEvent = await Event.findById(swap.requesterEventId);
    const responderEvent = await Event.findById(swap.responderEventId);
    if (!requesterEvent || !responderEvent) {
      // Auto-reject if either event has been deleted, and free the surviving one if exists
      if (requesterEvent) requesterEvent.status = EVENT_STATUS.SWAPPABLE;
      if (responderEvent) responderEvent.status = EVENT_STATUS.SWAPPABLE;
      await Promise.all([
        requesterEvent ? requesterEvent.save() : Promise.resolve(),
        responderEvent ? responderEvent.save() : Promise.resolve(),
        SwapRequest.findByIdAndUpdate(requestId, { status: SWAP_STATUS.REJECTED })
      ]);
      return res.status(410).json({ error: 'Swap cannot proceed: one or more events were deleted' });
    }

    if (accepted === true) {
      // ACCEPTED: Swap owners and set both to BUSY
      const requesterUserId = requesterEvent.userId;
      const responderUserId = responderEvent.userId;

      // Exchange the userId (owner) of both slots
      requesterEvent.userId = responderUserId;
      responderEvent.userId = requesterUserId;
      
      // Set both slots status to BUSY
      requesterEvent.status = EVENT_STATUS.BUSY;
      responderEvent.status = EVENT_STATUS.BUSY;

      await Promise.all([
        requesterEvent.save(),
        responderEvent.save(),
        SwapRequest.findByIdAndUpdate(requestId, { status: SWAP_STATUS.ACCEPTED })
      ]);

      return res.json({ success: true, message: 'Swap accepted' });
    } else {
      // REJECTED: Set both slots back to SWAPPABLE
      await Promise.all([
        Event.findByIdAndUpdate(swap.requesterEventId, { status: EVENT_STATUS.SWAPPABLE }),
        Event.findByIdAndUpdate(swap.responderEventId, { status: EVENT_STATUS.SWAPPABLE }),
        SwapRequest.findByIdAndUpdate(requestId, { status: SWAP_STATUS.REJECTED })
      ]);
      
      return res.json({ success: true, message: 'Swap rejected' });
    }
  } catch (err) {
    return next(err);
  }
});

// GET my incoming/outgoing swap requests
router.get('/swap-requests', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const [incoming, outgoing] = await Promise.all([
      SwapRequest.find({ responderId: userId })
        .populate('requesterId', 'name email')
        .populate('requesterEventId', 'title startTime endTime status')
        .populate('responderEventId', 'title startTime endTime status')
        .sort({ createdAt: -1 }),
      SwapRequest.find({ requesterId: userId })
        .populate('responderId', 'name email')
        .populate('requesterEventId', 'title startTime endTime status')
        .populate('responderEventId', 'title startTime endTime status')
        .sort({ createdAt: -1 })
    ]);
    return res.json({ incoming, outgoing });
  } catch (err) {
    return next(err);
  }
});

export default router;

