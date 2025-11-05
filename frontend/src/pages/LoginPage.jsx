import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import api from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Link, useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const mutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/auth/login', { email, password });
      return data;
    },
    onSuccess: (data) => {
      login(data.token, data.user);
      navigate('/dashboard');
    }
  });

  return (
    <div className="min-h-[calc(100vh-120px)] flex items-center justify-center py-10">
      <div className="max-w-md w-full card">
        <div className="card-body">
        <h1 className="text-2xl font-semibold mb-4">Welcome back</h1>
        <form
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
        className="space-y-4"
      >
        <div>
          <label className="label">Email</label>
          <input className="input" placeholder="you@example.com" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="label">Password</label>
          <input className="input" placeholder="••••••••" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {mutation.isError && <p className="text-rose-600 text-sm">{mutation.error?.response?.data?.error || 'Login failed'}</p>}
        <button className="btn btn-primary w-full" disabled={mutation.isPending}>{mutation.isPending ? 'Signing in…' : 'Login'}</button>
        </form>
        <p className="text-sm mt-4 text-center">No account? <Link className="text-indigo-600" to="/signup">Create one</Link></p>
        </div>
      </div>
    </div>
  );
}


