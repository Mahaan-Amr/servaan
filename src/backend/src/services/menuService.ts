import { PrismaClient, MenuCategory, MenuItem, MenuItemModifier } from '../../../shared/generated/client';
import { AppError } from '../utils/AppError';

const prisma = new PrismaClient();

export interface CreateCategoryData {
  name: string;
  nameEn?: string;
  description?: string;
  displayOrder?: number;
  color?: string;
  icon?: string;
  availableFrom?: string;
  availableTo?: string;
  availableDays?: string[];
}

export interface UpdateCategoryData extends Partial<CreateCategoryData> {
  isActive?: boolean;
}

export interface CreateMenuItemData {
  itemId?: string;
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
}

export interface UpdateMenuItemData extends Partial<CreateMenuItemData> {
  isActive?: boolean;
  isAvailable?: boolean;
}

export interface CreateModifierData {
  menuItemId: string;
  name: string;
  nameEn?: string;
  additionalPrice?: number;
  isRequired?: boolean;
  maxQuantity?: number;
  displayOrder?: number;
}

export interface UpdateModifierData extends Partial<CreateModifierData> {
  isActive?: boolean;
}

export interface MenuFilterOptions {
  categoryId?: string;
  isActive?: boolean;
  isAvailable?: boolean;
  isFeatured?: boolean;
  isVegetarian?: boolean;
  isSpicy?: boolean;
  isNew?: boolean;
  priceRange?: {
    min?: number;
    max?: number;
  };
  search?: string;
}

export class MenuService {
  /**
   * Create menu category
   */
  static async createCategory(tenantId: string, categoryData: CreateCategoryData) {
    try {
      // Validate category name uniqueness
      const existingCategory = await prisma.menuCategory.findFirst({
        where: {
          tenantId,
          name: categoryData.name,
          isActive: true
        }
      });

      if (existingCategory) {
        throw new AppError(`Category "${categoryData.name}" already exists`, 400);
      }

      // Get next display order if not provided
      let displayOrder = categoryData.displayOrder;
      if (displayOrder === undefined) {
        const lastCategory = await prisma.menuCategory.findFirst({
          where: { tenantId, isActive: true },
          orderBy: { displayOrder: 'desc' },
          select: { displayOrder: true }
        });
        displayOrder = (lastCategory?.displayOrder || 0) + 1;
      }

      const category = await prisma.menuCategory.create({
        data: {
          tenantId,
          name: categoryData.name,
          nameEn: categoryData.nameEn,
          description: categoryData.description,
          displayOrder,
          color: categoryData.color,
          icon: categoryData.icon,
          availableFrom: categoryData.availableFrom,
          availableTo: categoryData.availableTo,
          availableDays: categoryData.availableDays || []
        }
      });

      return category;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to create category', 500, error);
    }
  }

  /**
   * Get menu categories with items count
   */
  static async getCategories(tenantId: string, includeInactive: boolean = false) {
    try {
      const where: any = { tenantId };
      if (!includeInactive) {
        where.isActive = true;
      }

      const categories = await prisma.menuCategory.findMany({
        where,
        include: {
          _count: {
            select: {
              items: {
                where: {
                  isActive: true
                }
              }
            }
          },
          items: {
            where: {
              isActive: true,
              isAvailable: true
            },
            select: {
              id: true,
              displayName: true,
              menuPrice: true,
              isFeatured: true,
              isNew: true,
              thumbnailUrl: true
            },
            orderBy: {
              displayOrder: 'asc'
            },
            take: 3 // Preview items
          }
        },
        orderBy: {
          displayOrder: 'asc'
        }
      });

      // Check current availability for each category
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
      const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

      const categoriesWithAvailability = categories.map(category => ({
        ...category,
        itemsCount: category._count.items,
        previewItems: category.items,
        isCurrentlyAvailable: this.isCategoryAvailable(category, currentTime, currentDay)
      }));

      return categoriesWithAvailability;
    } catch (error) {
      throw new AppError('Failed to get categories', 500, error);
    }
  }

  /**
   * Update category
   */
  static async updateCategory(
    tenantId: string,
    categoryId: string,
    updateData: UpdateCategoryData
  ) {
    try {
      const existingCategory = await prisma.menuCategory.findFirst({
        where: { id: categoryId, tenantId }
      });

      if (!existingCategory) {
        throw new AppError('Category not found', 404);
      }

      // Check name uniqueness if being updated
      if (updateData.name && updateData.name !== existingCategory.name) {
        const duplicateCategory = await prisma.menuCategory.findFirst({
          where: {
            tenantId,
            name: updateData.name,
            isActive: true,
            id: { not: categoryId }
          }
        });

        if (duplicateCategory) {
          throw new AppError(`Category "${updateData.name}" already exists`, 400);
        }
      }

      const updatedCategory = await prisma.menuCategory.update({
        where: { id: categoryId },
        data: {
          ...updateData,
          updatedAt: new Date()
        }
      });

      return updatedCategory;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to update category', 500, error);
    }
  }

  /**
   * Create menu item
   */
  static async createMenuItem(tenantId: string, menuItemData: CreateMenuItemData) {
    try {
      return await prisma.$transaction(async (tx) => {
        // Validate item exists in inventory ONLY if itemId is provided
        if (menuItemData.itemId) {
          const item = await tx.item.findFirst({
            where: {
              id: menuItemData.itemId,
              tenantId,
              isActive: true
            }
          });

          if (!item) {
            throw new AppError('Inventory item not found', 404);
          }
        }

        // Validate category exists
        const category = await tx.menuCategory.findFirst({
          where: {
            id: menuItemData.categoryId,
            tenantId,
            isActive: true
          }
        });

        if (!category) {
          throw new AppError('Category not found', 404);
        }

        // Check if item already exists in menu (only when itemId is provided)
        if (menuItemData.itemId) {
          const existingMenuItem = await tx.menuItem.findFirst({
            where: {
              tenantId,
              itemId: menuItemData.itemId,
              isActive: true
            }
          });

          if (existingMenuItem) {
            throw new AppError('Item already exists in menu', 400);
          }
        }

        // Get next display order if not provided
        let displayOrder = menuItemData.displayOrder;
        if (displayOrder === undefined) {
          const lastItem = await tx.menuItem.findFirst({
            where: { categoryId: menuItemData.categoryId, isActive: true },
            orderBy: { displayOrder: 'desc' },
            select: { displayOrder: true }
          });
          displayOrder = (lastItem?.displayOrder || 0) + 1;
        }

        // Validate price
        if (menuItemData.menuPrice <= 0) {
          throw new AppError('Menu price must be greater than zero', 400);
        }

        const menuItem = await tx.menuItem.create({
          data: {
            tenantId,
            itemId: menuItemData.itemId || null, // Allow null for items without inventory connection
            categoryId: menuItemData.categoryId,
            displayName: menuItemData.displayName,
            displayNameEn: menuItemData.displayNameEn,
            description: menuItemData.description,
            shortDesc: menuItemData.shortDesc,
            menuPrice: menuItemData.menuPrice,
            originalPrice: menuItemData.originalPrice,
            displayOrder,
            isFeatured: menuItemData.isFeatured || false,
            isSpicy: menuItemData.isSpicy || false,
            isVegetarian: menuItemData.isVegetarian || false,
            isNew: menuItemData.isNew || false,
            imageUrl: menuItemData.imageUrl,
            thumbnailUrl: menuItemData.thumbnailUrl,
            prepTime: menuItemData.prepTime,
            cookingNotes: menuItemData.cookingNotes,
            availableFrom: menuItemData.availableFrom,
            availableTo: menuItemData.availableTo,
            maxOrderQty: menuItemData.maxOrderQty,
            calories: menuItemData.calories,
            allergens: menuItemData.allergens || []
          },
          include: {
            item: {
              select: {
                id: true,
                name: true,
                barcode: true,
                description: true
              }
            },
            category: {
              select: {
                id: true,
                name: true,
                color: true,
                icon: true
              }
            }
          }
        });

        return menuItem;
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('خطا در ایجاد آیتم منو', 500);
    }
  }

  /**
   * Get menu items with filtering
   */
  static async getMenuItems(
    tenantId: string,
    options: MenuFilterOptions & {
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    } = {}
  ) {
    try {
      const {
        page = 1,
        limit = 50,
        sortBy = 'displayOrder',
        sortOrder = 'asc',
        ...filters
      } = options;

      const skip = (page - 1) * limit;
      const where: any = { 
        tenantId,
        isActive: filters.isActive !== undefined ? filters.isActive : true // Default to active items only
      };

      // Apply filters
      if (filters.categoryId) {
        where.categoryId = filters.categoryId;
      }

      if (filters.isAvailable !== undefined) {
        where.isAvailable = filters.isAvailable;
      }

      if (filters.isFeatured !== undefined) {
        where.isFeatured = filters.isFeatured;
      }

      if (filters.isVegetarian !== undefined) {
        where.isVegetarian = filters.isVegetarian;
      }

      if (filters.isSpicy !== undefined) {
        where.isSpicy = filters.isSpicy;
      }

      if (filters.priceRange) {
        where.menuPrice = {};
        if (filters.priceRange.min !== undefined) {
          where.menuPrice.gte = filters.priceRange.min;
        }
        if (filters.priceRange.max !== undefined) {
          where.menuPrice.lte = filters.priceRange.max;
        }
      }

      if (filters.search) {
        where.OR = [
          { displayName: { contains: filters.search, mode: 'insensitive' } },
          { displayNameEn: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } },
          { item: { name: { contains: filters.search, mode: 'insensitive' } } }
        ];
      }

      const [menuItems, total] = await Promise.all([
        prisma.menuItem.findMany({
          where,
          include: {
            item: {
              select: {
                id: true,
                name: true,
                barcode: true,
                description: true,
                unit: true
              }
            },
            category: {
              select: {
                id: true,
                name: true,
                nameEn: true,
                color: true
              }
            },
            modifiers: {
              where: { isActive: true },
              orderBy: { displayOrder: 'asc' }
            }
          },
          skip,
          take: limit,
          orderBy: {
            [sortBy]: sortOrder
          }
        }),
        prisma.menuItem.count({ where })
      ]);

      // Add availability status
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5);

      const menuItemsWithAvailability = menuItems.map(item => ({
        ...item,
        isCurrentlyAvailable: this.isMenuItemAvailable(item, currentTime),
        stockStatus: item.isAvailable ? 'available' : 'unavailable',
        discountPercentage: item.originalPrice && item.originalPrice > item.menuPrice
          ? Math.round(((Number(item.originalPrice) - Number(item.menuPrice)) / Number(item.originalPrice)) * 100)
          : 0
      }));

      return {
        menuItems: menuItemsWithAvailability,
        pagination: {
          total,
          totalPages: Math.ceil(total / limit),
          currentPage: page,
          limit
        }
      };
    } catch (error) {
      throw new AppError('Failed to get menu items', 500, error);
    }
  }

  /**
   * Get full menu (categories with items)
   * Respects ordering settings for locking items without stock
   */
  static async getFullMenu(tenantId: string, onlyAvailable: boolean = true) {
    try {
      // Get ordering settings to check if items without stock should be locked
      const orderingSettings = await prisma.orderingSettings.findUnique({
        where: { tenantId }
      });
      const lockItemsWithoutStock = orderingSettings?.lockItemsWithoutStock ?? false;

      const categoryWhere: any = { tenantId, isActive: true };
      const itemWhere: any = { isActive: true };

      if (onlyAvailable) {
        itemWhere.isAvailable = true;
      }

      const categories = await prisma.menuCategory.findMany({
        where: categoryWhere,
        include: {
          items: {
            where: itemWhere,
            include: {
              item: {
                select: {
                  id: true,
                  name: true,
                  barcode: true,
                  unit: true
                }
              },
              recipe: {
                where: { isActive: true },
                include: {
                  ingredients: {
                    where: { isOptional: false },
                    include: {
                      item: {
                        select: {
                          id: true,
                          name: true
                        }
                      }
                    }
                  }
                }
              },
              modifiers: {
                where: { isActive: true },
                orderBy: { displayOrder: 'asc' }
              }
            },
            orderBy: { displayOrder: 'asc' }
          }
        },
        orderBy: { displayOrder: 'asc' }
      });

      // If lockItemsWithoutStock is enabled, check stock for items with recipes
      const menuWithAvailability = await Promise.all(
        categories.map(async (category) => {
          const itemsWithStockCheck = await Promise.all(
            category.items.map(async (item) => {
              let isAvailableForOrder = item.isAvailable;
              let stockStatus = item.isAvailable ? 'available' : 'unavailable';

              // If lockItemsWithoutStock is enabled and item has a recipe, check stock
              if (lockItemsWithoutStock && item.recipe && item.recipe.ingredients.length > 0) {
                const { OrderInventoryIntegrationService } = await import('./orderInventoryIntegrationService');
                const { calculateCurrentStock } = await import('./inventoryService');

                // Check if all required ingredients have stock
                let hasAllStock = true;
                for (const ingredient of item.recipe.ingredients) {
                  if (!ingredient.isOptional) {
                    const currentStock = await calculateCurrentStock(ingredient.itemId, tenantId);
                    const requiredQuantity = Number(ingredient.quantity);
                    
                    if (currentStock < requiredQuantity) {
                      hasAllStock = false;
                      break;
                    }
                  }
                }

                // If any ingredient is out of stock, lock the item
                if (!hasAllStock) {
                  isAvailableForOrder = false;
                  stockStatus = 'out_of_stock';
                  
                  // Update menu item availability in database
                  await prisma.menuItem.update({
                    where: { id: item.id },
                    data: { isAvailable: false }
                  });
                }
              }

              return {
                ...item,
                stockStatus,
                isCurrentlyAvailable: isAvailableForOrder,
                isAvailable: isAvailableForOrder
              };
            })
          );

          return {
            ...category,
            items: itemsWithStockCheck
          };
        })
      );

      return menuWithAvailability;
    } catch (error) {
      throw new AppError('Failed to get full menu', 500, error);
    }
  }

  /**
   * Update menu item
   */
  static async updateMenuItem(
    tenantId: string,
    menuItemId: string,
    updateData: UpdateMenuItemData
  ) {
    try {
      const existingItem = await prisma.menuItem.findFirst({
        where: { id: menuItemId, tenantId }
      });

      if (!existingItem) {
        throw new AppError('Menu item not found', 404);
      }

      // Validate price if being updated
      if (updateData.menuPrice !== undefined && updateData.menuPrice <= 0) {
        throw new AppError('Menu price must be greater than zero', 400);
      }

      // Validate category if being updated
      if (updateData.categoryId && updateData.categoryId !== existingItem.categoryId) {
        const category = await prisma.menuCategory.findFirst({
          where: {
            id: updateData.categoryId,
            tenantId,
            isActive: true
          }
        });

        if (!category) {
          throw new AppError('Category not found', 404);
        }
      }

      const updatedItem = await prisma.menuItem.update({
        where: { id: menuItemId },
        data: {
          ...updateData,
          updatedAt: new Date()
        },
        include: {
          item: {
            select: {
              id: true,
              name: true,
              barcode: true
            }
          },
          category: {
            select: {
              id: true,
              name: true,
              nameEn: true
            }
          },
          modifiers: {
            where: { isActive: true },
            orderBy: { displayOrder: 'asc' }
          }
        }
      });

      return updatedItem;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to update menu item', 500, error);
    }
  }

  /**
   * Toggle menu item availability
   */
  static async toggleItemAvailability(
    tenantId: string,
    menuItemId: string,
    isAvailable: boolean,
    reason?: string
  ) {
    try {
      const updatedItem = await this.updateMenuItem(tenantId, menuItemId, {
        isAvailable,
        ...(reason && { cookingNotes: reason })
      });

      return updatedItem;
    } catch (error) {
      throw new AppError('Failed to toggle item availability', 500, error);
    }
  }

  /**
   * Create menu item modifier
   */
  static async createModifier(tenantId: string, modifierData: CreateModifierData) {
    try {
      // Validate menu item exists
      const menuItem = await prisma.menuItem.findFirst({
        where: {
          id: modifierData.menuItemId,
          tenantId,
          isActive: true
        }
      });

      if (!menuItem) {
        throw new AppError('Menu item not found', 404);
      }

      // Get next display order if not provided
      let displayOrder = modifierData.displayOrder;
      if (displayOrder === undefined) {
        const lastModifier = await prisma.menuItemModifier.findFirst({
          where: { menuItemId: modifierData.menuItemId, isActive: true },
          orderBy: { displayOrder: 'desc' },
          select: { displayOrder: true }
        });
        displayOrder = (lastModifier?.displayOrder || 0) + 1;
      }

      const modifier = await prisma.menuItemModifier.create({
        data: {
          tenantId,
          menuItemId: modifierData.menuItemId,
          name: modifierData.name,
          nameEn: modifierData.nameEn,
          additionalPrice: modifierData.additionalPrice || 0,
          isRequired: modifierData.isRequired || false,
          maxQuantity: modifierData.maxQuantity || 1,
          displayOrder
        }
      });

      return modifier;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to create modifier', 500, error);
    }
  }

  /**
   * Get menu statistics
   */
  static async getMenuStatistics(tenantId: string) {
    try {
      const [
        totalCategories,
        activeCategories,
        totalItems,
        availableItems,
        featuredItems,
        newItems,
        vegetarianItems,
        outOfStockItems
      ] = await Promise.all([
        prisma.menuCategory.count({ where: { tenantId } }),
        prisma.menuCategory.count({ where: { tenantId, isActive: true } }),
        prisma.menuItem.count({ where: { tenantId } }),
        prisma.menuItem.count({ where: { tenantId, isActive: true, isAvailable: true } }),
        prisma.menuItem.count({ where: { tenantId, isActive: true, isFeatured: true } }),
        prisma.menuItem.count({ where: { tenantId, isActive: true, isNew: true } }),
        prisma.menuItem.count({ where: { tenantId, isActive: true, isVegetarian: true } }),
        prisma.menuItem.count({
          where: {
            tenantId,
            isActive: true,
            isAvailable: false
          }
        })
      ]);

      // Get price range
      const priceStats = await prisma.menuItem.aggregate({
        where: { tenantId, isActive: true },
        _min: { menuPrice: true },
        _max: { menuPrice: true },
        _avg: { menuPrice: true }
      });

      return {
        categories: {
          total: totalCategories,
          active: activeCategories
        },
        items: {
          total: totalItems,
          available: availableItems,
          featured: featuredItems,
          new: newItems,
          vegetarian: vegetarianItems,
          outOfStock: outOfStockItems
        },
        pricing: {
          minPrice: Number(priceStats._min.menuPrice || 0),
          maxPrice: Number(priceStats._max.menuPrice || 0),
          avgPrice: Number(priceStats._avg.menuPrice || 0)
        }
      };
    } catch (error) {
      throw new AppError('Failed to get menu statistics', 500, error);
    }
  }

  /**
   * Bulk update item availability (for inventory integration)
   */
  static async bulkUpdateAvailability(
    tenantId: string,
    updates: Array<{ itemId: string; isAvailable: boolean }>
  ) {
    try {
      const results = await Promise.all(
        updates.map(async (update) => {
          return prisma.menuItem.updateMany({
            where: {
              tenantId,
              itemId: update.itemId,
              isActive: true
            },
            data: {
              isAvailable: update.isAvailable,
              updatedAt: new Date()
            }
          });
        })
      );

      return {
        updatedCount: results.reduce((sum, result) => sum + result.count, 0),
        results
      };
    } catch (error) {
      throw new AppError('Failed to bulk update availability', 500, error);
    }
  }

  /**
   * Private helper methods
   */
  private static isCategoryAvailable(
    category: any,
    currentTime: string,
    currentDay: string
  ): boolean {
    // Check day availability
    if (category.availableDays && category.availableDays.length > 0) {
      if (!category.availableDays.includes(currentDay)) {
        return false;
      }
    }

    // Check time availability
    if (category.availableFrom && category.availableTo) {
      if (currentTime < category.availableFrom || currentTime > category.availableTo) {
        return false;
      }
    }

    return true;
  }

  private static isMenuItemAvailable(item: any, currentTime: string): boolean {
    if (!item.isActive || !item.isAvailable) {
      return false;
    }

    // Check time availability
    if (item.availableFrom && item.availableTo) {
      if (currentTime < item.availableFrom || currentTime > item.availableTo) {
        return false;
      }
    }

    // Note: Stock availability check removed since currentStock field doesn't exist in Item model
    // Stock availability should be handled by the inventory integration service instead

    return true;
  }

  /**
   * Delete menu category
   */
  static async deleteCategory(tenantId: string, categoryId: string) {
    try {
      // Check if category exists
      const category = await prisma.menuCategory.findFirst({
        where: {
          id: categoryId,
          tenantId
        }
      });

      if (!category) {
        throw new AppError('Category not found', 404);
      }

      // Check if category has menu items
      const menuItemsCount = await prisma.menuItem.count({
        where: {
          categoryId,
          tenantId,
          isActive: true
        }
      });

      if (menuItemsCount > 0) {
        throw new AppError('Cannot delete category that contains menu items', 400);
      }

      // Soft delete the category
      await prisma.menuCategory.update({
        where: { id: categoryId },
        data: { isActive: false }
      });

      return true;
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  }

  /**
   * Delete menu item
   */
  static async deleteMenuItem(tenantId: string, menuItemId: string) {
    try {
      // Check if menu item exists
      const menuItem = await prisma.menuItem.findFirst({
        where: {
          id: menuItemId,
          tenantId
        }
      });

      if (!menuItem) {
        throw new AppError('Menu item not found', 404);
      }

      // Soft delete the menu item
      await prisma.menuItem.update({
        where: { id: menuItemId },
        data: { isActive: false }
      });

      return true;
    } catch (error) {
      console.error('Error deleting menu item:', error);
      throw error;
    }
  }

  private static getStockStatus(currentStock: number): 'in_stock' | 'low_stock' | 'out_of_stock' {
    if (currentStock <= 0) return 'out_of_stock';
    if (currentStock <= 5) return 'low_stock'; // Configurable threshold
    return 'in_stock';
  }
} 
