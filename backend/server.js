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

// Middleware to check database connection
app.use((req, res, next) => {
  if (!invoicesCollection && req.path.startsWith("/api/") && req.path !== "/health") {
    return res.status(503).json({ 
      success: false, 
      error: "Database not connected. Please check MongoDB credentials." 
    });
  }
  next();
});

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
    return true;
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);
    console.warn("⚠️  Database operations will not work. Please check MongoDB credentials.");
    return false;
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

// POST: Send SMS (placeholder - integrate with SMS service like Twilio)
app.post("/api/send-sms", async (req, res) => {
  try {
    const { phoneNumber, message } = req.body;
    
    if (!phoneNumber || !message) {
      return res.status(400).json({ success: false, error: "Phone number and message required" });
    }

    // TODO: Integrate with Twilio or other SMS service
    // For now, return success message
    console.log(`📱 SMS Request: ${phoneNumber} - ${message.substring(0, 50)}...`);
    
    res.json({ 
      success: true, 
      message: "SMS functionality not yet configured. Contact admin to set up Twilio integration." 
    });
  } catch (error) {
    console.error("Error sending SMS:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST: Send Bulk WhatsApp Messages
app.post("/api/bulk-message", async (req, res) => {
  try {
    const { title, content, sendToRecentOnly } = req.body;
    
    if (!content) {
      return res.status(400).json({ success: false, error: "Message content is required" });
    }

    // Get all invoices to extract customer data
    const invoices = await invoicesCollection.find().toArray();
    
    // Filter customers based on criteria
    let customerMap = new Map();
    
    if (sendToRecentOnly) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      invoices
        .filter(invoice => new Date(invoice.createdAt) >= thirtyDaysAgo)
        .forEach(invoice => {
          if (invoice.whatsapp && invoice.whatsapp.trim()) {
            customerMap.set(invoice.whatsapp.trim(), {
              name: invoice.customerName,
              whatsapp: invoice.whatsapp.trim()
            });
          }
        });
    } else {
      invoices.forEach(invoice => {
        if (invoice.whatsapp && invoice.whatsapp.trim()) {
          customerMap.set(invoice.whatsapp.trim(), {
            name: invoice.customerName,
            whatsapp: invoice.whatsapp.trim()
          });
        }
      });
    }
    
    const customers = Array.from(customerMap.values());
    
    if (customers.length === 0) {
      return res.status(400).json({ success: false, error: "No customers found with valid WhatsApp numbers" });
    }
    
    // Format the message
    let fullMessage = "";
    if (title) {
      fullMessage += `🎉 ${title}\n\n`;
    }
    fullMessage += content;
    fullMessage += "\n\nThe Ramayana Salon & Academy";
    
    // Generate WhatsApp URLs for each customer
    const whatsappUrls = customers.map(customer => {
      // Clean: remove all non-digits
      let cleanNumber = customer.whatsapp.replace(/[^\d]/g, "");
      
      // Handle country code: ensure proper formatting
      if (cleanNumber.startsWith("91")) {
        // Already has 91 prefix, use as-is
        // But remove if it has duplicate 91
        if (cleanNumber.length === 12 && cleanNumber.startsWith("91")) {
          // Already properly formatted (91 + 10 digits)
          cleanNumber = cleanNumber;
        } else if (cleanNumber.length > 12) {
          // Might have duplicate 91, fix it
          cleanNumber = "91" + cleanNumber.slice(-10);
        }
      } else if (cleanNumber.startsWith("1") && cleanNumber.length === 11) {
        // US format, keep as-is
        cleanNumber = cleanNumber;
      } else if (cleanNumber.length === 10) {
        // 10-digit Indian number, add 91 prefix
        cleanNumber = "91" + cleanNumber;
      } else if (cleanNumber.length < 10) {
        // Invalid number, skip
        console.warn(`Skipping invalid number: ${customer.whatsapp}`);
        return null;
      }
      
      const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(fullMessage)}`;
      return {
        name: customer.name,
        whatsapp: customer.whatsapp,
        url: whatsappUrl
      };
    }).filter(item => item !== null);
    
    console.log(`📱 Bulk message request: ${customers.length} customers, title: "${title}"`);
    
    // Return the data for frontend to handle opening WhatsApp tabs
    res.json({
      success: true,
      message: `Bulk message prepared for ${customers.length} customers`,
      sentCount: customers.length,
      whatsappUrls: whatsappUrls
    });
    
  } catch (error) {
    console.error("Error preparing bulk message:", error);
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
  const dbConnected = await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    if (dbConnected) {
      console.log(`📊 Stats: /api/stats`);
      console.log(`📄 All Invoices: /api/invoices`);
    } else {
      console.log(`⚠️  Running without database connection. Reconnect MongoDB to enable data persistence.`);
    }
  });
}

startServer();
