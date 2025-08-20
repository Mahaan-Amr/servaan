# طراحی یکپارچگی سیستم POS - سِروان

**نسخه**: 1.0  
**تاریخ**: 2025/01/10  
**وضعیت**: Design Phase - Ready for Implementation

---

## 🎯 **اهداف یکپارچگی POS**

### **هدف اصلی**
توسعه یک **سیستم یکپارچگی جامع با POS** که فروش، موجودی و حسابداری را به صورت real-time همگام‌سازی کند.

### **اهداف فرعی**
- 🔄 **همگام‌سازی real-time** فروش و موجودی
- 💰 **یکپارچگی مالی** با سیستم حسابداری
- 📊 **تحلیل فروش** و گزارش‌گیری پیشرفته
- 🛒 **پشتیبانی از POS های مختلف** (Square, Toast, Clover, etc.)
- 📱 **API یکپارچه** برای اتصال آسان
- 🔍 **ردیابی تراکنش‌ها** و تطبیق خودکار
- 📈 **آمارگیری فروش** و تحلیل عملکرد

---

## 🏗️ **Architecture یکپارچگی POS**

### **ساختار کلی**
```
┌─────────────────────────────────────────────────────────┐
│                 Servaan POS Integration                 │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐               │
│  │  External POS   │  │  Webhook        │               │
│  │  Systems        │  │  Receivers      │               │ 
│  │  (Square,Toast) │  │                 │               │
│  └─────────────────┘  └─────────────────┘               │
│           │                     │                       │
│  ┌─────────────────────────────────────────────────────┐│
│  │              Integration Engine                     ││
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   ││
│  │  │Transaction  │ │Data         │ │Error        │   ││
│  │  │Processor    │ │Transformer  │ │Handler      │   ││
│  │  └─────────────┘ └─────────────┘ └─────────────┘   ││
│  └─────────────────────────────────────────────────────┘│
│           │                     │                       │
│  ┌─────────────────┐  ┌─────────────────┐               │
│  │  Servaan Core   │  │  Financial      │               │
│  │  Systems        │  │  Integration    │               │
│  │  (Inventory,    │  │  (Accounting)   │               │
│  │   Analytics)    │  │                 │               │
│  └─────────────────┘  └─────────────────┘               │
│           │                     │                       │
│  ┌─────────────────────────────────────────────────────┐│
│  │              Monitoring & Logging                   ││
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   ││
│  │  │Transaction  │ │Performance  │ │Audit        │   ││
│  │  │Tracking     │ │Monitoring   │ │Logs         │   ││
│  │  └─────────────┘ └─────────────┘ └─────────────┘   ││
│  └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

---

## 🔌 **POS System Integrations**

### **1. Square Integration**

```typescript
interface SquareConfig {
  applicationId: string;
  accessToken: string;
  locationId: string;
  environment: 'sandbox' | 'production';
  webhookSignatureKey: string;
}

class SquareIntegration {
  private client: Client;
  private config: SquareConfig;
  
  constructor(config: SquareConfig) {
    this.config = config;
    this.client = new Client({
      accessToken: config.accessToken,
      environment: config.environment === 'production' ? Environment.Production : Environment.Sandbox
    });
  }
  
  // دریافت تراکنش‌های جدید
  async fetchNewTransactions(since: Date): Promise<SquareTransaction[]> {
    try {
      const ordersApi = this.client.ordersApi;
      
      const response = await ordersApi.searchOrders({
        locationIds: [this.config.locationId],
        query: {
          filter: {
            dateTimeFilter: {
              createdAt: {
                startAt: since.toISOString()
              }
            },
            stateFilter: {
              states: ['COMPLETED']
            }
          },
          sort: {
            sortField: 'CREATED_AT',
            sortOrder: 'ASC'
          }
        }
      });
      
      return response.result.orders?.map(order => this.transformSquareOrder(order)) || [];
      
    } catch (error) {
      throw new Error(`Square API Error: ${error.message}`);
    }
  }
  
  // تبدیل سفارش Square به فرمت استاندارد
  private transformSquareOrder(order: any): SquareTransaction {
    return {
      externalId: order.id,
      externalSystem: 'SQUARE',
      locationId: order.locationId,
      createdAt: new Date(order.createdAt),
      updatedAt: new Date(order.updatedAt),
      totalAmount: parseInt(order.totalMoney?.amount || '0') / 100, // Square uses cents
      currency: order.totalMoney?.currency || 'USD',
      status: order.state,
      items: order.lineItems?.map(item => ({
        externalId: item.uid,
        name: item.name,
        quantity: parseInt(item.quantity),
        basePrice: parseInt(item.basePriceMoney?.amount || '0') / 100,
        totalPrice: parseInt(item.totalMoney?.amount || '0') / 100,
        sku: item.catalogObjectId,
        modifiers: item.modifiers?.map(mod => ({
          name: mod.name,
          price: parseInt(mod.totalMoney?.amount || '0') / 100
        }))
      })) || [],
      customer: order.customerId ? {
        externalId: order.customerId
      } : undefined,
      payments: order.tenders?.map(tender => ({
        type: tender.type,
        amount: parseInt(tender.amountMoney?.amount || '0') / 100,
        cardDetails: tender.cardDetails
      })) || [],
      taxes: order.taxes?.map(tax => ({
        name: tax.name,
        amount: parseInt(tax.appliedMoney?.amount || '0') / 100,
        percentage: tax.percentage ? parseFloat(tax.percentage) : undefined
      })) || [],
      discounts: order.discounts?.map(discount => ({
        name: discount.name,
        amount: parseInt(discount.appliedMoney?.amount || '0') / 100,
        percentage: discount.percentage ? parseFloat(discount.percentage) : undefined
      })) || []
    };
  }
  
  // همگام‌سازی موجودی با Square
  async syncInventoryToSquare(items: Item[]): Promise<void> {
    try {
      const catalogApi = this.client.catalogApi;
      
      for (const item of items) {
        const catalogObject = {
          type: 'ITEM',
          id: `#${item.id}`,
          itemData: {
            name: item.name,
            description: item.description,
            variations: [{
              type: 'ITEM_VARIATION',
              id: `#${item.id}_variation`,
              itemVariationData: {
                itemId: `#${item.id}`,
                name: 'Regular',
                pricingType: 'FIXED_PRICING',
                priceMoney: {
                  amount: Math.round(item.unitPrice * 100), // Convert to cents
                  currency: 'USD'
                },
                sku: item.barcode || item.id,
                trackInventory: true
              }
            }]
          }
        };
        
        await catalogApi.upsertCatalogObject({
          idempotencyKey: `servaan_${item.id}_${Date.now()}`,
          object: catalogObject
        });
      }
      
    } catch (error) {
      throw new Error(`Square inventory sync error: ${error.message}`);
    }
  }
  
  // بروزرسانی موجودی در Square
  async updateSquareInventory(itemId: string, newQuantity: number): Promise<void> {
    try {
      const inventoryApi = this.client.inventoryApi;
      
      await inventoryApi.batchChangeInventory({
        idempotencyKey: `servaan_inventory_${itemId}_${Date.now()}`,
        changes: [{
          type: 'PHYSICAL_COUNT',
          physicalCount: {
            catalogObjectId: itemId,
            locationId: this.config.locationId,
            quantity: newQuantity.toString(),
            occurredAt: new Date().toISOString()
          }
        }]
      });
      
    } catch (error) {
      throw new Error(`Square inventory update error: ${error.message}`);
    }
  }
}
```

### **2. Toast POS Integration**

```typescript
interface ToastConfig {
  clientId: string;
  clientSecret: string;
  restaurantGuid: string;
  accessToken: string;
  baseUrl: string;
}

class ToastIntegration {
  private config: ToastConfig;
  private httpClient: AxiosInstance;
  
  constructor(config: ToastConfig) {
    this.config = config;
    this.httpClient = axios.create({
      baseURL: config.baseUrl,
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
        'Toast-Restaurant-External-ID': config.restaurantGuid,
        'Content-Type': 'application/json'
      }
    });
  }
  
  // دریافت سفارش‌های جدید
  async fetchNewOrders(since: Date): Promise<ToastTransaction[]> {
    try {
      const response = await this.httpClient.get('/orders', {
        params: {
          startDate: since.toISOString(),
          endDate: new Date().toISOString(),
          pageSize: 100
        }
      });
      
      return response.data.map(order => this.transformToastOrder(order));
      
    } catch (error) {
      throw new Error(`Toast API Error: ${error.response?.data?.message || error.message}`);
    }
  }
  
  // تبدیل سفارش Toast به فرمت استاندارد
  private transformToastOrder(order: any): ToastTransaction {
    return {
      externalId: order.guid,
      externalSystem: 'TOAST',
      locationId: order.restaurantGuid,
      createdAt: new Date(order.openedDate),
      updatedAt: new Date(order.modifiedDate),
      totalAmount: order.totalAmount,
      currency: 'USD',
      status: order.voided ? 'VOIDED' : 'COMPLETED',
      orderNumber: order.orderNumber,
      items: order.selections?.map(selection => ({
        externalId: selection.guid,
        name: selection.item?.name,
        quantity: selection.quantity,
        basePrice: selection.price,
        totalPrice: selection.price * selection.quantity,
        sku: selection.item?.sku,
        modifiers: selection.modifiers?.map(mod => ({
          name: mod.modifier?.name,
          price: mod.price
        }))
      })) || [],
      customer: order.customer ? {
        externalId: order.customer.guid,
        firstName: order.customer.firstName,
        lastName: order.customer.lastName,
        email: order.customer.email,
        phone: order.customer.phone
      } : undefined,
      payments: order.payments?.map(payment => ({
        type: payment.type,
        amount: payment.amount,
        cardType: payment.cardType,
        last4: payment.last4
      })) || [],
      taxes: order.taxes?.map(tax => ({
        name: tax.name,
        amount: tax.amount,
        rate: tax.rate
      })) || [],
      discounts: order.discounts?.map(discount => ({
        name: discount.name,
        amount: discount.amount,
        percentage: discount.percentage
      })) || []
    };
  }
  
  // همگام‌سازی منو با Toast
  async syncMenuToToast(items: Item[]): Promise<void> {
    try {
      for (const item of items) {
        const menuItem = {
          name: item.name,
          description: item.description,
          price: item.unitPrice,
          sku: item.barcode || item.id,
          visibility: item.isActive ? 'VISIBLE' : 'HIDDEN',
          menuGroupGuid: await this.getDefaultMenuGroup()
        };
        
        await this.httpClient.post('/menu/items', menuItem);
      }
      
    } catch (error) {
      throw new Error(`Toast menu sync error: ${error.message}`);
    }
  }
  
  private async getDefaultMenuGroup(): Promise<string> {
    try {
      const response = await this.httpClient.get('/menu/groups');
      return response.data[0]?.guid || null;
    } catch (error) {
      return null;
    }
  }
}
```

### **3. Clover Integration**

```typescript
interface CloverConfig {
  merchantId: string;
  accessToken: string;
  environment: 'sandbox' | 'production';
  baseUrl: string;
}

class CloverIntegration {
  private config: CloverConfig;
  private httpClient: AxiosInstance;
  
  constructor(config: CloverConfig) {
    this.config = config;
    this.httpClient = axios.create({
      baseURL: `${config.baseUrl}/v3/merchants/${config.merchantId}`,
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json'
      }
    });
  }
  
  // دریافت سفارش‌های جدید
  async fetchNewOrders(since: Date): Promise<CloverTransaction[]> {
    try {
      const response = await this.httpClient.get('/orders', {
        params: {
          filter: `createdTime>=${since.getTime()}`,
          expand: 'lineItems,payments,customers'
        }
      });
      
      return response.data.elements?.map(order => this.transformCloverOrder(order)) || [];
      
    } catch (error) {
      throw new Error(`Clover API Error: ${error.response?.data?.message || error.message}`);
    }
  }
  
  // تبدیل سفارش Clover به فرمت استاندارد
  private transformCloverOrder(order: any): CloverTransaction {
    return {
      externalId: order.id,
      externalSystem: 'CLOVER',
      locationId: this.config.merchantId,
      createdAt: new Date(order.createdTime),
      updatedAt: new Date(order.modifiedTime),
      totalAmount: order.total / 100, // Clover uses cents
      currency: order.currency || 'USD',
      status: order.state,
      orderNumber: order.orderNumber,
      items: order.lineItems?.elements?.map(item => ({
        externalId: item.id,
        name: item.name,
        quantity: item.unitQty || 1,
        basePrice: item.price / 100,
        totalPrice: (item.price * (item.unitQty || 1)) / 100,
        sku: item.alternateName,
        itemId: item.item?.id
      })) || [],
      customer: order.customers?.elements?.[0] ? {
        externalId: order.customers.elements[0].id,
        firstName: order.customers.elements[0].firstName,
        lastName: order.customers.elements[0].lastName,
        email: order.customers.elements[0].emailAddresses?.elements?.[0]?.emailAddress,
        phone: order.customers.elements[0].phoneNumbers?.elements?.[0]?.phoneNumber
      } : undefined,
      payments: order.payments?.elements?.map(payment => ({
        type: payment.tender?.label,
        amount: payment.amount / 100,
        cardType: payment.cardTransaction?.type,
        last4: payment.cardTransaction?.last4
      })) || []
    };
  }
  
  // همگام‌سازی موجودی با Clover
  async syncInventoryToClover(items: Item[]): Promise<void> {
    try {
      for (const item of items) {
        const cloverItem = {
          name: item.name,
          price: Math.round(item.unitPrice * 100), // Convert to cents
          sku: item.barcode || item.id,
          stockCount: item.currentQuantity,
          hidden: !item.isActive
        };
        
        await this.httpClient.post('/items', cloverItem);
      }
      
    } catch (error) {
      throw new Error(`Clover inventory sync error: ${error.message}`);
    }
  }
}
```

---

## 🔄 **Transaction Processing Engine**

### **Universal Transaction Processor**

```typescript
interface UniversalTransaction {
  id: string;
  externalId: string;
  externalSystem: 'SQUARE' | 'TOAST' | 'CLOVER' | 'CUSTOM';
  locationId: string;
  transactionAt: Date;
  totalAmount: number;
  currency: string;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED';
  orderNumber?: string;
  receiptNumber?: string;
  items: TransactionItem[];
  customer?: TransactionCustomer;
  payments: TransactionPayment[];
  taxes: TransactionTax[];
  discounts: TransactionDiscount[];
  metadata: Record<string, any>;
  processedAt?: Date;
  syncedToInventory: boolean;
  syncedToAccounting: boolean;
}

interface TransactionItem {
  externalId: string;
  itemId?: string; // Servaan item ID
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  sku?: string;
  barcode?: string;
  modifiers?: TransactionModifier[];
  category?: string;
}

class TransactionProcessor {
  // پردازش تراکنش جدید
  async processTransaction(
    rawTransaction: any, 
    source: 'SQUARE' | 'TOAST' | 'CLOVER'
  ): Promise<UniversalTransaction> {
    
    try {
      // تبدیل به فرمت استاندارد
      const transaction = await this.normalizeTransaction(rawTransaction, source);
      
      // بررسی تکراری بودن
      const existingTransaction = await this.findExistingTransaction(
        transaction.externalId, 
        transaction.externalSystem
      );
      
      if (existingTransaction) {
        return await this.updateExistingTransaction(existingTransaction, transaction);
      }
      
      // تطبیق آیتم‌ها با موجودی
      await this.matchItemsWithInventory(transaction);
      
      // ذخیره تراکنش
      const savedTransaction = await this.saveTransaction(transaction);
      
      // همگام‌سازی با سیستم‌های دیگر
      await this.syncToSystems(savedTransaction);
      
      return savedTransaction;
      
    } catch (error) {
      await this.logProcessingError(rawTransaction, source, error);
      throw error;
    }
  }
  
  // تطبیق آیتم‌ها با موجودی
  private async matchItemsWithInventory(transaction: UniversalTransaction): Promise<void> {
    for (const item of transaction.items) {
      // جستجو بر اساس SKU/Barcode
      let inventoryItem = null;
      
      if (item.sku) {
        inventoryItem = await this.findItemBySKU(item.sku);
      }
      
      if (!inventoryItem && item.barcode) {
        inventoryItem = await this.findItemByBarcode(item.barcode);
      }
      
      // جستجو بر اساس نام (fuzzy matching)
      if (!inventoryItem) {
        inventoryItem = await this.findItemByName(item.name);
      }
      
      if (inventoryItem) {
        item.itemId = inventoryItem.id;
      } else {
        // ایجاد آیتم جدید
        const newItem = await this.createItemFromTransaction(item, transaction);
        item.itemId = newItem.id;
      }
    }
  }
  
  // ایجاد آیتم جدید از تراکنش
  private async createItemFromTransaction(
    transactionItem: TransactionItem,
    transaction: UniversalTransaction
  ): Promise<Item> {
    
    const itemData: Partial<Item> = {
      name: transactionItem.name,
      barcode: transactionItem.barcode || transactionItem.sku,
      unitPrice: transactionItem.unitPrice,
      costPrice: transactionItem.unitPrice * 0.7, // تخمین 70% cost
      categoryId: await this.getDefaultCategoryId(),
      minQuantity: 5,
      currentQuantity: 0, // شروع با موجودی صفر
      isActive: true,
      createdFromPOS: true,
      posSource: transaction.externalSystem,
      externalId: transactionItem.externalId
    };
    
    const newItem = await ItemService.create(itemData);
    
    // ثبت لاگ
    await this.logItemCreation(newItem, transaction);
    
    return newItem;
  }
  
  // همگام‌سازی با سیستم‌های دیگر
  private async syncToSystems(transaction: UniversalTransaction): Promise<void> {
    const syncPromises = [];
    
    // همگام‌سازی با موجودی
    if (!transaction.syncedToInventory) {
      syncPromises.push(this.syncToInventory(transaction));
    }
    
    // همگام‌سازی با حسابداری
    if (!transaction.syncedToAccounting) {
      syncPromises.push(this.syncToAccounting(transaction));
    }
    
    // همگام‌سازی با آنالیتیکس
    syncPromises.push(this.syncToAnalytics(transaction));
    
    await Promise.allSettled(syncPromises);
  }
  
  // همگام‌سازی با موجودی
  private async syncToInventory(transaction: UniversalTransaction): Promise<void> {
    try {
      for (const item of transaction.items) {
        if (item.itemId) {
          // کاهش موجودی
          await InventoryService.createEntry({
            itemId: item.itemId,
            type: 'OUT',
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            date: transaction.transactionAt,
            notes: `فروش از ${transaction.externalSystem} - سفارش: ${transaction.orderNumber}`,
            posTransactionId: transaction.id,
            externalTransactionId: transaction.externalId
          });
        }
      }
      
      // علامت‌گذاری به عنوان همگام‌سازی شده
      await this.markAsSynced(transaction.id, 'inventory');
      
    } catch (error) {
      await this.logSyncError(transaction.id, 'inventory', error);
      throw error;
    }
  }
  
  // همگام‌سازی با حسابداری
  private async syncToAccounting(transaction: UniversalTransaction): Promise<void> {
    try {
      // ایجاد سند حسابداری
      const journalEntry = await AccountingService.createSalesEntry({
        transactionId: transaction.id,
        date: transaction.transactionAt,
        totalAmount: transaction.totalAmount,
        items: transaction.items,
        payments: transaction.payments,
        taxes: transaction.taxes,
        discounts: transaction.discounts,
        reference: `POS-${transaction.externalSystem}-${transaction.orderNumber}`
      });
      
      // علامت‌گذاری به عنوان همگام‌سازی شده
      await this.markAsSynced(transaction.id, 'accounting');
      
    } catch (error) {
      await this.logSyncError(transaction.id, 'accounting', error);
      throw error;
    }
  }
}
```

---

## 📡 **Webhook Management**

### **Webhook Receiver System**

```typescript
interface WebhookConfig {
  posSystem: string;
  endpoint: string;
  secret: string;
  events: string[];
  isActive: boolean;
}

class WebhookManager {
  private webhookConfigs: Map<string, WebhookConfig> = new Map();
  
  // ثبت webhook جدید
  registerWebhook(config: WebhookConfig): void {
    this.webhookConfigs.set(config.posSystem, config);
  }
  
  // پردازش webhook دریافتی
  async processWebhook(
    posSystem: string,
    headers: Record<string, string>,
    body: any
  ): Promise<void> {
    
    const config = this.webhookConfigs.get(posSystem);
    if (!config || !config.isActive) {
      throw new Error(`Webhook not configured for ${posSystem}`);
    }
    
    // تأیید امضا
    if (!this.verifySignature(posSystem, headers, body, config.secret)) {
      throw new Error('Invalid webhook signature');
    }
    
    // پردازش بر اساس نوع POS
    switch (posSystem) {
      case 'SQUARE':
        await this.processSquareWebhook(body);
        break;
      case 'TOAST':
        await this.processToastWebhook(body);
        break;
      case 'CLOVER':
        await this.processCloverWebhook(body);
        break;
      default:
        throw new Error(`Unsupported POS system: ${posSystem}`);
    }
  }
  
  // تأیید امضای webhook
  private verifySignature(
    posSystem: string,
    headers: Record<string, string>,
    body: any,
    secret: string
  ): boolean {
    
    switch (posSystem) {
      case 'SQUARE':
        return this.verifySquareSignature(headers, body, secret);
      case 'TOAST':
        return this.verifyToastSignature(headers, body, secret);
      case 'CLOVER':
        return this.verifyCloverSignature(headers, body, secret);
      default:
        return false;
    }
  }
  
  // تأیید امضای Square
  private verifySquareSignature(
    headers: Record<string, string>,
    body: any,
    secret: string
  ): boolean {
    
    const signature = headers['x-square-signature'];
    if (!signature) return false;
    
    const hmac = crypto.createHmac('sha1', secret);
    hmac.update(JSON.stringify(body));
    const expectedSignature = hmac.digest('base64');
    
    return signature === expectedSignature;
  }
  
  // پردازش webhook Square
  private async processSquareWebhook(body: any): Promise<void> {
    const { type, data } = body;
    
    switch (type) {
      case 'order.created':
      case 'order.updated':
        await this.handleOrderEvent(data.object.order_created || data.object.order_updated);
        break;
        
      case 'payment.created':
        await this.handlePaymentEvent(data.object.payment);
        break;
        
      case 'inventory.count.updated':
        await this.handleInventoryEvent(data.object.inventory_counts);
        break;
        
      default:
        console.log(`Unhandled Square webhook event: ${type}`);
    }
  }
  
  // پردازش رویداد سفارش
  private async handleOrderEvent(orderData: any): Promise<void> {
    try {
      // دریافت اطلاعات کامل سفارش
      const squareIntegration = new SquareIntegration(this.getSquareConfig());
      const fullOrder = await squareIntegration.getOrder(orderData.id);
      
      // پردازش تراکنش
      const processor = new TransactionProcessor();
      await processor.processTransaction(fullOrder, 'SQUARE');
      
    } catch (error) {
      console.error('Error processing order event:', error);
      await this.logWebhookError('SQUARE', 'order.event', orderData, error);
    }
  }
  
  // پردازش رویداد موجودی
  private async handleInventoryEvent(inventoryData: any): Promise<void> {
    try {
      for (const count of inventoryData) {
        await this.syncInventoryFromPOS(count.catalog_object_id, count.quantity);
      }
    } catch (error) {
      console.error('Error processing inventory event:', error);
    }
  }
}
```

---

## 📊 **Real-time Synchronization**

### **Sync Engine**

```typescript
interface SyncJob {
  id: string;
  type: 'FULL_SYNC' | 'INCREMENTAL_SYNC' | 'REAL_TIME_SYNC';
  posSystem: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  startedAt?: Date;
  completedAt?: Date;
  lastSyncPoint?: Date;
  itemsProcessed: number;
  itemsFailed: number;
  errors: SyncError[];
}

class SyncEngine {
  private activeSyncJobs: Map<string, SyncJob> = new Map();
  
  // شروع همگام‌سازی کامل
  async startFullSync(posSystem: string): Promise<SyncJob> {
    const job: SyncJob = {
      id: generateId(),
      type: 'FULL_SYNC',
      posSystem,
      status: 'PENDING',
      itemsProcessed: 0,
      itemsFailed: 0,
      errors: []
    };
    
    this.activeSyncJobs.set(job.id, job);
    
    // شروع همگام‌سازی در background
    this.executeFullSync(job).catch(error => {
      job.status = 'FAILED';
      job.errors.push({
        message: error.message,
        timestamp: new Date()
      });
    });
    
    return job;
  }
  
  // اجرای همگام‌سازی کامل
  private async executeFullSync(job: SyncJob): Promise<void> {
    job.status = 'RUNNING';
    job.startedAt = new Date();
    
    try {
      const integration = this.getPOSIntegration(job.posSystem);
      
      // همگام‌سازی تراکنش‌ها
      await this.syncTransactions(job, integration);
      
      // همگام‌سازی موجودی
      await this.syncInventory(job, integration);
      
      // همگام‌سازی مشتریان
      await this.syncCustomers(job, integration);
      
      job.status = 'COMPLETED';
      job.completedAt = new Date();
      
    } catch (error) {
      job.status = 'FAILED';
      job.errors.push({
        message: error.message,
        timestamp: new Date()
      });
      throw error;
    }
  }
  
  // همگام‌سازی تراکنش‌ها
  private async syncTransactions(job: SyncJob, integration: any): Promise<void> {
    const batchSize = 100;
    let offset = 0;
    let hasMore = true;
    
    while (hasMore) {
      try {
        const transactions = await integration.fetchTransactions({
          limit: batchSize,
          offset,
          since: job.lastSyncPoint
        });
        
        if (transactions.length === 0) {
          hasMore = false;
          break;
        }
        
        // پردازش batch
        const processor = new TransactionProcessor();
        for (const transaction of transactions) {
          try {
            await processor.processTransaction(transaction, job.posSystem);
            job.itemsProcessed++;
          } catch (error) {
            job.itemsFailed++;
            job.errors.push({
              message: `Transaction ${transaction.id}: ${error.message}`,
              timestamp: new Date()
            });
          }
        }
        
        offset += batchSize;
        
        // به‌روزرسانی پیشرفت
        await this.updateSyncProgress(job);
        
      } catch (error) {
        throw new Error(`Batch sync failed at offset ${offset}: ${error.message}`);
      }
    }
  }
  
  // همگام‌سازی موجودی
  private async syncInventory(job: SyncJob, integration: any): Promise<void> {
    try {
      const inventoryItems = await integration.fetchInventory();
      
      for (const item of inventoryItems) {
        try {
          await this.syncInventoryItem(item, job.posSystem);
          job.itemsProcessed++;
        } catch (error) {
          job.itemsFailed++;
          job.errors.push({
            message: `Inventory ${item.id}: ${error.message}`,
            timestamp: new Date()
          });
        }
      }
      
    } catch (error) {
      throw new Error(`Inventory sync failed: ${error.message}`);
    }
  }
  
  // همگام‌سازی آیتم موجودی
  private async syncInventoryItem(posItem: any, posSystem: string): Promise<void> {
    // جستجوی آیتم موجود
    let item = await ItemService.findByExternalId(posItem.id, posSystem);
    
    if (!item) {
      // ایجاد آیتم جدید
      item = await ItemService.create({
        name: posItem.name,
        description: posItem.description,
        barcode: posItem.sku,
        unitPrice: posItem.price,
        costPrice: posItem.cost || posItem.price * 0.7,
        currentQuantity: posItem.quantity || 0,
        categoryId: await this.mapCategory(posItem.category),
        isActive: posItem.active !== false,
        externalId: posItem.id,
        externalSystem: posSystem
      });
    } else {
      // بروزرسانی آیتم موجود
      await ItemService.update(item.id, {
        name: posItem.name,
        description: posItem.description,
        unitPrice: posItem.price,
        currentQuantity: posItem.quantity || item.currentQuantity,
        isActive: posItem.active !== false,
        updatedAt: new Date()
      });
    }
    
    // همگام‌سازی موجودی
    if (posItem.quantity !== undefined && posItem.quantity !== item.currentQuantity) {
      await InventoryService.createEntry({
        itemId: item.id,
        type: 'ADJUSTMENT',
        quantity: Math.abs(posItem.quantity - item.currentQuantity),
        unitPrice: 0,
        totalPrice: 0,
        date: new Date(),
        notes: `همگام‌سازی از ${posSystem}`,
        isAdjustment: true,
        externalSource: posSystem
      });
    }
  }
  
  // شروع همگام‌سازی real-time
  async startRealTimeSync(posSystem: string): Promise<void> {
    const config = await this.getPOSConfig(posSystem);
    
    // تنظیم webhook
    await this.setupWebhook(posSystem, config);
    
    // شروع polling برای سیستم‌هایی که webhook ندارند
    if (!config.supportsWebhooks) {
      this.startPolling(posSystem);
    }
  }
  
  // polling برای سیستم‌های بدون webhook
  private startPolling(posSystem: string): void {
    const interval = 30000; // 30 ثانیه
    
    setInterval(async () => {
      try {
        const lastSync = await this.getLastSyncTime(posSystem);
        const integration = this.getPOSIntegration(posSystem);
        
        const newTransactions = await integration.fetchNewTransactions(lastSync);
        
        if (newTransactions.length > 0) {
          const processor = new TransactionProcessor();
          for (const transaction of newTransactions) {
            await processor.processTransaction(transaction, posSystem);
          }
          
          await this.updateLastSyncTime(posSystem, new Date());
        }
        
      } catch (error) {
        console.error(`Polling error for ${posSystem}:`, error);
      }
    }, interval);
  }
}
```

---

## 📈 **Analytics & Reporting**

### **POS Analytics Service**

```typescript
class POSAnalyticsService {
  // آمار فروش به تفکیک POS
  async getSalesByPOS(
    startDate: Date,
    endDate: Date
  ): Promise<POSSalesAnalytics[]> {
    
    const query = `
      SELECT 
        external_system as pos_system,
        COUNT(*) as transaction_count,
        SUM(total_amount) as total_sales,
        AVG(total_amount) as avg_transaction_value,
        SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_transactions,
        SUM(CASE WHEN status = 'REFUNDED' THEN 1 ELSE 0 END) as refunded_transactions
      FROM pos_transactions 
      WHERE transaction_at BETWEEN ? AND ?
      GROUP BY external_system
      ORDER BY total_sales DESC
    `;
    
    const results = await db.query(query, [startDate, endDate]);
    
    return results.map(row => ({
      posSystem: row.pos_system,
      transactionCount: row.transaction_count,
      totalSales: row.total_sales,
      avgTransactionValue: row.avg_transaction_value,
      completedTransactions: row.completed_transactions,
      refundedTransactions: row.refunded_transactions,
      successRate: (row.completed_transactions / row.transaction_count) * 100
    }));
  }
  
  // تحلیل عملکرد محصولات در POS
  async getProductPerformanceByPOS(
    startDate: Date,
    endDate: Date,
    posSystem?: string
  ): Promise<ProductPOSPerformance[]> {
    
    let query = `
      SELECT 
        i.id as item_id,
        i.name as item_name,
        pt.external_system as pos_system,
        SUM(pti.quantity) as total_quantity_sold,
        SUM(pti.total_price) as total_revenue,
        AVG(pti.unit_price) as avg_selling_price,
        COUNT(DISTINCT pt.id) as transaction_count
      FROM pos_transaction_items pti
      JOIN pos_transactions pt ON pti.transaction_id = pt.id
      JOIN items i ON pti.item_id = i.id
      WHERE pt.transaction_at BETWEEN ? AND ?
    `;
    
    const params = [startDate, endDate];
    
    if (posSystem) {
      query += ' AND pt.external_system = ?';
      params.push(posSystem);
    }
    
    query += `
      GROUP BY i.id, i.name, pt.external_system
      ORDER BY total_revenue DESC
    `;
    
    const results = await db.query(query, params);
    
    return results.map(row => ({
      itemId: row.item_id,
      itemName: row.item_name,
      posSystem: row.pos_system,
      totalQuantitySold: row.total_quantity_sold,
      totalRevenue: row.total_revenue,
      avgSellingPrice: row.avg_selling_price,
      transactionCount: row.transaction_count,
      revenuePerTransaction: row.total_revenue / row.transaction_count
    }));
  }
  
  // تحلیل ساعات پیک فروش
  async getPeakSalesHours(
    startDate: Date,
    endDate: Date,
    posSystem?: string
  ): Promise<HourlySalesData[]> {
    
    let query = `
      SELECT 
        EXTRACT(HOUR FROM transaction_at) as hour,
        COUNT(*) as transaction_count,
        SUM(total_amount) as total_sales,
        AVG(total_amount) as avg_transaction_value
      FROM pos_transactions 
      WHERE transaction_at BETWEEN ? AND ?
      AND status = 'COMPLETED'
    `;
    
    const params = [startDate, endDate];
    
    if (posSystem) {
      query += ' AND external_system = ?';
      params.push(posSystem);
    }
    
    query += `
      GROUP BY EXTRACT(HOUR FROM transaction_at)
      ORDER BY hour
    `;
    
    const results = await db.query(query, params);
    
    return results.map(row => ({
      hour: row.hour,
      transactionCount: row.transaction_count,
      totalSales: row.total_sales,
      avgTransactionValue: row.avg_transaction_value
    }));
  }
  
  // گزارش تطبیق موجودی
  async getInventoryReconciliationReport(
    posSystem: string
  ): Promise<InventoryReconciliation[]> {
    
    const query = `
      SELECT 
        i.id as item_id,
        i.name as item_name,
        i.current_quantity as servaan_quantity,
        pi.external_quantity as pos_quantity,
        (i.current_quantity - pi.external_quantity) as variance,
        pi.last_synced_at
      FROM items i
      LEFT JOIN pos_inventory_sync pi ON i.id = pi.item_id AND pi.pos_system = ?
      WHERE i.is_active = true
      ORDER BY ABS(i.current_quantity - COALESCE(pi.external_quantity, 0)) DESC
    `;
    
    const results = await db.query(query, [posSystem]);
    
    return results.map(row => ({
      itemId: row.item_id,
      itemName: row.item_name,
      servaanQuantity: row.servaan_quantity,
      posQuantity: row.pos_quantity || 0,
      variance: row.variance || row.servaan_quantity,
      lastSyncedAt: row.last_synced_at,
      needsReconciliation: Math.abs(row.variance || row.servaan_quantity) > 0
    }));
  }
}
```

**🎯 سیستم یکپارچگی POS کامل آماده برای پیاده‌سازی است! تمام ویژگی‌های اتصال به POS های مختلف، پردازش تراکنش، همگام‌سازی real-time و تحلیل‌های پیشرفته طراحی شده است.** 