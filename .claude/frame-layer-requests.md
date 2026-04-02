# Frame Layer Request System — Implementation Spec

## Overview
A system where customers request custom frame layers from the admin. Managed via a dedicated **Frame Layer Requests** admin page + a section in **Customer Details**. Customers submit requests via mobile APIs; admins process, upload delivered frames, and track status.

---

## Database

### Table: `frame_requests` (migration exists)
| Column | Type | Notes |
|--------|------|-------|
| id | bigIncrements | PK |
| customer_id | foreignId → users | Who submitted the request. cascadeOnDelete |
| title | string | Short description of what they want |
| description | text, nullable | Detailed request description |
| reference_image | string, nullable | Customer-uploaded reference image path |
| status | enum: pending, in_progress, completed, rejected | Default: pending |
| admin_notes | text, nullable | Admin's internal notes |
| frame_layer_id | foreignId → frame_layers, nullable | Link to existing frame layer if applicable. nullOnDelete |
| delivered_file | string, nullable | Admin-uploaded custom frame file path |
| completed_at | timestamp, nullable | Set when status → completed |
| timestamps | | |

### Permission (in `permissions` table)
| name | slug | module |
|------|------|--------|
| View Frame Layer Requests | frame-requests.view | Frame Layer Requests |

Assigned to: Super Admin, Admin roles.

### Navigation (in `navigation_items` table)
| title | icon | route | permission_slug | sort_order |
|-------|------|-------|-----------------|------------|
| Frame Layer Requests | Inbox | /frame-requests | frame-requests.view | 6 |

---

## Backend

### Model: `FrameRequest`
- Path: `app/Models/FrameRequest.php`
- `$fillable`: customer_id, title, description, reference_image, status, admin_notes, frame_layer_id, delivered_file, completed_at
- `$casts`: completed_at => datetime
- Relationships: `customer()` → belongsTo(User), `frameLayer()` → belongsTo(FrameLayer)

### Controller: `FrameRequestController`
- Path: `app/Http/Controllers/Api/FrameRequestController.php`

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| `index` | `GET /api/frame-requests` | Admin | List all requests. Search by title/customer name. Filter by status, customer_id. Paginated (per_page default 10) |
| `show` | `GET /api/frame-requests/{id}` | Admin | View single request with customer + frameLayer |
| `update` | `PUT /api/frame-requests/{id}` | Admin | Update status, admin_notes, frame_layer_id. Upload delivered_file (multipart). Auto-sets completed_at on status→completed |
| `destroy` | `DELETE /api/frame-requests/{id}` | Admin | Deletes request + associated files |
| `customerStore` | `POST /api/my/frame-requests` | Customer | Submit new request with title, description, optional reference_image |
| `customerIndex` | `GET /api/my/frame-requests` | Customer | List own requests. Filter by status. Paginated |
| `customerCustomFrames` | `GET /api/my/custom-frames` | Customer | Get completed requests with delivered files (for mobile app) |
| `customerRequests` | `GET /api/customers/{id}/frame-requests` | Admin | Per-customer request list. Search by title. Filter by status. Paginated |

### Routes
```
# Customer/Mobile (auth:sanctum, any authenticated user)
GET    /api/my/frame-requests          → customerIndex
POST   /api/my/frame-requests          → customerStore
GET    /api/my/custom-frames           → customerCustomFrames

# Admin (auth:sanctum + role:super_admin,admin)
GET    /api/frame-requests             → index
GET    /api/frame-requests/{id}        → show
PUT    /api/frame-requests/{id}        → update
DELETE /api/frame-requests/{id}        → destroy
GET    /api/customers/{id}/frame-requests → customerRequests
```

### File Storage
- Reference images: `storage/app/public/frame-requests/references/`
- Delivered frames: `storage/app/public/frame-requests/`
- Max file size: 5MB (5120 KB)
- Old files deleted on replacement or request deletion

---

## Frontend

### Redux Slice: `frameRequestSlice.js`
- Path: `src/features/frameRequests/frameRequestSlice.js`
- Registered in store as `frameRequests`
- Thunks: `fetchFrameRequests`, `updateFrameRequest` (multipart with `_method: PUT`), `deleteFrameRequest`
- State: `items[]`, `loading`, `error`, `pagination`

### Admin Page: `FrameRequests.jsx`
- Path: `src/pages/frameRequests/FrameRequests.jsx`
- Route: `/frame-requests` (permission: `frame-requests.view`)
- Sidebar icon: `Inbox`

**Page layout:**
1. Header — "Frame Layer Requests" title + subtitle
2. Search + Filter bar — server-side search (400ms debounce) + status dropdown (Pending, In Progress, Completed, Rejected)
3. Table — Customer (avatar+name+email), Request Title (+description), Status (colored badges), Reference thumbnail, Delivered thumbnail, Date, Actions
4. Pagination — Previous, page numbers, Next
5. **ProcessModal** — view request details, reference image preview, status select, admin notes textarea, drag-drop file upload for delivered frame, optional frame_layer_id input

**Status badge colors:** pending=amber, in_progress=blue, completed=emerald, rejected=red

### Customer Details Page (modified)
- Path: `src/pages/customers/CustomerDetails.jsx`
- Added "Custom Frame Layer Requests" section between Referral System and Activity Timeline
- Uses `fetchCustomerFrameRequests` thunk from `customerManagementSlice`
- Search + filter + table (Title, Status, Delivered Frame thumbnail, Date) + pagination

### customerManagementSlice.js (modified)
- Added thunk: `fetchCustomerFrameRequests({ id, page, search, status, per_page })`
- Added state: `frameRequests[]`, `frameRequestsLoading`, `frameRequestsPagination`
- Added reducer: `clearCustomerFrameRequests`

---

## Flow Summary

```
1. Customer opens mobile app → submits frame layer request (title + description + optional reference image)
   POST /api/my/frame-requests

2. Admin sees request in Frame Layer Requests page (sidebar → Frame Layer Requests)
   GET /api/frame-requests

3. Admin clicks Process → sees details, reference image → changes status to "in_progress"
   PUT /api/frame-requests/{id}

4. Admin creates/uploads custom frame → uploads delivered_file → sets status "completed"
   PUT /api/frame-requests/{id} (multipart with delivered_file)

5. Customer fetches their custom frames in mobile app
   GET /api/my/custom-frames

6. Admin can also view per-customer requests in Customer Details page
   GET /api/customers/{id}/frame-requests
```

---

## Files Inventory

### Created
| File | Type |
|------|------|
| `backend/database/migrations/2026_04_02_200001_create_frame_requests_table.php` | Migration |
| `backend/app/Models/FrameRequest.php` | Model |
| `backend/app/Http/Controllers/Api/FrameRequestController.php` | Controller |
| `frontend/src/features/frameRequests/frameRequestSlice.js` | Redux Slice |
| `frontend/src/pages/frameRequests/FrameRequests.jsx` | Admin Page |

### Modified
| File | Changes |
|------|---------|
| `backend/routes/api.php` | Added 8 frame request routes (3 customer + 5 admin) |
| `backend/database/seeders/NavigationSeeder.php` | Added "Frame Layer Requests" nav item at sort_order 6 |
| `frontend/src/app/store.js` | Registered `frameRequests` reducer |
| `frontend/src/App.jsx` | Added `/frame-requests` route |
| `frontend/src/components/Sidebar.jsx` | Added `Inbox` icon to iconMap |
| `frontend/src/features/customers/customerManagementSlice.js` | Added `fetchCustomerFrameRequests` thunk + state |
| `frontend/src/pages/customers/CustomerDetails.jsx` | Added "Custom Frame Layer Requests" section |

### Database Records
| Table | Record |
|-------|--------|
| `permissions` | slug: `frame-requests.view`, module: `Frame Layer Requests` |
| `role_permission` | Assigned to Super Admin + Admin |
| `navigation_items` | title: `Frame Layer Requests`, icon: `Inbox`, route: `/frame-requests` |
