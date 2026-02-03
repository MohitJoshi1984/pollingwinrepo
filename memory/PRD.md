# The Polling Winner - Product Requirements Document

## Original Problem Statement
Build a web app named "The Polling Winner" where users can vote on polls by paying money. When a poll ends, the total amount collected is distributed among winning voters proportionally based on their vote count.

## Core Features

### User-Facing App
- Homepage displaying all available polls with pagination
- Each poll shows: total votes cast, voting deadline, LIVE/ENDED status
- Poll Details page (requires login): images, total votes, deadline, cost per vote
- Users select number of votes and pay via **NOWPayments (300+ Cryptocurrencies)**
- Successful payments add poll to user's "My Polls" section
- User profile management: name, UPI ID for withdrawals, KYC details
- KYC verification required before withdrawals (admin approval needed)
- Cash Wallet for winnings - can be used for future polls or withdrawn (10% fee)

### Admin Panel
- Separate admin login at /admin/login
- Full CRUD for polls (Create, Edit, Delete) with pagination
- View poll statistics and declare results
- Manage payment gateway charge % and withdrawal charge %
- Review and approve/reject user KYC submissions
- User management with pagination
- Transaction overview with pagination

### Fund Distribution Logic
When a poll concludes:
```
per_vote_winning = total_amount_collected / winning_votes
each_winner_gets = their_votes * per_vote_winning
```

## Tech Stack
- **Frontend**: React, React Router, Axios, Custom styling with gradients
- **Backend**: FastAPI, Pydantic, Modular routers
- **Database**: MongoDB
- **Authentication**: JWT (JSON Web Tokens)
- **Payments**: NOWPayments (300+ Cryptocurrencies including BTC, ETH, USDT, BNB)

## Architecture
```
/app/
├── backend/
│   ├── .env                    # Mongo, JWT, NOWPayments credentials
│   ├── requirements.txt
│   ├── server.py               # Main FastAPI app with router imports
│   ├── core/
│   │   ├── config.py           # Environment configuration
│   │   ├── database.py         # MongoDB connection
│   │   └── security.py         # JWT, password hashing
│   ├── models/
│   │   └── schemas.py          # Pydantic models
│   └── routes/
│       ├── auth.py             # Authentication endpoints
│       ├── polls.py            # Poll endpoints
│       ├── payments.py         # NOWPayments integration
│       ├── users.py            # User profile, KYC, wallet
│       └── admin.py            # Admin endpoints
└── frontend/
    └── src/
        ├── pages/              # All user and admin pages
        ├── components/         # Header, Pagination, etc.
        └── auth.js             # Token handling
```

## API Endpoints

### Payments (NOWPayments)
- `GET /api/payments/currencies` - Get available cryptocurrencies (50+)
- `POST /api/payments/create-order` - Create NOWPayments invoice, returns invoice_url
- `POST /api/payments/verify` - Verify payment status from NOWPayments API
- `POST /api/payments/webhook` - NOWPayments IPN for payment notifications

## NOWPayments Configuration
- **API Key**: Configured in backend/.env as NOWPAYMENTS_API_KEY
- **IPN Secret**: Configured in backend/.env as NOWPAYMENTS_IPN_SECRET
- **Webhook URL**: https://votevault.preview.emergentagent.com/api/payments/webhook
- **Redirect URL**: https://votevault.preview.emergentagent.com/payment-success?order_id={order_id}
- **Minimum Payment**: $0.50 USD
- **Supported Currencies**: BTC, ETH, USDT, USDC, BNB, LTC, DOGE, SOL, MATIC, TRX, and 300+ more

## What's Been Implemented

### Completed (Feb 3, 2026)
- [x] **NOWPayments Integration**: Replaced Coinbase Commerce with NOWPayments
  - 300+ cryptocurrencies supported
  - Binance wallet compatible (BNB, BUSD)
  - Lower minimum ($0.50 USD vs $1 on Coinbase)
  - IPN webhook with HMAC-SHA512 signature verification
  - Currencies endpoint returns top 50 coins
- [x] **Currency Changed to USD**: All amounts now in USD ($) instead of INR (₹)
  - Updated all frontend pages
  - Updated all admin pages
  - Changed icons from IndianRupee to DollarSign

### Previously Completed
- [x] Full-stack scaffolding (React + FastAPI + MongoDB)
- [x] User authentication (register, login, JWT tokens)
- [x] Admin authentication with role-based access
- [x] Poll CRUD operations
- [x] Fund distribution logic
- [x] KYC workflow (submit, approve, reject)
- [x] Wallet system with withdrawal requests
- [x] Modern colorful UI theme
- [x] All admin panel features
- [x] Backend modularization
- [x] Pagination on all list pages

## Test Credentials
- **Admin**: admin@pollingwinner.com / admin123
- **User**: testuser123@test.com / test123

## Backlog / Future Enhancements

### P1 (High Priority)
- [ ] Live poll updates using WebSockets

### P2 (Nice to Have)
- [ ] Email/Push notifications
- [ ] Poll search and filtering
- [ ] User referral system
- [ ] Poll image uploads

### P3 (Future)
- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Social sharing for polls
