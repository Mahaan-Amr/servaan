import { Request, Response, NextFunction } from 'express';
import { RecipeService, CreateRecipeData, UpdateRecipeData, CreateRecipeIngredientData, UpdateRecipeIngredientData, RecipeFilterOptions } from '../services/recipeService';
import { AppError } from '../utils/AppError';
import { PrismaClient } from '../../shared/generated/client';

const prisma = new PrismaClient();

export class RecipeController {
  // ===================== RECIPE ENDPOINTS =====================

  /**
   * Create recipe for menu item
   * POST /api/ordering/recipes
   */
  static async createRecipe(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        throw new AppError('Authentication required', 401);
      }

      const { menuItemId, name } = req.body;

      if (!menuItemId || !name) {
        throw new AppError('Menu item ID and recipe name are required', 400);
      }

      const recipeData: CreateRecipeData = {
        menuItemId: menuItemId.trim(),
        name: name.trim(),
        description: req.body.description?.trim(),
        instructions: req.body.instructions?.trim(),
        yield: req.body.yield ? parseInt(req.body.yield) : undefined,
        prepTime: req.body.prepTime ? parseInt(req.body.prepTime) : undefined
      };

      const recipe = await RecipeService.createRecipe(tenantId, recipeData);

      res.status(201).json({
        success: true,
        data: recipe,
        message: 'Recipe created successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all recipes
   * GET /api/ordering/recipes
   */
  static async getRecipes(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        throw new AppError('Authentication required', 401);
      }

      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const sortBy = req.query.sortBy as string || 'name';
      const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'asc';

      const filters: RecipeFilterOptions = {
        isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
        menuItemId: req.query.menuItemId as string,
        search: req.query.search as string
      };

      const result = await RecipeService.getRecipes(tenantId, {
        ...filters,
        page,
        limit,
        sortBy,
        sortOrder
      });

      res.json({
        success: true,
        data: result.recipes,
        pagination: {
          page,
          limit,
          total: result.total,
          pages: result.pages
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get recipe by menu item ID
   * GET /api/ordering/recipes/menu-item/:menuItemId
   */
  static async getRecipeByMenuItem(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      const { menuItemId } = req.params;

      if (!tenantId) {
        throw new AppError('Authentication required', 401);
      }

      if (!menuItemId) {
        throw new AppError('Menu item ID is required', 400);
      }

      const recipe = await RecipeService.getRecipeByMenuItem(tenantId, menuItemId);

      if (!recipe) {
        return res.status(404).json({
          success: false,
          message: 'Recipe not found for this menu item'
        });
      }

      res.json({
        success: true,
        data: recipe
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update recipe
   * PUT /api/ordering/recipes/:id
   */
  static async updateRecipe(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      const { id } = req.params;

      if (!tenantId) {
        throw new AppError('Authentication required', 401);
      }

      if (!id) {
        throw new AppError('Recipe ID is required', 400);
      }

      const updateData: UpdateRecipeData = {};

      if (req.body.name !== undefined) updateData.name = req.body.name.trim();
      if (req.body.description !== undefined) updateData.description = req.body.description?.trim();
      if (req.body.instructions !== undefined) updateData.instructions = req.body.instructions?.trim();
      if (req.body.yield !== undefined) updateData.yield = parseInt(req.body.yield);
      if (req.body.prepTime !== undefined) updateData.prepTime = parseInt(req.body.prepTime);
      if (req.body.isActive !== undefined) updateData.isActive = req.body.isActive === true || req.body.isActive === 'true';

      const recipe = await RecipeService.updateRecipe(tenantId, id, updateData);

      res.json({
        success: true,
        data: recipe,
        message: 'Recipe updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete recipe
   * DELETE /api/ordering/recipes/:id
   */
  static async deleteRecipe(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      const { id } = req.params;

      if (!tenantId) {
        throw new AppError('Authentication required', 401);
      }

      if (!id) {
        throw new AppError('Recipe ID is required', 400);
      }

      await RecipeService.deleteRecipe(tenantId, id);

      res.json({
        success: true,
        message: 'Recipe deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // ===================== RECIPE INGREDIENT ENDPOINTS =====================

  /**
   * Add ingredient to recipe
   * POST /api/ordering/recipes/:id/ingredients
   */
  static async addIngredient(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      const { id: recipeId } = req.params;

      if (!tenantId) {
        throw new AppError('Authentication required', 401);
      }

      if (!recipeId) {
        throw new AppError('Recipe ID is required', 400);
      }

      const { itemId, quantity, unit } = req.body;

      if (!itemId || !quantity || !unit) {
        throw new AppError('Item ID, quantity, and unit are required', 400);
      }

      const ingredientData: CreateRecipeIngredientData = {
        recipeId,
        itemId: itemId.trim(),
        quantity: parseFloat(quantity),
        unit: unit.trim(),
        unitCost: req.body.unitCost ? parseFloat(req.body.unitCost) : undefined,
        isOptional: req.body.isOptional === true || req.body.isOptional === 'true',

      };

      const ingredient = await RecipeService.addIngredient(tenantId, ingredientData);

      res.status(201).json({
        success: true,
        data: ingredient,
        message: 'Ingredient added to recipe successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get recipe ingredients
   * GET /api/ordering/recipes/:id/ingredients
   */
  static async getRecipeIngredients(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      const { id: recipeId } = req.params;

      if (!tenantId) {
        throw new AppError('Authentication required', 401);
      }

      if (!recipeId) {
        throw new AppError('Recipe ID is required', 400);
      }

      const ingredients = await RecipeService.getRecipeIngredients(tenantId, recipeId);

      res.json({
        success: true,
        data: ingredients
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update recipe ingredient
   * PUT /api/ordering/recipes/ingredients/:ingredientId
   */
  static async updateIngredient(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      const { ingredientId } = req.params;

      if (!tenantId) {
        throw new AppError('Authentication required', 401);
      }

      if (!ingredientId) {
        throw new AppError('Ingredient ID is required', 400);
      }

      const updateData: UpdateRecipeIngredientData = {};

      if (req.body.quantity !== undefined) updateData.quantity = parseFloat(req.body.quantity);
      if (req.body.unit !== undefined) updateData.unit = req.body.unit.trim();
      if (req.body.unitCost !== undefined) updateData.unitCost = parseFloat(req.body.unitCost);
      if (req.body.isOptional !== undefined) updateData.isOptional = req.body.isOptional === true || req.body.isOptional === 'true';


      const ingredient = await RecipeService.updateIngredient(tenantId, ingredientId, updateData);

      res.json({
        success: true,
        data: ingredient,
        message: 'Recipe ingredient updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Remove ingredient from recipe
   * DELETE /api/ordering/recipes/ingredients/:ingredientId
   */
  static async removeIngredient(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      const { ingredientId } = req.params;

      if (!tenantId) {
        throw new AppError('Authentication required', 401);
      }

      if (!ingredientId) {
        throw new AppError('Ingredient ID is required', 400);
      }

      await RecipeService.removeIngredient(tenantId, ingredientId);

      res.json({
        success: true,
        message: 'Ingredient removed from recipe successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // ===================== RECIPE ANALYSIS ENDPOINTS =====================

  /**
   * Get recipe cost analysis
   * GET /api/ordering/recipes/:id/cost-analysis
   */
  static async getRecipeCostAnalysis(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      const { id: recipeId } = req.params;

      if (!tenantId) {
        throw new AppError('Authentication required', 401);
      }

      if (!recipeId) {
        throw new AppError('Recipe ID is required', 400);
      }

      const analysis = await RecipeService.getRecipeCostAnalysis(tenantId, recipeId);

      res.json({
        success: true,
        data: analysis
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Sync all recipe ingredient prices from inventory
   * POST /api/ordering/recipes/sync-prices
   */
  static async syncIngredientPrices(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        throw new AppError('Authentication required', 401);
      }

      const result = await RecipeService.syncIngredientPrices(tenantId);

      res.json({
        success: true,
        data: result,
        message: `Successfully synced ${result.synced} ingredient prices, ${result.failed} failed`
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get price analysis for a specific recipe
   * GET /api/ordering/recipes/:id/price-analysis
   */
  static async getRecipePriceAnalysis(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      const { id: recipeId } = req.params;

      if (!tenantId) {
        throw new AppError('Authentication required', 401);
      }

      if (!recipeId) {
        throw new AppError('Recipe ID is required', 400);
      }

      const analysis = await RecipeService.getRecipePriceAnalysis(tenantId, recipeId);

      res.json({
        success: true,
        data: analysis,
        message: 'Recipe price analysis retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update ingredient price from inventory
   * PUT /api/ordering/recipes/:recipeId/ingredients/:ingredientId/price
   */
  static async updateIngredientPrice(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      const { recipeId, ingredientId } = req.params;
      const { forceSync = false } = req.body;

      if (!tenantId) {
        throw new AppError('Authentication required', 401);
      }

      if (!recipeId || !ingredientId) {
        throw new AppError('Recipe ID and Ingredient ID are required', 400);
      }

      // Get current ingredient
      const ingredient = await prisma.recipeIngredient.findFirst({
        where: {
          id: ingredientId,
          recipeId,
          tenantId
        },
        include: {
          item: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      if (!ingredient) {
        throw new AppError('Recipe ingredient not found', 404);
      }

      // Get inventory price
      const { getInventoryPrice } = await import('../services/inventoryService');
      const inventoryPrice = await getInventoryPrice(ingredient.itemId);

      if (inventoryPrice.price === 0 && !forceSync) {
        throw new AppError('No inventory price available for this item', 400);
      }

      // Update ingredient with inventory price
      const updatedIngredient = await RecipeService.updateIngredient(tenantId, ingredientId, {
        unitCost: inventoryPrice.price
      });

      res.json({
        success: true,
        data: {
          ingredient: updatedIngredient,
          inventoryPrice: inventoryPrice.price,
          priceSource: inventoryPrice.priceSource
        },
        message: 'Ingredient price updated from inventory successfully'
      });
    } catch (error) {
      next(error);
    }
  }
} 
