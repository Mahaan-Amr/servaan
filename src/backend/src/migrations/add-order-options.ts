import { PrismaClient } from '../../../shared/generated/client';

const prisma = new PrismaClient();

export async function addOrderOptions() {
  try {
    console.log('Starting migration: add-order-options');

    // Create order_options table
    await prisma.$executeRaw`
      CREATE TABLE order_options (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id TEXT NOT NULL,
        order_id TEXT NOT NULL UNIQUE,
        discount_enabled BOOLEAN DEFAULT FALSE,
        discount_type VARCHAR(20) DEFAULT 'PERCENTAGE',
        discount_value DECIMAL(12,2) DEFAULT 0,
        tax_enabled BOOLEAN DEFAULT TRUE,
        tax_percentage DECIMAL(5,2) DEFAULT 9.00,
        service_enabled BOOLEAN DEFAULT TRUE,
        service_percentage DECIMAL(5,2) DEFAULT 10.00,
        courier_enabled BOOLEAN DEFAULT FALSE,
        courier_amount DECIMAL(12,2) DEFAULT 0,
        courier_notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        CONSTRAINT fk_order_options_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
        CONSTRAINT fk_order_options_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
      );
    `;

    // Create business_presets table
    await prisma.$executeRaw`
      CREATE TABLE business_presets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id TEXT NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        is_default BOOLEAN DEFAULT FALSE,
        discount_enabled BOOLEAN DEFAULT FALSE,
        discount_type VARCHAR(20) DEFAULT 'PERCENTAGE',
        discount_value DECIMAL(12,2) DEFAULT 0,
        tax_enabled BOOLEAN DEFAULT TRUE,
        tax_percentage DECIMAL(5,2) DEFAULT 9.00,
        service_enabled BOOLEAN DEFAULT TRUE,
        service_percentage DECIMAL(5,2) DEFAULT 10.00,
        courier_enabled BOOLEAN DEFAULT FALSE,
        courier_amount DECIMAL(12,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        CONSTRAINT fk_business_presets_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
      );
    `;

    // Create indexes
    await prisma.$executeRaw`
      CREATE INDEX idx_order_options_tenant_id ON order_options(tenant_id);
      CREATE INDEX idx_order_options_order_id ON order_options(order_id);
      CREATE INDEX idx_business_presets_tenant_id ON business_presets(tenant_id);
    `;

    // Create default presets for existing tenants
    const tenants = await prisma.tenant.findMany({
      select: { id: true }
    });

    for (const tenant of tenants) {
      // Default preset
      await prisma.businessPreset.create({
        data: {
          tenantId: tenant.id,
          name: 'پیش‌فرض',
          description: 'تنظیمات پیش‌فرض سیستم',
          isDefault: true,
          discountEnabled: false,
          discountType: 'PERCENTAGE',
          discountValue: 0,
          taxEnabled: true,
          taxPercentage: 9.00,
          serviceEnabled: true,
          servicePercentage: 10.00,
          courierEnabled: false,
          courierAmount: 0
        }
      });

      // No tax preset
      await prisma.businessPreset.create({
        data: {
          tenantId: tenant.id,
          name: 'بدون مالیات',
          description: 'سفارش بدون مالیات',
          isDefault: false,
          discountEnabled: false,
          discountType: 'PERCENTAGE',
          discountValue: 0,
          taxEnabled: false,
          taxPercentage: 0,
          serviceEnabled: true,
          servicePercentage: 10.00,
          courierEnabled: false,
          courierAmount: 0
        }
      });

      // No service preset
      await prisma.businessPreset.create({
        data: {
          tenantId: tenant.id,
          name: 'بدون خدمات',
          description: 'سفارش بدون هزینه خدمات',
          isDefault: false,
          discountEnabled: false,
          discountType: 'PERCENTAGE',
          discountValue: 0,
          taxEnabled: true,
          taxPercentage: 9.00,
          serviceEnabled: false,
          servicePercentage: 0,
          courierEnabled: false,
          courierAmount: 0
        }
      });

      // With courier preset
      await prisma.businessPreset.create({
        data: {
          tenantId: tenant.id,
          name: 'با پیک',
          description: 'سفارش با هزینه پیک',
          isDefault: false,
          discountEnabled: false,
          discountType: 'PERCENTAGE',
          discountValue: 0,
          taxEnabled: true,
          taxPercentage: 9.00,
          serviceEnabled: true,
          servicePercentage: 10.00,
          courierEnabled: true,
          courierAmount: 50000
        }
      });
    }

    console.log('Migration completed successfully: add-order-options');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

// Run migration if called directly
if (require.main === module) {
  addOrderOptions()
    .then(() => {
      console.log('Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
} 
