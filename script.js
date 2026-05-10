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
const openDashboardBtn = document.getElementById("openDashboardBtn");
const refreshDashboardBtn = document.getElementById("refreshDashboardBtn");
const todayRevenueEl = document.getElementById("todayRevenue");
const monthRevenueEl = document.getElementById("monthRevenue");
const totalInvoicesEl = document.getElementById("totalInvoices");
const uniqueCustomersEl = document.getElementById("uniqueCustomers");
const eyebrowCountEl = document.getElementById("eyebrowCount");
const dayWiseListEl = document.getElementById("dayWiseList");
const topServicesEl = document.getElementById("topServices");
const monthSummaryEl = document.getElementById("monthSummary");
const dashboardTableEl = document.getElementById("dashboardTable");

// Bulk Messaging Elements
const bulkMessageBtn = document.getElementById("bulkMessageBtn");
const bulkMessageModal = document.getElementById("bulkMessageModal");
const closeBulkModal = document.getElementById("closeBulkModal");
const bulkMessageTitle = document.getElementById("bulkMessageTitle");
const bulkMessageContent = document.getElementById("bulkMessageContent");
const sendToAll = document.getElementById("sendToAll");
const sendToRecent = document.getElementById("sendToRecent");
const messagePreview = document.getElementById("messagePreview");
const customerCount = document.getElementById("customerCount");
const sendBulkMessageBtn = document.getElementById("sendBulkMessageBtn");
const cancelBulkMessageBtn = document.getElementById("cancelBulkMessageBtn");

// Backend API URL - Always use localhost:5000 for development, or fallback to origin
const API_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
  ? "http://localhost:5000"
  : window.location.protocol + "//" + window.location.host;

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
      loadDashboard();
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

refreshDashboardBtn.addEventListener("click", loadDashboard);
openDashboardBtn.addEventListener("click", () => {
  document.getElementById("dashboardSection").scrollIntoView({ behavior: "smooth" });
});

// Bulk Messaging Event Listeners
bulkMessageBtn.addEventListener("click", openBulkMessageModal);
closeBulkModal.addEventListener("click", closeBulkMessageModal);
cancelBulkMessageBtn.addEventListener("click", closeBulkMessageModal);
sendBulkMessageBtn.addEventListener("click", sendBulkMessage);
bulkMessageContent.addEventListener("input", updateMessagePreview);
bulkMessageTitle.addEventListener("input", updateMessagePreview);
sendToAll.addEventListener("change", updateCustomerCount);
sendToRecent.addEventListener("change", updateCustomerCount);

// Close modal when clicking outside
bulkMessageModal.addEventListener("click", (e) => {
  if (e.target === bulkMessageModal) {
    closeBulkMessageModal();
  }
});

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

    const groupedInvoices = result.data.reduce((groups, invoice, index) => {
      const invoiceDate = new Date(invoice.createdAt);
      const dateKey = invoiceDate.toISOString().slice(0, 10);
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push({ invoice, index });
      return groups;
    }, {});

    const sortedDateKeys = Object.keys(groupedInvoices).sort((a, b) => new Date(b) - new Date(a));

    historyDiv.innerHTML = sortedDateKeys
      .map((dateKey) => {
        const displayDate = new Date(dateKey).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });

        const items = groupedInvoices[dateKey]
          .map(({ invoice, index }) =>
            `<div class="history-item">
              <div class="history-item-header">
                <span>Invoice #${invoice._id ? invoice._id.toString().slice(-6) : index + 1}</span>
                <span>${new Date(invoice.createdAt).toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })}</span>
              </div>
              <div class="history-item-detail">Total: ₹${invoice.total.toFixed(2)}</div>
              <div class="history-item-detail">WhatsApp: ${invoice.whatsapp}</div>
              <div class="history-item-detail">Payment: ${invoice.paymentMethod}</div>
              <div class="history-item-detail">Services: ${invoice.services.length} items</div>
            </div>`
          )
          .join("");

        return `<div class="history-date-group">
          <div class="history-date-title">${displayDate}</div>
          ${items}
        </div>`;
      })
      .join("");
  } catch (error) {
    historyDiv.innerHTML = `<p>Error: ${error.message}</p>`;
  }
}

// Bulk Messaging Functions
async function openBulkMessageModal() {
  bulkMessageModal.style.display = "block";
  document.body.style.overflow = "hidden";
  
  // Load customer count
  await updateCustomerCount();
  updateMessagePreview();
}

function closeBulkMessageModal() {
  bulkMessageModal.style.display = "none";
  document.body.style.overflow = "auto";
  
  // Reset form
  bulkMessageTitle.value = "";
  bulkMessageContent.value = "";
  sendToAll.checked = true;
  sendToRecent.checked = false;
}

async function updateCustomerCount() {
  try {
    const response = await fetch(`${API_URL}/api/invoices`);
    const result = await response.json();
    
    if (!result.success) {
      customerCount.textContent = "Error loading customers";
      return;
    }
    
    const invoices = result.data;
    let customers = [];
    
    if (sendToRecent.checked) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      customers = [...new Set(
        invoices
          .filter(invoice => new Date(invoice.createdAt) >= thirtyDaysAgo)
          .map(invoice => ({
            name: invoice.customerName,
            whatsapp: invoice.whatsapp
          }))
          .filter(customer => customer.whatsapp && customer.whatsapp.trim())
      )];
    } else {
      customers = [...new Set(
        invoices
          .map(invoice => ({
            name: invoice.customerName,
            whatsapp: invoice.whatsapp
          }))
          .filter(customer => customer.whatsapp && customer.whatsapp.trim())
      )];
    }
    
    customerCount.textContent = `📱 Will send to ${customers.length} customers`;
  } catch (error) {
    customerCount.textContent = "Error loading customer count";
    console.error("Error loading customers:", error);
  }
}

function updateMessagePreview() {
  const title = bulkMessageTitle.value.trim();
  const content = bulkMessageContent.value.trim();
  
  let preview = "";
  if (title) {
    preview += `🎉 ${title}\n\n`;
  }
  preview += content;
  
  messagePreview.textContent = preview || "Your message will appear here...";
}

async function sendBulkMessage() {
  const title = bulkMessageTitle.value.trim();
  const content = bulkMessageContent.value.trim();
  
  if (!content) {
    alert("Please enter a message to send.");
    return;
  }
  
  if (!confirm("Are you sure you want to send this message to all selected customers? This will open multiple WhatsApp tabs.")) {
    return;
  }
  
  try {
    sendBulkMessageBtn.disabled = true;
    sendBulkMessageBtn.textContent = "⏳ Preparing messages...";
    
    const response = await fetch(`${API_URL}/api/bulk-message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        content,
        sendToRecentOnly: sendToRecent.checked
      }),
    });
    
    const result = await response.json();
    
    if (result.success) {
      sendBulkMessageBtn.textContent = "🚀 Opening WhatsApp tabs...";
      
      // Open WhatsApp tabs for each customer
      let openedCount = 0;
      const totalToSend = result.whatsappUrls.length;
      
      for (let i = 0; i < result.whatsappUrls.length; i++) {
        const customer = result.whatsappUrls[i];
        try {
          // Use unique target name for each URL to ensure separate tabs
          window.open(customer.url, `whatsapp_${i}_${Date.now()}`);
          openedCount++;
          
          // Small delay between openings to prevent browser blocking
          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (error) {
          console.error("Failed to open WhatsApp for", customer.name, error);
        }
      }
      
      let message = `✅ Opened ${openedCount}/${totalToSend} WhatsApp tabs!`;
      message += `\n\n👥 ${result.whatsappUrls.length} unique customers contacted.`;
      message += `\n\n💡 Confirm 'Send' in WhatsApp to deliver each message.`;
      
      alert(message);
      closeBulkMessageModal();
    } else {
      alert("❌ Error preparing bulk message: " + result.error);
    }
  } catch (error) {
    alert("❌ Error: " + error.message);
  } finally {
    sendBulkMessageBtn.disabled = false;
    sendBulkMessageBtn.textContent = "🚀 Send Bulk Message";
  }
}

addServiceRow({ name: "Haircut", price: 300, qty: 1 });
loadDashboard();
setInterval(loadDashboard, 30000);

window.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    loadDashboard();
  }
});

async function loadDashboard() {
  try {
    console.log("📊 Loading dashboard from API:", API_URL);
    const response = await fetch(`${API_URL}/api/invoices`);
    
    if (!response.ok) {
      console.error("API Error:", response.status, response.statusText);
      dashboardTableEl.innerHTML = `<div style="color: red; padding: 20px;">
        <strong>Error:</strong> Cannot connect to backend API at ${API_URL}<br>
        Status: ${response.status} ${response.statusText}<br>
        Please ensure backend server is running on port 5000.
      </div>`;
      return;
    }
    
    const result = await response.json();
    if (!result.success) {
      console.warn("API returned error:", result.error);
      dashboardTableEl.innerHTML = `<div style="color: orange; padding: 20px;">
        <strong>Warning:</strong> ${result.error || "Unable to load dashboard"}<br>
        Invoice data may not be available.
      </div>`;
      return;
    }
    
    console.log("✅ Dashboard data loaded:", result.data.length, "invoices");
    renderDashboard(result.data);
  } catch (error) {
    console.error("Dashboard load failed:", error);
    dashboardTableEl.innerHTML = `<div style="color: red; padding: 20px;">
      <strong>Error:</strong> ${error.message}<br>
      Could not connect to backend at ${API_URL}<br>
      Make sure to run: npm start (in backend folder)
    </div>`;
  }
}

function renderDashboard(invoices) {
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

  const totals = {
    today: 0,
    thisMonth: 0,
    lastMonth: 0,
    invoicesThisMonth: 0,
    invoicesLastMonth: 0,
  };

  const serviceCounts = {};
  const customerSet = new Set();
  const eyebrowServiceKey = /brow|eyebrow|eyebrows/i;
  let eyebrowCountThisMonth = 0;

  const dateGroups = {};
  const dayWise = {};

  invoices.forEach((invoice) => {
    const invoiceDate = new Date(invoice.createdAt);
    const invoiceDayKey = invoiceDate.toISOString().slice(0, 10);
    const amount = Number(invoice.total) || 0;
    customerSet.add(invoice.customerName || "Unknown");

    if (invoiceDate >= startOfToday) {
      totals.today += amount;
    }
    if (invoiceDate >= startOfThisMonth) {
      totals.thisMonth += amount;
      totals.invoicesThisMonth += 1;
    }
    if (invoiceDate >= startOfLastMonth && invoiceDate <= endOfLastMonth) {
      totals.lastMonth += amount;
      totals.invoicesLastMonth += 1;
    }

    if (!dateGroups[invoiceDayKey]) {
      dateGroups[invoiceDayKey] = [];
    }
    dateGroups[invoiceDayKey].push(invoice);

    if (!dayWise[invoiceDayKey]) {
      dayWise[invoiceDayKey] = 0;
    }
    dayWise[invoiceDayKey] += amount;

    invoice.services?.forEach((service) => {
      const name = (service.name || "Unknown").trim();
      const quantity = Number(service.qty) || 1;
      const count = serviceCounts[name] || 0;
      serviceCounts[name] = count + quantity;
      if (invoiceDate >= startOfThisMonth && eyebrowServiceKey.test(name)) {
        eyebrowCountThisMonth += quantity;
      }
    });
  });

  todayRevenueEl.textContent = currency(totals.today);
  monthRevenueEl.textContent = currency(totals.thisMonth);
  totalInvoicesEl.textContent = invoices.length;
  uniqueCustomersEl.textContent = customerSet.size;
  eyebrowCountEl.textContent = eyebrowCountThisMonth;

  const sortedDays = Object.keys(dayWise)
    .sort((a, b) => new Date(b) - new Date(a))
    .slice(0, 7);
  dayWiseListEl.innerHTML = sortedDays
    .map((dayKey) => {
      const dayTotal = currency(dayWise[dayKey]);
      const dayLabel = new Date(dayKey).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      });
      return `<div><span>${dayLabel}</span><strong>${dayTotal}</strong></div>`;
    })
    .join("");

  const topServices = Object.entries(serviceCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  topServicesEl.innerHTML = topServices
    .map(([name, count]) => `<li><span>${name}</span><strong>${count}</strong></li>`)
    .join("");

  monthSummaryEl.innerHTML = [
    `<div><span>Invoices This Month</span><strong>${totals.invoicesThisMonth}</strong></div>`,
    `<div><span>Last Month Revenue</span><strong>${currency(totals.lastMonth)}</strong></div>`,
    `<div><span>Invoices Last Month</span><strong>${totals.invoicesLastMonth}</strong></div>`,
  ].join("");

  const sortedDates = Object.keys(dateGroups).sort((a, b) => new Date(b) - new Date(a));
  const tableHtml = sortedDates
    .flatMap((dateKey) => {
      const displayDate = new Date(dateKey).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
      const rows = dateGroups[dateKey]
        .map((invoice) => {
          const invoiceDate = new Date(invoice.createdAt);
          return `<div class="dashboard-row">
            <span>${displayDate} ${invoiceDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
            <span>${invoice.customerName || "Unknown"}</span>
            <span>₹${Number(invoice.total).toFixed(2)}</span>
            <span>${invoice.paymentMethod || "N/A"}</span>
            <span>${invoice.services?.length || 0} items</span>
          </div>`;
        })
        .join("");
      return [`<div class="dashboard-row dashboard-row-header">
            <span>Date</span>
            <span>Customer</span>
            <span>Amount</span>
            <span>Payment</span>
            <span>Items</span>
          </div>`, rows];
    })
    .join("");
  dashboardTableEl.innerHTML = tableHtml || "<div>No invoice records available yet.</div>";
}
