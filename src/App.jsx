import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';

// Fix axios baseURL for proxy
axios.defaults.baseURL = '/';

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      axios.get('/api/profile').then(res => {
        setUser(res.data);
      }).catch(() => {
        localStorage.removeItem('token');
      }).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
      setUser(res.data.user);
      return true;
    } catch {
      return false;
    }
  };

  const signup = async (fullName, email, password) => {
    try {
      await axios.post('/api/auth/signup', { fullName, email, password });
      return true;
    } catch {
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
    <div className="w-16 h-16 border-4 border-purple-400/30 border-t-purple-500 rounded-full animate-spin" />
  </div>
);

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/profile" replace />;
  return children;
};

// Navbar
const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  if (!user) return null;
  return (
    <nav className="glass fixed top-0 left-0 right-0 z-50 shadow-2xl px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-xl">
            <span className="text-xl font-bold text-white">PM</span>
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">
            Purple Merit Technologies
          </h1>
        </div>
        <div className="flex items-center space-x-4">
          <span className="glass px-4 py-2 rounded-xl text-white text-sm font-semibold">
            {user.fullName} <span className="bg-yellow-500 text-xs px-2 py-1 rounded-full ml-2">{user.role}</span>
          </span>
          <button onClick={logout} className="glass px-6 py-2 rounded-xl hover:bg-white/20 font-semibold">Logout</button>
        </div>
      </div>
    </nav>
  );
};

// Input Component
const Input = ({ label, error, type = "text", ...props }) => (
  <div className="space-y-2">
    {label && <label className="block text-sm font-semibold text-white/90">{label}</label>}
    <input 
      className={`w-full glass p-4 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${error ? 'ring-2 ring-red-500/50' : ''}`}
      type={type}
      {...props}
    />
    {error && <p className="text-sm text-red-400">{error}</p>}
  </div>
);

// Login Page
const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const success = await login(form.email, form.password);
    setLoading(false);
    if (success) {
      navigate('/dashboard');
    } else {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 pt-32 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-md w-full glass shadow-2xl rounded-3xl p-10">
        <h2 className="text-4xl font-bold text-center mb-8 bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">Login</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Email"
            type="email"
            placeholder="john@example.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <Input
            label="Password"
            type="password"
            placeholder="Password123"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          {error && <p className="text-red-400 text-center">{error}</p>}
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-4 px-8 rounded-2xl font-bold shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all disabled:opacity-50"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
        <div className="text-center mt-8">
          <button 
            onClick={() => navigate('/signup')}
            className="w-full glass p-3 rounded-xl hover:bg-white/20 transition-all text-white font-medium"
          >
            Create Account
          </button>
        </div>
      </div>
    </div>
  );
};

// Signup Page - SIMPLIFIED WORKING VERSION
const Signup = () => {
  const [form, setForm] = useState({ fullName: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signup } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Signup form:', form); // DEBUG
    setLoading(true);
    setError('');
    
    const success = await signup(form.fullName, form.email, form.password);
    setLoading(false);
    
    if (success) {
      alert('✅ Account created! You can now login.');
      navigate('/login');
    } else {
      setError('Signup failed. Try different email.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 pt-32 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-md w-full glass shadow-2xl rounded-3xl p-10">
        <h2 className="text-4xl font-bold text-center mb-8 bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">Create Account</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Full Name"
            placeholder="John Doe"
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          />
          <Input
            label="Email"
            type="email"
            placeholder="john@example.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <Input
            label="Password"
            type="password"
            placeholder="Password123"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          {error && <p className="text-red-400 text-center">{error}</p>}
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-4 px-8 rounded-2xl font-bold shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
        <div className="text-center mt-8">
          <button 
            onClick={() => navigate('/login')}
            className="w-full glass p-3 rounded-xl hover:bg-white/20 transition-all text-white font-medium"
          >
            Already have account? Sign In
          </button>
        </div>
      </div>
    </div>
  );
};

// Dashboard (simple)
const Dashboard = () => {
  return (
    <div className="p-8 pt-32 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold text-center mb-12 bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">
          Admin Dashboard
        </h1>
        <div className="glass p-8 rounded-3xl text-white text-center">
          <h2 className="text-2xl mb-4">✅ Setup Complete!</h2>
          <p>Create users via signup → They'll appear here</p>
        </div>
      </div>
    </div>
  );
};

const Profile = () => (
  <div className="p-8 pt-32 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 min-h-screen">
    <div className="max-w-2xl mx-auto glass p-10 rounded-3xl text-white text-center">
      <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">
        Profile
      </h1>
      <p>Profile management coming soon!</p>
    </div>
  </div>
);

const AppContent = () => (
  <Router>
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <AuthProvider>
        <Navbar />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<ProtectedRoute adminOnly>{<Dashboard />}</ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute>{<Profile />}</ProtectedRoute>} />
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </div>
  </Router>
);

const App = () => <AppContent />;

export default App;
