# CRM Testing Strategy
## استراتژی تست مدیریت ارتباط با مشتری

### Overview | نمای کلی
Comprehensive testing strategy for Servaan CRM workspace to ensure reliability, performance, and user experience excellence. Focus on Persian localization, SMS integration, and customer data accuracy.

**Testing Approach**: Pyramid strategy with emphasis on integration and user acceptance testing
**Tools**: Jest, Cypress, Artillery, Postman
**Coverage Goal**: >85% code coverage, 100% critical path coverage

---

## 🧪 Testing Pyramid | هرم تست

### Unit Tests (60%) | تست‌های واحد
**Target Coverage**: 85%
**Tools**: Jest, TypeScript
**Focus Areas**:

#### Backend Services
```typescript
// Customer Service Tests
describe('CrmCustomerService', () => {
  describe('Phone Number Normalization', () => {
    test('should normalize Iranian mobile numbers correctly', () => {
      const service = new CrmCustomerService(mockPrisma);
      
      expect(service.normalizePhone('09123456789')).toBe('+989123456789');
      expect(service.normalizePhone('9123456789')).toBe('+989123456789');
      expect(service.normalizePhone('+989123456789')).toBe('+989123456789');
      expect(service.normalizePhone('00989123456789')).toBe('+989123456789');
    });

    test('should reject invalid phone formats', () => {
      const service = new CrmCustomerService(mockPrisma);
      
      expect(() => service.normalizePhone('123456')).toThrow('Invalid Iranian mobile number');
      expect(() => service.normalizePhone('09123456')).toThrow('Invalid Iranian mobile number');
      expect(() => service.normalizePhone('+1234567890')).toThrow('Invalid Iranian mobile number');
    });
  });

  describe('Customer Creation', () => {
    test('should create customer with loyalty record', async () => {
      const service = new CrmCustomerService(mockPrisma);
      const customerData = {
        phone: '09123456789',
        name: 'احمد محمدی',
        email: 'ahmad@test.com'
      };

      const result = await service.createCustomer(customerData);

      expect(result).toMatchObject({
        phone: '+989123456789',
        name: 'احمد محمدی',
        segment: 'new'
      });
      expect(mockPrisma.customerLoyalty.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          customerId: result.id,
          pointsEarned: 0,
          tierLevel: 'bronze'
        })
      });
    });

    test('should prevent duplicate phone numbers', async () => {
      mockPrisma.customer.findUnique.mockResolvedValue({ id: 'existing' });
      const service = new CrmCustomerService(mockPrisma);

      await expect(service.createCustomer({
        phone: '09123456789',
        name: 'Test'
      })).rejects.toThrow('Customer with this phone number already exists');
    });
  });
});

// Visit Service Tests
describe('CrmVisitService', () => {
  describe('Visit Recording', () => {
    test('should calculate and award loyalty points correctly', async () => {
      const service = new CrmVisitService(mockPrisma);
      const visitData = {
        customerId: 'customer-123',
        totalAmount: 125000, // Should earn 125 points
        paymentMethod: 'cash'
      };

      await service.recordVisit(visitData);

      expect(mockPrisma.customerLoyalty.update).toHaveBeenCalledWith({
        where: { customerId: 'customer-123' },
        data: expect.objectContaining({
          pointsEarned: { increment: 125 },
          lifetimeSpent: { increment: 125000 },
          totalVisits: { increment: 1 }
        })
      });
    });

    test('should update customer segment based on visit history', async () => {
      mockPrisma.customerLoyalty.findUnique.mockResolvedValue({
        totalVisits: 20,
        lifetimeSpent: 1500000
      });

      const service = new CrmVisitService(mockPrisma);
      await service.recordVisit({
        customerId: 'customer-123',
        totalAmount: 100000
      });

      expect(mockPrisma.customer.update).toHaveBeenCalledWith({
        where: { id: 'customer-123' },
        data: { segment: 'vip' }
      });
    });
  });
});

// SMS Service Tests
describe('SmsProviderService', () => {
  describe('Message Sending', () => {
    test('should handle Kavenegar API responses', async () => {
      const mockResponse = {
        json: () => Promise.resolve({
          return: { status: 200 },
          entries: [{ messageid: 12345 }]
        })
      };
      global.fetch = jest.fn().mockResolvedValue(mockResponse);

      const service = new SmsProviderService();
      const result = await service.sendSms('+989123456789', 'Test message');

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('12345');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('kavenegar'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('+989123456789')
        })
      );
    });

    test('should handle SMS delivery failures gracefully', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      const service = new SmsProviderService();
      const result = await service.sendSms('+989123456789', 'Test');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });
  });

  describe('Bulk SMS', () => {
    test('should process messages in batches', async () => {
      const service = new SmsProviderService();
      const messages = Array.from({ length: 250 }, (_, i) => ({
        phone: `+98912345${String(i).padStart(4, '0')}`,
        message: `Test message ${i}`
      }));

      const result = await service.sendBulkSms(messages);

      expect(result.total).toBe(250);
      expect(fetch).toHaveBeenCalledTimes(Math.ceil(250 / 100)); // Batch size 100
    });
  });
});
```

#### Frontend Components
```typescript
// Customer Search Component Tests
describe('CustomerSearch', () => {
  test('should render search input with Persian placeholder', () => {
    render(<CustomerSearch onCustomerSelect={jest.fn()} />);
    
    expect(screen.getByPlaceholderText(/جستجو مشتری/)).toBeInTheDocument();
  });

  test('should debounce search queries', async () => {
    const mockSearch = jest.fn();
    jest.spyOn(crmService, 'searchCustomers').mockImplementation(mockSearch);

    render(<CustomerSearch onCustomerSelect={jest.fn()} />);
    const input = screen.getByRole('textbox');

    fireEvent.change(input, { target: { value: 'احمد' } });
    fireEvent.change(input, { target: { value: 'احمد محمد' } });
    fireEvent.change(input, { target: { value: 'احمد محمدی' } });

    // Should only call search once after debounce
    await waitFor(() => {
      expect(mockSearch).toHaveBeenCalledTimes(1);
      expect(mockSearch).toHaveBeenCalledWith('احمد محمدی', { limit: 10 });
    });
  });

  test('should display search results with proper RTL layout', async () => {
    const mockCustomers = [
      {
        id: '1',
        name: 'احمد محمدی',
        phone: '+989123456789',
        segment: 'regular',
        loyalty: { currentPoints: 250, tierLevel: 'silver', totalVisits: 15 }
      }
    ];

    jest.spyOn(crmService, 'searchCustomers').mockResolvedValue({
      customers: mockCustomers,
      pagination: { currentPage: 1, totalPages: 1, totalItems: 1 }
    });

    render(<CustomerSearch onCustomerSelect={jest.fn()} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'احمد' } });

    await waitFor(() => {
      expect(screen.getByText('احمد محمدی')).toBeInTheDocument();
      expect(screen.getByText('+989123456789')).toBeInTheDocument();
      expect(screen.getByText('250 امتیاز')).toBeInTheDocument();
    });
  });
});

// Customer Profile Component Tests
describe('CustomerProfile', () => {
  const mockCustomer = {
    id: '1',
    name: 'فاطمه احمدی',
    phone: '+989987654321',
    email: 'fateme@test.com',
    segment: 'vip',
    loyalty: {
      currentPoints: 500,
      tierLevel: 'gold',
      totalVisits: 25,
      lifetimeSpent: 2500000
    }
  };

  test('should display customer information in Persian', () => {
    render(<CustomerProfile customer={mockCustomer} onUpdate={jest.fn()} />);

    expect(screen.getByText('فاطمه احمدی')).toBeInTheDocument();
    expect(screen.getByText('500 امتیاز')).toBeInTheDocument();
    expect(screen.getByText('طلا')).toBeInTheDocument(); // Gold tier in Persian
    expect(screen.getByText('25')).toBeInTheDocument(); // Visit count
  });

  test('should calculate and display average spend per visit', () => {
    render(<CustomerProfile customer={mockCustomer} onUpdate={jest.fn()} />);

    // 2,500,000 / 25 = 100,000 IRR per visit = 100K
    expect(screen.getByText('100K')).toBeInTheDocument();
  });

  test('should enable edit mode when edit button clicked', () => {
    render(<CustomerProfile customer={mockCustomer} onUpdate={jest.fn()} />);

    fireEvent.click(screen.getByText('ویرایش'));
    expect(screen.getByText('ذخیره')).toBeInTheDocument();
    expect(screen.getByText('انصراف')).toBeInTheDocument();
  });
});
```

### Integration Tests (30%) | تست‌های یکپارچه‌سازی
**Focus Areas**: API endpoints, database transactions, SMS integration

#### API Integration Tests
```typescript
// Customer API Integration Tests
describe('Customer API Integration', () => {
  beforeEach(async () => {
    await setupTestDatabase();
  });

  afterEach(async () => {
    await cleanupTestDatabase();
  });

  test('POST /api/crm/customers - should create customer with loyalty', async () => {
    const customerData = {
      phone: '09123456789',
      name: 'علی محمدی',
      email: 'ali@test.com',
      birthday: '1990-05-15'
    };

    const response = await request(app)
      .post('/api/crm/customers')
      .send(customerData)
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.customer).toMatchObject({
      phone: '+989123456789',
      name: 'علی محمدی',
      segment: 'new'
    });

    // Verify loyalty record was created
    const loyaltyRecord = await prisma.customerLoyalty.findUnique({
      where: { customerId: response.body.data.customer.id }
    });
    expect(loyaltyRecord).toBeTruthy();
    expect(loyaltyRecord.tierLevel).toBe('bronze');
  });

  test('GET /api/crm/customers/phone/:phone - should retrieve customer with history', async () => {
    // Create test customer with visits
    const customer = await createTestCustomer({
      phone: '+989123456789',
      name: 'مریم احمدی'
    });
    await createTestVisit({
      customerId: customer.id,
      totalAmount: 150000,
      itemsOrdered: [{ name: 'قهوه اسپرسو', quantity: 2 }]
    });

    const response = await request(app)
      .get('/api/crm/customers/phone/09123456789')
      .expect(200);

    expect(response.body.data.customer.name).toBe('مریم احمدی');
    expect(response.body.data.recent_visits).toHaveLength(1);
    expect(response.body.data.recent_visits[0].total_amount).toBe(150000);
  });

  test('POST /api/crm/visits - should record visit and update loyalty', async () => {
    const customer = await createTestCustomer();
    const visitData = {
      customer_id: customer.id,
      total_amount: 200000,
      items_ordered: [
        { name: 'کاپوچینو', quantity: 1, price: 80000 },
        { name: 'کیک شکلاتی', quantity: 1, price: 120000 }
      ],
      payment_method: 'card'
    };

    const response = await request(app)
      .post('/api/crm/visits')
      .send(visitData)
      .expect(201);

    // Verify visit was recorded
    expect(response.body.data.points_earned).toBe(200); // 200,000 / 1000

    // Verify loyalty was updated
    const loyalty = await prisma.customerLoyalty.findUnique({
      where: { customerId: customer.id }
    });
    expect(loyalty.currentPoints).toBe(200);
    expect(loyalty.lifetimeSpent).toBe(200000);
    expect(loyalty.totalVisits).toBe(1);
  });
});

// Campaign API Integration Tests
describe('Campaign API Integration', () => {
  test('POST /api/crm/campaigns - should create and validate campaign', async () => {
    const campaignData = {
      name: 'کمپین تولد زمستان',
      type: 'sms',
      target_segment: {
        birthday_month: 12,
        tier_levels: ['silver', 'gold']
      },
      template_content: 'سلام {{name}} عزیز! تولدت مبارک! 🎉',
      scheduled_date: '2024-12-01T09:00:00Z'
    };

    const response = await request(app)
      .post('/api/crm/campaigns')
      .send(campaignData)
      .expect(201);

    expect(response.body.data.name).toBe('کمپین تولد زمستان');
    expect(response.body.data.status).toBe('draft');
    expect(response.body.data.estimated_recipients).toBeGreaterThanOrEqual(0);
  });

  test('POST /api/crm/campaigns/:id/send - should send SMS campaign', async () => {
    // Create test customers
    const customers = await Promise.all([
      createTestCustomer({ 
        name: 'احمد محمدی', 
        phone: '+989123456789',
        birthday: '1985-12-15'
      }),
      createTestCustomer({ 
        name: 'فاطمه احمدی', 
        phone: '+989987654321',
        birthday: '1990-12-22'
      })
    ]);

    // Update their tier to silver
    await Promise.all(customers.map(c => 
      prisma.customerLoyalty.update({
        where: { customerId: c.id },
        data: { tierLevel: 'silver' }
      })
    ));

    const campaign = await createTestCampaign({
      target_segment: {
        birthday_month: 12,
        tier_levels: ['silver']
      },
      template_content: 'سلام {{name}} عزیز! تولدت مبارک!'
    });

    // Mock SMS service
    const mockSmsService = jest.spyOn(smsService, 'sendBulkSms')
      .mockResolvedValue({
        total: 2,
        sent: 2,
        failed: 0,
        results: [
          { success: true, messageId: '123' },
          { success: true, messageId: '456' }
        ]
      });

    const response = await request(app)
      .post(`/api/crm/campaigns/${campaign.id}/send`)
      .expect(200);

    expect(response.body.data.total_sent).toBe(2);
    expect(mockSmsService).toHaveBeenCalledWith([
      expect.objectContaining({
        phone: '+989123456789',
        message: 'سلام احمد محمدی عزیز! تولدت مبارک!'
      }),
      expect.objectContaining({
        phone: '+989987654321',
        message: 'سلام فاطمه احمدی عزیز! تولدت مبارک!'
      })
    ]);
  });
});
```

#### Database Transaction Tests
```typescript
describe('CRM Database Transactions', () => {
  test('should maintain data consistency during concurrent operations', async () => {
    const customer = await createTestCustomer();
    
    // Simulate concurrent visit recordings
    const concurrentVisits = Array.from({ length: 5 }, (_, i) => 
      recordVisit({
        customerId: customer.id,
        totalAmount: 100000,
        notes: `Concurrent visit ${i}`
      })
    );

    await Promise.all(concurrentVisits);

    // Verify final loyalty state is correct
    const loyalty = await prisma.customerLoyalty.findUnique({
      where: { customerId: customer.id }
    });

    expect(loyalty.totalVisits).toBe(5);
    expect(loyalty.currentPoints).toBe(500); // 5 × 100 points
    expect(loyalty.lifetimeSpent).toBe(500000); // 5 × 100,000 IRR
  });

  test('should rollback failed visit recordings', async () => {
    const customer = await createTestCustomer();
    
    // Mock Prisma to fail on loyalty update
    jest.spyOn(prisma.customerLoyalty, 'update')
      .mockRejectedValueOnce(new Error('Database error'));

    await expect(
      recordVisit({
        customerId: customer.id,
        totalAmount: 100000
      })
    ).rejects.toThrow('Database error');

    // Verify no partial data was saved
    const visits = await prisma.customerVisit.findMany({
      where: { customerId: customer.id }
    });
    expect(visits).toHaveLength(0);

    const transactions = await prisma.loyaltyTransaction.findMany({
      where: { customerId: customer.id }
    });
    expect(transactions).toHaveLength(0);
  });
});
```

### End-to-End Tests (10%) | تست‌های انتها به انتها
**Tools**: Cypress
**Focus**: Critical user journeys, Persian UI interaction

```typescript
// cypress/integration/crm-customer-management.spec.ts
describe('CRM Customer Management', () => {
  beforeEach(() => {
    cy.login('manager@test.com', 'password');
    cy.visit('/workspace/crm');
  });

  it('should complete full customer registration flow', () => {
    // Navigate to customer registration
    cy.get('[data-cy=add-customer-btn]').click();
    
    // Fill customer form in Persian
    cy.get('[data-cy=customer-name]').type('احمد محمدی');
    cy.get('[data-cy=customer-phone]').type('09123456789');
    cy.get('[data-cy=customer-email]').type('ahmad@test.com');
    cy.get('[data-cy=customer-birthday]').type('1985-03-15');
    cy.get('[data-cy=customer-notes]').type('مشتری جدید - ترجیح قهوه ترک');
    
    // Submit form
    cy.get('[data-cy=submit-customer]').click();
    
    // Verify success message
    cy.get('[data-cy=success-message]').should('contain', 'مشتری با موفقیت ثبت شد');
    
    // Verify customer appears in list
    cy.get('[data-cy=customer-search]').type('احمد محمدی');
    cy.get('[data-cy=search-results]').should('contain', 'احمد محمدی');
    cy.get('[data-cy=search-results]').should('contain', '09123456789');
  });

  it('should record customer visit and award points', () => {
    // Search for existing customer
    cy.get('[data-cy=customer-search]').type('09123456789');
    cy.get('[data-cy=search-results] .customer-item').first().click();
    
    // Open visit recording modal
    cy.get('[data-cy=record-visit-btn]').click();
    
    // Fill visit details
    cy.get('[data-cy=visit-amount]').type('125000');
    cy.get('[data-cy=payment-method]').select('cash');
    cy.get('[data-cy=table-number]').type('A5');
    cy.get('[data-cy=visit-notes]').type('سرویس عالی');
    
    // Add items
    cy.get('[data-cy=add-item-btn]').click();
    cy.get('[data-cy=item-name-0]').type('اسپرسو دوبل');
    cy.get('[data-cy=item-quantity-0]').type('2');
    cy.get('[data-cy=item-price-0]').type('45000');
    
    // Submit visit
    cy.get('[data-cy=submit-visit]').click();
    
    // Verify points awarded
    cy.get('[data-cy=success-message]').should('contain', '125 امتیاز اعطا شد');
    
    // Verify loyalty points updated
    cy.get('[data-cy=customer-points]').should('contain', '125');
  });

  it('should create and send SMS campaign', () => {
    // Navigate to campaigns
    cy.get('[data-cy=campaigns-tab]').click();
    cy.get('[data-cy=create-campaign-btn]').click();
    
    // Fill campaign details
    cy.get('[data-cy=campaign-name]').type('کمپین تست');
    cy.get('[data-cy=campaign-type]').select('sms');
    cy.get('[data-cy=template-content]').type('سلام {{name}} عزیز! پیام تستی.');
    
    // Set target segment
    cy.get('[data-cy=segment-tier]').select('silver');
    cy.get('[data-cy=segment-visits]').type('5');
    
    // Save campaign
    cy.get('[data-cy=save-campaign]').click();
    
    // Preview recipients
    cy.get('[data-cy=preview-recipients]').click();
    cy.get('[data-cy=recipient-list]').should('be.visible');
    
    // Send campaign
    cy.get('[data-cy=send-campaign]').click();
    cy.get('[data-cy=confirm-send]').click();
    
    // Verify campaign sent
    cy.get('[data-cy=campaign-status]').should('contain', 'ارسال شد');
    cy.get('[data-cy=delivery-stats]').should('be.visible');
  });
});

// cypress/integration/crm-feedback-collection.spec.ts
describe('CRM Feedback Collection', () => {
  it('should collect customer feedback via QR code', () => {
    // Simulate QR code scan (direct URL visit)
    cy.visit('/feedback/qr/table-a5');
    
    // Customer selects rating
    cy.get('[data-cy=rating-5]').click();
    
    // Optional phone number for loyalty points
    cy.get('[data-cy=customer-phone]').type('09123456789');
    
    // Add comment
    cy.get('[data-cy=feedback-comment]').type('سرویس بسیار عالی! قهوه فوق‌العاده خوشمزه بود.');
    
    // Select categories
    cy.get('[data-cy=category-service]').check();
    cy.get('[data-cy=category-quality]').check();
    
    // Submit feedback
    cy.get('[data-cy=submit-feedback]').click();
    
    // Verify thank you message
    cy.get('[data-cy=thank-you-message]').should('contain', 'متشکریم');
    cy.get('[data-cy=points-awarded]').should('contain', 'امتیاز');
  });
});
```

---

## 🔧 Performance Testing | تست عملکرد

### Load Testing with Artillery
```yaml
# artillery-config.yml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
    - duration: 120  
      arrivalRate: 50
    - duration: 60
      arrivalRate: 100

scenarios:
  - name: "Customer Search Performance"
    weight: 40
    flow:
      - post:
          url: "/api/auth/login"
          json:
            email: "test@example.com"
            password: "password"
          capture:
            - json: "$.token"
              as: "token"
      - get:
          url: "/api/crm/customers"
          qs:
            search: "احمد"
            limit: 20
          headers:
            Authorization: "Bearer {{ token }}"

  - name: "Visit Recording Performance"
    weight: 30
    flow:
      - post:
          url: "/api/auth/login"
          json:
            email: "staff@example.com"
            password: "password"
          capture:
            - json: "$.token"
              as: "token"
      - post:
          url: "/api/crm/visits"
          headers:
            Authorization: "Bearer {{ token }}"
          json:
            customer_phone: "09123456789"
            total_amount: 125000
            payment_method: "cash"
            items_ordered:
              - name: "اسپرسو"
                quantity: 2
                price: 45000

  - name: "SMS Campaign Sending"
    weight: 20
    flow:
      - post:
          url: "/api/auth/login"
          json:
            email: "manager@example.com"
            password: "password"
          capture:
            - json: "$.token"
              as: "token"
      - post:
          url: "/api/crm/campaigns"
          headers:
            Authorization: "Bearer {{ token }}"
          json:
            name: "Test Campaign {{ $randomString() }}"
            type: "sms"
            template_content: "Test message"
            target_segment:
              tier_levels: ["bronze", "silver"]
          capture:
            - json: "$.data.id"
              as: "campaignId"
      - post:
          url: "/api/crm/campaigns/{{ campaignId }}/send"
          headers:
            Authorization: "Bearer {{ token }}"
```

### Performance Benchmarks | معیارهای عملکرد
```typescript
// Performance test expectations
const PERFORMANCE_BENCHMARKS = {
  api: {
    customerSearch: {
      maxResponseTime: 200, // ms
      maxMemoryUsage: 50,   // MB
      throughput: 100       // requests/second
    },
    visitRecording: {
      maxResponseTime: 500, // ms (includes DB transaction)
      maxMemoryUsage: 30,   // MB
      throughput: 50        // requests/second
    },
    smsSending: {
      maxResponseTime: 2000, // ms (external API)
      batchSize: 100,        // messages per batch
      throughput: 500        // messages/minute
    }
  },
  
  frontend: {
    initialLoad: 3000,      // ms
    customerSearch: 300,     // ms after typing
    pageTransition: 200,     // ms
    memoryLeakThreshold: 100 // MB growth per hour
  },
  
  database: {
    customerQuery: 50,       // ms
    loyaltyUpdate: 100,      // ms
    campaignTargeting: 200,  // ms
    maxConnections: 100      // concurrent connections
  }
};
```

---

## 📊 Test Data Management | مدیریت داده‌های تست

### Sample Data Generator
```typescript
// test/fixtures/customerDataGenerator.ts
export class CustomerDataGenerator {
  private readonly persianNames = [
    'احمد محمدی', 'فاطمه احمدی', 'علی رضایی', 'مریم محمدی',
    'حسن احمدی', 'زهرا رضایی', 'محمد حسینی', 'سارا محمدی'
  ];

  private readonly phonePrefix = [
    '0912', '0913', '0914', '0915', '0916', '0917', '0918', '0919',
    '0901', '0902', '0903', '0905', '0930', '0933', '0934', '0935'
  ];

  generateCustomer(overrides: Partial<Customer> = {}): Customer {
    const name = this.randomName();
    const phone = this.randomPhone();
    
    return {
      id: uuidv4(),
      phone,
      name,
      email: this.generateEmail(name),
      birthday: this.randomBirthday(),
      segment: this.randomSegment(),
      status: 'active',
      notes: `یادداشت تست برای ${name}`,
      preferences: {
        favorite_drink: this.randomDrink(),
        preferred_time: this.randomTime()
      },
      createdAt: this.randomPastDate(),
      ...overrides
    };
  }

  generateLoyalty(customerId: string): CustomerLoyalty {
    const visits = this.randomInt(1, 50);
    const pointsPerVisit = this.randomInt(50, 200);
    const totalPoints = visits * pointsPerVisit;
    const redeemedPoints = Math.floor(totalPoints * 0.3);

    return {
      id: uuidv4(),
      customerId,
      pointsEarned: totalPoints,
      pointsRedeemed: redeemedPoints,
      currentPoints: totalPoints - redeemedPoints,
      tierLevel: this.calculateTier(totalPoints - redeemedPoints),
      lifetimeSpent: visits * this.randomInt(50000, 300000),
      totalVisits: visits,
      lastVisitDate: this.randomRecentDate()
    };
  }

  generateVisit(customerId: string): CustomerVisit {
    const amount = this.randomInt(30000, 500000);
    
    return {
      id: uuidv4(),
      customerId,
      visitDate: this.randomRecentDate(),
      totalAmount: amount,
      itemsOrdered: this.generateOrderItems(),
      paymentMethod: this.randomPaymentMethod(),
      pointsEarned: Math.floor(amount / 1000),
      feedbackRating: this.randomInt(3, 5),
      feedbackComment: this.randomFeedbackComment()
    };
  }

  private randomName(): string {
    return this.persianNames[Math.floor(Math.random() * this.persianNames.length)];
  }

  private randomPhone(): string {
    const prefix = this.phonePrefix[Math.floor(Math.random() * this.phonePrefix.length)];
    const suffix = String(Math.floor(Math.random() * 10000000)).padStart(7, '0');
    return prefix + suffix;
  }

  private generateEmail(name: string): string {
    const englishName = this.transliterate(name);
    const domain = ['gmail.com', 'yahoo.com', 'test.com'][Math.floor(Math.random() * 3)];
    return `${englishName.toLowerCase().replace(' ', '.')}@${domain}`;
  }

  // Generate 1000 test customers with realistic data distribution
  generateTestDataset(): {
    customers: Customer[];
    loyalty: CustomerLoyalty[];
    visits: CustomerVisit[];
  } {
    const customers = Array.from({ length: 1000 }, () => this.generateCustomer());
    
    const loyalty = customers.map(c => this.generateLoyalty(c.id));
    
    const visits = customers.flatMap(c => 
      Array.from({ length: this.randomInt(1, 20) }, () => this.generateVisit(c.id))
    );

    return { customers, loyalty, visits };
  }
}
```

### Test Environment Setup
```typescript
// test/setup/testEnvironment.ts
export async function setupTestEnvironment() {
  // Setup test database
  await execSync('createdb servaan_test');
  await execSync('psql -d servaan_test -f schema/crm-schema.sql');
  
  // Generate test data
  const generator = new CustomerDataGenerator();
  const { customers, loyalty, visits } = generator.generateTestDataset();
  
  // Insert test data
  await prisma.customer.createMany({ data: customers });
  await prisma.customerLoyalty.createMany({ data: loyalty });
  await prisma.customerVisit.createMany({ data: visits });
  
  // Setup mock SMS provider
  setupMockSmsProvider();
  
  console.log('✅ Test environment setup complete');
}

export async function cleanupTestEnvironment() {
  await prisma.$executeRaw`TRUNCATE TABLE customers, customer_loyalty, customer_visits RESTART IDENTITY CASCADE`;
  await execSync('dropdb servaan_test');
  console.log('✅ Test environment cleanup complete');
}
```

---

## 🚨 Error Testing & Edge Cases | تست خطاها و موارد حدی

### SMS Provider Failure Scenarios
```typescript
describe('SMS Provider Resilience', () => {
  test('should handle provider downtime gracefully', async () => {
    // Mock all providers to fail
    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('Network timeout'));
    
    const campaign = await createTestCampaign();
    const result = await campaignService.sendCampaign(campaign.id);
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('All SMS providers failed');
    
    // Verify campaign status updated
    const updatedCampaign = await prisma.campaign.findUnique({
      where: { id: campaign.id }
    });
    expect(updatedCampaign.status).toBe('failed');
  });

  test('should fallback to secondary provider on primary failure', async () => {
    // Mock primary provider to fail, secondary to succeed
    jest.spyOn(global, 'fetch')
      .mockRejectedValueOnce(new Error('Primary provider down'))
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, id: 'backup-123' })
      });

    const result = await smsService.sendSms('+989123456789', 'Test message');
    
    expect(result.success).toBe(true);
    expect(result.provider).toBe('backup');
  });
});
```

### Database Edge Cases
```typescript
describe('Database Edge Cases', () => {
  test('should handle database connection loss during transaction', async () => {
    const customer = await createTestCustomer();
    
    // Simulate connection loss during loyalty update
    jest.spyOn(prisma, '$transaction').mockImplementation(async (callback) => {
      await callback(prisma);
      throw new Error('Connection lost');
    });

    await expect(
      visitService.recordVisit({
        customerId: customer.id,
        totalAmount: 100000
      })
    ).rejects.toThrow('Connection lost');

    // Verify no partial data corruption
    const visits = await prisma.customerVisit.count({
      where: { customerId: customer.id }
    });
    expect(visits).toBe(0);
  });

  test('should handle concurrent loyalty point updates correctly', async () => {
    const customer = await createTestCustomer();
    
    // Simulate race condition with concurrent point awards
    const concurrentUpdates = Promise.all([
      awardLoyaltyPoints(customer.id, 100),
      awardLoyaltyPoints(customer.id, 150),
      awardLoyaltyPoints(customer.id, 75)
    ]);

    await concurrentUpdates;

    const loyalty = await prisma.customerLoyalty.findUnique({
      where: { customerId: customer.id }
    });
    
    expect(loyalty.currentPoints).toBe(325); // All points should be correctly summed
  });
});
```

---

## 📈 Test Metrics & Reporting | معیارها و گزارش‌دهی تست

### Coverage Requirements
```json
{
  "jest": {
    "collectCoverageFrom": [
      "src/**/*.{js,ts,tsx}",
      "!src/**/*.d.ts",
      "!src/test/**/*"
    ],
    "coverageThreshold": {
      "global": {
        "branches": 80,
        "functions": 85,
        "lines": 85,
        "statements": 85
      },
      "./src/services/crm/": {
        "branches": 90,
        "functions": 95,
        "lines": 95,
        "statements": 95
      }
    }
  }
}
```

### Test Automation Pipeline
```yaml
# .github/workflows/crm-testing.yml
name: CRM Testing Pipeline

on:
  push:
    paths:
      - 'src/backend/src/services/crm/**'
      - 'src/frontend/src/components/crm/**'
      - 'src/frontend/src/pages/crm/**'
  pull_request:
    paths:
      - 'src/backend/src/services/crm/**'
      - 'src/frontend/src/components/crm/**'

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:unit -- --coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Setup test database
        run: |
          createdb servaan_test
          psql -d servaan_test -f schema/crm-schema.sql
        env:
          PGPASSWORD: postgres
      
      - name: Run integration tests
        run: npm run test:integration:crm
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/servaan_test

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Start application
        run: |
          npm run build
          npm run start:test &
          sleep 30
      
      - name: Run Cypress tests
        run: npx cypress run --spec "cypress/integration/crm/**/*"
      
      - name: Upload test videos
        uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: cypress-videos
          path: cypress/videos

  performance-tests:
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install artillery
        run: npm install -g artillery
      
      - name: Run load tests
        run: artillery run test/performance/crm-load-test.yml
      
      - name: Generate performance report
        run: artillery report --output performance-report.html
```

---

*This comprehensive testing strategy ensures the CRM workspace meets quality, performance, and reliability standards while maintaining excellent user experience for Persian-speaking users.* 