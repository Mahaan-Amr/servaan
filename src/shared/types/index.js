"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationPriority = exports.NotificationType = exports.InventoryEntryType = exports.UserRole = void 0;
// User types
var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "ADMIN";
    UserRole["MANAGER"] = "MANAGER";
    UserRole["STAFF"] = "STAFF";
})(UserRole || (exports.UserRole = UserRole = {}));
// Inventory types
var InventoryEntryType;
(function (InventoryEntryType) {
    InventoryEntryType["IN"] = "IN";
    InventoryEntryType["OUT"] = "OUT";
})(InventoryEntryType || (exports.InventoryEntryType = InventoryEntryType = {}));
// Notification types
var NotificationType;
(function (NotificationType) {
    NotificationType["LOW_STOCK"] = "LOW_STOCK";
    NotificationType["INVENTORY_UPDATE"] = "INVENTORY_UPDATE";
    NotificationType["NEW_USER"] = "NEW_USER";
    NotificationType["ITEM_CREATED"] = "ITEM_CREATED";
    NotificationType["ITEM_UPDATED"] = "ITEM_UPDATED";
    NotificationType["SUPPLIER_CREATED"] = "SUPPLIER_CREATED";
    NotificationType["SUPPLIER_UPDATED"] = "SUPPLIER_UPDATED";
    NotificationType["SYSTEM_ALERT"] = "SYSTEM_ALERT";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
var NotificationPriority;
(function (NotificationPriority) {
    NotificationPriority["LOW"] = "LOW";
    NotificationPriority["MEDIUM"] = "MEDIUM";
    NotificationPriority["HIGH"] = "HIGH";
    NotificationPriority["URGENT"] = "URGENT";
})(NotificationPriority || (exports.NotificationPriority = NotificationPriority = {}));
