# 🌿 VedNidan Healthcare

Premium Ayurvedic e-commerce store with AI Doctor consultation, Prescription OCR Reader, Therapist Booking System, and Admin Dashboard.

---

## 📁 Project Structure

```
VEDNIDAN HEALTHCARE/
├── backend/                   ← Node.js / Express API Server
│   ├── server.js              ← Entry point — run this to start
│   ├── package.json
│   ├── controllers/           ← Business logic handlers
│   ├── routes/                ← API route definitions
│   ├── data/                  ← JSON file-based databases
│   └── uploads/               ← Temp OCR image uploads
│
└── frontend/                  ← Static Web UI (HTML/CSS/JS)
    ├── index.html             ← Main website
    ├── admin.html             ← Admin control panel
    ├── css/                   ← Stylesheets
    └── js/                    ← Client-side JavaScript
```

---

## 🚀 How to Run

### 1. Open VS Code
- Press `Ctrl + K, Ctrl + O` → Select the `VEDNIDAN HEALTHCARE` folder

### 2. Open Terminal in VS Code
- Press `` Ctrl + ` ``

### 3. Install dependencies (first time only)
```bash
cd backend
npm install
```

### 4. Start the server
```bash
cd backend
npm run dev
```

### 5. Open in browser
- **Main Website** → http://localhost:5000
- **Admin Panel** → http://localhost:5000/admin.html

---

## 🔑 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | Get products list |
| POST | `/api/auth/signup` | Register user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/booking/slots` | Doctor availability |
| POST | `/api/booking/book` | Book doctor appointment |
| POST | `/api/therapist-booking/book` | Book therapy session |
| POST | `/api/doctor/chat` | AI Doctor consultation |
| POST | `/api/prescription/upload` | Prescription OCR |
| GET | `/api/admin/stats` | Admin dashboard stats |
| GET | `/api/admin/orders` | View all orders |
| PUT | `/api/admin/orders/:id/status` | Update order status |
| POST | `/api/admin/products` | Add product |
| PUT | `/api/admin/products/:id` | Edit product |
| DELETE | `/api/admin/products/:id` | Delete product |

---

## 🛠 Tech Stack

- **Backend**: Node.js, Express.js
- **Storage**: JSON file-based database
- **OCR**: Tesseract.js
- **Frontend**: Vanilla HTML, CSS, JavaScript
