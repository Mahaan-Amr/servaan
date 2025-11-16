# 📋 Inventory Management - Delete Operations Analysis

## Executive Summary

This document provides a comprehensive analysis of all DELETE operations in the Inventory Management workspace, categorizing them as **Soft Delete** or **Hard Delete**, and providing recommendations for implementing consistent soft delete functionality.

---

## 🔍 DELETE Operations Found

### 1. **Inventory Entry Deletion** ❌ **HARD DELETE**

**Location:**
- Backend: `src/backend/src/routes/inventoryRoutes.ts` (line 1328-1352)
- Frontend: `src/frontend/services/inventoryService.ts` (line 75-81)
- Frontend UI: `src/frontend/app/workspaces/inventory-management/inventory/transactions/page.tsx`

**Current Implementation:**
```typescript
// HARD DELETE - Permanently removes from database
await prisma.inventoryEntry.delete({
  where: { id }
});
```

**Details:**
- **Route:** `DELETE /api/inventory/:id`
- **Authorization:** ADMIN, MANAGER only
- **Current Behavior:** Permanently deletes the inventory transaction
- **Impact:** 
  - ❌ **Loses historical data** - No audit trail
  - ❌ **Affects stock calculations** - If deleted, stock history becomes inconsistent
  - ❌ **No recovery possible** - Once deleted, cannot be restored
- **Schema:** `InventoryEntry` model does NOT have `deletedAt` or `isActive` fields

**Recommendation:** ⚠️ **CRITICAL** - Should be converted to soft delete immediately as inventory entries are critical for:
- Stock history tracking
- Audit compliance
- Financial reporting
- Historical analysis

---

### 2. **Item Deletion** ⚠️ **CONDITIONAL (Soft/Hard)**

**Location:**
- Backend: `src/backend/src/routes/itemRoutes.ts` (line 222-295)
- Frontend: `src/frontend/services/itemService.ts` (line 64-70)
- Frontend UI: `src/frontend/app/workspaces/inventory-management/items/page.tsx` (line 81-108)

**Current Implementation:**
```typescript
// CONDITIONAL DELETE:
// - If item has inventory entries → SOFT DELETE (isActive = false)
// - If item has NO inventory entries → HARD DELETE
if (item.inventoryEntries.length > 0) {
  await prisma.item.update({
    where: { id: req.params.id },
    data: { isActive: false }  // SOFT DELETE
  });
} else {
  await prisma.item.delete({  // HARD DELETE
    where: { id: req.params.id }
  });
}
```

**Details:**
- **Route:** `DELETE /api/items/:id`
- **Authorization:** ADMIN only
- **Current Behavior:** 
  - Soft delete if item has inventory history
  - Hard delete if item has no inventory history
- **Schema:** `Item` model HAS `isActive` field (line 761) but NO `deletedAt` field
- **Impact:**
  - ✅ Partially preserves history (if has entries)
  - ❌ Loses data for items without entries
  - ❌ No `deletedAt` timestamp for audit trail
  - ❌ No `deletedBy` tracking

**Recommendation:** ⚠️ **IMPROVE** - Should always use soft delete with:
- `deletedAt` timestamp
- `deletedBy` user tracking
- Consistent behavior regardless of inventory entries

---

### 3. **Supplier Deletion** ⚠️ **CONDITIONAL (Soft/Hard)**

**Location:**
- Backend: `src/backend/src/routes/supplierRoutes.ts` (line 145-196)
- Frontend: `src/frontend/services/supplierService.ts` (line 72-78)
- Frontend UI: `src/frontend/app/workspaces/inventory-management/suppliers/page.tsx` (line 37-51)

**Current Implementation:**
```typescript
// CONDITIONAL DELETE:
// - If supplier has related items → SOFT DELETE (isActive = false)
// - If supplier has NO related items → HARD DELETE
if (relatedItems > 0) {
  await prisma.supplier.update({
    where: { id: req.params.id },
    data: { isActive: false }  // SOFT DELETE
  });
} else {
  await prisma.supplier.delete({  // HARD DELETE
    where: { id: req.params.id }
  });
}
```

**Details:**
- **Route:** `DELETE /api/suppliers/:id`
- **Authorization:** ADMIN only
- **Current Behavior:**
  - Soft delete if supplier has related items
  - Hard delete if supplier has no related items
- **Schema:** `Supplier` model HAS `isActive` field (line 1367) but NO `deletedAt` field
- **Impact:**
  - ✅ Partially preserves history (if has items)
  - ❌ Loses data for suppliers without items
  - ❌ No `deletedAt` timestamp
  - ❌ No `deletedBy` tracking

**Recommendation:** ⚠️ **IMPROVE** - Should always use soft delete with:
- `deletedAt` timestamp
- `deletedBy` user tracking
- Consistent behavior

---

### 4. **Item-Supplier Relation Deletion** ❌ **HARD DELETE**

**Location:**
- Backend: `src/backend/src/routes/supplierRoutes.ts` (line 280-314)
- Frontend: `src/frontend/services/supplierService.ts` (line 90-96)

**Current Implementation:**
```typescript
// HARD DELETE - Permanently removes relation
await prisma.itemSupplier.delete({
  where: {
    tenantId_itemId_supplierId: {
      tenantId: req.tenant!.id,
      itemId: req.params.itemId,
      supplierId: req.params.id
    }
  }
});
```

**Details:**
- **Route:** `DELETE /api/suppliers/:id/items/:itemId`
- **Authorization:** ADMIN, MANAGER
- **Current Behavior:** Permanently removes the relationship between item and supplier
- **Schema:** `ItemSupplier` model does NOT have `deletedAt` or `isActive` fields
- **Impact:**
  - ❌ Loses relationship history
  - ❌ Cannot track when/why relationship was removed
  - ❌ No audit trail

**Recommendation:** ⚠️ **CONSIDER** - For audit purposes, could benefit from soft delete, but this is a junction table, so impact is lower than main entities.

---

## 📊 Summary Table

| Operation | Type | Has `isActive`? | Has `deletedAt`? | Has `deletedBy`? | Recommendation |
|-----------|------|----------------|------------------|------------------|----------------|
| **Inventory Entry** | ❌ Hard Delete | ❌ No | ❌ No | ❌ No | 🔴 **CRITICAL** - Convert to soft delete |
| **Item** | ⚠️ Conditional | ✅ Yes | ❌ No | ❌ No | 🟡 **IMPROVE** - Always soft delete + add `deletedAt` |
| **Supplier** | ⚠️ Conditional | ✅ Yes | ❌ No | ❌ No | 🟡 **IMPROVE** - Always soft delete + add `deletedAt` |
| **Item-Supplier Relation** | ❌ Hard Delete | ❌ No | ❌ No | ❌ No | 🟢 **OPTIONAL** - Lower priority |

---

## 🎯 Recommendations

### Priority 1: **Inventory Entry** (CRITICAL)
**Why:** Inventory entries are the core of inventory management. Deleting them:
- Breaks stock calculation history
- Loses audit trail for compliance
- Makes financial reporting inaccurate
- Prevents historical analysis

**Required Changes:**
1. Add `deletedAt: DateTime?` to `InventoryEntry` model
2. Add `deletedBy: String?` to track who deleted it
3. Convert hard delete to soft delete
4. Update all queries to filter out deleted entries (`WHERE deletedAt IS NULL`)
5. Update stock calculations to exclude deleted entries

### Priority 2: **Item** (IMPROVE)
**Why:** Items are core entities. Current conditional delete is inconsistent.

**Required Changes:**
1. Add `deletedAt: DateTime?` to `Item` model
2. Add `deletedBy: String?` to track who deleted it
3. Always use soft delete (remove conditional logic)
4. Update all queries to filter deleted items
5. Ensure UI shows deleted items in a separate section or with visual indicator

### Priority 3: **Supplier** (IMPROVE)
**Why:** Similar to items, suppliers should maintain history.

**Required Changes:**
1. Add `deletedAt: DateTime?` to `Supplier` model
2. Add `deletedBy: String?` to track who deleted it
3. Always use soft delete (remove conditional logic)
4. Update all queries to filter deleted suppliers

### Priority 4: **Item-Supplier Relation** (OPTIONAL)
**Why:** Lower impact, but could be useful for audit trail.

**Required Changes:**
1. Consider adding soft delete if audit trail is important
2. Or keep as hard delete if junction table cleanup is preferred

---

## 🔧 Implementation Pattern (Reference)

Looking at existing soft delete implementations in the codebase:

### Customer Model (Good Example)
```prisma
model Customer {
  // ... other fields
  deletedAt  DateTime?
  isActive   Boolean @default(true)
  updatedBy  String?
}
```

### Customer Service (Good Example)
```typescript
// Soft delete customer
await prisma.customer.update({
  where: { id },
  data: {
    isActive: false,
    deletedAt: new Date(),
    updatedBy: deletedBy,
    updatedAt: new Date()
  }
});
```

### Query Pattern (Good Example)
```typescript
// Always filter deleted records
const customers = await prisma.customer.findMany({
  where: {
    isActive: true,
    deletedAt: null,
    tenantId: tenantId
  }
});
```

---

## 📝 Schema Changes Required

### 1. InventoryEntry Model
```prisma
model InventoryEntry {
  // ... existing fields
  deletedAt  DateTime?
  deletedBy  String?
  user       User?    @relation("InventoryEntryDeletedBy", fields: [deletedBy], references: [id])
  
  @@index([deletedAt])
  @@index([tenantId, deletedAt])
}
```

### 2. Item Model
```prisma
model Item {
  // ... existing fields (already has isActive)
  deletedAt  DateTime?
  deletedBy  String?
  
  @@index([deletedAt])
}
```

### 3. Supplier Model
```prisma
model Supplier {
  // ... existing fields (already has isActive)
  deletedAt  DateTime?
  deletedBy  String?
  
  @@index([deletedAt])
}
```

---

## 🚨 Important Considerations

1. **Stock Calculations:** When implementing soft delete for `InventoryEntry`, ensure stock calculations exclude deleted entries but maintain historical accuracy.

2. **Foreign Key Constraints:** Adding `deletedBy` will require user relation, ensure proper handling.

3. **Query Updates:** All queries must be updated to filter `deletedAt IS NULL` or `isActive = true`.

4. **UI Updates:** Frontend must handle showing/hiding deleted items appropriately.

5. **Migration Strategy:** 
   - Create migration to add new fields
   - Set `deletedAt = NULL` for all existing records
   - Update all delete operations
   - Update all queries

6. **Performance:** Add indexes on `deletedAt` for efficient filtering.

---

## ✅ Benefits of Soft Delete

1. **Audit Trail:** Complete history of all operations
2. **Compliance:** Meet regulatory requirements for data retention
3. **Recovery:** Ability to restore accidentally deleted records
4. **Analytics:** Historical data for reporting and analysis
5. **User Tracking:** Know who deleted what and when
6. **Data Integrity:** Maintain referential integrity for historical reports

---

## 📅 Next Steps

1. Review this analysis
2. Decide on implementation priority
3. Create migration for schema changes
4. Update backend delete operations
5. Update all queries to filter deleted records
6. Update frontend to handle soft-deleted items
7. Test thoroughly
8. Deploy

---

**Generated:** 2025-11-16
**Last Updated:** 2025-11-16

