import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleHome = () => {
    if (user.role === 'staff') {
      navigate('/staff');
    } else {
      navigate('/reader/tickets');
    }
  };

  return (
    <div className="navbar">
      <div className="navbar-left">
        <span>Hệ thống Mượn Sách Thư viện</span>
      </div>
      <div className="navbar-right">
        <span>Xin chào, {user?.fullName}</span>
        <span className="navbar-link" onClick={handleHome}>Trang chủ</span>
        <button className="navbar-logout" onClick={handleLogout}>Đăng xuất</button>
      </div>
    </div>
  );
};

export default Navbar;

