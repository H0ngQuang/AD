import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import Navbar from './components/Navbar';
import ReaderTicketList from './components/ReaderTicketList';
import ReaderTicketDetail from './components/ReaderTicketDetail';
import StaffHomepage from './components/StaffHomepage';
import StaffSearchReader from './components/StaffSearchReader';
import StaffReaderTickets from './components/StaffReaderTickets';
import StaffProcessLoan from './components/StaffProcessLoan';
import StaffLoyaltyPackages from './components/StaffLoyaltyPackages';
import Invoice from './components/Invoice';

const PrivateRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Đang tải...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" />;
  }

  return children;
};

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to={user.role === 'staff' ? '/staff' : '/reader/tickets'} />} />
      
      <Route path="/reader/tickets" element={
        <PrivateRoute allowedRoles={['reader']}>
          <Navbar />
          <ReaderTicketList />
        </PrivateRoute>
      } />
      
      <Route path="/reader/tickets/:ticketCode" element={
        <PrivateRoute allowedRoles={['reader']}>
          <Navbar />
          <ReaderTicketDetail />
        </PrivateRoute>
      } />
      
      <Route path="/staff" element={
        <PrivateRoute allowedRoles={['staff']}>
          <Navbar />
          <StaffHomepage />
        </PrivateRoute>
      } />
      
      <Route path="/staff/search-reader" element={
        <PrivateRoute allowedRoles={['staff']}>
          <Navbar />
          <StaffSearchReader />
        </PrivateRoute>
      } />
      
      <Route path="/staff/reader/:readerId/tickets" element={
        <PrivateRoute allowedRoles={['staff']}>
          <Navbar />
          <StaffReaderTickets />
        </PrivateRoute>
      } />
      
      <Route path="/staff/process-loan/:ticketId" element={
        <PrivateRoute allowedRoles={['staff']}>
          <Navbar />
          <StaffProcessLoan />
        </PrivateRoute>
      } />
      
      <Route path="/staff/loyalty-packages/:ticketId" element={
        <PrivateRoute allowedRoles={['staff']}>
          <Navbar />
          <StaffLoyaltyPackages />
        </PrivateRoute>
      } />
      
      <Route path="/staff/invoice/:ticketId" element={
        <PrivateRoute allowedRoles={['staff']}>
          <Navbar />
          <Invoice />
        </PrivateRoute>
      } />
      
      <Route path="/" element={<Navigate to={user ? (user.role === 'staff' ? '/staff' : '/reader/tickets') : '/login'} />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;

