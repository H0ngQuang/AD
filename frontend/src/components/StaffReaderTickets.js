import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import './StaffReaderTickets.css';

const StaffReaderTickets = () => {
  const { readerId } = useParams();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTickets();
  }, [readerId]);

  const fetchTickets = async () => {
    try {
      const response = await axios.get(`/api/staff/reader/${readerId}/tickets`);
      setTickets(response.data);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      alert('Lỗi khi tải danh sách phiếu mượn');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'received':
        return '#4caf50';
      case 'pending':
        return '#ff9800';
      default:
        return '#757575';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'received':
        return 'Đã nhận';
      case 'pending':
        return 'Chưa nhận';
      default:
        return status;
    }
  };

  const handleProcessTicket = (ticketId) => {
    navigate(`/staff/process-loan/${ticketId}`);
  };

  if (loading) {
    return <div className="loading">Đang tải...</div>;
  }

  return (
    <div className="reader-tickets-page">
      <div className="page-header">
        <button className="back-button" onClick={() => navigate('/staff/search-reader')}>
          ← Quay lại
        </button>
        <h1>Danh sách phiếu mượn</h1>
      </div>

      <div className="tickets-container">
        <table className="tickets-table">
          <thead>
            <tr>
              <th>Mã Phiếu</th>
              <th>Ngày đặt</th>
              <th>Ngày nhận (dự kiến)</th>
              <th>Danh sách sách</th>
              <th>Status</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket) => (
              <tr key={ticket.id}>
                <td>{ticket.code}</td>
                <td>{formatDate(ticket.order_date)}</td>
                <td>{formatDate(ticket.expected_receive_date)}</td>
                <td>{ticket.book_count} sách</td>
                <td>
                  <span 
                    className="status-badge"
                    style={{ color: getStatusColor(ticket.status) }}
                  >
                    {getStatusText(ticket.status)}
                  </span>
                </td>
                <td>
                  {ticket.status === 'pending' && (
                    <button
                      className="process-button"
                      onClick={() => handleProcessTicket(ticket.id)}
                    >
                      Xử lý
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StaffReaderTickets;

