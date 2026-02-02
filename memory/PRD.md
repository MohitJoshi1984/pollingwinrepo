# The Polling Winner - Product Requirements Document

## Original Problem Statement
Build a web app named "The Polling Winner" where users can vote on polls by paying money. When a poll ends, the total amount collected is distributed among winning voters proportionally based on their vote count.

## Core Features

### User-Facing App
- Homepage displaying all available polls with pagination
- Each poll shows: total votes cast, voting deadline, LIVE/ENDED status
- Poll Details page (requires login): images, total votes, deadline, cost per vote
- Users select number of votes and pay via **Coinbase Commerce (Cryptocurrency)**
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
Note: Total amount from ALL voters is distributed to winners (not just losers' money).

## Tech Stack
- **Frontend**: React, React Router, Axios, Custom styling with gradients
- **Backend**: FastAPI, Pydantic, Modular routers
- **Database**: MongoDB
- **Authentication**: JWT (JSON Web Tokens)
- **Payments**: Coinbase Commerce (Cryptocurrency - BTC, ETH, USDC, etc.)

## Architecture
```
/app/
├── backend/
│   ├── .env                    # Mongo, JWT, Coinbase Commerce credentials
│   ├── requirements.txt
│   ├── server.py               # Main FastAPI app with router imports
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py           # Environment configuration
│   │   ├── database.py         # MongoDB connection
│   │   └── security.py         # JWT, password hashing, auth dependencies
│   ├── models/
│   │   ├── __init__.py
│   │   └── schemas.py          # Pydantic models
│   └── routes/
│       ├── __init__.py
│       ├── auth.py             # Authentication endpoints
│       ├── polls.py            # Poll endpoints (with pagination)
│       ├── payments.py         # Coinbase Commerce payment endpoints
│       ├── users.py            # User profile, KYC, wallet endpoints
│       └── admin.py            # Admin endpoints (with pagination)
└── frontend/
    ├── public/index.html
    └── src/
        ├── pages/              # All user and admin pages
        ├── components/
        │   ├── Header.js
        │   └── Pagination.js   # Reusable pagination component
        └── auth.js             # Token handling
```

## API Endpoints

### User Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login (blocks admin)
- `GET /api/auth/me` - Get current user

### Polls
- `GET /api/polls?page=1&limit=20` - List all polls with pagination
- `GET /api/polls/{id}` - Poll details with result_details (auth required)

### Payments (Coinbase Commerce)
- `POST /api/payments/create-order` - Create Coinbase Commerce charge, returns hosted_url
- `POST /api/payments/verify` - Verify payment status from Coinbase API
- `POST /api/payments/webhook` - Coinbase Commerce webhook for payment notifications

### User Features
- `GET /api/my-polls` - User's voted polls with dynamic winning calculation
- `GET /api/profile` - Get profile
- `PUT /api/profile` - Update profile
- `POST /api/kyc/submit` - Submit KYC
- `GET /api/wallet` - Wallet balance and transactions
- `POST /api/withdrawal/request` - Request withdrawal
- `GET /api/settings/public` - Get public settings (gateway charge %)

### Admin
- `POST /api/admin/login` - Admin login (blocks regular users)
- `POST /api/admin/polls` - Create poll
- `PUT /api/admin/polls/{id}` - Update poll
- `DELETE /api/admin/polls/{id}` - Delete poll
- `POST /api/admin/polls/{id}/set-result` - Declare winner
- `GET /api/admin/polls/{id}/result-stats` - Get detailed result statistics
- `GET /api/admin/kyc-requests` - Pending KYC requests
- `POST /api/admin/kyc/{id}/approve` - Approve KYC
- `POST /api/admin/kyc/{id}/reject` - Reject KYC
- `GET /api/admin/users?page=1&limit=20` - List users with pagination
- `GET /api/admin/transactions?page=1&limit=20` - Transactions with pagination
- `GET /api/admin/settings` - Get settings
- `PUT /api/admin/settings` - Update settings
- `GET /api/admin/dashboard-stats` - Dashboard statistics

## Database Collections
- `users` - User accounts with wallet, KYC status
- `polls` - Poll definitions with options and vote counts
- `user_votes` - Individual vote records per user+poll+option
- `orders` - Payment orders (includes charge_code for Coinbase)
- `transactions` - Completed transactions (vote, winning)
- `kyc_requests` - KYC submissions
- `withdrawal_requests` - Withdrawal requests
- `settings` - App settings (gateway %, withdrawal %)

## What's Been Implemented

### Completed (Jan 18-25, 2026)
- [x] Full-stack scaffolding (React + FastAPI + MongoDB)
- [x] User authentication (register, login, JWT tokens)
- [x] Admin authentication with role-based access
- [x] Poll CRUD operations
- [x] Fund distribution logic (total amount / winner votes)
- [x] KYC workflow (submit, approve, reject)
- [x] Wallet system with withdrawal requests
- [x] Modern colorful UI theme
- [x] All admin panel features
- [x] End-to-end testing completed

### Completed (Jan 26, 2026)
- [x] **Backend Refactoring**: Split monolithic server.py into modular routers
- [x] **Pagination**: Added to all list endpoints
- [x] **Payment Verification Retry**: Enhanced PaymentSuccess page

### Completed (Feb 2, 2026)
- [x] **Coinbase Commerce Integration**: Replaced Cashfree with cryptocurrency payments
  - Supports BTC, ETH, USDC, and other cryptocurrencies
  - Hosted checkout (redirects to commerce.coinbase.com)
  - Webhook integration for payment confirmation
  - INR to USD conversion (1 USD = 83 INR, min $1 charge)
  - Blockchain confirmation status on PaymentSuccess page
  - 10 auto-retries with 5-second delay for payment verification
- [x] **UI Updates for Crypto**:
  - Bitcoin icon on pending payment screen
  - "Awaiting Blockchain Confirmation" messaging
  - Crypto-specific user guidance

### Test Results (iteration_6.json - Feb 2, 2026)
- Backend: 100% (31/31 tests passed)
- Frontend: 100% (all pages and flows working)
- Coinbase Commerce integration fully tested

## Coinbase Commerce Configuration
- **API Key**: Configured in backend/.env as COINBASE_COMMERCE_API_KEY
- **Webhook Secret**: Configured in backend/.env as COINBASE_WEBHOOK_SECRET
- **Webhook URL**: https://votevault.preview.emergentagent.com/api/payments/webhook
- **Redirect URL**: https://votevault.preview.emergentagent.com/payment-success?order_id={order_id}

## Test Credentials
- **Admin**: admin@pollingwinner.com / admin123
- **User**: testuser123@test.com / test123

## Backlog / Future Enhancements

### P1 (Completed)
- [x] End-to-end testing - COMPLETED
- [x] Backend refactoring - COMPLETED
- [x] Pagination - COMPLETED
- [x] Payment retry mechanism - COMPLETED
- [x] Coinbase Commerce integration - COMPLETED

### P2 (Nice to Have)
- [ ] Email/Push notifications for KYC approval, poll results, withdrawals
- [ ] Real-time updates using WebSockets
- [ ] Poll search and filtering
- [ ] User referral system
- [ ] Better poll images (currently using placeholders)

### P3 (Future)
- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Social sharing for polls
