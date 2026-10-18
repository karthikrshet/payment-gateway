import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Sidebar from './components/dashboard/Sidebar';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import PaymentsPage from './pages/PaymentsPage';
import PaymentDetailPage from './pages/PaymentDetailPage';
import WebhooksPage from './pages/WebhooksPage';
import APIKeysPage from './pages/APIKeysPage';
import { Spinner } from './components/dashboard/UIComponents';
import './styles/index.css';

import LandingPage from './pages/LandingPage';



function ProtectedLayout() {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  return (
    <div className="flex min-h-screen">
      <Sidebar />
     <main className="flex-1 lg:ml-64 min-h-screen overflow-y-auto pt-14 lg:pt-0 pb-16 lg:pb-0">
        <Outlet />
      </main>
    </div>
  );
}

function GuestOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><Spinner size="lg" /></div>;
  if (user) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
       <Routes>
  <Route path="/landing" element={<LandingPage />} />
  <Route path="/login" element={<GuestOnly><AuthPage /></GuestOnly>} />
  <Route element={<ProtectedLayout />}>
    <Route path="/" element={<DashboardPage />} />
    <Route path="/payments" element={<PaymentsPage />} />
    <Route path="/payments/:id" element={<PaymentDetailPage />} />
    <Route path="/webhooks" element={<WebhooksPage />} />
    <Route path="/api-keys" element={<APIKeysPage />} />
  </Route>
  <Route path="*" element={<Navigate to="/" replace />} />
</Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
