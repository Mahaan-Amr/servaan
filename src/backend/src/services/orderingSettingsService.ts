import { PrismaClient } from '../../../shared/generated/client';
import { AppError } from '../utils/AppError';

const prisma = new PrismaClient();

export interface OrderingSettings {
  id: string;
  tenantId: string;
  orderCreationEnabled: boolean;
  lockItemsWithoutStock: boolean;
  requireManagerConfirmationForNoStock: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateOrderingSettingsData {
  orderCreationEnabled?: boolean;
  lockItemsWithoutStock?: boolean;
  requireManagerConfirmationForNoStock?: boolean;
}

export class OrderingSettingsService {
  /**
   * Get ordering settings for a tenant
   * Creates default settings if they don't exist
   */
  static async getOrderingSettings(tenantId: string): Promise<OrderingSettings> {
    try {
      let settings = await prisma.orderingSettings.findUnique({
        where: { tenantId }
      });

      // Create default settings if they don't exist
      if (!settings) {
        settings = await prisma.orderingSettings.create({
          data: {
            tenantId,
            orderCreationEnabled: true,
            lockItemsWithoutStock: false,
            requireManagerConfirmationForNoStock: false
          }
        });
      }

      return settings;
    } catch (error) {
      throw new AppError('Failed to get ordering settings', 500, error);
    }
  }

  /**
   * Update ordering settings
   */
  static async updateOrderingSettings(
    tenantId: string,
    updateData: UpdateOrderingSettingsData
  ): Promise<OrderingSettings> {
    try {
      const settings = await prisma.orderingSettings.upsert({
        where: { tenantId },
        update: {
          ...updateData,
          updatedAt: new Date()
        },
        create: {
          tenantId,
          orderCreationEnabled: updateData.orderCreationEnabled ?? true,
          lockItemsWithoutStock: updateData.lockItemsWithoutStock ?? false,
          requireManagerConfirmationForNoStock: updateData.requireManagerConfirmationForNoStock ?? false
        }
      });

      return settings;
    } catch (error) {
      throw new AppError('Failed to update ordering settings', 500, error);
    }
  }

  /**
   * Check if order creation is enabled
   */
  static async isOrderCreationEnabled(tenantId: string): Promise<boolean> {
    try {
      const settings = await this.getOrderingSettings(tenantId);
      return settings.orderCreationEnabled;
    } catch (error) {
      // Default to enabled if there's an error
      console.error('Error checking order creation enabled:', error);
      return true;
    }
  }

  /**
   * Check if items without stock should be locked
   */
  static async shouldLockItemsWithoutStock(tenantId: string): Promise<boolean> {
    try {
      const settings = await this.getOrderingSettings(tenantId);
      return settings.lockItemsWithoutStock;
    } catch (error) {
      // Default to false if there's an error
      console.error('Error checking lock items without stock:', error);
      return false;
    }
  }

  /**
   * Check if manager confirmation is required for no stock orders
   */
  static async requiresManagerConfirmationForNoStock(tenantId: string): Promise<boolean> {
    try {
      const settings = await this.getOrderingSettings(tenantId);
      return settings.requireManagerConfirmationForNoStock;
    } catch (error) {
      // Default to false if there's an error
      console.error('Error checking require manager confirmation:', error);
      return false;
    }
  }
}

