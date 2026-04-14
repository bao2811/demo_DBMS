# ClassicModels Analytics App

Ung dung thong ke, bao cao, tim kiem du lieu cho CSDL `classicmodels`.

Backend su dung Node.js + Express + Sequelize ORM (MySQL).
Frontend chia theo menu nghiep vu de de su dung va quan ly.

## 1) Tinh nang chinh

- Dashboard KPI:
  - Tong doanh thu
  - Tong so don hang
  - Tong so khach hang
  - Tong so luong mat hang ban
- Bieu do doanh thu theo thoi gian (ngay/thang)
- Bao cao top khach hang theo doanh thu
- Bao cao top san pham theo doanh thu/so luong
- Pivot report (dong/cot/metric tuy chon)
- Tim kiem chi tiet don hang theo:
  - khoang thoi gian
  - ten khach hang
  - ten ma mat hang
- Chatbot ho tro hoi dap nhanh du lieu tong quan

## 2) Giao dien menu

App duoc chia theo cac menu ro rang:

- `Dashboard`: KPI + chart doanh thu
- `Bao cao`: Top khach hang, top san pham, pivot
- `Tim kiem`: Tra cuu chi tiet don hang
- `Chatbot`: Tro ly hoi dap du lieu

## 3) Kien truc backend

### ORM + Model

- Sequelize config: `src/config/sequelize.js`
- Models:
  - `src/models/Customer.js`
  - `src/models/Order.js`
  - `src/models/OrderDetail.js`
  - `src/models/Product.js`
- Association + export: `src/models/index.js`

### RESTful API (v1)

Base URL: `/api/v1`

- `GET /api/v1/analytics/summary`
- `GET /api/v1/analytics/sales?groupBy=day|month&from=YYYY-MM-DD&to=YYYY-MM-DD`
- `GET /api/v1/customers/top?limit=15&q=keyword&from=YYYY-MM-DD&to=YYYY-MM-DD`
- `GET /api/v1/products/top?limit=15&q=keyword&from=YYYY-MM-DD&to=YYYY-MM-DD`
- `GET /api/v1/reports/pivot?rows=customer&cols=productLine&metric=revenue&from=YYYY-MM-DD&to=YYYY-MM-DD`
- `GET /api/v1/orders?customer=...&product=...&limit=200&from=YYYY-MM-DD&to=YYYY-MM-DD`

### Layer tach ro rang

- Routes: `src/routes/apiV1.js`
- Controller: `src/controllers/analyticsController.js`
- Service: `src/services/analyticsService.js`
- Server bootstrap: `server.js`

## 4) Cau hinh CSDL MySQL

Thong so mac dinh:

- `DB_HOST=localhost`
- `DB_PORT=3306`
- `DB_USER=root`
- `DB_PASSWORD=bao12345`
- `DB_NAME=classicmodels`

Copy file `.env.example` thanh `.env` neu can doi cau hinh.

## 5) Cai dat va chay

```bash
npm install
npm start
```

Sau khi chay, app thu tu dong dung cong trong truong hop cong mac dinh dang bi chiem.

Vi du URL:

- <http://localhost:3000>
- neu 3000 dang dung, app se tu chay sang 3001, 3002, ...

## 6) Kiem tra nhanh

Kiem tra health:

```bash
curl http://localhost:3000/health
```

Kiem tra API summary:

```bash
curl http://localhost:3000/api/v1/analytics/summary
```

Neu cong thay doi, thay `3000` bang cong thuc te in ra trong log.

## 7) Luu y

- CSDL `classicmodels` can ton tai san schema va data.
- App hien tai tap trung vao thong ke/bao cao/tim kiem (read/reporting).
- Co the mo rong CRUD va auth/role cho production.
