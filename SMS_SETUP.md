# SMS & WhatsApp Integration Setup

## 📱 Current Features
- ✅ **Send to WhatsApp** - Opens wa.me with prefilled message
- ✅ **Send SMS** - Text message via Twilio (requires setup)

---

## 🔧 Setup Twilio for SMS

### Step 1: Create Free Twilio Account
1. Go to: https://www.twilio.com/try-twilio
2. Sign up with your email
3. Verify your phone number
4. Get a free Twilio phone number (e.g., +1234567890)

### Step 2: Get Your Credentials
From Twilio Dashboard:
- **Account SID** - Find in Dashboard
- **Auth Token** - Find in Dashboard
- **Phone Number** - Your Twilio number (from Step 1)

### Step 3: Add Credentials to Backend

#### Option A: Using .env File (Recommended)
Create `backend/.env`:
```
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

#### Option B: Direct in Code
Edit `backend/server.js` and replace:
```javascript
const TWILIO_ACCOUNT_SID = "your_account_sid";
const TWILIO_AUTH_TOKEN = "your_auth_token";
const TWILIO_PHONE_NUMBER = "+1234567890";
```

---

## 📲 How to Use

### Send SMS
1. Enter customer name & phone number
2. Add services & generate bill
3. Click **"Send SMS"** button
4. ✅ SMS sent to customer's phone

### Send WhatsApp
1. Enter customer name & phone number
2. Add services & generate bill
3. Click **"Send to WhatsApp"** button
4. ✅ Opens WhatsApp with prefilled message (manual send)

---

## 💰 Twilio Pricing
- **Free Trial**: $15 credit (enough for ~50 SMS)
- **After Trial**: ~₹4-5 per SMS in India
- Pay-as-you-go (no monthly fee)

---

## ❌ Troubleshooting

**"Twilio not configured"**
- Add credentials to `.env` file or `server.js`

**"Invalid phone number"**
- Ensure format: 91XXXXXXXXXX (India) or +91XXXXXXXXXX

**"SMS not sending but no error"**
- Check Twilio account has credits
- Verify phone number is verified in Twilio

---

## 📧 Alternative: Email Integration
Want to also send invoices via email? Let me know and I'll add it!
