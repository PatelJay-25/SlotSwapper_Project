import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import api from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Link, useNavigate } from 'react-router-dom';

export default function SignupPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [errors, setErrors] = useState({});
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const mutation = useMutation({
    mutationFn: async () => {
      // Client-side validation for nicer UX (server enforces as well)
      const nextErrors = {};
      if (!/^([A-Za-z\s]+)$/.test(name.trim())) {
        nextErrors.name = 'Name must contain only letters and spaces';
      }
      if (typeof password !== 'string') {
        nextErrors.password = 'Password must be a string';
      }
      setErrors(nextErrors);
      if (Object.keys(nextErrors).length > 0) return Promise.reject({ response: { data: { error: 'Fix validation errors' } } });

      const { data } = await api.post('/auth/signup', { name, email, password });
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
        <h1 className="text-2xl font-semibold mb-4">Create your account</h1>
        <form
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
        className="space-y-4"
      >
        <div>
          <label className="label">Name</label>
          <input className="input" placeholder="Jane Doe" value={name} onChange={(e) => setName(e.target.value)} />
          {errors.name && <p className="text-rose-600 text-xs mt-1">{errors.name}</p>}
        </div>
        <div>
          <label className="label">Email</label>
          <input className="input" placeholder="you@example.com" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="label">Password</label>
          <input className="input" placeholder="••••••••" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          {errors.password && <p className="text-rose-600 text-xs mt-1">{errors.password}</p>}
        </div>
        {mutation.isError && <p className="text-rose-600 text-sm">{mutation.error?.response?.data?.error || 'Signup failed'}</p>}
        <button className="btn btn-primary w-full" disabled={mutation.isPending}>{mutation.isPending ? 'Creating…' : 'Create Account'}</button>
        </form>
        <p className="text-sm mt-4 text-center">Have an account? <Link className="text-indigo-600" to="/login">Login</Link></p>
        </div>
      </div>
    </div>
  );
}


