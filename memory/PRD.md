# The Polling Winner - Product Requirements Document

## Original Problem Statement
Build a web app named "The Polling Winner" where users can vote on polls by paying money. When a poll ends, the money from losing voters is distributed among winning voters proportionally based on their vote count.

## Core Features

### User-Facing App
- Homepage/dashboard displaying all available polls (e-commerce style)
- Each poll shows: total votes cast, voting deadline
- Poll Details page (requires login): images, total votes, deadline, cost per vote
- Users select number of votes and pay via Cashfree (includes 2% gateway fee)
- Successful payments add poll to user's "My Polls" section
- User profile management: name, UPI ID for withdrawals, KYC details
- KYC verification required before withdrawals (admin approval needed)
- Cash Wallet for winnings - can be used for future polls or withdrawn (10% fee)

### Admin Panel
- Separate admin login
- Full CRUD for polls (Create, Edit, Delete)
- View poll statistics and declare results
- Manage payment gateway charge % and withdrawal charge %
- Review and approve/reject user KYC submissions
- User management (view/update details)
- Transaction overview

### Fund Distribution Logic
When a poll concludes:
```
per_vote_winning = total_losing_amount / winning_votes
each_winner_gets = their_votes * per_vote_winning
```

## Tech Stack
- **Frontend**: React, React Router, Axios, Tailwind-esque custom styling
- **Backend**: FastAPI, Pydantic
- **Database**: MongoDB
- **Authentication**: JWT (JSON Web Tokens)
- **Payments**: Cashfree Payment Gateway (Sandbox)

## Architecture
```
/app/
├── backend/
│   ├── .env              # Mongo, JWT, Cashfree credentials
│   ├── requirements.txt
│   └── server.py         # All API endpoints
└── frontend/
    ├── public/index.html # Cashfree SDK script
    └── src/
        ├── pages/        # All user and admin pages
        ├── components/   # Header, UI components
        └── auth.js       # Token handling
```

## API Endpoints

### User Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Polls
- `GET /api/polls` - List all polls (public)
- `GET /api/polls/{id}` - Poll details (auth required)

### Payments
- `POST /api/payments/create-order` - Create Cashfree order
- `POST /api/payments/verify` - Verify payment status

### User Features
- `GET /api/my-polls` - User's voted polls
- `GET /api/profile` - Get profile
- `PUT /api/profile` - Update profile
- `POST /api/kyc/submit` - Submit KYC
- `GET /api/wallet` - Wallet balance and transactions
- `POST /api/withdrawal/request` - Request withdrawal

### Admin
- `POST /api/admin/polls` - Create poll
- `PUT /api/admin/polls/{id}` - Update poll
- `DELETE /api/admin/polls/{id}` - Delete poll
- `POST /api/admin/polls/{id}/set-result` - Declare winner
- `GET /api/admin/kyc-requests` - Pending KYC requests
- `POST /api/admin/kyc/{id}/approve` - Approve KYC
- `POST /api/admin/kyc/{id}/reject` - Reject KYC
- `GET /api/admin/users` - List users
- `GET /api/admin/transactions` - All transactions
- `GET /api/admin/settings` - Get settings
- `PUT /api/admin/settings` - Update settings
- `GET /api/admin/dashboard-stats` - Dashboard statistics

## Database Collections
- `users` - User accounts with wallet, KYC status
- `polls` - Poll definitions with options and vote counts
- `user_votes` - Individual vote records
- `orders` - Payment orders
- `transactions` - Completed transactions
- `kyc_requests` - KYC submissions
- `withdrawal_requests` - Withdrawal requests
- `settings` - App settings (charges %)

## What's Been Implemented (Jan 18, 2026)

### Completed
- [x] Full-stack scaffolding (React + FastAPI + MongoDB)
- [x] User authentication (register, login, JWT tokens)
- [x] Admin authentication with role-based access
- [x] Poll CRUD operations
- [x] Cashfree payment integration (sandbox)
  - Order creation with gateway fee calculation
  - Payment verification
  - Vote recording after successful payment
- [x] Fund distribution logic (set-result endpoint)
- [x] KYC workflow (submit, approve, reject)
- [x] Wallet system with withdrawal requests
- [x] Modern colorful UI theme (Option A)
- [x] All admin panel features

### Test Results (iteration_3.json - Jan 25, 2026)
- Backend: 100% (26/26 tests passed)
- Frontend: 100% (all pages and flows working)

### P1 E2E Testing Completed (Jan 25, 2026)
- [x] User Registration flow - PASS
- [x] User Login flow with role separation - PASS
- [x] Admin Login via /admin/login - PASS
- [x] Poll listing and voting with dynamic gateway charge - PASS
- [x] Payment order creation via Cashfree - PASS
- [x] My Polls page with aggregated votes - PASS
- [x] Profile page with KYC submission - PASS
- [x] Wallet page with withdrawal functionality - PASS
- [x] Admin Dashboard stats - PASS
- [x] Admin Polls CRUD and result declaration - PASS
- [x] Admin KYC approve/reject workflow - PASS
- [x] Admin Settings for charges - PASS
- [x] Dynamic payment gateway charge from admin settings - PASS
- [x] Role separation (admin/user endpoints) - PASS

### Bug Fixes (Jan 18, 2026)
- **Fixed Cashfree Payment Verification**: Added missing `order_id` parameter to `CreateOrderRequest`. Previously, the order was created without passing our order ID to Cashfree, causing payment verification to fail with "order_not_found" error. Now the full payment flow works correctly.

- **Fixed Multi-Option Voting Display**: Updated vote storage to track votes per user + poll + option combination (not just user + poll). Now when a user votes for multiple options on the same poll, each option's votes are tracked and displayed separately in My Polls page.

## Test Credentials
- **Admin**: admin@pollingwinner.com / admin123
- **User**: Create via registration

## Backlog / Future Enhancements

### P1 (Should Have)
- [ ] End-to-end user flow testing with actual Cashfree payments
- [ ] Email notifications for KYC approval, poll results, withdrawals

### P2 (Nice to Have)
- [ ] Refactor server.py into separate router modules
- [ ] Add pagination for polls and transactions
- [ ] Real-time updates using WebSockets
- [ ] Poll search and filtering
- [ ] User referral system

### P3 (Future)
- [ ] Mobile app (React Native)
- [ ] Multiple payment gateways
- [ ] Advanced analytics dashboard
