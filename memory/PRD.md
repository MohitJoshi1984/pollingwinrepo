# The Polling Winner - Product Requirements Document

## Original Problem Statement
Build a web app named "The Polling Winner" where users can vote on polls by paying money. When a poll ends, the total amount collected is distributed among winning voters proportionally based on their vote count.

## Core Features

### User-Facing App
- Homepage displaying all available polls with pagination
- Each poll shows: total votes cast, voting deadline, LIVE/ENDED status
- Poll Details page (requires login): images, total votes, deadline, cost per vote
- Users select number of votes and pay via Cashfree (includes dynamic gateway fee)
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

### Fund Distribution Logic (UPDATED)
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
- **Payments**: Cashfree Payment Gateway (Sandbox)

## Architecture (UPDATED - Modular Structure)
```
/app/
├── backend/
│   ├── .env                    # Mongo, JWT, Cashfree credentials
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
│       ├── payments.py         # Payment endpoints
│       ├── users.py            # User profile, KYC, wallet endpoints
│       └── admin.py            # Admin endpoints (with pagination)
└── frontend/
    ├── public/index.html       # Cashfree SDK script
    └── src/
        ├── pages/              # All user and admin pages
        ├── components/
        │   ├── Header.js
        │   └── Pagination.js   # Reusable pagination component
        └── auth.js             # Token handling
```

## API Endpoints (with Pagination)

### User Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login (blocks admin)
- `GET /api/auth/me` - Get current user

### Polls
- `GET /api/polls?page=1&limit=20` - List all polls with pagination
- `GET /api/polls/{id}` - Poll details with result_details (auth required)

### Payments
- `POST /api/payments/create-order` - Create Cashfree order
- `POST /api/payments/verify` - Verify payment status

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
- `orders` - Payment orders
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
- [x] Cashfree payment integration (sandbox)
- [x] Fund distribution logic (total amount / winner votes)
- [x] KYC workflow (submit, approve, reject)
- [x] Wallet system with withdrawal requests
- [x] Modern colorful UI theme
- [x] All admin panel features
- [x] End-to-end testing completed

### Completed (Jan 26, 2026)
- [x] **Backend Refactoring**: Split monolithic server.py into modular routers
  - Created /core/config.py, database.py, security.py
  - Created /routes/auth.py, polls.py, payments.py, users.py, admin.py
  - Created /models/schemas.py
- [x] **Pagination**: Added to all list endpoints
  - Homepage polls (9 per page)
  - Admin Polls (10 per page)
  - Admin Transactions (20 per page)
  - Admin Users (20 per page)
- [x] **Payment Verification Retry**: Enhanced PaymentSuccess page
  - Auto-retry up to 5 times with 3-second delay
  - Manual retry button for users
  - Clear status indicators (loading, success, pending, error)
- [x] **UI Updates**: 
  - "Ended" text for declared polls (was "Ends")
  - Removed redundant "Total Votes" from results section
  - Reusable Pagination component

### Test Results (iteration_5.json - Jan 26, 2026)
- Backend: 100% (22/22 tests passed)
- Frontend: 100% (all pages and flows working)
- Bug fixed: AdminUsers.js pagination handling

## Test Credentials
- **Admin**: admin@pollingwinner.com / admin123
- **User**: testuser123@test.com / test123

## Backlog / Future Enhancements

### P1 (Completed)
- [x] End-to-end testing - COMPLETED
- [x] Backend refactoring - COMPLETED
- [x] Pagination - COMPLETED
- [x] Payment retry mechanism - COMPLETED

### P2 (Nice to Have)
- [ ] Email/Push notifications for KYC approval, poll results, withdrawals
- [ ] Real-time updates using WebSockets
- [ ] Poll search and filtering
- [ ] User referral system
- [ ] Better poll images (currently using placeholders)

### P3 (Future)
- [ ] Mobile app (React Native)
- [ ] Multiple payment gateways
- [ ] Advanced analytics dashboard
- [ ] Social sharing for polls
