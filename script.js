// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => console.log('SW registered'))
      .catch(error => console.log('SW registration failed'));
  });
}

const servicesList = document.getElementById("servicesList");
const serviceRowTemplate = document.getElementById("serviceRowTemplate");
const addServiceBtn = document.getElementById("addServiceBtn");
const generateBtn = document.getElementById("generateBtn");
const printBtn = document.getElementById("printBtn");
const sendWhatsappBtn = document.getElementById("sendWhatsappBtn");
const subtotalEl = document.getElementById("subtotal");
const totalEl = document.getElementById("total");
const discountEl = document.getElementById("discount");
const invoiceTextEl = document.getElementById("invoiceText");

// Backend API URL
const API_URL = window.location.hostname === "localhost"
  ? "http://localhost:5000"
  : window.location.origin;

function currency(amount) {
  return `₹${amount.toFixed(2)}`;
}

function cleanWhatsappNumber(number) {
  return (number || "").replace(/[^\d]/g, "");
}

function addServiceRow(defaults = {}) {
  const row = serviceRowTemplate.content.firstElementChild.cloneNode(true);

  const serviceName = row.querySelector(".service-name");
  const servicePrice = row.querySelector(".service-price");
  const serviceQty = row.querySelector(".service-qty");
  const serviceTotal = row.querySelector(".service-total");
  const removeBtn = row.querySelector(".remove-btn");

  serviceName.value = defaults.name || "";
  servicePrice.value = defaults.price ?? "";
  serviceQty.value = defaults.qty ?? 1;

  const updateRowTotal = () => {
    const price = Number(servicePrice.value) || 0;
    const qty = Number(serviceQty.value) || 0;
    const total = price * qty;
    serviceTotal.textContent = currency(total);
    updateSummary();
  };

  servicePrice.addEventListener("input", updateRowTotal);
  serviceQty.addEventListener("input", updateRowTotal);
  removeBtn.addEventListener("click", () => {
    row.remove();
    updateSummary();
  });

  servicesList.appendChild(row);
  updateRowTotal();
}

function getServiceData() {
  const rows = [...servicesList.querySelectorAll(".service-row")];
  return rows
    .map((row) => {
      const name = row.querySelector(".service-name").value.trim();
      const price = Number(row.querySelector(".service-price").value) || 0;
      const qty = Number(row.querySelector(".service-qty").value) || 0;
      return { name, price, qty, total: price * qty };
    })
    .filter((item) => item.name && item.qty > 0 && item.price >= 0);
}

function updateSummary() {
  const services = getServiceData();
  const subtotal = services.reduce((sum, item) => sum + item.total, 0);
  const discountPercent = Math.min(100, Math.max(0, Number(discountEl.value) || 0));
  const discount = (subtotal * discountPercent) / 100;
  const total = Math.max(0, subtotal - discount);

  subtotalEl.textContent = currency(subtotal);
  totalEl.textContent = currency(total);

  return { services, subtotal, discountPercent, discount, total };
}

function generateInvoiceID() {
  const timestamp = Date.now().toString().slice(-6);
  return `TRS-${timestamp}`;
}

function generateInvoiceText() {
  const customerName = document.getElementById("customerName").value.trim();
  const paymentMethod = document.getElementById("paymentMethod").value;
  const { services, subtotal, discountPercent, discount, total } = updateSummary();

  if (!customerName) {
    alert("Please enter customer name.");
    return "";
  }

  if (!services.length) {
    alert("Please add at least one service.");
    return "";
  }

  const now = new Date();
  const dateText = now.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const timeText = now.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  
  const invoiceID = generateInvoiceID();

  const servicesLines = services
    .map((item) => {
      return `- ${item.name} x ${item.qty}            Rs. ${item.total.toFixed(2)}`;
    })
    .join("\n");

  const bill = [
    "══════════════════════════════════════",
    "THE RAMAYANA SALON & ACADEMY",
    "Beauty | Grooming | Style",
    "══════════════════════════════════════",
    "",
    `Receipt No: ${invoiceID}`,
    `Date: ${dateText} | Time: ${timeText}`,
    "",
    `Customer: ${customerName}`,
    "Owner: Miss Anshu Singh",
    "",
    "Address: Nandanagar, New Project Road, Gorakhpur",
    "Phone: 8317097467",
    "Website: https://sl1nk.com/rpinxw7",
    "",
    "──────────────────────────────────────",
    "SERVICES",
    "──────────────────────────────────────",
    servicesLines,
    "",
    "──────────────────────────────────────",
    `Subtotal:             Rs. ${subtotal.toFixed(2)}`,
    `Discount (${discountPercent.toFixed(2)}%):  -Rs. ${discount.toFixed(2)}`,
    `TOTAL AMOUNT:         Rs. ${total.toFixed(2)}`,
    `Payment Mode: ${paymentMethod}`,
    "Status: PAID",
    "──────────────────────────────────────",
    "",
    "Offers:",
    "- Refer a Friend & Get 10% OFF",
    "- Birthday Month Special - 15% OFF",
    "- Membership Rewards Available",
    "",
    "Thank you for visiting Ramayana Salon!",
    "We look forward to serving you again.",
    "══════════════════════════════════════"
  ].join("\n");

  invoiceTextEl.value = bill;
  return bill;
}

function sendToWhatsapp() {
  const rawNumber = document.getElementById("whatsapp").value;
  const number = cleanWhatsappNumber(rawNumber);
  const invoice = invoiceTextEl.value || generateInvoiceText();

  if (!number) {
    alert("Please enter customer WhatsApp number.");
    return;
  }

  if (!invoice) {
    return;
  }

  const url = `https://wa.me/${number}?text=${encodeURIComponent(invoice)}`;
  window.open(url, "_blank");
}

async function loadImageAsDataUrl(src) {
  const response = await fetch(src);
  const blob = await response.blob();
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function generateInvoicePdf() {
  const customerName = document.getElementById("customerName").value.trim();
  const paymentMethod = document.getElementById("paymentMethod").value;
  const { services, subtotal, discountPercent, discount, total } = updateSummary();

  if (!customerName) {
    alert("Please enter customer name.");
    return null;
  }

  if (!services.length) {
    alert("Please add at least one service.");
    return null;
  }

  const now = new Date();
  const dateText = now.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const timeText = now.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  const invoiceID = generateInvoiceID();

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const centerX = pageWidth / 2;
  const left = 48;
  const right = pageWidth - 48;
  const gold = [146, 95, 22];

  doc.setDrawColor(...gold);
  doc.setLineWidth(1.4);
  doc.roundedRect(24, 24, pageWidth - 48, pageHeight - 48, 18, 18);

  try {
    const emblem = await loadImageAsDataUrl("bill-template.png");
    const emblemSize = 170;
    doc.addImage(emblem, "PNG", centerX - emblemSize / 2, 36, emblemSize, emblemSize);
  } catch (_error) {
  }

  let y = 225;
  doc.setTextColor(...gold);
  doc.setFont("times", "bold");
  doc.setFontSize(21);
  doc.text("THE RAMAYANA SALON & ACADEMY", centerX, y, { align: "center" });
  y += 18;

  doc.setFont("times", "italic");
  doc.setFontSize(12);
  doc.text("Beauty | Grooming | Style", centerX, y, { align: "center" });
  y += 22;

  doc.setDrawColor(...gold);
  doc.setLineWidth(0.8);
  doc.line(left, y, right, y);
  y += 18;

  doc.setTextColor(40, 40, 40);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(`Receipt No: ${invoiceID}`, left, y);
  doc.text(`Date: ${dateText} ${timeText}`, right, y, { align: "right" });
  y += 18;

  doc.setFont("helvetica", "normal");
  doc.text(`Customer: ${customerName}`, left, y);
  y += 14;
  doc.text("Owner: Miss Anshu Singh", left, y);
  y += 14;
  doc.text("Address: Nandanagar, New Project Road, Gorakhpur", left, y);
  y += 14;
  doc.text("Phone: 8317097467   Website: https://sl1nk.com/rpinxw7", left, y);
  y += 20;

  doc.setDrawColor(...gold);
  doc.line(left, y, right, y);
  y += 16;

  doc.setTextColor(...gold);
  doc.setFont("helvetica", "bold");
  doc.text("SERVICES", left, y);
  y += 14;

  doc.setTextColor(35, 35, 35);
  doc.setFont("helvetica", "normal");
  services.forEach((item, index) => {
    const label = `${index + 1}. ${item.name} x ${item.qty}`;
    const amount = `Rs. ${item.total.toFixed(2)}`;
    doc.text(label, left + 6, y);
    doc.text(amount, right, y, { align: "right" });
    y += 14;
  });

  y += 6;
  doc.setDrawColor(215, 215, 215);
  doc.line(left, y, right, y);
  y += 16;

  doc.setFont("helvetica", "normal");
  doc.setTextColor(45, 45, 45);
  doc.text(`Subtotal`, left, y);
  doc.text(`Rs. ${subtotal.toFixed(2)}`, right, y, { align: "right" });
  y += 14;
  doc.text(`Discount (${discountPercent.toFixed(2)}%)`, left, y);
  doc.text(`Rs. ${discount.toFixed(2)}`, right, y, { align: "right" });
  y += 16;

  doc.setDrawColor(...gold);
  doc.line(left, y, right, y);
  y += 18;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...gold);
  doc.text(`TOTAL AMOUNT`, left, y);
  doc.text(`Rs. ${total.toFixed(2)}`, right, y, { align: "right" });
  y += 18;

  doc.setTextColor(35, 35, 35);
  doc.setFont("helvetica", "normal");
  doc.text(`Payment Mode: ${paymentMethod}`, left, y);
  doc.text("Status: PAID", right, y, { align: "right" });
  y += 22;

  doc.setDrawColor(220, 220, 220);
  doc.line(left, y, right, y);
  y += 18;
  doc.setTextColor(70, 70, 70);
  doc.setFont("times", "italic");
  doc.text("Thank you for visiting Ramayana Salon.", centerX, y, { align: "center" });
  y += 14;
  doc.text("We look forward to serving you again.", centerX, y, { align: "center" });

  const fileName = `Ramayana-Receipt-${invoiceID}.pdf`;
  const blob = doc.output("blob");
  const file = new File([blob], fileName, { type: "application/pdf" });
  return { blob, file, fileName, invoiceID, dateText, timeText };
}

async function saveInvoiceToDatabase() {
  const customerName = document.getElementById("customerName").value.trim();
  const whatsapp = document.getElementById("whatsapp").value.trim();
  const paymentMethod = document.getElementById("paymentMethod").value;
  const { services, subtotal, discountPercent, discount, total } = updateSummary();

  if (!customerName || !services.length) {
    alert("Please fill customer name and add services first.");
    return;
  }

  const invoiceData = {
    customerName,
    whatsapp,
    paymentMethod,
    services,
    subtotal,
    discountPercent,
    discount,
    total,
    invoiceText: invoiceTextEl.value,
  };

  try {
    const response = await fetch(`${API_URL}/api/invoices`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(invoiceData),
    });

    const result = await response.json();
    if (result.success) {
      alert("Invoice saved to database!");
    } else {
      alert("Error saving invoice: " + result.error);
    }
  } catch (error) {
    alert("Database error: " + error.message + "\n\nMake sure backend is running: npm start");
  }
}

async function sendSMS() {
  const phoneNumber = document.getElementById("whatsapp").value.trim();
  const invoice = invoiceTextEl.value || generateInvoiceText();

  if (!phoneNumber) {
    alert("Please enter customer phone number.");
    return;
  }

  if (!invoice) {
    return;
  }

  // Format phone number: ensure it has country code
  let formattedNumber = phoneNumber.replace(/[^\d]/g, "");
  if (!formattedNumber.startsWith("91")) {
    formattedNumber = "91" + formattedNumber; // India country code
  }

  try {
    const response = await fetch(`${API_URL}/api/send-sms`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phoneNumber: formattedNumber,
        message: invoice,
      }),
    });

    const result = await response.json();
    if (result.success) {
      alert("✅ SMS sent to: " + phoneNumber);
    } else {
      alert("⚠️ " + (result.error || "Could not send SMS"));
    }
  } catch (error) {
    alert("❌ Error: " + error.message + "\n\nMake sure backend is running: npm start");
  }
}

function printInvoice() {
  const invoice = invoiceTextEl.value || generateInvoiceText();

  if (!invoice) {
    return;
  }

  const printWindow = window.open("", "_blank", "width=800,height=900");
  if (!printWindow) {
    alert("Please allow pop-ups to print the bill.");
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <title>Bill - The Ramayana Salon & Academy</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 24px; line-height: 1.5; white-space: pre-wrap; text-align: center; }
        .logo { max-width: 150px; height: auto; margin-bottom: 20px; }
        .invoice { text-align: left; }
      </style>
    </head>
    <body>
      <img src="logo.png" alt="Logo" class="logo">
      <div class="invoice">${invoice.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
    </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

addServiceBtn.addEventListener("click", () => addServiceRow());
generateBtn.addEventListener("click", () => {
  generateInvoiceText();
  saveInvoiceToDatabase();
});
printBtn.addEventListener("click", printInvoice);
sendWhatsappBtn.addEventListener("click", () => {
  generateInvoiceText();
  saveInvoiceToDatabase();
  sendToWhatsapp();
});
discountEl.addEventListener("input", updateSummary);

// History Search
document.getElementById("searchBtn").addEventListener("click", fetchCustomerHistory);
document.getElementById("searchCustomer").addEventListener("keypress", (e) => {
  if (e.key === "Enter") fetchCustomerHistory();
});

async function fetchCustomerHistory() {
  const customerName = document.getElementById("searchCustomer").value.trim();

  if (!customerName) {
    alert("Please enter a customer name.");
    return;
  }

  const historyDiv = document.getElementById("customerHistory");
  historyDiv.innerHTML = "<p>Loading...</p>";

  try {
    const response = await fetch(`${API_URL}/api/invoices/customer/${customerName}`);
    const result = await response.json();

    if (!result.success || result.count === 0) {
      historyDiv.innerHTML = "<p>No records found for this customer.</p>";
      return;
    }

    historyDiv.innerHTML = result.data
      .map(
        (invoice, index) =>
          `<div class="history-item">
            <div class="history-item-header">
              <span>Invoice #${invoice._id ? invoice._id.toString().slice(-6) : index + 1}</span>
              <span>${new Date(invoice.createdAt).toLocaleDateString("en-IN")}</span>
            </div>
            <div class="history-item-detail">Total: ₹${invoice.total.toFixed(2)}</div>
            <div class="history-item-detail">WhatsApp: ${invoice.whatsapp}</div>
            <div class="history-item-detail">Payment: ${invoice.paymentMethod}</div>
            <div class="history-item-detail">Services: ${invoice.services.length} items</div>
          </div>`
      )
      .join("");
  } catch (error) {
    historyDiv.innerHTML = `<p>Error: ${error.message}</p>`;
  }
}

addServiceRow({ name: "Haircut", price: 300, qty: 1 });
