import { Request, Response, NextFunction } from 'express';
import { MenuService, CreateCategoryData, UpdateCategoryData, CreateMenuItemData, UpdateMenuItemData, CreateModifierData, MenuFilterOptions } from '../services/menuService';
import { AppError } from '../utils/AppError';

export class MenuController {
  // ===================== CATEGORY ENDPOINTS =====================

  /**
   * Create menu category
   * POST /api/menu/categories
   */
  static async createCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        throw new AppError('Authentication required', 401);
      }

      const { name } = req.body;

      if (!name) {
        throw new AppError('Category name is required', 400);
      }

      const categoryData: CreateCategoryData = {
        name: name.trim(),
        nameEn: req.body.nameEn?.trim(),
        description: req.body.description?.trim(),
        displayOrder: req.body.displayOrder ? parseInt(req.body.displayOrder) : undefined,
        color: req.body.color,
        icon: req.body.icon,
        availableFrom: req.body.availableFrom,
        availableTo: req.body.availableTo,
        availableDays: req.body.availableDays || []
      };

      const category = await MenuService.createCategory(tenantId, categoryData);

      res.status(201).json({
        success: true,
        data: category,
        message: 'Menu category created successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get menu categories
   * GET /api/menu/categories
   */
  static async getCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        throw new AppError('Authentication required', 401);
      }

      const includeInactive = req.query.includeInactive === 'true';
      const categories = await MenuService.getCategories(tenantId, includeInactive);

      res.json({
        success: true,
        data: categories,
        message: 'Menu categories retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update menu category
   * PUT /api/menu/categories/:id
   */
  static async updateCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      const categoryId = req.params.id;

      if (!tenantId) {
        throw new AppError('Authentication required', 401);
      }

      if (!categoryId) {
        throw new AppError('Category ID is required', 400);
      }

      const updateData: UpdateCategoryData = {
        name: req.body.name?.trim(),
        nameEn: req.body.nameEn?.trim(),
        description: req.body.description?.trim(),
        displayOrder: req.body.displayOrder ? parseInt(req.body.displayOrder) : undefined,
        color: req.body.color,
        icon: req.body.icon,
        availableFrom: req.body.availableFrom,
        availableTo: req.body.availableTo,
        availableDays: req.body.availableDays,
        isActive: req.body.isActive
      };

      const updatedCategory = await MenuService.updateCategory(tenantId, categoryId, updateData);

      res.json({
        success: true,
        data: updatedCategory,
        message: 'Menu category updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // ===================== MENU ITEM ENDPOINTS =====================

  /**
   * Create menu item
   * POST /api/menu/items
   */
  static async createMenuItem(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        throw new AppError('Authentication required', 401);
      }

      const { itemId, categoryId, displayName, menuPrice } = req.body;

      if (!categoryId || !displayName || !menuPrice) {
        throw new AppError('Category ID, display name, and menu price are required', 400);
      }

      if (parseFloat(menuPrice) <= 0) {
        throw new AppError('Menu price must be greater than zero', 400);
      }

      const menuItemData: CreateMenuItemData = {
        itemId,
        categoryId,
        displayName: displayName.trim(),
        displayNameEn: req.body.displayNameEn?.trim(),
        description: req.body.description?.trim(),
        shortDesc: req.body.shortDesc?.trim(),
        menuPrice: parseFloat(menuPrice),
        originalPrice: req.body.originalPrice ? parseFloat(req.body.originalPrice) : undefined,
        displayOrder: req.body.displayOrder ? parseInt(req.body.displayOrder) : undefined,
        isFeatured: req.body.isFeatured === true,
        isSpicy: req.body.isSpicy === true,
        isVegetarian: req.body.isVegetarian === true,
        isNew: req.body.isNew === true,
        imageUrl: req.body.imageUrl,
        thumbnailUrl: req.body.thumbnailUrl,
        prepTime: req.body.prepTime ? parseInt(req.body.prepTime) : undefined,
        cookingNotes: req.body.cookingNotes?.trim(),
        availableFrom: req.body.availableFrom,
        availableTo: req.body.availableTo,
        maxOrderQty: req.body.maxOrderQty ? parseInt(req.body.maxOrderQty) : undefined,
        calories: req.body.calories ? parseInt(req.body.calories) : undefined,
        allergens: req.body.allergens || []
      };

      const menuItem = await MenuService.createMenuItem(tenantId, menuItemData);

      res.status(201).json({
        success: true,
        data: menuItem,
        message: 'Menu item created successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get menu items with filtering
   * GET /api/menu/items
   */
  static async getMenuItems(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        throw new AppError('Authentication required', 401);
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const sortBy = (req.query.sortBy as string) || 'displayOrder';
      const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'asc';

      // Build filter options
      const filters: MenuFilterOptions = {};

      if (req.query.categoryId) {
        filters.categoryId = req.query.categoryId as string;
      }

      if (req.query.isActive !== undefined) {
        filters.isActive = req.query.isActive === 'true';
      }

      if (req.query.isAvailable !== undefined) {
        filters.isAvailable = req.query.isAvailable === 'true';
      }

      if (req.query.isFeatured !== undefined) {
        filters.isFeatured = req.query.isFeatured === 'true';
      }

      if (req.query.isVegetarian !== undefined) {
        filters.isVegetarian = req.query.isVegetarian === 'true';
      }

      if (req.query.isSpicy !== undefined) {
        filters.isSpicy = req.query.isSpicy === 'true';
      }

      if (req.query.minPrice || req.query.maxPrice) {
        filters.priceRange = {};
        if (req.query.minPrice) {
          filters.priceRange.min = parseFloat(req.query.minPrice as string);
        }
        if (req.query.maxPrice) {
          filters.priceRange.max = parseFloat(req.query.maxPrice as string);
        }
      }

      if (req.query.search) {
        filters.search = req.query.search as string;
      }

      const result = await MenuService.getMenuItems(tenantId, {
        ...filters,
        page,
        limit,
        sortBy,
        sortOrder
      });

      res.json({
        success: true,
        data: result.menuItems,
        pagination: result.pagination,
        message: 'Menu items retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get full menu (categories with items)
   * GET /api/menu/full
   */
  static async getFullMenu(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        throw new AppError('Authentication required', 401);
      }

      const onlyAvailable = req.query.onlyAvailable !== 'false'; // Default to true
      const menu = await MenuService.getFullMenu(tenantId, onlyAvailable);

      res.json({
        success: true,
        data: menu,
        message: 'Full menu retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update menu item
   * PUT /api/menu/items/:id
   */
  static async updateMenuItem(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      const menuItemId = req.params.id;

      if (!tenantId) {
        throw new AppError('Authentication required', 401);
      }

      if (!menuItemId) {
        throw new AppError('Menu item ID is required', 400);
      }

      // Validate price if provided
      if (req.body.menuPrice !== undefined && parseFloat(req.body.menuPrice) <= 0) {
        throw new AppError('Menu price must be greater than zero', 400);
      }

      const updateData: UpdateMenuItemData = {
        categoryId: req.body.categoryId,
        displayName: req.body.displayName?.trim(),
        displayNameEn: req.body.displayNameEn?.trim(),
        description: req.body.description?.trim(),
        shortDesc: req.body.shortDesc?.trim(),
        menuPrice: req.body.menuPrice ? parseFloat(req.body.menuPrice) : undefined,
        originalPrice: req.body.originalPrice ? parseFloat(req.body.originalPrice) : undefined,
        displayOrder: req.body.displayOrder ? parseInt(req.body.displayOrder) : undefined,
        isFeatured: req.body.isFeatured,
        isSpicy: req.body.isSpicy,
        isVegetarian: req.body.isVegetarian,
        isNew: req.body.isNew,
        imageUrl: req.body.imageUrl,
        thumbnailUrl: req.body.thumbnailUrl,
        prepTime: req.body.prepTime ? parseInt(req.body.prepTime) : undefined,
        cookingNotes: req.body.cookingNotes?.trim(),
        availableFrom: req.body.availableFrom,
        availableTo: req.body.availableTo,
        maxOrderQty: req.body.maxOrderQty ? parseInt(req.body.maxOrderQty) : undefined,
        calories: req.body.calories ? parseInt(req.body.calories) : undefined,
        allergens: req.body.allergens,
        isActive: req.body.isActive,
        isAvailable: req.body.isAvailable
      };

      const updatedMenuItem = await MenuService.updateMenuItem(tenantId, menuItemId, updateData);

      res.json({
        success: true,
        data: updatedMenuItem,
        message: 'Menu item updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Toggle menu item availability
   * PATCH /api/menu/items/:id/availability
   */
  static async toggleItemAvailability(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      const menuItemId = req.params.id;
      const { isAvailable, reason } = req.body;

      if (!tenantId) {
        throw new AppError('Authentication required', 401);
      }

      if (!menuItemId) {
        throw new AppError('Menu item ID is required', 400);
      }

      if (typeof isAvailable !== 'boolean') {
        throw new AppError('isAvailable must be a boolean value', 400);
      }

      const updatedMenuItem = await MenuService.toggleItemAvailability(
        tenantId,
        menuItemId,
        isAvailable,
        reason
      );

      res.json({
        success: true,
        data: updatedMenuItem,
        message: `Menu item availability ${isAvailable ? 'enabled' : 'disabled'}`
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Bulk update item availability
   * POST /api/menu/items/bulk-availability
   */
  static async bulkUpdateAvailability(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        throw new AppError('Authentication required', 401);
      }

      const { updates } = req.body;

      if (!updates || !Array.isArray(updates) || updates.length === 0) {
        throw new AppError('Updates array is required', 400);
      }

      // Validate each update
      for (const update of updates) {
        if (!update.itemId || typeof update.isAvailable !== 'boolean') {
          throw new AppError('Each update must have itemId and isAvailable boolean', 400);
        }
      }

      const result = await MenuService.bulkUpdateAvailability(tenantId, updates);

      res.json({
        success: true,
        data: result,
        message: `${result.updatedCount} items updated successfully`
      });
    } catch (error) {
      next(error);
    }
  }

  // ===================== MODIFIER ENDPOINTS =====================

  /**
   * Create menu item modifier
   * POST /api/menu/items/:itemId/modifiers
   */
  static async createModifier(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      const menuItemId = req.params.itemId;

      if (!tenantId) {
        throw new AppError('Authentication required', 401);
      }

      if (!menuItemId) {
        throw new AppError('Menu item ID is required', 400);
      }

      const { name } = req.body;

      if (!name) {
        throw new AppError('Modifier name is required', 400);
      }

      const modifierData: CreateModifierData = {
        menuItemId,
        name: name.trim(),
        nameEn: req.body.nameEn?.trim(),
        additionalPrice: req.body.additionalPrice ? parseFloat(req.body.additionalPrice) : 0,
        isRequired: req.body.isRequired === true,
        maxQuantity: req.body.maxQuantity ? parseInt(req.body.maxQuantity) : 1,
        displayOrder: req.body.displayOrder ? parseInt(req.body.displayOrder) : undefined
      };

      const modifier = await MenuService.createModifier(tenantId, modifierData);

      res.status(201).json({
        success: true,
        data: modifier,
        message: 'Menu item modifier created successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // ===================== STATISTICS & ANALYTICS =====================

  /**
   * Get menu statistics
   * GET /api/menu/statistics
   */
  static async getMenuStatistics(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        throw new AppError('Authentication required', 401);
      }

      const statistics = await MenuService.getMenuStatistics(tenantId);

      res.json({
        success: true,
        data: statistics,
        message: 'Menu statistics retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get featured items
   * GET /api/menu/featured
   */
  static async getFeaturedItems(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        throw new AppError('Authentication required', 401);
      }

      const result = await MenuService.getMenuItems(tenantId, {
        isFeatured: true,
        isActive: true,
        isAvailable: true,
        sortBy: 'displayOrder',
        sortOrder: 'asc',
        page: 1,
        limit: 20
      });

      res.json({
        success: true,
        data: result.menuItems,
        message: 'Featured items retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get new items
   * GET /api/menu/new
   */
  static async getNewItems(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        throw new AppError('Authentication required', 401);
      }

      const result = await MenuService.getMenuItems(tenantId, {
        isNew: true,
        isActive: true,
        isAvailable: true,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        page: 1,
        limit: 20
      });

      res.json({
        success: true,
        data: result.menuItems,
        message: 'New items retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Search menu items
   * GET /api/menu/search
   */
  static async searchMenuItems(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      const query = req.query.q as string;

      if (!tenantId) {
        throw new AppError('Authentication required', 401);
      }

      if (!query || query.trim().length < 2) {
        throw new AppError('Search query must be at least 2 characters', 400);
      }

      const result = await MenuService.getMenuItems(tenantId, {
        search: query.trim(),
        isActive: true,
        page: 1,
        limit: 50
      });

      res.json({
        success: true,
        data: result.menuItems,
        message: 'Search results retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get menu items by category
   * GET /api/menu/categories/:categoryId/items
   */
  static async getItemsByCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      const categoryId = req.params.categoryId;

      if (!tenantId) {
        throw new AppError('Authentication required', 401);
      }

      if (!categoryId) {
        throw new AppError('Category ID is required', 400);
      }

      const result = await MenuService.getMenuItems(tenantId, {
        categoryId,
        isActive: true,
        sortBy: 'displayOrder',
        sortOrder: 'asc',
        page: 1,
        limit: 100
      });

      res.json({
        success: true,
        data: result.menuItems,
        message: 'Category items retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get out of stock items
   * GET /api/menu/out-of-stock
   */
  static async getOutOfStockItems(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        throw new AppError('Authentication required', 401);
      }

      // This would require integration with inventory system
      // For now, return items marked as unavailable
      const result = await MenuService.getMenuItems(tenantId, {
        isActive: true,
        isAvailable: false,
        page: 1,
        limit: 100
      });

      res.json({
        success: true,
        data: result.menuItems,
        message: 'Out of stock items retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete menu category
   * DELETE /api/menu/categories/:id
   */
  static async deleteCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      const { id } = req.params;

      if (!tenantId) {
        throw new AppError('Authentication required', 401);
      }

      if (!id) {
        throw new AppError('Category ID is required', 400);
      }

      // Check if category has menu items
      const menuItemsCount = await MenuService.getMenuItems(tenantId, { categoryId: id });
      if (menuItemsCount && Array.isArray(menuItemsCount.menuItems) && menuItemsCount.menuItems.length > 0) {
        throw new AppError('Cannot delete category that contains menu items', 400);
      }

      await MenuService.deleteCategory(tenantId, id);

      res.json({
        success: true,
        message: 'Category deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete menu item
   * DELETE /api/menu/items/:id
   */
  static async deleteMenuItem(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      const { id } = req.params;

      if (!tenantId) {
        throw new AppError('Authentication required', 401);
      }

      if (!id) {
        throw new AppError('Menu item ID is required', 400);
      }

      await MenuService.deleteMenuItem(tenantId, id);

      res.json({
        success: true,
        message: 'Menu item deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
} 