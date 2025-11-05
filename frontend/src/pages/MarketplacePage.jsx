import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api.js';
import { useState } from 'react';

export default function MarketplacePage() {
  const qc = useQueryClient();
  const [myEventId, setMyEventId] = useState('');

  const myEventsQuery = useQuery({ queryKey: ['events'], queryFn: async () => (await api.get('/events')).data });
  const { data, isLoading } = useQuery({ queryKey: ['swappable'], queryFn: async () => (await api.get('/swappable-slots')).data });

  const requestSwap = useMutation({
    mutationFn: async (theirSlotId) => (await api.post('/swap-request', { mySlotId: myEventId, theirSlotId })).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['swappable'] });
      qc.invalidateQueries({ queryKey: ['events'] });
      qc.invalidateQueries({ queryKey: ['swap-requests'] });
      setMyEventId(''); // Reset selection after successful request
    },
    onError: (error) => {
      console.error('Swap request failed:', error);
      alert(error?.response?.data?.error || 'Failed to create swap request');
    }
  });

  const events = data?.events || [];
  const myEvents = myEventsQuery.data?.events?.filter((e) => e.status === 'SWAPPABLE') || [];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Marketplace</h1>
      <div className="card">
        <div className="card-body flex flex-col md:flex-row gap-3 md:items-center">
          <label className="label m-0">Choose your swappable event</label>
          <select className="input md:max-w-md" value={myEventId} onChange={(e) => setMyEventId(e.target.value)}>
            <option value="">Select…</option>
            {myEvents.map((e) => (
              <option key={e._id} value={e._id}>{e.title} ({new Date(e.startTime).toLocaleString()})</option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? <div className="card"><div className="card-body">Loading…</div></div> : (
        <div className="grid gap-3">
          {events.map((ev) => (
            <div key={ev._id} className="card">
              <div className="card-body flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <div className="font-medium text-slate-900">{ev.title}</div>
                  <div className="text-sm text-slate-600">{new Date(ev.startTime).toLocaleString()} → {new Date(ev.endTime).toLocaleString()}</div>
                </div>
                <button className="btn btn-primary w-full sm:w-auto" disabled={!myEventId || requestSwap.isPending} onClick={() => requestSwap.mutate(ev._id)}>
                  {requestSwap.isPending ? 'Requesting…' : 'Request Swap'}
                </button>
              </div>
            </div>
          ))}
          {events.length === 0 && (
            <div className="card"><div className="card-body text-sm text-slate-600">No swappable events from other users right now.</div></div>
          )}
        </div>
      )}
    </div>
  );
}


