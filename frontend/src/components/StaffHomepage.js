import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './StaffHomepage.css';

const StaffHomepage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="staff-homepage">
      <div className="content-container">
        <h1>Trang chủ nhân viên</h1>
        
        <div className="info-card">
          <h2>Thông tin nhân viên</h2>
          <div className="info-item">
            <strong>Họ tên:</strong> {user?.fullName}
          </div>
          <div className="info-item">
            <strong>SĐT:</strong> {user?.phone}
          </div>
          <div className="info-item">
            <strong>Địa chỉ:</strong> {user?.address}
          </div>
          <div className="info-item">
            <strong>CCCD:</strong> {user?.cccd}
          </div>
        </div>

        <div className="functions-card">
          <h2>Chức năng</h2>
          <button 
            className="function-button primary"
            onClick={() => navigate('/staff/search-reader')}
          >
            Xử lý mượn sách đã đặt trước
          </button>
          <button className="function-button secondary">
            Trả sách
          </button>
          <button className="function-button secondary">
            Quản lý sách
          </button>
        </div>
      </div>
    </div>
  );
};

export default StaffHomepage;

