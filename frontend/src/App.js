import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from './components/ui/sonner';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import PollDetails from './pages/PollDetails';
import MyPolls from './pages/MyPolls';
import Profile from './pages/Profile';
import Wallet from './pages/Wallet';
import PaymentSuccess from './pages/PaymentSuccess';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminPolls from './pages/admin/AdminPolls';
import AdminKYC from './pages/admin/AdminKYC';
import AdminUsers from './pages/admin/AdminUsers';
import AdminTransactions from './pages/admin/AdminTransactions';
import AdminSettings from './pages/admin/AdminSettings';
import { isAuthenticated, isAdmin } from './auth';
import '@/App.css';

const PrivateRoute = ({ children }) => {
  return isAuthenticated() ? children : <Navigate to="/login" />;
};

const AdminRoute = ({ children }) => {
  return isAuthenticated() && isAdmin() ? children : <Navigate to="/admin/login" />;
};

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/poll/:pollId" element={<PrivateRoute><PollDetails /></PrivateRoute>} />
          <Route path="/my-polls" element={<PrivateRoute><MyPolls /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/wallet" element={<PrivateRoute><Wallet /></PrivateRoute>} />
          <Route path="/payment-success" element={<PrivateRoute><PaymentSuccess /></PrivateRoute>} />
          
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/polls" element={<AdminRoute><AdminPolls /></AdminRoute>} />
          <Route path="/admin/kyc" element={<AdminRoute><AdminKYC /></AdminRoute>} />
          <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
          <Route path="/admin/transactions" element={<AdminRoute><AdminTransactions /></AdminRoute>} />
          <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
        </Routes>
        <Toaster position="top-right" />
      </div>
    </BrowserRouter>
  );
}

export default App;
