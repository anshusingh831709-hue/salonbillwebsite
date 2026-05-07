# MongoDB Database Integration Setup

## 📋 What's New
- ✅ **MongoDB Backend**: Node.js + Express server connected to your MongoDB cluster
- ✅ **Auto-Save**: Every invoice automatically saves to the database
- ✅ **Customer History**: Search and view all invoices for a customer
- ✅ **Dashboard Ready**: Track stats and revenue

---

## 🚀 Setup Instructions

### Step 1: Install Node.js (if not installed)
Download from: https://nodejs.org/ (LTS version recommended)

### Step 2: Install Backend Dependencies
Open PowerShell in the project folder and run:
```powershell
cd backend
npm install
```

This will install:
- `express` - Web server
- `mongodb` - Database driver
- `cors` - Enable frontend-backend communication

### Step 3: Start the Backend Server
```powershell
npm start
```

✅ You should see:
```
✅ Connected to MongoDB
🚀 Server running on http://localhost:5000
```

### Step 4: Run the Frontend
Open `index.html` in your browser (as before)

---

## 📊 How It Works

1. **Generate Bill** → Automatically saves to MongoDB
2. **Search History** → View all invoices for a customer
3. **See Stats** → Visit http://localhost:5000/api/stats in browser

---

## 🔧 Available API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/invoices` | POST | Save new invoice |
| `/api/invoices` | GET | Get all invoices |
| `/api/invoices/customer/:name` | GET | Get customer history |
| `/api/stats` | GET | Get total revenue & invoices |
| `/health` | GET | Check if server is running |

---

## 🛑 Troubleshooting

**"❌ Database error: connection refused"**
- Make sure backend is running with `npm start`
- Verify MongoDB connection string is correct

**"Cannot connect to MongoDB"**
- Check internet connection
- Verify credentials: `anshusingh831709:as5759423`
- Check firewall/antivirus not blocking MongoDB

**"Port 5000 already in use"**
- Another app is using port 5000
- Change PORT in `backend/server.js` to 5001 and update API_URL in script.js

---

## 📁 File Structure
```
salon billing/
├── index.html (Frontend)
├── styles.css (Styling)
├── script.js (Frontend Logic + DB Integration)
├── README.md (This file)
└── backend/
    ├── package.json (Dependencies)
    └── server.js (Express + MongoDB Backend)
```

---

## 💾 MongoDB Data Structure
Each invoice saves as:
```json
{
  "_id": "ObjectId",
  "customerName": "John Doe",
  "whatsapp": "918317097467",
  "paymentMethod": "UPI",
  "services": [
    { "name": "Haircut", "price": 300, "qty": 1, "total": 300 }
  ],
  "subtotal": 300,
  "discount": 0,
  "total": 300,
  "invoiceText": "... full invoice text ...",
  "createdAt": "2026-05-07T10:30:00Z",
  "updatedAt": "2026-05-07T10:30:00Z"
}
```

---

## 🎯 Next Steps
✅ Database is ready
- Optional: Add login for salon staff
- Optional: Monthly revenue reports
- Optional: Export invoices as PDF

Enjoy! 🎉
