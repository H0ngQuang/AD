import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import './ReaderTicketDetail.css';

const ReaderTicketDetail = () => {
  const { ticketCode } = useParams();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTicket();
  }, [ticketCode]);

  const fetchTicket = async () => {
    try {
      const response = await axios.get(`/api/tickets/${ticketCode}`);
      setTicket(response.data);
    } catch (error) {
      console.error('Error fetching ticket:', error);
      alert('Lỗi khi tải chi tiết phiếu mượn');
    } finally {
      setLoading(false);
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
    return <div className="error">Không tìm thấy phiếu mượn</div>;
  }

  return (
    <div className="ticket-detail-page">
      <div className="content-container">
        <button className="back-button" onClick={() => navigate('/reader/tickets')}>
          ← Quay lại
        </button>
        
        <h1>Chi tiết phiếu mượn</h1>

        <div className="ticket-info-card">
          <h2>Thông tin phiếu mượn</h2>
          <div className="info-item">
            <strong>Chi nhánh lấy sách:</strong> {ticket.branch_name}
          </div>
          <div className="info-item">
            <strong>Mã phiếu:</strong> {ticket.code}
          </div>
          <div className="info-item">
            <strong>Mã vạch:</strong> {ticket.barcode}
          </div>
          <div className="info-item">
            <strong>Ngày đặt:</strong> {formatDate(ticket.order_date)}
          </div>
          <div className="info-item">
            <strong>Ngày nhận dự kiến:</strong> {formatDate(ticket.expected_receive_date)}
          </div>
          <div className="info-item">
            <strong>Ngày trả dự kiến:</strong> {formatDate(ticket.expected_return_date)}
          </div>
        </div>

        <div className="books-card">
          <h2>Danh sách sách</h2>
          <table className="books-table">
            <thead>
              <tr>
                <th>Mã sách</th>
                <th>Tên sách</th>
                <th>Giá mượn/ngày</th>
                <th>Tổng tiền mượn</th>
              </tr>
            </thead>
            <tbody>
              {ticket.items?.map((item, index) => (
                <tr key={index}>
                  <td>{item.book_code}</td>
                  <td>{item.book_name}</td>
                  <td>{formatCurrency(item.price_per_day)}/ngày</td>
                  <td>{formatCurrency(item.total_price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="payment-card">
          <h2>Thông tin thanh toán</h2>
          <div className="payment-item">
            <span>Tổng giá mượn:</span>
            <span>{formatCurrency(ticket.total_rental_price)}</span>
          </div>
          <div className="payment-item">
            <span>Tiền cọc:</span>
            <span>{formatCurrency(ticket.deposit)}</span>
          </div>
          {ticket.discount > 0 && (
            <div className="payment-item">
              <span>Giảm giá:</span>
              <span>-{formatCurrency(ticket.discount)}</span>
            </div>
          )}
          <div className="payment-item final">
            <span>Tổng tiền:</span>
            <span className="final-amount">{formatCurrency(ticket.final_amount || (ticket.total_rental_price + ticket.deposit))}</span>
          </div>
        </div>

        <div className="barcode-card">
          <h2>Mã vạch và QR Code</h2>
          <div className="barcode-display">
            <div className="barcode-text">{ticket.barcode}</div>
            <div className="qr-code">
              <QRCodeSVG value={ticket.barcode} size={200} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReaderTicketDetail;

