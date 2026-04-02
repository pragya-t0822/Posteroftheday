# Referral System — Implementation Spec

## Overview
A referral system integrated into the **existing** Customer Details page and Settings page. No new standalone pages, sidebar entries, or Redux slices required.

---

## Database

### Table: `referrals` (migration exists)
| Column | Type | Notes |
|--------|------|-------|
| id | bigIncrements | PK |
| referrer_id | foreignId → users | Customer who shared the code. cascadeOnDelete |
| referred_id | foreignId → users, nullable | Customer who signed up using the code. nullOnDelete |
| referral_code | varchar(20), indexed | The referrer's code (copied from users table at creation time) |
| reward_earned | decimal(10,2), default 0 | Amount credited on successful referral |
| status | enum: pending, successful, expired | Default: pending |
| timestamps | | |

### Columns added to `users` table (migration exists)
| Column | Type | Notes |
|--------|------|-------|
| referral_code | varchar(20), unique, nullable | Auto-generated 8-char code at registration |
| referred_by | foreignId → users, nullable | Who referred this customer. nullOnDelete |
| wallet_balance | decimal(10,2), default 0 | Credited when a referral is marked successful |

### Settings key (uses existing key-value `settings` table)
| Key | Default | Group |
|-----|---------|-------|
| `referral_reward_amount` | 0 | referral |

---

## Backend

### Model: `Referral`
- Path: `app/Models/Referral.php`
- `$fillable`: referrer_id, referred_id, referral_code, reward_earned, status
- `$casts`: reward_earned => decimal:2
- Relationships: `referrer()` → belongsTo(User, 'referrer_id'), `referred()` → belongsTo(User, 'referred_id')

### Model: `User` (modified)
- Added to `$fillable`: referral_code, referred_by, wallet_balance
- Added to `casts()`: wallet_balance => decimal:2
- Added relationships: `referrals()` → hasMany(Referral, 'referrer_id'), `referredBy()` → belongsTo(User, 'referred_by')

### Controller: `CustomerController` (modified)
| Method | Endpoint | What it does |
|--------|----------|--------------|
| `show()` | `GET /api/customers/{id}` | Now also returns `referral_stats` (total_referrals, successful_referrals, total_rewards_earned) and `wallet_balance` |
| `referrals()` | `GET /api/customers/{id}/referrals` | Paginated list of this customer's referrals. Server-side search (referred name, email, code) + status filter + pagination (per_page default 10) |
| `updateReferralStatus()` | `PATCH /api/customers/{id}/referrals/{referralId}/status` | Changes referral status. If → successful: reads `referral_reward_amount` from settings, sets reward_earned, credits wallet. If successful →: deducts from wallet (capped at 0, never negative) |

### Controller: `CustomerRegistrationController` (modified)
- Accepts optional `referral_code` in registration request
- After creating user: generates unique 8-char uppercase alphanumeric `referral_code` and saves to user
- If `referral_code` provided: looks up referrer, sets `referred_by` on new user, creates pending `referrals` row

### Routes (inside `auth:sanctum` + `role:super_admin,admin`)
```
GET    /api/customers/{customer}/referrals
PATCH  /api/customers/{customer}/referrals/{referral}/status
```
Settings endpoints already handle `referral_reward_amount` via existing `GET/POST /api/settings`.

---

## Frontend

### Redux: `customerManagementSlice.js` (modified, no new slice)
- Added thunks: `fetchCustomerReferrals({ id, page, search, status, per_page })`, `updateReferralStatus({ customerId, referralId, status })`
- Added state: `referrals[]`, `referralsLoading`, `referralsPagination`
- Added reducer: `clearCustomerReferrals`

### Page: `CustomerDetails.jsx` (modified)
New section added between Subscription History and Activity Timeline:

1. **Referral Code & Link** — displays code (monospace, copy button) and referral link (copy + share button)
2. **Summary Cards** (3 cards) — Total Referrals, Successful Referrals, Wallet Balance (with total earned subtitle)
3. **Search + Filter Bar** — server-side search by referred user name + status dropdown (All/Pending/Successful/Expired) with 400ms debounce
4. **Referred Users Table** — columns: Referred User (avatar+name+email), Status (colored badge), Reward Earned, Date, Actions (status change dropdown)
5. **Pagination** — Previous, page numbers with ellipsis, Next
6. **Share Modal** — shows code prominently, copyable link, social share buttons (WhatsApp, X, Facebook, Email)

### Page: `Settings.jsx` (modified)
- Added "Referral Program" tab to existing TABS array
- `ReferralTab` component: number input for reward amount per successful referral, info box explaining the flow, save button using existing settings pattern

### Page: `CustomerRegister.jsx` (modified)
- Reads `?ref=` query param from URL via `useSearchParams`
- Passes `referral_code` to backend registration if present

---

## Flow Summary

```
1. Customer registers → auto-generates unique referral_code on users table
2. Customer shares link: /get-started?ref=ABCD1234
3. New user clicks link → CustomerRegister reads ?ref param → sends referral_code in POST /customer/register
4. Backend links referred_by, creates pending referral row
5. Admin views Customer Details → sees referral stats, referred users table
6. Admin changes referral status to "successful" → reward_earned set from settings, wallet_balance credited
7. Admin configures reward amount in Settings → Referral Program tab
```

---

## Files Inventory

### Created
| File | Type |
|------|------|
| `backend/database/migrations/2026_04_02_100001_create_referrals_table.php` | Migration |
| `backend/database/migrations/2026_04_02_100002_add_referral_fields_to_users_table.php` | Migration |
| `backend/app/Models/Referral.php` | Model |

### Modified
| File | Changes |
|------|---------|
| `backend/app/Models/User.php` | Added referral fields to $fillable, casts, relationships |
| `backend/app/Http/Controllers/Api/CustomerController.php` | Added referral stats to show(), referrals(), updateReferralStatus() |
| `backend/app/Http/Controllers/Api/CustomerRegistrationController.php` | Auto-generate code, handle ref param |
| `backend/routes/api.php` | Added 2 referral routes under customers |
| `frontend/src/features/customers/customerManagementSlice.js` | Added referral thunks + state |
| `frontend/src/pages/customers/CustomerDetails.jsx` | Added referral section, share modal |
| `frontend/src/pages/settings/Settings.jsx` | Added Referral Program tab |
| `frontend/src/pages/customer/CustomerRegister.jsx` | Capture ref query param |
