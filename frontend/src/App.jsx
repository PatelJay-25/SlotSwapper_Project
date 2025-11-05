import { Outlet, Link } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';

export default function App() {
  const { token, logout } = useAuth();
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 backdrop-blur bg-white/75 border-b">
        <div className="container-page flex items-center justify-between py-3">
          <Link to="/" className="text-xl font-bold tracking-tight text-indigo-600">SlotSwapper</Link>
          <nav className="flex items-center gap-2">
            {token ? (
              <>
                <Link to="/dashboard" className="btn btn-secondary">Dashboard</Link>
                <Link to="/marketplace" className="btn btn-secondary">Marketplace</Link>
                <Link to="/requests" className="btn btn-secondary">Requests</Link>
                <button onClick={() => { logout(); window.location.href = '/login'; }} className="btn btn-outline">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-secondary">Login</Link>
                <Link to="/signup" className="btn btn-primary">Sign Up</Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="container-page">
        <Outlet />
      </main>
    </div>
  );
}


