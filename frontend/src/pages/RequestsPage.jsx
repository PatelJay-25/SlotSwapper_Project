import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api.js';

export default function RequestsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ 
    queryKey: ['swap-requests'], 
    queryFn: async () => {
      const response = await api.get('/swap-requests');
      return response.data;
    }
  });

  const respond = useMutation({
    mutationFn: async ({ requestId, accepted }) => (await api.post(`/swap-response/${requestId}`, { accepted })).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['swap-requests'] });
      qc.invalidateQueries({ queryKey: ['events'] });
      qc.invalidateQueries({ queryKey: ['swappable'] });
    },
    onError: (error) => {
      console.error('Swap response failed:', error);
      alert(error?.response?.data?.error || 'Failed to respond to swap request');
    }
  });

  if (isLoading) return <p className="text-center py-4">Loading…</p>;
  
  const incoming = data?.incoming || [];
  const outgoing = data?.outgoing || [];

  const getStatusBadge = (status) => {
    const map = { PENDING: 'badge badge-yellow', ACCEPTED: 'badge badge-green', REJECTED: 'badge badge-red' };
    return <span className={map[status] || 'badge badge-gray'}>{status}</span>;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Swap Requests</h1>

      <section>
        <h2 className="text-lg font-medium mb-3">Incoming Requests</h2>
        <div className="grid gap-3">
          {incoming.length === 0 ? (
            <p className="text-sm text-gray-600 bg-white p-4 rounded shadow">No incoming requests</p>
          ) : (
            incoming.map((r) => (
              <div key={r._id} className="bg-white p-4 rounded shadow">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="font-medium">From: {r.requesterId?.name || 'Unknown'}</span>
                      {getStatusBadge(r.status)}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="border rounded p-2 bg-gray-50">
                        <div className="font-medium text-xs text-gray-600 mb-1">Their Event (You'll Receive)</div>
                        <div className="font-medium">{r.requesterEventId?.title || 'N/A'}</div>
                        <div className="text-xs text-gray-600">
                          {r.requesterEventId?.startTime ? new Date(r.requesterEventId.startTime).toLocaleString() : 'N/A'}
                        </div>
                      </div>
                      <div className="border rounded p-2 bg-gray-50">
                        <div className="font-medium text-xs text-gray-600 mb-1">Your Event (You'll Give)</div>
                        <div className="font-medium">{r.responderEventId?.title || 'N/A'}</div>
                        <div className="text-xs text-gray-600">
                          {r.responderEventId?.startTime ? new Date(r.responderEventId.startTime).toLocaleString() : 'N/A'}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      Requested: {new Date(r.createdAt).toLocaleString()}
                    </div>
                  </div>
                  {r.status === 'PENDING' && (
                    <div className="flex gap-2 flex-wrap">
                      <button 
                        className="px-4 py-2 border border-red-300 text-red-600 rounded hover:bg-red-50 disabled:opacity-50 w-full sm:w-auto" 
                        onClick={() => respond.mutate({ requestId: r._id, accepted: false })}
                        disabled={respond.isPending}
                      >
                        {respond.isPending ? 'Rejecting…' : 'Reject'}
                      </button>
                      <button 
                        className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 w-full sm:w-auto" 
                        onClick={() => respond.mutate({ requestId: r._id, accepted: true })}
                        disabled={respond.isPending}
                      >
                        {respond.isPending ? 'Accepting…' : 'Accept'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-medium mb-3">Outgoing Requests</h2>
        <div className="grid gap-3">
          {outgoing.length === 0 ? (
            <p className="text-sm text-gray-600 bg-white p-4 rounded shadow">No outgoing requests</p>
          ) : (
            outgoing.map((r) => (
              <div key={r._id} className="bg-white p-4 rounded shadow">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">To: {r.responderId?.name || 'Unknown'}</span>
                    {getStatusBadge(r.status)}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="border rounded p-2 bg-gray-50">
                      <div className="font-medium text-xs text-gray-600 mb-1">Your Event (You're Giving)</div>
                      <div className="font-medium">{r.requesterEventId?.title || 'N/A'}</div>
                      <div className="text-xs text-gray-600">
                        {r.requesterEventId?.startTime ? new Date(r.requesterEventId.startTime).toLocaleString() : 'N/A'}
                      </div>
                    </div>
                    <div className="border rounded p-2 bg-gray-50">
                      <div className="font-medium text-xs text-gray-600 mb-1">Their Event (You'll Receive)</div>
                      <div className="font-medium">{r.responderEventId?.title || 'N/A'}</div>
                      <div className="text-xs text-gray-600">
                        {r.responderEventId?.startTime ? new Date(r.responderEventId.startTime).toLocaleString() : 'N/A'}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    Requested: {new Date(r.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}


