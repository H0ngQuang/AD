# Hệ thống Quản lý Mượn Sách Thư viện

Hệ thống quản lý mượn sách cho phép độc giả đặt mượn sách và nhân viên thư viện xử lý các phiếu mượn.

## Tính năng

### Dành cho Độc giả:

- Đăng nhập vào hệ thống

- Xem danh sách các phiếu mượn (sắp xếp từ mới đến cũ)

- Xem chi tiết phiếu mượn bao gồm:

  - Thông tin chi nhánh lấy sách

  - Danh sách sách kèm giá mượn

  - Tổng giá mượn và tiền cọc

  - Mã vạch để nhận sách (hiển thị dạng mã vạch và QR code)

### Dành cho Nhân viên:

- Tìm kiếm phiếu mượn theo mã phiếu hoặc mã vạch

- Xem chi tiết đầy đủ phiếu mượn:

  - Thông tin độc giả

  - Danh sách sách với số lượng đặt và số lượng nhận

  - Kiểm tra tồn kho

  - Thông tin thanh toán

- Xác nhận mượn sách:

  - Cập nhật số lượng nhận

  - Cập nhật tồn kho

  - Chuyển trạng thái phiếu sang "Đang mượn"

- Hủy phiếu đặt

## Công nghệ sử dụng

### Backend:

- Node.js

- Express.js

- SQLite (Database)

- JWT (Authentication)

- bcryptjs (Password hashing)

### Frontend:

- React

- React Router

- Axios (HTTP client)

- QRCode React (Hiển thị QR code)

## Cài đặt

### Yêu cầu:

- Node.js (v14 trở lên)

- npm hoặc yarn

### Các bước cài đặt:

1. **Cài đặt dependencies cho backend:**

```bash

npm install

```

2. **Cài đặt dependencies cho frontend:**

```bash

cd frontend

npm install

cd ..

```

Hoặc chạy lệnh cài đặt tất cả:

```bash

npm run install-all

```

## Chạy ứng dụng

### Chế độ Development:

1. **Chạy Backend Server:**

```bash

npm start

```

Server sẽ chạy tại: http://localhost:3001

2. **Chạy Frontend (terminal mới):**

```bash

cd frontend

npm start

```

Frontend sẽ chạy tại: http://localhost:3000

### Chế độ Production:

1. **Build frontend:**

```bash

npm run build

```

2. **Chạy server:**

```bash

NODE_ENV=production npm start

```

## Tài khoản mẫu

Sau khi khởi động lần đầu, hệ thống sẽ tự động tạo dữ liệu mẫu:

### Độc giả:

- **Username:** reader1

- **Password:** password123

- **Tên:** Hồng Quang

- **SĐT:** 03456

- **Địa chỉ:** Hà Nội

- **CCCD:** 12345

- **Ngày sinh:** 02/08/2004

### Nhân viên:

- **Username:** b

- **Password:** 1

- **Tên:** Trần Thị Hồng

- **SĐT:** 035648

- **Địa chỉ:** Dương Nội, Hà Đông

- **CCCD:** 24512

## Dữ liệu mẫu

Hệ thống tự động tạo:

- 1 chi nhánh: "Chi nhánh Mỹ Đình – Thư viện Cơ sở 2"

- 4 cuốn sách:

  - S001: Lập Trình Java Cơ Bản (5.000đ/ngày)

  - S036: Cấu Trúc Dữ Liệu & Giải Thuật (6.000đ/ngày)

  - S096: Thiết Kế Hệ Thống – System Design (8.000đ/ngày)

  - S666: Cơ sở dữ liệu (7.000đ/ngày)

- 3 phiếu mượn mẫu:

  - PM01: Trạng thái "Đã nhận" (2 sách)

  - PM36: Trạng thái "Chưa nhận" (4 sách) - có thể áp dụng tích điểm TD1

  - PM99: Trạng thái "Chưa nhận" (5 sách)

- Gói tích điểm:

  - TD1: Gói tích điểm 1 (300 điểm, giảm tối đa 20.000đ)

  - TD2: Gói tích điểm 2 (50 điểm, giảm tối đa 30.000đ)

- Độc giả Hồng Quang có 350 điểm tích lũy (đủ để dùng TD1)

## Cấu trúc dự án

```

AD2/

├── backend/

│   ├── database.js          # Khởi tạo database và dữ liệu mẫu

│   ├── middleware/

│   │   └── auth.js          # JWT authentication middleware

│   └── routes/

│       ├── auth.js          # Route đăng nhập

│       ├── tickets.js       # Route quản lý phiếu mượn (độc giả)

│       ├── books.js         # Route quản lý sách

│       ├── readers.js       # Route tìm kiếm độc giả

│       └── staff.js         # Route xử lý mượn sách (nhân viên)

├── frontend/

│   ├── public/

│   │   └── index.html

│   └── src/

│       ├── components/

│       │   ├── Login.js              # Màn hình đăng nhập

│       │   ├── ReaderTicketList.js   # Danh sách phiếu mượn

│       │   ├── ReaderTicketDetail.js # Chi tiết phiếu mượn (độc giả)

│       │   ├── StaffHomepage.js      # Trang chủ nhân viên

│       │   ├── StaffSearchReader.js  # Tìm kiếm độc giả

│       │   ├── StaffReaderTickets.js # Danh sách phiếu mượn của độc giả

│       │   ├── StaffProcessLoan.js   # Xử lý mượn sách (nhân viên)

│       │   ├── StaffLoyaltyPackages.js # Chọn gói tích điểm

│       │   ├── Invoice.js            # Hóa đơn

│       │   └── Navbar.js             # Thanh điều hướng

│       ├── context/

│       │   └── AuthContext.js        # Context quản lý authentication

│       ├── App.js

│       ├── index.js

│       └── index.css

├── server.js                 # Entry point của backend

├── package.json

└── README.md

```

## API Endpoints

### Authentication:

- `POST /api/auth/login` - Đăng nhập

### Tickets (Độc giả):

- `GET /api/tickets/my-tickets` - Lấy danh sách phiếu mượn của độc giả

- `GET /api/tickets/:ticketCode` - Lấy chi tiết phiếu mượn

### Staff:

- `GET /api/staff/search-ticket/:ticketCode` - Tìm kiếm phiếu mượn (theo mã phiếu hoặc mã vạch)

- `GET /api/staff/reader/:readerId/tickets` - Lấy danh sách phiếu mượn của độc giả

- `GET /api/staff/loyalty-packages` - Lấy danh sách gói tích điểm

- `POST /api/staff/apply-loyalty/:ticketId` - Áp dụng gói tích điểm

- `POST /api/staff/confirm-loan/:ticketId` - Xác nhận mượn sách

- `POST /api/staff/cancel-ticket/:ticketId` - Hủy phiếu đặt

### Books:

- `GET /api/books` - Lấy danh sách sách

- `GET /api/books/availability/:bookId` - Kiểm tra tồn kho

### Readers:

- `GET /api/readers/search?name=...` - Tìm kiếm độc giả theo tên

## Quy trình sử dụng

### 1. Độc giả xem phiếu mượn:

1. Đăng nhập với tài khoản độc giả

2. Chọn mục "Phiếu mượn"

3. Xem danh sách các phiếu mượn

4. Chọn một phiếu để xem chi tiết

5. Lấy mã vạch/QR code để nhận sách

### 2. Nhân viên xử lý mượn sách:

1. Đăng nhập với tài khoản nhân viên (username: b, password: 1)

2. Chọn chức năng "Xử lý mượn sách đã đặt trước"

3. Tìm kiếm độc giả theo tên (ví dụ: "Quang")

4. Chọn độc giả từ danh sách kết quả

5. Xem danh sách phiếu mượn của độc giả

6. Chọn phiếu mượn cần xử lý (trạng thái "Chưa nhận")

7. Xem chi tiết phiếu và thông tin thanh toán

8. (Tùy chọn) Áp dụng tích điểm nếu độc giả có đủ điểm

9. Xác nhận mượn sách

10. In hóa đơn/phiếu mượn

## Lưu ý

- Database được lưu trong file `database.sqlite` (tự động tạo khi chạy lần đầu)

- JWT Secret mặc định là "your-secret-key-change-in-production" - nên thay đổi trong môi trường production

- Tất cả mật khẩu mặc định là "password123" - nên thay đổi trong môi trường production

## License

ISC

