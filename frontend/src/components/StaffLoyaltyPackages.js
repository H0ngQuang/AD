import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import './StaffLoyaltyPackages.css';

const StaffLoyaltyPackages = () => {
  const { ticketId } = useParams();
  const [packages, setPackages] = useState([]);
  const [readerPoints, setReaderPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, [ticketId]);

  const fetchData = async () => {
    try {
      const [packagesRes, ticketRes] = await Promise.all([
        axios.get('/api/staff/loyalty-packages'),
        axios.get(`/api/staff/search-ticket/${ticketId}`)
      ]);
      
      setPackages(packagesRes.data);
      setReaderPoints(ticketRes.data.reader_points || 0);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Lỗi khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPackage = async (packageCode) => {
    try {
      await axios.post(`/api/staff/apply-loyalty/${ticketId}`, { packageCode });
      navigate(`/staff/process-loan/${ticketId}`);
    } catch (error) {
      console.error('Error applying loyalty package:', error);
      alert(error.response?.data?.error || 'Lỗi khi áp dụng gói tích điểm');
    }
  };

  const isPackageAvailable = (requiredPoints) => {
    return readerPoints >= requiredPoints;
  };

  if (loading) {
    return <div className="loading">Đang tải...</div>;
  }

  return (
    <div className="loyalty-packages-page">
      <div className="packages-container">
        <h2>Điểm tích lũy</h2>
        <div className="points-display">
          Điểm hiện có: {readerPoints} điểm
        </div>

        <div className="packages-table-container">
          <table className="packages-table">
            <thead>
              <tr>
                <th>Mã</th>
                <th>Tên</th>
                <th>Điểm yêu cầu</th>
                <th>Tối đa</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {packages.map((pkg) => {
                const available = isPackageAvailable(pkg.required_points);
                return (
                  <tr 
                    key={pkg.id} 
                    className={available ? 'available' : 'unavailable'}
                  >
                    <td>{pkg.code}</td>
                    <td>{pkg.name}</td>
                    <td>{pkg.required_points} điểm</td>
                    <td>{new Intl.NumberFormat('vi-VN').format(pkg.max_discount)}₫</td>
                    <td>
                      <button
                        className={`select-package-button ${available ? 'available' : 'unavailable'}`}
                        onClick={() => available && handleSelectPackage(pkg.code)}
                        disabled={!available}
                      >
                        Chọn
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="action-buttons">
          <button className="cancel-button" onClick={() => navigate(`/staff/process-loan/${ticketId}`)}>
            Hủy
          </button>
        </div>
      </div>
    </div>
  );
};

export default StaffLoyaltyPackages;

