# BAO CAO HE THONG WEB DONG CLASSICMODELS

## 1. Tong quan

- Ten he thong: ClassicModels Analytics App.
- Muc tieu: Xay dung web dong thong ke, bao cao va tim kiem du lieu tu CSDL MySQL `classicmodels`.
- Cong nghe chinh:
  - Frontend: HTML, CSS, JavaScript.
  - Backend: Node.js, Express.
  - Database: MySQL.
  - ORM: Sequelize.
  - API: RESTful, version `/api/v1`.

[Chen anh 1: Tong quan he thong tai day]

## 2. Kien truc he thong

- Tang giao dien (client): hien thi dashboard, bao cao, tim kiem, chatbot.
- Tang API (server): tiep nhan request, xu ly nghiep vu va tra JSON.
- Tang du lieu (database): luu tru orders, customers, products, orderdetails.
- Mo hinh to chuc backend:
  - `src/models`: dinh nghia model va quan he.
  - `src/services`: xu ly logic thong ke/bao cao/tim kiem.
  - `src/controllers`: dieu phoi request-response.
  - `src/routes`: khai bao RESTful API.

[Chen anh 2: So do kien truc 3 tang]

## 3. Cac chuc nang chinh

### 3.1 Dashboard thong ke

- Hien thi KPI tong quan:
  - Tong doanh thu
  - Tong so don hang
  - Tong so khach hang
  - Tong so luong mat hang ban
- Bieu do doanh thu theo thoi gian:
  - Theo ngay
  - Theo thang
- Loc du lieu theo khoang thoi gian (`from`, `to`).

[Chen anh 3: Man hinh Dashboard]

### 3.2 Bao cao top khach hang

- Liet ke top khach hang theo doanh thu.
- Co bo loc tu khoa ten khach hang.
- Co gioi han so ban ghi (limit).

[Chen anh 4: Bao cao top khach hang]

### 3.3 Bao cao top san pham

- Liet ke top mat hang theo doanh thu va so luong.
- Loc theo ten mat hang/nhom mat hang.
- Ho tro gioi han ket qua.

[Chen anh 5: Bao cao top san pham]

### 3.4 Pivot report

- Tao bao cao dong/cot dong:
  - Chieu dong: customer, productLine, country, status, month
  - Chieu cot: customer, productLine, country, status, month
- Chon metric:
  - revenue
  - qty
- Giup so sanh du lieu da chieu nhanh.

[Chen anh 6: Man hinh Pivot report]

### 3.5 Tim kiem chi tiet don hang

- Tim theo:
  - Khoang thoi gian
  - Khach hang
  - Mat hang/ma hang
- Ket qua hien thi chi tiet:
  - Ngay don
  - So don
  - Trang thai
  - Khach hang
  - Ma/Ten/Nhom mat hang
  - So luong, gia, doanh thu dong

[Chen anh 7: Man hinh Tim kiem don hang]

### 3.6 Chatbot ho tro

- Hoi dap nhanh cac cau hoi thong dung:
  - Tong quan doanh thu/KPI
  - Top khach hang
  - Top mat hang
- Ho tro nguoi dung tra cuu nhanh khong can thao tac nhieu.

[Chen anh 8: Man hinh Chatbot]

## 4. Giao dien theo menu

He thong duoc chia theo menu nghiep vu ro rang:

- Dashboard
- Bao cao
- Tim kiem
- Chatbot

Muc tieu: de su dung, de dao tao, de mo rong.

[Chen anh 9: Thanh menu dieu huong]

## 5. Danh sach RESTful API

Base URL: `/api/v1`

- `GET /analytics/summary`
- `GET /analytics/sales?groupBy=day|month&from=YYYY-MM-DD&to=YYYY-MM-DD`
- `GET /customers/top?limit=15&q=keyword&from=YYYY-MM-DD&to=YYYY-MM-DD`
- `GET /products/top?limit=15&q=keyword&from=YYYY-MM-DD&to=YYYY-MM-DD`
- `GET /reports/pivot?rows=customer&cols=productLine&metric=revenue&from=YYYY-MM-DD&to=YYYY-MM-DD`
- `GET /orders?customer=...&product=...&limit=200&from=YYYY-MM-DD&to=YYYY-MM-DD`

[Chen anh 10: Ket qua goi API mau]

## 6. Uu diem

- Web dong lay du lieu truc tiep tu CSDL.
- Bao cao da dang (KPI, chart, top, pivot, search).
- Kien truc tach lop ro rang, de bao tri va mo rong.
- Su dung ORM (Sequelize) han che SQL hard-code phan model.
- API RESTful version hoa de nang cap de dang.

## 7. Han che hien tai

- Chua co dang nhap/phan quyen.
- Chua co xuat file Excel/PDF.
- Chatbot hien tai dang o muc hoi dap nhanh theo logic co san.

## 8. Huong mo rong

- Bo sung authentication/authorization (JWT, role).
- Them chuc nang export bao cao (Excel/PDF).
- Toi uu hieu nang truy van va bo nho dem.
- Nang cap chatbot ket noi AI model.
- Them dashboard real-time bang WebSocket.

## 9. Ket luan

He thong da dap ung yeu cau xay dung web dong cho CSDL classicmodels voi day du chuc nang thong ke, bao cao, tim kiem va giao dien menu ro rang. Kien truc hien tai phu hop cho demo, do an, va co kha nang phat trien thanh san pham thuc te.

[Chen anh 11: Tong ket he thong]
