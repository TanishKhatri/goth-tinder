import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Signup from './pages/auth/Signup';
import Login from './pages/auth/Login';
import Onboarding from './pages/onboarding/Onboarding';
import Discover from './pages/Discover';
import Matches from './pages/Matches';
import Chat from './pages/Chat';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen" aria-hidden="true" />;
  return user ? children : <Navigate to="/login" replace />;
};

const GuestRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen" aria-hidden="true" />;
  return user ? <Navigate to="/discover" replace /> : children;
};

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/signup" element={<GuestRoute><Signup /></GuestRoute>} />
      <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/discover" element={<Discover />} />
        <Route path="/matches" element={<Matches />} />
        <Route path="/matches/:matchId" element={<Chat />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/:userId" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;