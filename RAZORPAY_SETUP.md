# Razorpay Payment Gateway Setup Guide

This guide will help you set up Razorpay payment gateway for the 18 Cricket Ecosystem platform.

## Why Razorpay?

Razorpay is India's leading payment gateway that provides:
- ✅ Support for all major payment methods (Cards, UPI, Wallets, Net Banking)
- ✅ Easy integration with mobile and web apps
- ✅ Secure payment processing
- ✅ Automatic settlement to bank accounts
- ✅ Test mode for development
- ✅ Comprehensive dashboard and analytics

## Step-by-Step Setup

### Step 1: Create Razorpay Account

1. Visit [Razorpay Signup Page](https://dashboard.razorpay.com/signup)

2. Fill in your details:
   - Business Email
   - Create Password
   - Mobile Number
   - Business Name: "18 Cricket Company"
   - Business Type: "E-commerce"

3. Verify your email and mobile number

4. You'll be redirected to the Razorpay Dashboard

### Step 2: Get Test API Keys (For Development)

**No KYC required for test mode!**

1. Login to [Razorpay Dashboard](https://dashboard.razorpay.com/)

2. Look at the top-right corner - you'll see a toggle switch
   - Make sure it's set to **"Test Mode"** (usually blue/green colored)

3. Go to **Settings** (gear icon in left sidebar)

4. Click on **API Keys** under "Website and app settings"

5. Click **"Generate Test Key"** button

6. You'll see two keys:
   - **Key ID**: Starts with `rzp_test_` (visible immediately)
   - **Key Secret**: Click the "eye" icon to reveal it

7. **Copy both keys** - you'll need them!

### Step 3: Configure in Your Application

1. Open your project folder

2. Navigate to `backend/.env` file

3. Add your Razorpay keys:
   ```env
   RAZORPAY_KEY_ID="rzp_test_xxxxxxxxxxxxx"
   RAZORPAY_KEY_SECRET="your_secret_key_here"
   ```

4. Save the file

5. Restart your backend server:
   ```bash
   sudo supervisorctl restart backend
   ```

### Step 4: Test the Payment Flow

#### Test Credit/Debit Cards

Razorpay provides test cards that simulate different payment scenarios:

**✅ Successful Payment:**
- Card Number: `4111 1111 1111 1111`
- CVV: Any 3 digits (e.g., `123`)
- Expiry: Any future date (e.g., `12/25`)
- Cardholder Name: Any name

**❌ Failed Payment:**
- Card Number: `4000 0000 0000 0002`
- CVV: Any 3 digits
- Expiry: Any future date
- Use this to test payment failure scenarios

**⏳ Payment Requires Authentication:**
- Card Number: `4000 0027 6000 3184`
- CVV: Any 3 digits
- Expiry: Any future date
- Tests 3D Secure flow

#### Test UPI
- UPI ID: `success@razorpay`
- Status: Payment succeeds
- UPI ID: `failure@razorpay`
- Status: Payment fails

#### Test Wallets
All test wallets work in test mode automatically

### Step 5: Go Live (Production Mode)

When you're ready to accept real payments:

1. **Complete KYC Verification**
   - Go to Account & Settings
   - Click "Complete KYC"
   - Submit required documents:
     - PAN Card
     - Bank Account Details
     - Address Proof
     - Business Registration (if applicable)

2. **Wait for Approval** (typically 24-48 hours)

3. **Get Live API Keys**
   - Switch to "Live Mode" in dashboard
   - Go to Settings → API Keys
   - Generate Live Keys (starts with `rzp_live_`)

4. **Update Production Environment**
   ```env
   RAZORPAY_KEY_ID="rzp_live_xxxxxxxxxxxxx"
   RAZORPAY_KEY_SECRET="your_live_secret_key"
   ```

5. **Test with Real Cards** (use small amounts initially)

## Payment Flow in the App

Here's how payments work in your cricket ecosystem:

1. **User adds products to cart**
   - Products from multiple vendors can be in one order

2. **User proceeds to checkout**
   - Enters shipping address
   - Reviews order total

3. **Create Order API**
   - Backend creates Razorpay order
   - Order ID is generated
   - Amount is in paise (multiply by 100)

4. **Payment Gateway Opens**
   - User selects payment method
   - Enters payment details
   - Completes payment

5. **Payment Success**
   - Razorpay redirects back to app
   - Backend receives payment confirmation
   - Order status updated to "Paid"

6. **Commission & Payout**
   - Platform commission (15%) is calculated
   - Vendor receives 85% of order value
   - Automatic settlement to registered bank account

## Important Settings

### Webhook Setup (Recommended for Production)

Webhooks notify your server about payment events automatically.

1. Go to Settings → Webhooks

2. Add webhook URL:
   ```
   https://your-domain.com/api/razorpay/webhook
   ```

3. Select events to listen:
   - payment.authorized
   - payment.failed
   - payment.captured
   - order.paid

4. Copy the webhook secret

5. Add to your `.env`:
   ```env
   RAZORPAY_WEBHOOK_SECRET="your_webhook_secret"
   ```

### Settlement Configuration

1. Go to Settings → Payment Configuration

2. Set auto-settlement schedule:
   - Daily settlements (default)
   - On-demand settlements (for higher tiers)

3. Add bank account details for settlements

## Security Best Practices

1. **Never commit API keys to Git**
   - Always use `.env` files
   - Add `.env` to `.gitignore`

2. **Use environment-specific keys**
   - Test keys for development
   - Live keys only in production

3. **Validate payments on backend**
   - Always verify payment signature
   - Check order amount matches

4. **Use HTTPS in production**
   - Razorpay requires HTTPS for live mode

5. **Rotate keys regularly**
   - Change API keys every 6 months
   - Immediately if compromised

## Troubleshooting

### "Invalid API Key"
- Check if you're using test/live keys correctly
- Verify no extra spaces in keys
- Ensure keys are copied completely

### "Payment Failed"
- In test mode, use test cards only
- Check if card details are correct
- Try different test cards

### "Order not found"
- Verify Razorpay order ID is correct
- Check backend logs for errors
- Ensure order was created successfully

### "Webhook not received"
- Verify webhook URL is accessible
- Check webhook secret is correct
- Review webhook logs in Razorpay dashboard

## Support & Resources

### Razorpay Resources
- **Dashboard**: [https://dashboard.razorpay.com/](https://dashboard.razorpay.com/)
- **Documentation**: [https://razorpay.com/docs/](https://razorpay.com/docs/)
- **API Reference**: [https://razorpay.com/docs/api/](https://razorpay.com/docs/api/)
- **Support**: [https://razorpay.com/support/](https://razorpay.com/support/)

### Contact Razorpay Support
- Email: support@razorpay.com
- Phone: 1800-102-4414 (India)
- Live Chat: Available in dashboard

### Test Mode Limitations
- Cannot accept real money
- No actual bank settlements
- All transactions are simulated
- Test mode data is separate from live

## Fees & Pricing

Razorpay charges a transaction fee:
- **Domestic Cards**: 2% per transaction
- **International Cards**: 3% per transaction
- **UPI**: Free (currently)
- **Wallets**: 2% per transaction
- **Net Banking**: 2% per transaction

**No setup fees or annual maintenance charges!**

## Next Steps

1. ✅ Create Razorpay account
2. ✅ Get test API keys
3. ✅ Add keys to your app
4. ✅ Test payments with test cards
5. ⏳ Complete KYC (when ready for production)
6. ⏳ Get live API keys
7. ⏳ Go live!

---

**Need Help?**

If you face any issues:
1. Check Razorpay documentation
2. Contact Razorpay support
3. Review backend logs: `tail -f /var/log/supervisor/backend.err.log`

**Happy Accepting Payments! 💰🏏**
