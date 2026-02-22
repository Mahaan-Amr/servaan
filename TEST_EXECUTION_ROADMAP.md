# Test Execution Roadmap - Inventory Optimization

## Overview

This document provides the testing strategy for validating all inventory system optimizations implemented in this session. Tests should be executed sequentially with each phase validating specific improvements.

---

## Test Environment Setup

### Prerequisites
- Backend running: `npm run dev` from `src/backend/`
- Database: PostgreSQL with dima tenant data
- API Client: Postman, curl, or similar
- Test User Credentials:
  - Manager: `alirezayousefi@dima.ir` / `manager123` (Token: Store as `$TOKEN_MANAGER`)
  - Staff: `sara@dima.ir` / `staff123` (Token: Store as `$TOKEN_STAFF`)

### Test Tenant
- Tenant ID: `67391ebd-7fb4-4e54-a311-ddbad8af8409`
- Subdomain: `dima`
- Base URL: `http://localhost:3001/api`

---

## Phase 1: Verify Performance Optimization (N+1 Query Fix)

### Objective
Verify that stock deficit queries now execute in milliseconds instead of seconds.

### Test 1.1: Stock Deficits Query Time
```bash
# Before: ~1000ms for 35 items (N queries)
# After: ~50ms for 35 items (2 queries)

curl -X GET "http://localhost:3001/api/inventory/deficits" \
  -H "Authorization: Bearer $TOKEN_MANAGER" \
  -H "X-Tenant-Subdomain: dima" \
  -w "\n%{time_total}s\n"
```

**Expected Result:**
- Response time: < 100ms
- Status: 200 OK
- Response contains array of deficit items
- Each deficit has: itemId, itemName, currentStock, minStock, deficitAmount

### Test 1.2: Inventory Valuation Query Time
```bash
# Before: ~2000ms (2N queries)
# After: ~100ms (3 queries)

curl -X GET "http://localhost:3001/api/inventory/valuation" \
  -H "Authorization: Bearer $TOKEN_MANAGER" \
  -H "X-Tenant-Subdomain: dima" \
  -w "\n%{time_total}s\n"
```

**Expected Result:**
- Response time: < 200ms
- Status: 200 OK
- Response contains: totalValue (number), items (array with itemId, currentStock, averageCost, totalValue)
- totalValue equals sum of (stock × WAC) for all items

### Test 1.3: Deficit Summary Query Time
```bash
# Before: ~1500ms (2N queries)
# After: ~100ms (3 queries)

curl -X GET "http://localhost:3001/api/inventory/deficits/summary" \
  -H "Authorization: Bearer $TOKEN_MANAGER" \
  -H "X-Tenant-Subdomain: dima"
```

**Expected Result:**
- Response time: < 200ms
- Status: 200 OK
- Response contains: totalDeficitItems, totalDeficitValue, criticalDeficits, moderateDeficits

### Test 1.4: Multiple Rapid Calls
```bash
# Verify performance under load (concurrent requests)

for i in {1..10}; do
  curl -X GET "http://localhost:3001/api/inventory/valuation" \
    -H "Authorization: Bearer $TOKEN_MANAGER" \
    -H "X-Tenant-Subdomain: dima" \
    -w "Request $i: %{time_total}s\n"
done
```

**Expected Result:**
- All 10 requests complete in < 1 second total
- No timeouts
- Consistent response times (< 100ms each)

---

## Phase 2: Verify Race Condition Prevention (Audit Upsert Fix)

### Objective
Verify that concurrent audit entry additions don't create duplicates.

### Test 2.1: Single Audit Entry Creation
```bash
# First, get audit cycle ID
AUDIT_CYCLE_ID=$(curl -s -X GET "http://localhost:3001/api/audit-cycles?status=IN_PROGRESS" \
  -H "Authorization: Bearer $TOKEN_MANAGER" \
  -H "X-Tenant-Subdomain: dima" | jq -r '.data[0].id')

# Get an item ID
ITEM_ID=$(curl -s -X GET "http://localhost:3001/api/inventory/items?limit=1" \
  -H "Authorization: Bearer $TOKEN_MANAGER" \
  -H "X-Tenant-Subdomain: dima" | jq -r '.data[0].id')

# Create audit entry
curl -X POST "http://localhost:3001/api/audit-cycles/$AUDIT_CYCLE_ID/entries" \
  -H "Authorization: Bearer $TOKEN_MANAGER" \
  -H "X-Tenant-Subdomain: dima" \
  -H "Content-Type: application/json" \
  -d "{
    \"itemId\": \"$ITEM_ID\",
    \"countedQuantity\": 100,
    \"reason\": \"Test count\"
  }"
```

**Expected Result:**
- Status: 201 Created (or 200 OK)
- Response contains audit entry with all fields

### Test 2.2: Concurrent Audit Entry Updates (Race Condition Test)
```bash
# This simulates two staff members counting the same item simultaneously

# Prepare environment variables
AUDIT_CYCLE_ID="..." # Same cycle as Test 2.1
ITEM_ID="..."        # Same item

# Terminal 1: First update
curl -X POST "http://localhost:3001/api/audit-cycles/$AUDIT_CYCLE_ID/entries" \
  -H "Authorization: Bearer $TOKEN_STAFF" \
  -H "X-Tenant-Subdomain: dima" \
  -H "Content-Type: application/json" \
  -d "{
    \"itemId\": \"$ITEM_ID\",
    \"countedQuantity\": 150,
    \"reason\": \"Staff 1 count\"
  }" &

# Terminal 2: Second update (same item, same cycle)
sleep 0.1
curl -X POST "http://localhost:3001/api/audit-cycles/$AUDIT_CYCLE_ID/entries" \
  -H "Authorization: Bearer $TOKEN_STAFF" \
  -H "X-Tenant-Subdomain: dima" \
  -H "Content-Type: application/json" \
  -d "{
    \"itemId\": \"$ITEM_ID\",
    \"countedQuantity\": 200,
    \"reason\": \"Staff 2 count\"
  }" &

wait
```

**Expected Result:**
- Both requests return 200 OK (no error)
- Database contains only ONE entry for this cycle+item combination
- Latest value is 200 (from second request)
- No "unique constraint violation" errors
- Old value 150 is replaced, not duplicated

### Test 2.3: Verify Upsert Behavior
```bash
# Get the entry we just updated
curl -X GET "http://localhost:3001/api/audit-cycles/$AUDIT_CYCLE_ID/entries" \
  -H "Authorization: Bearer $TOKEN_MANAGER" \
  -H "X-Tenant-Subdomain: dima"
```

**Expected Result:**
- Status: 200 OK
- Entry list contains only ONE entry for $ITEM_ID
- countedQuantity is 200 (latest value)
- No duplicate entries

---

## Phase 3: Verify Input Validation (Barcode, minStock, Date Range)

### Test 3.1: Barcode Format Validation
```bash
# Test 1: Valid barcode
curl -X PATCH "http://localhost:3001/api/inventory/items/{itemId}/barcode" \
  -H "Authorization: Bearer $TOKEN_MANAGER" \
  -H "X-Tenant-Subdomain: dima" \
  -H "Content-Type: application/json" \
  -d "{\"barcode\": \"ABC1234567\"}"

# Expected: 200 OK

# Test 2: Invalid barcode (too short)
curl -X PATCH "http://localhost:3001/api/inventory/items/{itemId}/barcode" \
  -H "Authorization: Bearer $TOKEN_MANAGER" \
  -H "X-Tenant-Subdomain: dima" \
  -H "Content-Type: application/json" \
  -d "{\"barcode\": \"ABC\"}"

# Expected: 400 Bad Request with message "بارکد باید 4-50 کاراکتر حروف و اعداد باشد"

# Test 3: Invalid barcode (special characters)
curl -X PATCH "http://localhost:3001/api/inventory/items/{itemId}/barcode" \
  -H "Authorization: Bearer $TOKEN_MANAGER" \
  -H "X-Tenant-Subdomain: dima" \
  -H "Content-Type: application/json" \
  -d "{\"barcode\": \"ABC@123!\"}"

# Expected: 400 Bad Request with validation error
```

### Test 3.2: minStock Validation
```bash
# Test 1: Valid minStock
curl -X PATCH "http://localhost:3001/api/inventory/items/{itemId}" \
  -H "Authorization: Bearer $TOKEN_MANAGER" \
  -H "X-Tenant-Subdomain: dima" \
  -H "Content-Type: application/json" \
  -d "{\"minStock\": 10}"

# Expected: 200 OK

# Test 2: Invalid minStock (negative)
curl -X PATCH "http://localhost:3001/api/inventory/items/{itemId}" \
  -H "Authorization: Bearer $TOKEN_MANAGER" \
  -H "X-Tenant-Subdomain: dima" \
  -H "Content-Type: application/json" \
  -d "{\"minStock\": -5}"

# Expected: 400 Bad Request with message "حد اقل موجودی نمی‌تواند منفی باشد"
```

### Test 3.3: Date Range Validation
```bash
# Test 1: Valid date range (start < end)
curl -X GET "http://localhost:3001/api/inventory?startDate=2025-01-01&endDate=2025-12-31" \
  -H "Authorization: Bearer $TOKEN_MANAGER" \
  -H "X-Tenant-Subdomain: dima"

# Expected: 200 OK with filtered results

# Test 2: Invalid date range (start > end)
curl -X GET "http://localhost:3001/api/inventory?startDate=2025-12-31&endDate=2025-01-01" \
  -H "Authorization: Bearer $TOKEN_MANAGER" \
  -H "X-Tenant-Subdomain: dima"

# Expected: 400 Bad Request with message "تاریخ شروع باید قبل از تاریخ پایان باشد"
```

---

## Phase 4: Verify Backend Deletion Enforcement (7-Day Limit)

### Objective
Verify that entry deletion is enforced on the backend, not just frontend.

### Test 4.1: Recent Entry Deletion (Within 7 Days)
```bash
# Create a new entry (will be within 7 days)
ENTRY_ID=$(curl -s -X POST "http://localhost:3001/api/inventory" \
  -H "Authorization: Bearer $TOKEN_MANAGER" \
  -H "X-Tenant-Subdomain: dima" \
  -H "Content-Type: application/json" \
  -d "{
    \"itemId\": \"$(ITEM_ID)\",
    \"quantity\": 10,
    \"type\": \"IN\",
    \"unitPrice\": 100,
    \"note\": \"Test entry for deletion\"
  }" | jq -r '.data.id')

# Try to delete it (should succeed)
curl -X DELETE "http://localhost:3001/api/inventory/$ENTRY_ID" \
  -H "Authorization: Bearer $TOKEN_MANAGER" \
  -H "X-Tenant-Subdomain: dima"

# Expected: 200 OK with message "تراکنش انبار با موفقیت حذف شد (حذف نرم)"
```

### Test 4.2: Old Entry Deletion Rejection (Older Than 7 Days)
```bash
# Get an old entry from database (created more than 7 days ago)
OLD_ENTRY_ID=$(curl -s -X GET "http://localhost:3001/api/inventory?limit=100" \
  -H "Authorization: Bearer $TOKEN_MANAGER" \
  -H "X-Tenant-Subdomain: dima" | jq -r '.data[] | select(.createdAt < (now - 7*24*3600) | @uri) | .id' | head -1)

# Try to delete old entry (should fail with 403)
curl -X DELETE "http://localhost:3001/api/inventory/$OLD_ENTRY_ID" \
  -H "Authorization: Bearer $TOKEN_MANAGER" \
  -H "X-Tenant-Subdomain: dima"

# Expected: 403 Forbidden with message "نمی‌توان رکوردهای قدیمی را حذف کرد"
```

### Test 4.3: Role-Based Deletion Permissions
```bash
# Test 3a: Manager can delete any recent entry
curl -X DELETE "http://localhost:3001/api/inventory/$RECENT_ENTRY_ID" \
  -H "Authorization: Bearer $TOKEN_MANAGER" \
  -H "X-Tenant-Subdomain: dima"

# Expected: 200 OK (Manager has full access)

# Test 3b: Staff can delete only their own recent entries
# First create an entry as Staff
STAFF_ENTRY_ID=$(curl -s -X POST "http://localhost:3001/api/inventory" \
  -H "Authorization: Bearer $TOKEN_STAFF" \
  -H "X-Tenant-Subdomain: dima" \
  -H "Content-Type: application/json" \
  -d "{
    \"itemId\": \"$(ITEM_ID)\",
    \"quantity\": 5,
    \"type\": \"IN\",
    \"unitPrice\": 50
  }" | jq -r '.data.id')

# Staff deletes own entry (should succeed)
curl -X DELETE "http://localhost:3001/api/inventory/$STAFF_ENTRY_ID" \
  -H "Authorization: Bearer $TOKEN_STAFF" \
  -H "X-Tenant-Subdomain: dima"

# Expected: 200 OK (Staff owns this entry)

# Test 3c: Staff tries to delete Manager's entry (should fail)
MANAGER_ENTRY_ID=$(curl -s -X POST "http://localhost:3001/api/inventory" \
  -H "Authorization: Bearer $TOKEN_MANAGER" \
  -H "X-Tenant-Subdomain: dima" \
  -H "Content-Type: application/json" \
  -d "{
    \"itemId\": \"$(ITEM_ID)\",
    \"quantity\": 20,
    \"type\": \"IN\",
    \"unitPrice\": 100
  }" | jq -r '.data.id')

curl -X DELETE "http://localhost:3001/api/inventory/$MANAGER_ENTRY_ID" \
  -H "Authorization: Bearer $TOKEN_STAFF" \
  -H "X-Tenant-Subdomain: dima"

# Expected: 403 Forbidden with message "شما دسترسی لازم برای این عملیات را ندارید"
```

---

## Phase 5: Verify Tenant Isolation

### Objective
Ensure all optimizations maintain proper multi-tenant isolation.

### Test 5.1: Tenant Data Isolation
```bash
# Create second test tenant (if needed)
# List deficits for dima tenant
curl -X GET "http://localhost:3001/api/inventory/deficits" \
  -H "Authorization: Bearer $TOKEN_MANAGER" \
  -H "X-Tenant-Subdomain: dima"

# Should return dima's deficits only
# Should NOT include any other tenant's data
```

**Expected Result:**
- Only dima tenant's items appear
- Deficits calculation only includes dima's stock
- No cross-tenant data leakage

### Test 5.2: Audit Isolation
```bash
# Get audit cycles for dima tenant
curl -X GET "http://localhost:3001/api/audit-cycles" \
  -H "Authorization: Bearer $TOKEN_MANAGER" \
  -H "X-Tenant-Subdomain: dima"

# All cycles should be from dima tenant only
```

**Expected Result:**
- Only dima's audit cycles returned
- All entries within cycles belong to dima
- No other tenant data visible

---

## Phase 6: Integration Testing

### Test 6.1: Complete Workflow
```bash
# 1. Create new item
ITEM_ID=$(curl -s -X POST "http://localhost:3001/api/inventory/items" \
  -H "Authorization: Bearer $TOKEN_MANAGER" \
  -H "X-Tenant-Subdomain: dima" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Test Product\",
    \"barcode\": \"TEST123456\",
    \"minStock\": 5
  }" | jq -r '.id')

# 2. Add stock entry (IN)
curl -X POST "http://localhost:3001/api/inventory" \
  -H "Authorization: Bearer $TOKEN_MANAGER" \
  -H "X-Tenant-Subdomain: dima" \
  -H "Content-Type: application/json" \
  -d "{
    \"itemId\": \"$ITEM_ID\",
    \"quantity\": 100,
    \"type\": \"IN\",
    \"unitPrice\": 50
  }"

# 3. Verify stock calculation works
curl -X GET "http://localhost:3001/api/inventory/stock?itemId=$ITEM_ID" \
  -H "Authorization: Bearer $TOKEN_MANAGER" \
  -H "X-Tenant-Subdomain: dima"

# Expected: currentStock = 100

# 4. Verify valuation includes new item
curl -X GET "http://localhost:3001/api/inventory/valuation" \
  -H "Authorization: Bearer $TOKEN_MANAGER" \
  -H "X-Tenant-Subdomain: dima"

# Expected: Contains new item with correct value (100 × 50 = 5000)

# 5. Create physical count entry
AUDIT_CYCLE_ID="..."
curl -X POST "http://localhost:3001/api/audit-cycles/$AUDIT_CYCLE_ID/entries" \
  -H "Authorization: Bearer $TOKEN_MANAGER" \
  -H "X-Tenant-Subdomain: dima" \
  -H "Content-Type: application/json" \
  -d "{
    \"itemId\": \"$ITEM_ID\",
    \"countedQuantity\": 95,
    \"reason\": \"Physical count shows 5 units missing\"
  }"

# 6. Verify discrepancy calculated
curl -X GET "http://localhost:3001/api/audit-cycles/$AUDIT_CYCLE_ID/discrepancies" \
  -H "Authorization: Bearer $TOKEN_MANAGER" \
  -H "X-Tenant-Subdomain: dima"

# Expected: Discrepancy = -5 units = -250 value
```

---

## Test Results Summary Template

```markdown
## Test Execution Results - [Date]

### Phase 1: Performance Optimization
- [ ] Test 1.1: Stock Deficits < 100ms ✓
- [ ] Test 1.2: Valuation < 200ms ✓
- [ ] Test 1.3: Summary < 200ms ✓
- [ ] Test 1.4: Concurrent calls consistent ✓

### Phase 2: Race Condition Prevention
- [ ] Test 2.1: Single entry creation ✓
- [ ] Test 2.2: Concurrent updates (no duplicates) ✓
- [ ] Test 2.3: Verify upsert behavior ✓

### Phase 3: Input Validation
- [ ] Test 3.1: Barcode validation (valid/invalid) ✓
- [ ] Test 3.2: minStock validation (valid/invalid) ✓
- [ ] Test 3.3: Date range validation (valid/invalid) ✓

### Phase 4: Backend Enforcement
- [ ] Test 4.1: Recent entry deletion allowed ✓
- [ ] Test 4.2: Old entry deletion rejected ✓
- [ ] Test 4.3: Role-based permissions enforced ✓

### Phase 5: Tenant Isolation
- [ ] Test 5.1: Tenant data isolation verified ✓
- [ ] Test 5.2: Audit isolation verified ✓

### Phase 6: Integration
- [ ] Test 6.1: Complete workflow functional ✓

**Overall Status**: ✅ ALL TESTS PASSED
**Performance Improvement Verified**: 15-20x faster
**Security**: Fully enforced on backend
**Data Integrity**: Race condition prevented
```

---

## Troubleshooting

### Issue: Query still slow
- Check if helpers are being called
- Verify Prisma client was regenerated
- Check database indexes on tenantId, itemId

### Issue: Race condition still occurring
- Verify schema has `@@unique([auditCycleId, itemId])`
- Ensure using upsert pattern, not findFirst + create
- Check database constraints are enforced

### Issue: Validation not working
- Verify validateStockEntry is called before operations
- Check error messages match expected Farsi text
- Ensure function signature includes new parameters

### Issue: Deletion still allowed for old entries
- Verify canDeleteInventoryEntry is called on DELETE route
- Check date calculation: daysDiff > 7
- Ensure permission check returns false correctly

---

## Performance Benchmarking Commands

```bash
# Measure average response time for stock deficits
for i in {1..5}; do
  curl -s -o /dev/null -w "Time: %{time_total}s\n" \
    -X GET "http://localhost:3001/api/inventory/deficits" \
    -H "Authorization: Bearer $TOKEN_MANAGER" \
    -H "X-Tenant-Subdomain: dima"
done

# Measure inventory valuation
for i in {1..5}; do
  curl -s -o /dev/null -w "Time: %{time_total}s\n" \
    -X GET "http://localhost:3001/api/inventory/valuation" \
    -H "Authorization: Bearer $TOKEN_MANAGER" \
    -H "X-Tenant-Subdomain: dima"
done

# Check database query logs
# (Enable slow query log in PostgreSQL: log_min_duration_statement = 100)
```

---

**Test Roadmap Version**: 1.0  
**Last Updated**: January 16, 2025  
**Status**: Ready for Execution ✅
