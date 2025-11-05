import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api.js';
import { useState } from 'react';

function EventForm({ onSubmit }) {
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ title, startTime, endTime }); setTitle(''); setStartTime(''); setEndTime(''); }} className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <input className="input" placeholder="Team Sync" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input className="input" type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
        <input className="input" type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
      </div>
      <button className="btn btn-primary">Add Event</button>
    </form>
  );
}

export default function DashboardPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: async () => (await api.get('/events')).data
  });

  const createMutation = useMutation({
    mutationFn: async (payload) => (await api.post('/events', payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['events'] })
  });

  const updateEvent = useMutation({
    mutationFn: async ({ id, update }) => (await api.put(`/events/${id}`, update)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['events'] })
  });

  const deleteEvent = useMutation({
    mutationFn: async (id) => (await api.delete(`/events/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['events'] })
  });

  if (isLoading) return <p>Loading…</p>;

  const events = data?.events || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Your Events</h1>
      <div className="card">
        <div className="card-body space-y-3">
          <h2 className="section-title">Add new event</h2>
          <EventForm onSubmit={(payload) => createMutation.mutate(payload)} />
        </div>
      </div>
      <div className="grid gap-3">
        {events.map((ev) => (
          <div key={ev._id} className="card">
            <div className="card-body flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <div className="font-medium text-slate-900">{ev.title}</div>
                <div className="text-sm text-slate-600">{new Date(ev.startTime).toLocaleString()} → {new Date(ev.endTime).toLocaleString()}</div>
                <div className="text-xs mt-2">
                  <span className={`badge ${ev.status === 'SWAPPABLE' ? 'badge-green' : ev.status === 'SWAP_PENDING' ? 'badge-yellow' : 'badge-gray'}`}>{ev.status}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button className="btn btn-outline w-full sm:w-auto" onClick={() => updateEvent.mutate({ id: ev._id, update: { status: 'SWAPPABLE' } })}>Mark Swappable</button>
                <button className="btn btn-secondary w-full sm:w-auto" onClick={() => updateEvent.mutate({ id: ev._id, update: { status: 'BUSY' } })}>Mark Busy</button>
                <button className="btn btn-danger w-full sm:w-auto" onClick={() => deleteEvent.mutate(ev._id)}>Delete</button>
              </div>
            </div>
          </div>
        ))}
        {events.length === 0 && (
          <div className="card"><div className="card-body text-sm text-slate-600">No events yet. Create your first event above.</div></div>
        )}
      </div>
    </div>
  );
}


