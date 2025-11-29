import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import './StaffProcessLoan.css';

const StaffProcessLoan = () => {
  const { ticketId } = useParams();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
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
      alert('Lỗi khi tải thông tin phiếu mượn');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyLoyalty = () => {
    navigate(`/staff/loyalty-packages/${ticketId}`);
  };

  const handleConfirm = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirmLoan = async () => {
    setConfirming(true);
    try {
      const response = await axios.post(`/api/staff/confirm-loan/${ticketId}`);
      if (response.data.message) {
        navigate(`/staff/invoice/${ticketId}`);
      }
    } catch (error) {
      console.error('Error confirming loan:', error);
      alert('Lỗi khi xác nhận mượn sách');
    } finally {
      setConfirming(false);
      setShowConfirmDialog(false);
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
    <div className="process-loan-page">
      <div className="page-header">
        <button className="back-button" onClick={() => navigate(-1)}>
          ← Quay lại
        </button>
        <h1>Xử lý mượn sách</h1>
      </div>

      <div className="loan-details-card">
        <h2>Xử lý mượn sách</h2>
        <div className="detail-item">
          <strong>Chi nhánh lấy sách:</strong> {ticket.branch_name}
        </div>
        <div className="detail-item">
          <strong>Mã phiếu:</strong> {ticket.code}
        </div>
        <div className="detail-item">
          <strong>Mã vạch:</strong> {ticket.barcode}
        </div>
        <div className="detail-item">
          <strong>Ngày đặt:</strong> {formatDate(ticket.order_date)}
        </div>
        <div className="detail-item">
          <strong>Ngày nhận dự kiến:</strong> {formatDate(ticket.expected_receive_date)}
        </div>
        <div className="detail-item">
          <strong>Ngày trả dự kiến:</strong> {formatDate(ticket.expected_return_date)}
        </div>

        <div className="books-section">
          <h3>Danh sách sách</h3>
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
      </div>

      <div className="payment-card">
        <h2>Thông tin thanh toán</h2>
        <div className="payment-item">
          <span>Tổng giá mượn:</span>
          <span>{formatCurrency(ticket.total_rental_price)}</span>
        </div>
        <div className="payment-item">
          <span>Tiền cọc (Mỗi sách 50.000 đồng):</span>
          <span>{formatCurrency(ticket.deposit)}</span>
        </div>
        <div className="payment-item">
          <span>Tổng số tiền tạm tính:</span>
          <span>{formatCurrency(ticket.total_rental_price + ticket.deposit)}</span>
        </div>
        <div className="payment-item">
          <span>Giảm giá {ticket.loyalty_package_code ? 'từ tích điểm' : '/ Khuyến mãi'}:</span>
          <span>{formatCurrency(ticket.discount || 0)}</span>
        </div>
        <div className="payment-item final">
          <span>Tổng tiền phải thu:</span>
          <span className="final-amount">{formatCurrency(ticket.final_amount || (ticket.total_rental_price + ticket.deposit))}</span>
        </div>
      </div>

      <div className="action-buttons">
        <button className="apply-loyalty-button" onClick={handleApplyLoyalty}>
          Áp dụng TĐ
        </button>
        <button className="confirm-button" onClick={handleConfirm} disabled={confirming}>
          Xác nhận
        </button>
        <button className="back-button-action" onClick={() => navigate(-1)}>
          Quay lại
        </button>
      </div>

      {showConfirmDialog && (
        <div className="confirm-dialog-overlay">
          <div className="confirm-dialog">
            <h2>Xác nhận lần cuối</h2>
            <p>Bạn có chắc chắn muốn xác nhận mượn sách này?</p>
            <div className="dialog-buttons">
              <button className="confirm-dialog-button" onClick={handleConfirmLoan} disabled={confirming}>
                Xác nhận
              </button>
              <button className="cancel-dialog-button" onClick={() => setShowConfirmDialog(false)}>
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffProcessLoan;

