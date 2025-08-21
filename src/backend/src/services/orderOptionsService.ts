import { PrismaClient } from '../../shared/generated/client';
import { AppError } from '../utils/AppError';
import { OrderCalculationService, OrderOptions, BusinessPreset } from './orderCalculationService';

const prisma = new PrismaClient();

export interface CreateOrderOptionsData {
  orderId: string;
  discountEnabled?: boolean;
  discountType?: 'PERCENTAGE' | 'AMOUNT';
  discountValue?: number;
  taxEnabled?: boolean;
  taxPercentage?: number;
  serviceEnabled?: boolean;
  servicePercentage?: number;
  courierEnabled?: boolean;
  courierAmount?: number;
  courierNotes?: string;
}

export interface UpdateOrderOptionsData {
  discountEnabled?: boolean;
  discountType?: 'PERCENTAGE' | 'AMOUNT';
  discountValue?: number;
  taxEnabled?: boolean;
  taxPercentage?: number;
  serviceEnabled?: boolean;
  servicePercentage?: number;
  courierEnabled?: boolean;
  courierAmount?: number;
  courierNotes?: string;
}

export interface CreateBusinessPresetData {
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
  /**
   * Save order options
   */
  static async saveOrderOptions(
    tenantId: string, 
    orderId: string, 
    options: OrderOptions
  ) {
    try {
      // Validate options
      const validation = OrderCalculationService.validateOrderOptions(options);
      if (!validation.isValid) {
        throw new AppError(`Invalid order options: ${validation.errors.join(', ')}`, 400);
      }

      return await prisma.orderOptions.upsert({
        where: { orderId },
        update: {
          discountEnabled: options.discountEnabled,
          discountType: options.discountType,
          discountValue: options.discountValue,
          taxEnabled: options.taxEnabled,
          taxPercentage: options.taxPercentage,
          serviceEnabled: options.serviceEnabled,
          servicePercentage: options.servicePercentage,
          courierEnabled: options.courierEnabled,
          courierAmount: options.courierAmount,
          courierNotes: options.courierNotes,
          updatedAt: new Date()
        },
        create: {
          orderId,
          tenantId,
          discountEnabled: options.discountEnabled,
          discountType: options.discountType,
          discountValue: options.discountValue,
          taxEnabled: options.taxEnabled,
          taxPercentage: options.taxPercentage,
          serviceEnabled: options.serviceEnabled,
          servicePercentage: options.servicePercentage,
          courierEnabled: options.courierEnabled,
          courierAmount: options.courierAmount,
          courierNotes: options.courierNotes
        }
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to save order options', 500);
    }
  }

  /**
   * Get order options
   */
  static async getOrderOptions(orderId: string): Promise<OrderOptions> {
    try {
      const options = await prisma.orderOptions.findUnique({
        where: { orderId }
      });

      if (!options) {
        return OrderCalculationService.getDefaultOptions();
      }

      return {
        discountEnabled: options.discountEnabled,
        discountType: options.discountType as 'PERCENTAGE' | 'AMOUNT',
        discountValue: Number(options.discountValue),
        taxEnabled: options.taxEnabled,
        taxPercentage: Number(options.taxPercentage),
        serviceEnabled: options.serviceEnabled,
        servicePercentage: Number(options.servicePercentage),
        courierEnabled: options.courierEnabled,
        courierAmount: Number(options.courierAmount),
        courierNotes: options.courierNotes || ''
      };
    } catch (error) {
      throw new AppError('Failed to get order options', 500);
    }
  }

  /**
   * Get business presets
   */
  static async getBusinessPresets(tenantId: string): Promise<BusinessPreset[]> {
    try {
      const presets = await prisma.businessPreset.findMany({
        where: { tenantId },
        orderBy: { isDefault: 'desc' }
      });

      return presets.map(preset => ({
        id: preset.id,
        tenantId: preset.tenantId,
        name: preset.name,
        description: preset.description || undefined,
        isDefault: preset.isDefault,
        discountEnabled: preset.discountEnabled,
        discountType: preset.discountType,
        discountValue: Number(preset.discountValue),
        taxEnabled: preset.taxEnabled,
        taxPercentage: Number(preset.taxPercentage),
        serviceEnabled: preset.serviceEnabled,
        servicePercentage: Number(preset.servicePercentage),
        courierEnabled: preset.courierEnabled,
        courierAmount: Number(preset.courierAmount),
        createdAt: preset.createdAt
      }));
    } catch (error) {
      throw new AppError('Failed to get business presets', 500);
    }
  }

  /**
   * Create business preset
   */
  static async createBusinessPreset(
    tenantId: string, 
    presetData: CreateBusinessPresetData
  ): Promise<BusinessPreset> {
    try {
      // If this is a default preset, unset other defaults
      if (presetData.isDefault) {
        await prisma.businessPreset.updateMany({
          where: { 
            tenantId,
            isDefault: true 
          },
          data: { isDefault: false }
        });
      }

      const preset = await prisma.businessPreset.create({
        data: {
          tenantId,
          name: presetData.name,
          description: presetData.description,
          isDefault: presetData.isDefault || false,
          discountEnabled: presetData.discountEnabled || false,
          discountType: presetData.discountType || 'PERCENTAGE',
          discountValue: presetData.discountValue || 0,
          taxEnabled: presetData.taxEnabled !== undefined ? presetData.taxEnabled : true,
          taxPercentage: presetData.taxPercentage || 9.00,
          serviceEnabled: presetData.serviceEnabled !== undefined ? presetData.serviceEnabled : true,
          servicePercentage: presetData.servicePercentage || 10.00,
          courierEnabled: presetData.courierEnabled || false,
          courierAmount: presetData.courierAmount || 0
        }
      });

      return {
        id: preset.id,
        tenantId: preset.tenantId,
        name: preset.name,
        description: preset.description || undefined,
        isDefault: preset.isDefault,
        discountEnabled: preset.discountEnabled,
        discountType: preset.discountType,
        discountValue: Number(preset.discountValue),
        taxEnabled: preset.taxEnabled,
        taxPercentage: Number(preset.taxPercentage),
        serviceEnabled: preset.serviceEnabled,
        servicePercentage: Number(preset.servicePercentage),
        courierEnabled: preset.courierEnabled,
        courierAmount: Number(preset.courierAmount),
        createdAt: preset.createdAt
      };
    } catch (error) {
      throw new AppError('Failed to create business preset', 500);
    }
  }

  /**
   * Update business preset
   */
  static async updateBusinessPreset(
    tenantId: string,
    presetId: string,
    presetData: Partial<CreateBusinessPresetData>
  ): Promise<BusinessPreset> {
    try {
      // If this is a default preset, unset other defaults
      if (presetData.isDefault) {
        await prisma.businessPreset.updateMany({
          where: { 
            tenantId,
            isDefault: true,
            id: { not: presetId }
          },
          data: { isDefault: false }
        });
      }

      const preset = await prisma.businessPreset.update({
        where: { 
          id: presetId,
          tenantId 
        },
        data: {
          name: presetData.name,
          description: presetData.description,
          isDefault: presetData.isDefault,
          discountEnabled: presetData.discountEnabled,
          discountType: presetData.discountType,
          discountValue: presetData.discountValue,
          taxEnabled: presetData.taxEnabled,
          taxPercentage: presetData.taxPercentage,
          serviceEnabled: presetData.serviceEnabled,
          servicePercentage: presetData.servicePercentage,
          courierEnabled: presetData.courierEnabled,
          courierAmount: presetData.courierAmount
        }
      });

      return {
        id: preset.id,
        tenantId: preset.tenantId,
        name: preset.name,
        description: preset.description || undefined,
        isDefault: preset.isDefault,
        discountEnabled: preset.discountEnabled,
        discountType: preset.discountType,
        discountValue: Number(preset.discountValue),
        taxEnabled: preset.taxEnabled,
        taxPercentage: Number(preset.taxPercentage),
        serviceEnabled: preset.serviceEnabled,
        servicePercentage: Number(preset.servicePercentage),
        courierEnabled: preset.courierEnabled,
        courierAmount: Number(preset.courierAmount),
        createdAt: preset.createdAt
      };
    } catch (error) {
      throw new AppError('Failed to update business preset', 500);
    }
  }

  /**
   * Delete business preset
   */
  static async deleteBusinessPreset(tenantId: string, presetId: string): Promise<void> {
    try {
      const preset = await prisma.businessPreset.findFirst({
        where: { 
          id: presetId,
          tenantId 
        }
      });

      if (!preset) {
        throw new AppError('Business preset not found', 404);
      }

      if (preset.isDefault) {
        throw new AppError('Cannot delete default preset', 400);
      }

      await prisma.businessPreset.delete({
        where: { id: presetId }
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to delete business preset', 500);
    }
  }

  /**
   * Get default preset for tenant
   */
  static async getDefaultPreset(tenantId: string): Promise<BusinessPreset | null> {
    try {
      const preset = await prisma.businessPreset.findFirst({
        where: { 
          tenantId,
          isDefault: true 
        }
      });

      if (!preset) {
        return null;
      }

      return {
        id: preset.id,
        tenantId: preset.tenantId,
        name: preset.name,
        description: preset.description || undefined,
        isDefault: preset.isDefault,
        discountEnabled: preset.discountEnabled,
        discountType: preset.discountType,
        discountValue: Number(preset.discountValue),
        taxEnabled: preset.taxEnabled,
        taxPercentage: Number(preset.taxPercentage),
        serviceEnabled: preset.serviceEnabled,
        servicePercentage: Number(preset.servicePercentage),
        courierEnabled: preset.courierEnabled,
        courierAmount: Number(preset.courierAmount),
        createdAt: preset.createdAt
      };
    } catch (error) {
      throw new AppError('Failed to get default preset', 500);
    }
  }

  /**
   * Apply preset to order options
   */
  static async applyPresetToOrder(
    tenantId: string,
    orderId: string,
    presetId: string
  ): Promise<OrderOptions> {
    try {
      const preset = await prisma.businessPreset.findFirst({
        where: { 
          id: presetId,
          tenantId 
        }
      });

      if (!preset) {
        throw new AppError('Business preset not found', 404);
      }

      const options: OrderOptions = {
        discountEnabled: preset.discountEnabled,
        discountType: preset.discountType as 'PERCENTAGE' | 'AMOUNT',
        discountValue: Number(preset.discountValue),
        taxEnabled: preset.taxEnabled,
        taxPercentage: Number(preset.taxPercentage),
        serviceEnabled: preset.serviceEnabled,
        servicePercentage: Number(preset.servicePercentage),
        courierEnabled: preset.courierEnabled,
        courierAmount: Number(preset.courierAmount),
        courierNotes: ''
      };

      // Save the applied options
      await this.saveOrderOptions(tenantId, orderId, options);

      return options;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to apply preset to order', 500);
    }
  }
} 
