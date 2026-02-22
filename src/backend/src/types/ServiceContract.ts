/**
 * Service Contract Interfaces
 * 
 * Defines type-safe contracts for all services.
 * All service methods must conform to these interfaces.
 * 
 * Convention:
 * - Interface names: `I<ServiceName>`
 * - All methods must include tenantId as first parameter
 * - All methods are async (except utility functions)
 * - Error handling uses AppError with Farsi messages
 */

// =================== INVENTORY SERVICE ===================

export interface IInventoryService {
  calculateCurrentStock(
    tenantId: string,
    itemId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<number>;

  getStockDeficits(tenantId: string): Promise<
    Array<{
      itemId: string;
      itemName: string;
      category: string;
      unit: string;
      currentStock: number;
      deficitAmount: number;
    }>
  >;

  getDeficitSummary(tenantId: string): Promise<{
    totalDeficitItems: number;
    totalDeficitAmount: number;
    deficitItems: Array<{
      itemId: string;
      itemName: string;
      deficitAmount: number;
    }>;
  }>;
}

// =================== CUSTOMER SERVICE ===================

export interface ICustomerService {
  createCustomer(
    tenantId: string,
    data: any,
    createdBy: string
  ): Promise<any>;

  getCustomers(
    tenantId: string,
    filter?: any
  ): Promise<{ data: any[]; pagination: any }>;

  getCustomerById(
    tenantId: string,
    customerId: string
  ): Promise<any | null>;

  updateCustomer(
    tenantId: string,
    customerId: string,
    data: any
  ): Promise<any>;

  deleteCustomer(
    tenantId: string,
    customerId: string
  ): Promise<void>;
}

// =================== ACCOUNTING SERVICE ===================

export interface IChartOfAccountsService {
  initializeIranianChartOfAccounts(tenantId: string): Promise<void>;

  createAccount(
    tenantId: string,
    data: any
  ): Promise<any>;

  getAccountHierarchy(
    tenantId: string,
    accountType?: string
  ): Promise<any[]>;

  getAccountBalance(
    tenantId: string,
    accountId: string
  ): Promise<number>;
}

export interface IJournalEntryService {
  createJournalEntry(
    tenantId: string,
    data: any,
    createdBy: string
  ): Promise<any>;

  postJournalEntry(
    tenantId: string,
    entryId: string,
    approvedBy: string
  ): Promise<any>;

  getJournalEntries(
    tenantId: string,
    filter?: any
  ): Promise<any[]>;

  reverseJournalEntry(
    tenantId: string,
    entryId: string,
    reversedBy: string
  ): Promise<any>;
}

// =================== LOYALTY SERVICE ===================

export interface ILoyaltyService {
  awardPoints(
    tenantId: string,
    customerId: string,
    points: number,
    reason: string
  ): Promise<any>;

  redeemPoints(
    tenantId: string,
    customerId: string,
    points: number
  ): Promise<any>;

  getCustomerLoyaltyStatus(
    tenantId: string,
    customerId: string
  ): Promise<any>;

  updateTierStatus(
    tenantId: string,
    customerId: string
  ): Promise<any>;
}

// =================== ORDER SERVICE ===================

export interface IOrderService {
  createOrder(
    tenantId: string,
    data: any,
    createdBy: string
  ): Promise<any>;

  updateOrder(
    tenantId: string,
    orderId: string,
    data: any
  ): Promise<any>;

  getOrder(
    tenantId: string,
    orderId: string
  ): Promise<any | null>;

  listOrders(
    tenantId: string,
    filter?: any
  ): Promise<{ data: any[]; pagination: any }>;

  completeOrder(
    tenantId: string,
    orderId: string
  ): Promise<any>;

  cancelOrder(
    tenantId: string,
    orderId: string,
    reason: string
  ): Promise<any>;
}

// =================== CAMPAIGN SERVICE ===================

export interface ICampaignService {
  createCampaign(
    tenantId: string,
    data: any,
    createdBy: string
  ): Promise<any>;

  listCampaigns(
    tenantId: string,
    filter?: any
  ): Promise<{ data: any[]; pagination: any }>;

  sendCampaign(
    tenantId: string,
    campaignId: string,
    sentBy: string
  ): Promise<any>;

  getCampaignAnalytics(
    tenantId: string,
    campaignId: string
  ): Promise<any>;
}

// =================== BI SERVICE ===================

export interface IBIService {
  calculateTotalRevenue(
    tenantId: string,
    period: any
  ): Promise<any>;

  calculateNetProfit(
    tenantId: string,
    period: any
  ): Promise<any>;

  buildExecutiveDashboard(
    tenantId: string,
    userId: string,
    period: any
  ): Promise<any>;

  getInventoryABCAnalysis(
    tenantId: string
  ): Promise<any>;
}

// =================== AUTH SERVICE ===================

export interface IAuthService {
  loginUser(
    email: string,
    password: string,
    tenantId?: string
  ): Promise<{ token: string; user: any }>;

  registerUser(
    email: string,
    password: string,
    userData: any
  ): Promise<{ token: string; user: any }>;

  generateToken(userId: string): string;

  verifyToken(token: string): { id: string };
}

// =================== RECIPE SERVICE ===================

export interface IRecipeService {
  createRecipe(
    tenantId: string,
    data: any,
    createdBy: string
  ): Promise<any>;

  listRecipes(
    tenantId: string,
    filter?: any
  ): Promise<any[]>;

  getRecipeById(
    tenantId: string,
    recipeId: string
  ): Promise<any | null>;

  updateRecipe(
    tenantId: string,
    recipeId: string,
    data: any
  ): Promise<any>;

  deleteRecipe(
    tenantId: string,
    recipeId: string
  ): Promise<void>;

  getRecipeCost(
    tenantId: string,
    recipeId: string
  ): Promise<number>;
}

// =================== TABLE SERVICE ===================

export interface ITableService {
  createTable(
    tenantId: string,
    data: any,
    createdBy: string
  ): Promise<any>;

  listTables(
    tenantId: string,
    filter?: any
  ): Promise<any[]>;

  getTableById(
    tenantId: string,
    tableId: string
  ): Promise<any | null>;

  updateTableStatus(
    tenantId: string,
    tableId: string,
    status: string
  ): Promise<any>;

  assignTableToOrder(
    tenantId: string,
    tableId: string,
    orderId: string
  ): Promise<any>;
}

// =================== MENU SERVICE ===================

export interface IMenuService {
  createMenuItem(
    tenantId: string,
    data: any,
    createdBy: string
  ): Promise<any>;

  listMenuItems(
    tenantId: string,
    filter?: any
  ): Promise<any[]>;

  getMenuItemById(
    tenantId: string,
    itemId: string
  ): Promise<any | null>;

  updateMenuItem(
    tenantId: string,
    itemId: string,
    data: any
  ): Promise<any>;

  deleteMenuItem(
    tenantId: string,
    itemId: string
  ): Promise<void>;

  checkItemAvailability(
    tenantId: string,
    itemId: string
  ): Promise<boolean>;
}

// =================== NOTIFICATION SERVICE ===================

export interface INotificationService {
  sendNotification(
    tenantId: string,
    userId: string,
    title: string,
    message: string
  ): Promise<any>;

  broadcastToTenant(
    tenantId: string,
    title: string,
    message: string
  ): Promise<any>;

  getNotifications(
    tenantId: string,
    userId: string,
    limit?: number
  ): Promise<any[]>;

  markAsRead(
    tenantId: string,
    notificationId: string
  ): Promise<any>;
}

// =================== AUDIT SERVICE ===================

export interface IAuditService {
  logAction(
    tenantId: string,
    userId: string,
    action: string,
    targetModel: string,
    targetId?: string,
    details?: Record<string, any>
  ): Promise<any>;

  listAuditLogs(
    tenantId: string,
    filter?: any
  ): Promise<{ data: any[]; pagination: any }>;
}

// =================== COMMON PATTERNS ===================

/**
 * Standard response format for paginated data
 */
export interface IPaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Standard create/update data pattern
 */
export interface IEntityData {
  tenantId: string;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string;
  updatedBy?: string;
}
