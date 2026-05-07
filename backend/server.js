const express = require("express");
const { MongoClient } = require("mongodb");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection String
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://anshusingh831709:as5759423@cluster0.skebsbg.mongodb.net/";
const DB_NAME = "salon_billing";
const COLLECTION_NAME = "invoices";

let mongoClient;
let db;
let invoicesCollection;

// Connect to MongoDB
async function connectDB() {
  try {
    mongoClient = new MongoClient(MONGO_URI);
    await mongoClient.connect();
    db = mongoClient.db(DB_NAME);
    invoicesCollection = db.collection(COLLECTION_NAME);
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error);
    process.exit(1);
  }
}

// POST: Save Invoice
app.post("/api/invoices", async (req, res) => {
  try {
    const invoiceData = {
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await invoicesCollection.insertOne(invoiceData);
    res.json({ success: true, id: result.insertedId, message: "Invoice saved!" });
  } catch (error) {
    console.error("Error saving invoice:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET: Fetch all invoices
app.get("/api/invoices", async (req, res) => {
  try {
    const invoices = await invoicesCollection
      .find()
      .sort({ createdAt: -1 })
      .toArray();
    res.json({ success: true, data: invoices });
  } catch (error) {
    console.error("Error fetching invoices:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET: Fetch invoices for a specific customer
app.get("/api/invoices/customer/:name", async (req, res) => {
  try {
    const customerName = req.params.name;
    const invoices = await invoicesCollection
      .find({ customerName: { $regex: customerName, $options: "i" } })
      .sort({ createdAt: -1 })
      .toArray();
    res.json({ success: true, data: invoices, count: invoices.length });
  } catch (error) {
    console.error("Error fetching customer invoices:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET: Get invoice statistics
app.get("/api/stats", async (req, res) => {
  try {
    const totalInvoices = await invoicesCollection.countDocuments();
    const totalRevenue = await invoicesCollection
      .aggregate([{ $group: { _id: null, total: { $sum: "$total" } } }])
      .toArray();

    res.json({
      success: true,
      totalInvoices,
      totalRevenue: totalRevenue[0]?.total || 0,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Health Check
app.get("/health", (req, res) => {
  res.json({ status: "✅ Backend is running!" });
});

// Serve frontend files (root project directory)
const FRONTEND_DIR = path.join(__dirname, "..");
app.use(express.static(FRONTEND_DIR));

app.get("*", (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, "index.html"));
});

// Start Server
async function startServer() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Stats: /api/stats`);
    console.log(`📄 All Invoices: /api/invoices`);
  });
}

startServer();
