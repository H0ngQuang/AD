import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import './Invoice.css';

const Invoice = () => {
  const { ticketId } = useParams();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTicket();
  }, [ticketId]);

  const fetchTicket = async () => {
    try {
      const response = await axios.get(`/api/staff/search-ticket/${ticketId}`);
      setTicket(response.data);
    } catch (error) {
      console.error('Error fetching ticket:', error);
      alert('Lỗi khi tải thông tin hóa đơn');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleBack = () => {
    // Navigate back to reader tickets list
    if (ticket?.reader_id) {
      navigate(`/staff/reader/${ticket.reader_id}/tickets`);
    } else {
      navigate('/staff');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN').format(amount) + '₫';
  };

  if (loading) {
    return <div className="loading">Đang tải...</div>;
  }

  if (!ticket) {
    return <div className="error">Không tìm thấy hóa đơn</div>;
  }

  return (
    <div className="invoice-page">
      <div className="invoice-container">
        <h1>Thông tin hóa đơn</h1>
        
        <div className="invoice-details">
          <div className="detail-row">
            <strong>Họ tên:</strong> {ticket.reader_name}
          </div>
          <div className="detail-row">
            <strong>SĐT:</strong> {ticket.reader_phone}
          </div>
          <div className="detail-row">
            <strong>Mã phiếu:</strong> {ticket.code}
          </div>
          <div className="detail-row">
            <strong>Ngày nhận:</strong> {formatDate(ticket.actual_receive_date || ticket.expected_receive_date)}
          </div>
        </div>

        <div className="divider"></div>

        <div className="payment-summary">
          <div className="payment-row">
            <span>Tổng tiền tạm tính:</span>
            <span>{formatCurrency(ticket.total_rental_price + ticket.deposit)}</span>
          </div>
          {ticket.discount > 0 && (
            <div className="payment-row">
              <span>Giảm giá từ Tích điểm:</span>
              <span>-{formatCurrency(ticket.discount)}</span>
            </div>
          )}
          <div className="payment-row final">
            <span>Tổng tiền thanh toán:</span>
            <span className="final-amount">{formatCurrency(ticket.final_amount || (ticket.total_rental_price + ticket.deposit - (ticket.discount || 0)))}</span>
          </div>
        </div>

        <div className="invoice-actions">
          <button className="print-button" onClick={handlePrint}>
            In
          </button>
          <button className="back-button" onClick={handleBack}>
            Quay lại
          </button>
        </div>
      </div>
    </div>
  );
};

export default Invoice;

