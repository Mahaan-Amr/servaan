import { OrderStatus, OrderType, PaymentMethod, TableStatus } from '../types/ordering';
import { API_URL } from '../lib/apiUtils';
import { formatCurrency } from '../../shared/utils/currencyUtils';

// API Configuration
const ORDERING_API_BASE = `${API_URL}/ordering`;
const INVENTORY_API_BASE = `${API_URL}/inventory`;

// Utility function for API requests
async function apiRequest<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${ORDERING_API_BASE}${endpoint}`;
  
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Add authentication token if available
  const token = typeof window !== 'undefined' 
    ? localStorage.getItem('token') || sessionStorage.getItem('token') 
    : null;
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  // Add tenant subdomain header with robust extraction logic
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  let subdomain = 'dima'; // Default fallback for localhost development
  
  if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
    // Handle localhost development: check for subdomain before localhost (e.g., dima.localhost)
    const parts = hostname.split('.');
    if (parts.length >= 2 && parts[parts.length - 1] === 'localhost') {
      subdomain = parts[0]; // Use the subdomain (e.g., 'dima' from 'dima.localhost')
    } else if (parts.length === 1 || (parts.length === 2 && parts[1] === 'localhost')) {
      subdomain = 'dima'; // Just localhost, use default
    }
  } else {
    // For production domains: extract subdomain from first part
    const parts = hostname.split('.');
    if (parts.length >= 3) {
      subdomain = parts[0];
    } else {
      subdomain = 'dima'; // Fallback for simple domains
    }
  }
  
  defaultHeaders['X-Tenant-Subdomain'] = subdomain;

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    cache: 'no-store'
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data || data;
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error);
    throw error;
  }
}

// Utility function for inventory API requests
async function inventoryApiRequest<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${INVENTORY_API_BASE}${endpoint}`;
  
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Add authentication token if available
  const token = typeof window !== 'undefined' 
    ? localStorage.getItem('token') || sessionStorage.getItem('token') 
    : null;
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  // Add tenant subdomain header with robust extraction logic
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  let subdomain = 'dima'; // Default fallback for localhost development
  
  if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
    // Handle localhost development: check for subdomain before localhost (e.g., dima.localhost)
    const parts = hostname.split('.');
    if (parts.length >= 2 && parts[parts.length - 1] === 'localhost') {
      subdomain = parts[0]; // Use the subdomain (e.g., 'dima' from 'dima.localhost')
    } else if (parts.length === 1 || (parts.length === 2 && parts[1] === 'localhost')) {
      subdomain = 'dima'; // Just localhost, use default
    }
  } else {
    // For production domains: extract subdomain from first part
    const parts = hostname.split('.');
    if (parts.length >= 3) {
      subdomain = parts[0];
    } else {
      subdomain = 'dima'; // Fallback for simple domains
    }
  }
  
  defaultHeaders['X-Tenant-Subdomain'] = subdomain;

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data || data;
  } catch (error) {
    console.error(`Inventory API request failed for ${endpoint}:`, error);
    throw error;
  }
}

// ==================== ORDER SERVICES ====================

export interface CreateOrderRequest {
  orderType: OrderType;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  tableId?: string;
  guestCount?: number;
  items: Array<{
    itemId: string;
    quantity: number;
    modifiers?: Array<{
      modifierId: string;
      quantity: number;
    }>;
    specialRequest?: string;
  }>;
  notes?: string;
  kitchenNotes?: string;
  allergyInfo?: string;
}

export interface OrderFilterOptions {
  status?: OrderStatus[];
  orderType?: OrderType[];
  tableId?: string;
  customerId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export class OrderService {
  // Create new order
  static async createOrder(orderData: CreateOrderRequest) {
    return apiRequest('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  // Get orders with filtering
  static async getOrders(options: OrderFilterOptions = {}): Promise<any[]> {
    const queryParams = new URLSearchParams();
    
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(item => queryParams.append(key, item.toString()));
        } else {
          queryParams.append(key, value.toString());
        }
      }
    });

    // Cache-busting param to avoid stale 304 responses in critical views
    queryParams.append('_t', Date.now().toString());

    const response = await apiRequest<unknown>(`/orders?${queryParams.toString()}`);
    if (response && typeof response === 'object' && (response as { data?: unknown }).data !== undefined) {
      return (response as { data: any[] }).data;
    }
    return response as any[];
  }

  // Get order by ID
  static async getOrderById(orderId: string) {
    return apiRequest(`/orders/${orderId}`);
  }

  // Update order
  static async updateOrder(orderId: string, updateData: {
    status?: string;
    priority?: number;
    estimatedTime?: number;
    notes?: string;
    kitchenNotes?: string;
    items?: Array<{
      itemId: string;
      quantity: number;
      unitPrice: number;
      modifiers?: string[];
      specialRequest?: string;
    }>;
    subtotal?: number;
    discountAmount?: number;
    taxAmount?: number;
    serviceCharge?: number;
    totalAmount?: number;
  }) {
    return apiRequest(`/orders/${orderId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  // Update order status
  static async updateOrderStatus(orderId: string, status: OrderStatus) {
    return apiRequest(`/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  // Bulk update order status
  static async bulkUpdateOrderStatus(orderIds: string[], status: OrderStatus, reason?: string, notes?: string) {
    return apiRequest('/orders/bulk/status', {
      method: 'POST',
      body: JSON.stringify({ orderIds, newStatus: status, reason, notes }),
    });
  }

  // Cancel order
  static async cancelOrder(orderId: string, reason: string, refundAmount?: number) {
    return apiRequest(`/orders/${orderId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason, refundAmount }),
    });
  }

  // Get today's orders summary
  static async getTodaysSummary() {
    return apiRequest('/orders/today/summary');
  }

  // Get active orders
  static async getActiveOrders() {
    return apiRequest('/orders/active');
  }

  // Get orders by table
  static async getOrdersByTable(tableId: string, includeCompleted = false) {
    return apiRequest(`/orders/table/${tableId}?includeCompleted=${includeCompleted}`);
  }

  // Add item to order
  static async addItemToOrder(orderId: string, itemData: {
    itemId: string;
    quantity: number;
    modifiers?: { modifierId: string; quantity: number }[];
    specialRequest?: string;
  }) {
    return apiRequest(`/orders/${orderId}/items`, {
      method: 'POST',
      body: JSON.stringify(itemData),
    });
  }

  // Add items to order
  static async addItemsToOrder(orderId: string, items: Array<{
    itemId: string;
    quantity: number;
    unitPrice: number;
    modifiers?: string[];
    specialRequest?: string;
  }>) {
    return apiRequest(`/orders/${orderId}/add-items`, {
      method: 'POST',
      body: JSON.stringify({ items }),
    });
  }

  // Remove item from order
  static async removeItemFromOrder(orderId: string, orderItemId: string) {
    return apiRequest(`/orders/${orderId}/items/${orderItemId}`, {
      method: 'DELETE',
    });
  }

  // Remove items from order
  static async removeItemsFromOrder(orderId: string, itemIds: string[]) {
    return apiRequest(`/orders/${orderId}/remove-items`, {
      method: 'DELETE',
      body: JSON.stringify({ itemIds })
    });
  }

  // Update item quantities in order
  static async updateItemQuantities(orderId: string, itemUpdates: Array<{
    itemId: string;
    newQuantity: number;
  }>) {
    return apiRequest(`/orders/${orderId}/update-quantities`, {
      method: 'PUT',
      body: JSON.stringify({ itemUpdates })
    });
  }
}

// ==================== TABLE SERVICES ====================

export interface CreateTableRequest {
  tableNumber: string;
  tableName?: string;
  capacity: number;
  section?: string;
  floor: number;
  positionX?: number;
  positionY?: number;
}

export interface TableFilterOptions {
  section?: string;
  floor?: number;
  status?: TableStatus[];
  minCapacity?: number;
  maxCapacity?: number;
  includeInactive?: boolean;
}

export interface CreateReservationRequest {
  tableId: string;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  guestCount: number;
  reservationDate: string;
  duration?: number;
  notes?: string;
}

export class TableService {
  // Create table
  static async createTable(tableData: CreateTableRequest) {
    return apiRequest('/tables', {
      method: 'POST',
      body: JSON.stringify(tableData),
    });
  }

  // Get tables
  static async getTables(options: TableFilterOptions = {}) {
    const queryParams = new URLSearchParams();
    
    if (options.section) queryParams.append('section', options.section);
    if (options.floor) queryParams.append('floor', options.floor.toString());
    if (options.status && options.status.length > 0) {
      options.status.forEach(status => queryParams.append('status', status));
    }
    if (options.minCapacity) queryParams.append('minCapacity', options.minCapacity.toString());
    if (options.maxCapacity) queryParams.append('maxCapacity', options.maxCapacity.toString());
    if (options.includeInactive) queryParams.append('includeInactive', 'true');
    
    // Add cache-busting parameter
    queryParams.append('_t', Date.now().toString());
    
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/tables?${queryString}` : '/tables';
    
    return apiRequest(endpoint);
  }

  // Get table by ID
  static async getTableById(tableId: string) {
    return apiRequest(`/tables/${tableId}`);
  }

  // Update table
  static async updateTable(tableId: string, updateData: Partial<CreateTableRequest>) {
    return apiRequest(`/tables/${tableId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  // Delete table
  static async deleteTable(tableId: string) {
    return apiRequest(`/tables/${tableId}`, {
      method: 'DELETE',
    });
  }

  // Change table status
  static async changeTableStatus(tableId: string, status: TableStatus, reason?: string) {
    return apiRequest(`/tables/${tableId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reason }),
    });
  }

  // Get table layout
  static async getTableLayout() {
    return apiRequest('/tables/layout');
  }

  // Get available tables
  static async getAvailableTables(guestCount?: number, dateTime?: string) {
    const queryParams = new URLSearchParams();
    if (guestCount) queryParams.append('guestCount', guestCount.toString());
    if (dateTime) queryParams.append('dateTime', dateTime);

    return apiRequest(`/tables/available?${queryParams.toString()}`);
  }

  // Transfer order to another table
  static async transferOrder(newTableId: string, orderId: string) {
    return apiRequest(`/tables/${newTableId}/transfer`, {
      method: 'POST',
      body: JSON.stringify({ orderId }),
    });
  }

  // Create reservation
  static async createReservation(reservationData: CreateReservationRequest) {
    return apiRequest('/tables/reservations', {
      method: 'POST',
      body: JSON.stringify(reservationData),
    });
  }

  // Get reservations
  static async getReservations(options: { date?: string; tableId?: string; status?: string } = {}) {
    const queryParams = new URLSearchParams();
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    return apiRequest(`/tables/reservations?${queryParams.toString()}`);
  }

  // Get upcoming reservations
  static async getUpcomingReservations() {
    return apiRequest(`/tables/reservations/upcoming`);
  }

  // ===================== BULK OPERATIONS =====================

  // Bulk status change
  static async bulkChangeStatus(tableIds: string[], newStatus: TableStatus, reason?: string, notes?: string, assignedStaff?: string) {
    return apiRequest('/tables/bulk/status', {
      method: 'POST',
      body: JSON.stringify({
        tableIds,
        newStatus,
        reason,
        notes,
        assignedStaff
      }),
    });
  }

  // Bulk reservation creation
  static async bulkCreateReservations(reservations: Array<{
    tableId: string;
    customerName: string;
    customerPhone: string;
    guestCount: number;
    reservationDate: string;
    duration?: number;
    notes?: string;
  }>, template?: string) {
    return apiRequest('/tables/bulk/reservations', {
      method: 'POST',
      body: JSON.stringify({
        reservations,
        template
      }),
    });
  }

  // Import tables
  static async importTables(tables: Array<{
    tableNumber: string;
    tableName?: string;
    capacity: number;
    section?: string;
    floor: number;
    positionX?: number;
    positionY?: number;
    status?: TableStatus;
  }>) {
    return apiRequest('/tables/bulk/import', {
      method: 'POST',
      body: JSON.stringify({ tables }),
    });
  }

  // Export tables
  static async exportTables(options: {
    includeInactive?: boolean;
    sections?: string[];
    floors?: number[];
  } = {}) {
    const queryParams = new URLSearchParams();
    if (options.includeInactive) queryParams.append('includeInactive', 'true');
    if (options.sections) queryParams.append('sections', options.sections.join(','));
    if (options.floors) queryParams.append('floors', options.floors.join(','));

    return apiRequest(`/tables/bulk/export?${queryParams.toString()}`);
  }

  // Get table templates
  static async getTableTemplates() {
    return apiRequest('/tables/bulk/templates');
  }

  // Create tables from template
  static async createTablesFromTemplate(templateId: string, options: {
    prefix?: string;
    startNumber?: number;
    sections?: string[];
    floors?: number[];
  } = {}) {
    return apiRequest(`/tables/bulk/templates/${templateId}`, {
      method: 'POST',
      body: JSON.stringify(options),
    });
  }

  // Get table status history
  static async getTableStatusHistory(tableId: string, page = 1, limit = 20) {
    return apiRequest(`/tables/${tableId}/status-history?page=${page}&limit=${limit}`);
  }
}

// ==================== PAYMENT SERVICES ====================

export interface ProcessPaymentRequest {
  orderId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  cardInfo?: {
    terminalId: string;
    transactionRef?: string;
    cardMask?: string;
    cardType?: string;
  };
  cashReceived?: number;
  pointsUsed?: number;
  splitPayments?: Array<{
    method: PaymentMethod;
    amount: number;
    cardInfo?: {
      terminalId: string;
      transactionRef?: string;
    };
  }>;
  gatewayId?: string;
  transactionId?: string;
  referenceNumber?: string;
}

export class PaymentService {
  // Process payment
  static async processPayment(paymentData: ProcessPaymentRequest) {
    return apiRequest('/payments/process', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  }

  // Process refund
  static async processRefund(paymentId: string, refundAmount: number, reason: string) {
    return apiRequest('/payments/refund', {
      method: 'POST',
      body: JSON.stringify({ paymentId, refundAmount, reason }),
    });
  }

  // Get payments
  static async getPayments(options: { status?: string; method?: string; dateFrom?: string; dateTo?: string; orderId?: string } = {}) {
    const queryParams = new URLSearchParams();
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(item => queryParams.append(key, item.toString()));
        } else {
          queryParams.append(key, value.toString());
        }
      }
    });

    return apiRequest(`/payments?${queryParams.toString()}`);
  }

  // Get daily sales summary
  static async getDailySalesSummary(date?: string) {
    const queryParams = date ? `?date=${date}` : '';
    return apiRequest(`/payments/daily-summary${queryParams}`);
  }

  // Get payment methods breakdown
  static async getPaymentMethodsBreakdown(startDate?: string, endDate?: string) {
    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);

    return apiRequest(`/payments/methods-breakdown?${queryParams.toString()}`);
  }

  // Validate payment
  static async validatePayment(paymentData: { orderId: string; amount: number; method: string }) {
    return apiRequest('/payments/validate', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  }
}

// ==================== MENU SERVICES ====================

export interface CreateCategoryRequest {
  name: string;
  nameEn?: string;
  description?: string;
  displayOrder?: number;
  color?: string;
  icon?: string;
  availableFrom?: string;
  availableTo?: string;
  availableDays?: string[];
  isActive?: boolean;
}

export interface CreateMenuItemRequest {
  itemId?: string; // Optional - menu items can exist without inventory linking
  categoryId: string;
  displayName: string;
  displayNameEn?: string;
  description?: string;
  shortDesc?: string;
  menuPrice: number;
  originalPrice?: number;
  displayOrder?: number;
  isFeatured?: boolean;
  isSpicy?: boolean;
  isVegetarian?: boolean;
  isNew?: boolean;
  imageUrl?: string;
  thumbnailUrl?: string;
  prepTime?: number;
  cookingNotes?: string;
  availableFrom?: string;
  availableTo?: string;
  maxOrderQty?: number;
  calories?: number;
  allergens?: string[];
  isActive?: boolean;
}

export class MenuService {
  // Get menu categories
  static async getCategories(includeInactive = false) {
    const queryParams = includeInactive ? '?includeInactive=true' : '';
    return apiRequest(`/menu/categories${queryParams}`);
  }

  // Create menu category
  static async createCategory(categoryData: CreateCategoryRequest) {
    return apiRequest('/menu/categories', {
      method: 'POST',
      body: JSON.stringify(categoryData),
    });
  }

  // Update menu category
  static async updateCategory(categoryId: string, updateData: Partial<CreateCategoryRequest>) {
    return apiRequest(`/menu/categories/${categoryId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  // Delete menu category
  static async deleteCategory(categoryId: string) {
    return apiRequest(`/menu/categories/${categoryId}`, {
      method: 'DELETE',
    });
  }

  // Get full menu
  static async getFullMenu(onlyAvailable = true) {
    const queryParams = onlyAvailable ? '' : '?onlyAvailable=false';
    return apiRequest(`/menu/full${queryParams}`);
  }

  // Get menu items
  static async getMenuItems(options: { categoryId?: string; isActive?: boolean; isAvailable?: boolean; search?: string; page?: number; limit?: number; sortBy?: string; sortOrder?: 'asc' | 'desc' } = {}) {
    const queryParams = new URLSearchParams();
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(item => queryParams.append(key, item.toString()));
        } else {
          queryParams.append(key, value.toString());
        }
      }
    });

    return apiRequest(`/menu/items?${queryParams.toString()}`);
  }

  // Create menu item
  static async createMenuItem(itemData: CreateMenuItemRequest) {
    return apiRequest('/menu/items', {
      method: 'POST',
      body: JSON.stringify(itemData),
    });
  }

  // Update menu item
  static async updateMenuItem(itemId: string, updateData: Partial<CreateMenuItemRequest>) {
    return apiRequest(`/menu/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  // Delete menu item
  static async deleteMenuItem(itemId: string) {
    return apiRequest(`/menu/items/${itemId}`, {
      method: 'DELETE',
    });
  }

  // Toggle item availability
  static async toggleItemAvailability(itemId: string, isAvailable: boolean, reason?: string) {
    return apiRequest(`/menu/items/${itemId}/availability`, {
      method: 'PATCH',
      body: JSON.stringify({ isAvailable, reason }),
    });
  }

  // Get featured items
  static async getFeaturedItems() {
    return apiRequest('/menu/featured');
  }

  // Search menu items
  static async searchMenuItems(query: string) {
    return apiRequest(`/menu/search?q=${encodeURIComponent(query)}`);
  }

  // Get menu statistics
  static async getMenuStatistics() {
    return apiRequest('/menu/statistics');
  }
}

// ==================== KITCHEN SERVICES ====================

export class KitchenService {
  // Get kitchen display orders
  static async getKitchenDisplayOrders(displayName: string) {
    return apiRequest(`/kitchen/displays/${displayName}`);
  }

  // Get all kitchen stations
  static async getAllKitchenStations() {
    return apiRequest('/kitchen/stations');
  }

  // Update kitchen display status
  static async updateKitchenDisplayStatus(kitchenDisplayId: string, status: OrderStatus) {
    return apiRequest(`/kitchen/displays/${kitchenDisplayId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  // Update kitchen display priority
  static async updateKitchenDisplayPriority(kitchenDisplayId: string, priority: number, reason?: string) {
    return apiRequest(`/kitchen/displays/${kitchenDisplayId}/priority`, {
      method: 'PATCH',
      body: JSON.stringify({ priority, reason }),
    });
  }

  // Get kitchen performance metrics
  static async getKitchenPerformanceMetrics(startDate?: string, endDate?: string) {
    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);

    return apiRequest(`/kitchen/performance?${queryParams.toString()}`);
  }

  // Get kitchen workload
  static async getKitchenWorkload() {
    return apiRequest('/kitchen/workload');
  }

  // Get kitchen dashboard
  static async getKitchenDashboard() {
    return apiRequest('/kitchen/dashboard');
  }
}

// ==================== ANALYTICS SERVICES ====================

export class AnalyticsService {
  // Get sales summary
  static async getSalesSummary(startDate?: string, endDate?: string) {
    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);

    return apiRequest(`/analytics/sales-summary?${queryParams.toString()}`);
  }

  // Get customer analytics
  static async getCustomerAnalytics(startDate?: string, endDate?: string) {
    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);

    return apiRequest(`/analytics/customer-analytics?${queryParams.toString()}`);
  }

  // Get kitchen performance
  static async getKitchenPerformance(startDate?: string, endDate?: string) {
    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);

    return apiRequest(`/analytics/kitchen-performance?${queryParams.toString()}`);
  }

  // Get table utilization
  static async getTableUtilization(startDate?: string, endDate?: string) {
    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);

    return apiRequest(`/analytics/table-utilization?${queryParams.toString()}`);
  }

  // Get top items
  static async getTopItems() {
    return apiRequest('/analytics/top-items');
  }

  // Get hourly sales
  static async getHourlySales() {
    return apiRequest('/analytics/hourly-sales');
  }
}

// ==================== HEALTH CHECK ====================

export class HealthService {
  // Check system health
  static async checkHealth() {
    return apiRequest('/health');
  }
}

// ==================== RECIPE SERVICES ====================

interface CreateRecipeRequest {
  menuItemId: string;
  name: string;
  description?: string;
  instructions?: string;
  yield?: number;
  prepTime?: number;
}

interface UpdateRecipeRequest {
  name?: string;
  description?: string;
  instructions?: string;
  yield?: number;
  prepTime?: number;
  isActive?: boolean;
}

interface CreateRecipeIngredientRequest {
  itemId: string;
  quantity: number;
  unit: string;
  unitCost?: number;
  isOptional?: boolean;
  displayOrder?: number;
}

interface UpdateRecipeIngredientRequest {
  quantity?: number;
  unit?: string;
  unitCost?: number;
  isOptional?: boolean;
  displayOrder?: number;
}

export class RecipeService {
  // Create new recipe
  static async createRecipe(recipeData: CreateRecipeRequest) {
    return apiRequest('/recipes', {
      method: 'POST',
      body: JSON.stringify(recipeData),
    });
  }

  // Get recipes with filtering
  static async getRecipes(params: { 
    page?: number; 
    limit?: number; 
    isActive?: boolean; 
    menuItemId?: string; 
    search?: string; 
  } = {}) {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    return apiRequest(`/recipes?${queryParams.toString()}`);
  }

  // Get recipe by menu item
  static async getRecipeByMenuItem(menuItemId: string) {
    return apiRequest(`/recipes/menu-item/${menuItemId}`);
  }

  // Update recipe
  static async updateRecipe(recipeId: string, updateData: UpdateRecipeRequest) {
    return apiRequest(`/recipes/${recipeId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  // Delete recipe
  static async deleteRecipe(recipeId: string) {
    return apiRequest(`/recipes/${recipeId}`, {
      method: 'DELETE',
    });
  }

  // Add ingredient to recipe
  static async addIngredient(recipeId: string, ingredientData: CreateRecipeIngredientRequest) {
    return apiRequest(`/recipes/${recipeId}/ingredients`, {
      method: 'POST',
      body: JSON.stringify(ingredientData),
    });
  }

  // Get recipe ingredients
  static async getRecipeIngredients(recipeId: string) {
    return apiRequest(`/recipes/${recipeId}/ingredients`);
  }

  // Update ingredient
  static async updateIngredient(ingredientId: string, updateData: UpdateRecipeIngredientRequest) {
    return apiRequest(`/recipes/ingredients/${ingredientId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  // Remove ingredient
  static async removeIngredient(ingredientId: string) {
    return apiRequest(`/recipes/ingredients/${ingredientId}`, {
      method: 'DELETE',
    });
  }

  // Get recipe cost analysis
  static async getRecipeCostAnalysis(recipeId: string) {
    return apiRequest(`/recipes/${recipeId}/cost-analysis`);
  }
}

// ==================== INVENTORY INTEGRATION SERVICES ====================

export interface StockValidationResult {
  isAvailable: boolean;
  unavailableIngredients: {
    itemId: string;
    itemName: string;
    requiredQuantity: number;
    availableQuantity: number;
    unit: string;
  }[];
  totalCost: number;
  profitMargin: number;
}

export interface OrderStockValidationResult {
  isValid: boolean;
  validationResults: (StockValidationResult & { menuItemId: string })[];
  totalCOGS: number;
  totalProfitMargin: number;
}

export interface MenuAvailabilityUpdate {
  updated: number;
  disabledItems: string[];
  enabledItems: string[];
  lowStockAlerts: {
    itemId: string;
    itemName: string;
    currentStock: number;
    minStock: number;
    affectedMenuItems: string[];
  }[];
}

export interface LowStockAlert {
  itemId: string;
  itemName: string;
  currentStock: number;
  unit: string;
  affectedMenuItems: string[];
  priority: 'high' | 'medium' | 'low';
}

export interface InventoryIntegrationStatus {
  totalMenuItems: number;
  availableMenuItems: number;
  unavailableMenuItems: number;
  itemsWithRecipes: number;
  itemsWithoutRecipes: number;
  lowStockIngredients: number;
  criticalStockIngredients: number;
  averageProfitMargin: number;
  lastUpdate: string;
}

export class InventoryIntegrationService {
  // Validate stock availability for a single menu item
  static async validateStockAvailability(menuItemId: string, quantity: number = 1): Promise<StockValidationResult> {
    return apiRequest(`/inventory/stock-validation/${menuItemId}?quantity=${quantity}`);
  }

  // Validate stock availability for multiple order items
  static async validateOrderStock(orderItems: { menuItemId: string; quantity: number }[]): Promise<OrderStockValidationResult> {
    return apiRequest('/inventory/validate-order-stock', {
      method: 'POST',
      body: JSON.stringify({ orderItems }),
    });
  }

  // NEW: Flexible stock validation with warnings and override capabilities
  static async validateFlexibleStockAvailability(menuItemId: string, quantity: number = 1): Promise<{
    isAvailable: boolean;
    hasWarnings: boolean;
    warnings: Array<{
      type: 'LOW_STOCK' | 'OUT_OF_STOCK' | 'CRITICAL_STOCK';
      severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      itemId: string;
      itemName: string;
      requiredQuantity: number;
      availableQuantity: number;
      unit: string;
      message: string;
      suggestedAction: string;
    }>;
    unavailableIngredients: Array<{
      itemId: string;
      itemName: string;
      requiredQuantity: number;
      availableQuantity: number;
      unit: string;
    }>;
    totalCost: number;
    profitMargin: number;
    canProceedWithOverride: boolean;
    overrideRequired: boolean;
  }> {
    return apiRequest(`/inventory/stock-validation/${menuItemId}?quantity=${quantity}`);
  }

  // NEW: Validate flexible stock for multiple order items with warnings
  static async validateFlexibleOrderStock(orderItems: { menuItemId: string; quantity: number }[]): Promise<{
    isValid: boolean;
    hasWarnings: boolean;
    validationResults: Array<{
      menuItemId: string;
      isAvailable: boolean;
      hasWarnings: boolean;
      warnings: Array<{
        type: 'LOW_STOCK' | 'OUT_OF_STOCK' | 'CRITICAL_STOCK';
        severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
        itemId: string;
        itemName: string;
        requiredQuantity: number;
        availableQuantity: number;
        unit: string;
        message: string;
        suggestedAction: string;
      }>;
      unavailableIngredients: Array<{
        itemId: string;
        itemName: string;
        requiredQuantity: number;
        availableQuantity: number;
        unit: string;
      }>;
      totalCost: number;
      profitMargin: number;
      canProceedWithOverride: boolean;
      overrideRequired: boolean;
    }>;
    totalCOGS: number;
    totalProfitMargin: number;
    canProceedWithOverride: boolean;
    overrideRequired: boolean;
    criticalWarnings: number;
    totalWarnings: number;
  }> {
    return apiRequest('/inventory/validate-order-stock', {
      method: 'POST',
      body: JSON.stringify({ orderItems }),
    });
  }

  // NEW: Record stock override when staff proceeds despite warnings
  static async recordStockOverride(overrideData: {
    orderId: string;
    menuItemId: string;
    itemId: string;
    itemName: string;
    requiredQuantity: number;
    availableQuantity: number;
    overrideReason: string;
    overrideType: 'STAFF_DECISION' | 'EMERGENCY_PURCHASE' | 'SUBSTITUTE_INGREDIENT' | 'VIP_CUSTOMER';
    notes?: string;
  }): Promise<{
    id: string;
    tenantId: string;
    orderId: string;
    menuItemId: string;
    itemId: string;
    itemName: string;
    requiredQuantity: number;
    availableQuantity: number;
    overrideReason: string;
    overrideType: string;
    overriddenBy: string;
    overriddenAt: string;
    notes?: string;
  }> {
    return apiRequest('/inventory/stock-override', {
      method: 'POST',
      body: JSON.stringify(overrideData),
    });
  }

  // NEW: Get stock override analytics
  static async getStockOverrideAnalytics(startDate?: string, endDate?: string): Promise<{
    totalOverrides: number;
    overridesByType: Record<string, number>;
    overridesByItem: Array<{
      itemId: string;
      itemName: string;
      overrideCount: number;
      totalDeficit: number;
    }>;
    overridesByStaff: Array<{
      staffId: string;
      staffName: string;
      overrideCount: number;
    }>;
    frequentOverrideItems: Array<{
      itemId: string;
      itemName: string;
      overrideCount: number;
      avgDeficit: number;
      lastOverride: string;
    }>;
  }> {
    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);

    return apiRequest(`/inventory/stock-override-analytics?${queryParams.toString()}`);
  }

  // NEW: Get stock validation configuration
  static async getStockValidationConfig(): Promise<{
    validationMode: 'STRICT' | 'FLEXIBLE' | 'DISABLED';
    allowStaffOverride: boolean;
    requireManagerApproval: boolean;
    autoReserveStock: boolean;
    warningThresholds: {
      lowStock: number;
      criticalStock: number;
      outOfStock: number;
    };
    overrideTypes: string[];
  }> {
    return apiRequest('/inventory/stock-validation-config');
  }

  // Update menu item availability based on ingredient stock
  static async updateMenuAvailability(): Promise<MenuAvailabilityUpdate> {
    return apiRequest('/inventory/update-menu-availability', {
      method: 'POST',
    });
  }

  // Get low stock alerts for recipe ingredients
  static async getLowStockAlerts(): Promise<{ criticalIngredients: LowStockAlert[] }> {
    return apiRequest('/inventory/low-stock-alerts');
  }

  // Update recipe costs when ingredient prices change
  static async updateRecipeCosts(): Promise<{
    updated: number;
    costChanges: {
      recipeId: string;
      recipeName: string;
      oldTotalCost: number;
      newTotalCost: number;
      oldCostPerServing: number;
      newCostPerServing: number;
    }[];
  }> {
    return apiRequest('/inventory/update-recipe-costs', {
      method: 'POST',
    });
  }

  // Get comprehensive inventory integration status
  static async getIntegrationStatus(): Promise<InventoryIntegrationStatus> {
    return apiRequest('/inventory/integration-status');
  }
}

// ==================== ACCOUNTING INTEGRATION SERVICES ====================

export interface IranianTaxCalculation {
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  incomeTaxRate: number;
  incomeTaxAmount: number;
  municipalTaxRate: number;
  municipalTaxAmount: number;
  totalTaxAmount: number;
  netAmount: number;
}

export interface EnhancedCOGSBreakdown {
  menuItemId: string;
  displayName: string;
  quantity: number;
  unitPrice: number;
  totalRevenue: number;
  ingredientCosts: {
    itemId: string;
    itemName: string;
    quantity: number;
    unitCost: number;
    totalCost: number;
    costPercentage: number;
  }[];
  totalCOGS: number;
  grossProfit: number;
  grossProfitMargin: number;
  costVariance: number;
}

export interface RecipeProfitabilityReport {
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  totalRevenue: number;
  totalCOGS: number;
  grossProfit: number;
  grossProfitMargin: number;
  menuItemPerformance: {
    menuItemId: string;
    displayName: string;
    quantitySold: number;
    revenue: number;
    cogs: number;
    profit: number;
    profitMargin: number;
    topIngredients: {
      itemId: string;
      itemName: string;
      totalUsed: number;
      totalCost: number;
    }[];
  }[];
}

export interface RecipeRefundJournalEntry {
  originalOrderId: string;
  refundOrderId: string;
  refundAmount: number;
  refundTaxAmount: number;
  refundCOGS: number;
  refundReason: string;
  paymentMethod: PaymentMethod;
  refundItems: {
    menuItemId: string;
    displayName: string;
    refundQuantity: number;
    unitPrice: number;
    refundAmount: number;
    refundCOGS: number;
  }[];
}

export interface AccountingIntegrationStatus {
  totalOrders: number;
  totalRevenue: number;
  totalCOGS: number;
  totalTax: number;
  grossProfit: number;
  grossProfitMargin: number;
  averageOrderValue: number;
  menuItemsWithRecipes: number;
  topMenuItems: {
    menuItemId: string;
    quantity: number;
  }[];
  lastUpdated: Date;
}

export class AccountingIntegrationService {
  static async calculateTax(
    subtotal: number,
    vatRate: number = 9,
    incomeTaxRate: number = 0,
    municipalTaxRate: number = 0
  ): Promise<IranianTaxCalculation> {
    const response = await fetch('/api/ordering/accounting/calculate-tax', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('token') || sessionStorage.getItem('token') : null}`
      },
      body: JSON.stringify({
        subtotal,
        vatRate,
        incomeTaxRate,
        municipalTaxRate
      })
    });

    if (!response.ok) {
      throw new Error('Failed to calculate tax');
    }

    const data = await response.json();
    return data.data;
  }

  static async getCOGSBreakdown(
    menuItemId: string,
    quantity: number = 1
  ): Promise<EnhancedCOGSBreakdown> {
    const response = await fetch(`/api/ordering/accounting/cogs-breakdown/${menuItemId}?quantity=${quantity}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('token') || sessionStorage.getItem('token') : null}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to get COGS breakdown');
    }

    const data = await response.json();
    return data.data;
  }

  static async getProfitabilityReport(
    startDate: Date,
    endDate: Date
  ): Promise<RecipeProfitabilityReport> {
    const response = await fetch(`/api/ordering/accounting/profitability-report?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('token') || sessionStorage.getItem('token') : null}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to get profitability report');
    }

    const data = await response.json();
    return data.data;
  }

  static async processRefund(
    originalOrderId: string,
    refundOrderId: string,
    refundAmount: number,
    refundReason: string,
    paymentMethod: PaymentMethod,
    refundTaxAmount: number = 0,
    refundCOGS: number = 0,
    refundItems: {
      menuItemId: string;
      displayName: string;
      refundQuantity: number;
      unitPrice: number;
      refundAmount: number;
      refundCOGS: number;
    }[] = []
  ): Promise<{
    journalEntry: {
      id: string;
      entryNumber: string;
      entryDate: string;
      description: string;
      totalDebit: number;
      totalCredit: number;
      status: string;
    };
    refundData: RecipeRefundJournalEntry;
  }> {
    const response = await fetch('/api/ordering/accounting/process-refund', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('token') || sessionStorage.getItem('token') : null}`
      },
      body: JSON.stringify({
        originalOrderId,
        refundOrderId,
        refundAmount,
        refundTaxAmount,
        refundCOGS,
        refundReason,
        paymentMethod,
        refundItems
      })
    });

    if (!response.ok) {
      throw new Error('Failed to process refund');
    }

    const data = await response.json();
    return data.data;
  }

  static async getIntegrationStatus(): Promise<AccountingIntegrationStatus> {
    return apiRequest('/accounting/integration-status');
  }
}

// ==================== ORDER OPTIONS SERVICES ====================

export interface OrderOptions {
  discountEnabled: boolean;
  discountType: 'PERCENTAGE' | 'AMOUNT';
  discountValue: number;
  taxEnabled: boolean;
  taxPercentage: number;
  serviceEnabled: boolean;
  servicePercentage: number;
  courierEnabled: boolean;
  courierAmount: number;
  courierNotes?: string;
}

export interface OrderCalculation {
  subtotal: number;
  discountAmount: number;
  discountPercentage: number;
  taxAmount: number;
  taxPercentage: number;
  serviceAmount: number;
  servicePercentage: number;
  courierAmount: number;
  totalAmount: number;
  breakdown: {
    subtotal: number;
    discount: number;
    tax: number;
    service: number;
    courier: number;
    total: number;
  };
}

export interface BusinessPreset {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  isDefault: boolean;
  discountEnabled: boolean;
  discountType: string;
  discountValue: number;
  taxEnabled: boolean;
  taxPercentage: number;
  serviceEnabled: boolean;
  servicePercentage: number;
  courierEnabled: boolean;
  courierAmount: number;
  createdAt: Date;
}

export interface CreateBusinessPresetRequest {
  name: string;
  description?: string;
  isDefault?: boolean;
  discountEnabled?: boolean;
  discountType?: 'PERCENTAGE' | 'AMOUNT';
  discountValue?: number;
  taxEnabled?: boolean;
  taxPercentage?: number;
  serviceEnabled?: boolean;
  servicePercentage?: number;
  courierEnabled?: boolean;
  courierAmount?: number;
}

export class OrderOptionsService {
  // Update order options
  static async updateOrderOptions(orderId: string, options: OrderOptions): Promise<{
    options: OrderOptions;
    calculation: OrderCalculation;
  }> {
    return apiRequest(`/orders/${orderId}/options`, {
      method: 'PUT',
      body: JSON.stringify(options),
    });
  }

  // Get order calculation
  static async getOrderCalculation(orderId: string): Promise<{
    options: OrderOptions;
    calculation: OrderCalculation;
  }> {
    return apiRequest(`/orders/${orderId}/calculation`);
  }

  // Get business presets
  static async getBusinessPresets(): Promise<BusinessPreset[]> {
    return apiRequest('/business/presets');
  }

  // Create business preset
  static async createBusinessPreset(presetData: CreateBusinessPresetRequest): Promise<BusinessPreset> {
    return apiRequest('/business/presets', {
      method: 'POST',
      body: JSON.stringify(presetData),
    });
  }

  // Update business preset
  static async updateBusinessPreset(presetId: string, presetData: Partial<CreateBusinessPresetRequest>): Promise<BusinessPreset> {
    return apiRequest(`/business/presets/${presetId}`, {
      method: 'PUT',
      body: JSON.stringify(presetData),
    });
  }

  // Delete business preset
  static async deleteBusinessPreset(presetId: string): Promise<void> {
    return apiRequest(`/business/presets/${presetId}`, {
      method: 'DELETE',
    });
  }

  // Apply preset to order
  static async applyPresetToOrder(orderId: string, presetId: string): Promise<{
    options: OrderOptions;
    calculation: OrderCalculation;
  }> {
    return apiRequest(`/orders/${orderId}/apply-preset/${presetId}`, {
      method: 'POST',
    });
  }

  // Get default preset
  static async getDefaultPreset(): Promise<BusinessPreset | null> {
    return apiRequest('/business/presets/default');
  }
}

// ==================== UTILITY FUNCTIONS ====================

export const OrderingUtils = {
  // Format Persian numbers
  formatPersianNumber: (num: number | string): string => {
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return num.toString().replace(/\d/g, (digit) => persianDigits[parseInt(digit)]);
  },

  // Format price in Iranian Toman
  formatPrice: (amount: number, includeCurrency = true): string => {
    return includeCurrency ? formatCurrency(amount) : formatCurrency(amount, { includeCurrency: false });
  },

  // Get status color
  getStatusColor: (status: string): string => {
    const statusColors: Record<string, string> = {
      'DRAFT': 'gray',
      'PENDING': 'yellow',
      'CONFIRMED': 'blue',
      'PREPARING': 'orange',
      'READY': 'purple',
      'SERVED': 'green',
      'COMPLETED': 'green',
      'CANCELLED': 'red',
      'REFUNDED': 'red'
    };
    return statusColors[status] || 'gray';
  },

  // Get status labels in Persian
  getStatusLabel: (status: string): string => {
    const statusLabels: Record<string, string> = {
      'DRAFT': 'پیش‌نویس',
      'PENDING': 'در انتظار',
      'CONFIRMED': 'تأیید شده',
      'PREPARING': 'در حال آماده‌سازی',
      'READY': 'آماده',
      'SERVED': 'سرو شده',
      'COMPLETED': 'تکمیل شده',
      'CANCELLED': 'لغو شده',
      'REFUNDED': 'مرجوع شده'
    };
    return statusLabels[status] || status;
  }
};

// ==================== INVENTORY PRICE INTEGRATION SERVICES ====================

export interface InventoryPriceData {
  price: number;
  priceSource: 'WAC' | 'MANUAL' | 'NONE';
  lastUpdated: Date;
  priceHistory: Array<{
    date: Date;
    price: number;
    quantity: number;
  }>;
}

export interface PriceConsistencyItem {
  itemId: string;
  itemName: string;
  inventoryPrice: number;
  recipePrices: Array<{
    recipeId: string;
    recipeName: string;
    recipePrice: number;
    difference: number;
    percentageDiff: number;
  }>;
}

export interface PriceStatistics {
  totalItems: number;
  itemsWithPrices: number;
  averagePrice: number;
  priceRange: { min: number; max: number; };
  recentPriceChanges: Array<{
    itemId: string;
    itemName: string;
    oldPrice: number;
    newPrice: number;
    changeDate: Date;
  }>;
}

export interface RecipePriceAnalysis {
  recipeId: string;
  recipeName: string;
  totalCost: number;
  costPerServing: number;
  ingredients: Array<{
    id: string;
    itemName: string;
    quantity: number;
    unit: string;
    recipePrice: number;
    inventoryPrice: number;
    priceDifference: number;
    priceSource: 'SYNCED' | 'MANUAL' | 'MISSING';
  }>;
}

export interface PriceSyncResult {
  synced: number;
  failed: number;
  changes: Array<{
    ingredientId: string;
    itemName: string;
    recipeName: string;
    oldPrice: number;
    newPrice: number;
  }>;
}

export class InventoryPriceService {
  // Get inventory price for a specific item
  static async getInventoryPrice(itemId: string): Promise<InventoryPriceData> {
    return inventoryApiRequest(`/items/${itemId}/price`);
  }

  // Validate price consistency across inventory and recipes
  static async validatePriceConsistency(): Promise<PriceConsistencyItem[]> {
    return inventoryApiRequest('/price-consistency');
  }

  // Get price statistics for inventory items
  static async getPriceStatistics(): Promise<PriceStatistics> {
    return inventoryApiRequest('/price-statistics');
  }

  // Sync all recipe ingredient prices from inventory
  static async syncIngredientPrices(): Promise<PriceSyncResult> {
    return apiRequest('/recipes/sync-prices', {
      method: 'POST'
    });
  }

  // Get detailed price analysis for a specific recipe
  static async getRecipePriceAnalysis(recipeId: string): Promise<RecipePriceAnalysis> {
    return apiRequest(`/recipes/${recipeId}/price-analysis`);
  }

  // Update ingredient price manually
  static async updateIngredientPrice(recipeId: string, ingredientId: string, newPrice: number): Promise<{
    ingredientId: string;
    oldPrice: number;
    newPrice: number;
    updatedAt: Date;
  }> {
    return apiRequest(`/recipes/${recipeId}/ingredients/${ingredientId}/price`, {
      method: 'PUT',
      body: JSON.stringify({ price: newPrice })
    });
  }
}

// ===================== TABLE ANALYTICS SERVICE =====================

export class TableAnalyticsService {
  /**
   * Get table utilization analytics
   */
  static async getTableUtilization(startDate: string, endDate: string) {
    const params = new URLSearchParams({ startDate, endDate });
    return apiRequest(`/tables/analytics/utilization?${params}`);
  }

  /**
   * Get peak hours analysis
   */
  static async getPeakHoursAnalysis(startDate: string, endDate: string) {
    const params = new URLSearchParams({ startDate, endDate });
    return apiRequest(`/tables/analytics/peak-hours?${params}`);
  }

  /**
   * Get table revenue analysis
   */
  static async getTableRevenueAnalysis(startDate: string, endDate: string) {
    const params = new URLSearchParams({ startDate, endDate });
    return apiRequest(`/tables/analytics/revenue?${params}`);
  }

  /**
   * Get capacity optimization analysis
   */
  static async getCapacityOptimization(startDate: string, endDate: string) {
    const params = new URLSearchParams({ startDate, endDate });
    return apiRequest(`/tables/analytics/capacity-optimization?${params}`);
  }

  /**
   * Get comprehensive table analytics summary
   */
  static async getTableAnalyticsSummary(startDate: string, endDate: string) {
    const params = new URLSearchParams({ startDate, endDate });
    return apiRequest(`/tables/analytics/summary?${params}`);
  }

  /**
   * Get table performance metrics
   */
  static async getTablePerformance(startDate: string, endDate: string) {
    const params = new URLSearchParams({ startDate, endDate });
    return apiRequest(`/tables/analytics/performance?${params}`);
  }
}

// ===================== ADVANCED TABLE ANALYTICS SERVICE =====================

export class TableAdvancedAnalyticsService {
  /**
   * Get detailed table performance reports
   */
  static async getDetailedTablePerformance(startDate: string, endDate: string) {
    const params = new URLSearchParams({ startDate, endDate });
    return apiRequest(`/tables/advanced-analytics/performance?${params}`);
  }

  /**
   * Get performance forecasts for tables
   */
  static async getPerformanceForecasts(startDate: string, endDate: string) {
    const params = new URLSearchParams({ startDate, endDate });
    return apiRequest(`/tables/advanced-analytics/forecasts?${params}`);
  }

  /**
   * Get comprehensive reservation analytics
   */
  static async getReservationAnalytics(startDate: string, endDate: string) {
    const params = new URLSearchParams({ startDate, endDate });
    return apiRequest(`/tables/advanced-analytics/reservations?${params}`);
  }

  /**
   * Get reservation insights and optimization opportunities
   */
  static async getReservationInsights(startDate: string, endDate: string) {
    const params = new URLSearchParams({ startDate, endDate });
    return apiRequest(`/tables/advanced-analytics/reservation-insights?${params}`);
  }

  /**
   * Get customer behavior insights for tables
   */
  static async getCustomerBehaviorInsights(startDate: string, endDate: string) {
    const params = new URLSearchParams({ startDate, endDate });
    return apiRequest(`/tables/advanced-analytics/customer-behavior?${params}`);
  }

  /**
   * Get advanced capacity optimization data
   */
  static async getAdvancedCapacityOptimization(startDate: string, endDate: string) {
    const params = new URLSearchParams({ startDate, endDate });
    return apiRequest(`/tables/advanced-analytics/capacity-optimization?${params}`);
  }

  /**
   * Get staff allocation recommendations
   */
  static async getStaffAllocationRecommendations(startDate: string, endDate: string) {
    const params = new URLSearchParams({ startDate, endDate });
    return apiRequest(`/tables/advanced-analytics/staff-allocation?${params}`);
  }

  /**
   * Get comprehensive advanced analytics summary
   */
  static async getAdvancedAnalyticsSummary(startDate: string, endDate: string) {
    const params = new URLSearchParams({ startDate, endDate });
    return apiRequest(`/tables/advanced-analytics/summary?${params}`);
  }
}

// Services are exported individually above 