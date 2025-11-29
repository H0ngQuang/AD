import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './StaffSearchReader.css';

const StaffSearchReader = () => {
  const [searchName, setSearchName] = useState('');
  const [readers, setReaders] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchName.trim()) return;

    setLoading(true);
    try {
      const response = await axios.get(`/api/readers/search?name=${encodeURIComponent(searchName)}`);
      setReaders(response.data);
    } catch (error) {
      console.error('Error searching readers:', error);
      alert('Lỗi khi tìm kiếm độc giả');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectReader = (readerId) => {
    navigate(`/staff/reader/${readerId}/tickets`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  return (
    <div className="search-reader-page">
      <div className="page-header">
        <button className="back-button" onClick={() => navigate('/staff')}>
          ← Quay lại
        </button>
        <h1>Tìm kiếm độc giả</h1>
      </div>

      <div className="search-container">
        <form onSubmit={handleSearch} className="search-form">
          <div className="form-group">
            <label>Tên độc giả:</label>
            <div className="search-input-group">
              <input
                type="text"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                placeholder="Nhập tên độc giả"
                className="search-input"
              />
              <button type="submit" className="search-button" disabled={loading}>
                {loading ? 'Đang tìm...' : 'Tìm kiếm'}
              </button>
            </div>
          </div>
        </form>

        {readers.length > 0 && (
          <div className="results-container">
            <h2>Kết quả tìm kiếm</h2>
            <table className="readers-table">
              <thead>
                <tr>
                  <th>Họ tên</th>
                  <th>Ngày sinh</th>
                  <th>CCCD</th>
                  <th>SĐT</th>
                  <th>Địa chỉ</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {readers.map((reader) => (
                  <tr key={reader.id}>
                    <td>{reader.full_name}</td>
                    <td>{formatDate(reader.birth_date)}</td>
                    <td>{reader.cccd}</td>
                    <td>{reader.phone}</td>
                    <td>{reader.address}</td>
                    <td>
                      <button
                        className="select-button"
                        onClick={() => handleSelectReader(reader.id)}
                      >
                        Chọn
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffSearchReader;

