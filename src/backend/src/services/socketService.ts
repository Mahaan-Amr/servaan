import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { verifyToken } from './authService';
import { prisma } from './dbService';
import { notificationService } from './notificationService';
import { NotificationType, NotificationPriority, UserRole } from '../../../shared/types';

// Interface for authenticated socket
interface AuthenticatedSocket extends Socket {
  user?: {
    id: string;
    role: 'ADMIN' | 'MANAGER' | 'STAFF';
    name: string;
  };
  tenant?: {
    id: string;
    subdomain: string;
    name: string;
  };
}

class SocketService {
  private io: SocketIOServer | null = null;
  private authenticatedUsers: Map<string, string> = new Map(); // userId -> socketId

  initialize(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
      }
    });

    this.io.use(this.authenticateSocket.bind(this));
    this.io.on('connection', this.handleConnection.bind(this));

    console.log('🔌 WebSocket server initialized');
  }

  // Authenticate socket connection using JWT
  private async authenticateSocket(socket: AuthenticatedSocket, next: Function) {
    console.log('🔍 Socket authentication attempt from:', socket.handshake.address);
    
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
      console.log('🔍 Token received:', token ? 'exists' : 'missing');
      
      if (!token) {
        console.log('❌ No authentication token provided');
        return next(new Error('Authentication token required'));
      }

      // Verify token
      console.log('🔍 Verifying token...');
      const decoded = verifyToken(token);
      console.log('✅ Token verified for user ID:', decoded.id);
      
      // Get user from database with tenant context
      console.log('🔍 Fetching user from database...');
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        include: {
          tenant: {
            select: {
              id: true,
              subdomain: true,
              name: true
            }
          }
        }
      });

      if (!user) {
        console.log('❌ User not found in database');
        return next(new Error('User not found'));
      }

      if (!user.active) {
        console.log('❌ User is inactive');
        return next(new Error('User inactive'));
      }

      if (!user.tenantId || !user.tenant) {
        console.log('❌ User has no tenant context');
        return next(new Error('User tenant context required'));
      }

      console.log('✅ User authenticated:', user.name, 'Tenant:', user.tenant.name);

      // Attach user and tenant to socket
      socket.user = {
        id: user.id,
        role: user.role,
        name: user.name
      };
      
      socket.tenant = user.tenant;

      next();
    } catch (error) {
      console.error('❌ Socket authentication error:', error);
      next(new Error('Authentication failed'));
    }
  }

  // Handle new socket connections
  private handleConnection(socket: AuthenticatedSocket) {
    if (!socket.user || !socket.tenant) return;

    const userId = socket.user.id;
    const tenantId = socket.tenant.id;
    console.log(`👤 User ${socket.user.name} connected (${socket.id}) to tenant ${socket.tenant.name}`);

    // Track authenticated user
    this.authenticatedUsers.set(userId, socket.id);

    // Join user to their personal room
    socket.join(`user:${userId}`);

    // CRITICAL SECURITY FIX: Join tenant-specific rooms for proper isolation
    socket.join(`tenant:${tenantId}`);
    socket.join(`tenant:${tenantId}:user:${userId}`);

    // Join role-based rooms within tenant context
    socket.join(`tenant:${tenantId}:role:${socket.user.role}`);

    // Join general notification room within tenant context
    socket.join(`tenant:${tenantId}:notifications`);

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`👤 User ${socket.user?.name} disconnected (${socket.id}) from tenant ${socket.tenant?.name}`);
      this.authenticatedUsers.delete(userId);
    });

    // Handle marking notifications as read
    socket.on('notification:read', async (notificationId: string) => {
      try {
        await prisma.notification.update({
          where: { id: notificationId },
          data: { read: true }
        });
        
        // Emit confirmation back to user
        socket.emit('notification:read:success', { notificationId });
      } catch (error) {
        console.error('Error marking notification as read:', error);
        socket.emit('notification:read:error', { notificationId, error: 'Failed to mark as read' });
      }
    });

    // Handle marking all notifications as read
    socket.on('notifications:read:all', async () => {
      try {
        await prisma.notification.updateMany({
          where: { 
            userId: userId,
            read: false 
          },
          data: { read: true }
        });
        
        socket.emit('notifications:read:all:success');
      } catch (error) {
        console.error('Error marking all notifications as read:', error);
        socket.emit('notifications:read:all:error', { error: 'Failed to mark all as read' });
      }
    });

    // Send welcome message and unread notification count
    this.sendWelcomeMessage(socket);
  }

  // Send welcome message with unread notification count
  private async sendWelcomeMessage(socket: AuthenticatedSocket) {
    if (!socket.user) return;

    try {
      const unreadCount = await prisma.notification.count({
        where: {
          userId: socket.user.id,
          read: false
        }
      });

      socket.emit('welcome', {
        message: `خوش آمدید، ${socket.user.name}`,
        unreadNotifications: unreadCount
      });
    } catch (error) {
      console.error('Error sending welcome message:', error);
    }
  }

  // Send notification to specific user within tenant context
  sendToUser(userId: string, event: string, data: any, tenantId: string) {
    if (!this.io) return;
    
    // CRITICAL: Scope to tenant-specific user room
    this.io.to(`tenant:${tenantId}:user:${userId}`).emit(event, {
      ...data,
      timestamp: new Date().toISOString()
    });
  }

  // Send notification to users with specific role within tenant context
  sendToRole(role: 'ADMIN' | 'MANAGER' | 'STAFF', event: string, data: any, tenantId: string) {
    if (!this.io) return;
    
    // CRITICAL: Scope to tenant-specific role room
    this.io.to(`tenant:${tenantId}:role:${role}`).emit(event, {
      ...data,
      timestamp: new Date().toISOString()
    });
  }

  // Broadcast notification to all connected users within tenant context
  broadcast(event: string, data: any, tenantId: string) {
    if (!this.io) return;
    
    // CRITICAL: Scope to tenant-specific notification room
    this.io.to(`tenant:${tenantId}:notifications`).emit(event, {
      ...data,
      timestamp: new Date().toISOString()
    });
  }

  // Send notification and save to database
  async sendNotification(notification: {
    userId?: string;
    type: string;
    priority: string;
    title: string;
    message: string;
    data?: any;
    tenantId: string; // Added tenantId parameter
  }) {
    try {
      // Save notification to database
      const savedNotification = await prisma.notification.create({
        data: {
          userId: notification.userId,
          type: notification.type as any,
          priority: notification.priority as any,
          title: notification.title,
          message: notification.message,
          data: notification.data ? JSON.parse(JSON.stringify(notification.data)) : null,
          tenantId: notification.tenantId, // Added tenantId
        }
      });

      // Send real-time notification
      const eventData = {
        id: savedNotification.id,
        type: notification.type,
        priority: notification.priority,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        createdAt: savedNotification.createdAt.toISOString()
      };

      if (notification.userId) {
        // Send to specific user
        this.sendToUser(notification.userId, 'notification', eventData, notification.tenantId);
      } else {
        // Broadcast to all users
        this.broadcast('notification', eventData, notification.tenantId);
      }

      return savedNotification;
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }

  // Get online user count
  getOnlineUserCount(): number {
    return this.authenticatedUsers.size;
  }

  // Check if user is online
  isUserOnline(userId: string): boolean {
    return this.authenticatedUsers.has(userId);
  }

  // === Kitchen Display Events ===

  // Send new order notification to kitchen staff with recipe details
  sendKitchenOrderUpdate(tenantId: string, orderData: {
    orderId: string;
    orderNumber: string;
    status: string;
    items: Array<{
      id: string;
      name: string;
      quantity: number;
      specialRequest?: string;
      recipe?: {
        ingredients: Array<{
          name: string;
          quantity: number;
          unit: string;
          isOptional: boolean;
        }>;
        instructions?: string;
      };
    }>;
    estimatedTime?: number;
    allergyInfo?: string;
    kitchenNotes?: string;
  }) {
    if (!this.io) return;

    // CRITICAL: Send to kitchen staff and managers within tenant context only
    this.io.to(`tenant:${tenantId}:role:MANAGER`).to(`tenant:${tenantId}:role:STAFF`).emit('kitchen:order:update', {
      tenantId,
      ...orderData,
      timestamp: new Date().toISOString()
    });
  }

  // Send ingredient stock alert to kitchen
  sendKitchenStockAlert(tenantId: string, alertData: {
    type: 'low_stock' | 'out_of_stock' | 'ingredient_shortage';
    itemId: string;
    itemName: string;
    currentStock: number;
    minStock: number;
    urgency: 'low' | 'medium' | 'high' | 'critical';
    estimatedDaysUntilStockout: number;
    suggestedActions: string[];
  }) {
    if (!this.io) return;

    // CRITICAL: Send to kitchen staff and managers within tenant context only
    this.io.to(`tenant:${tenantId}:role:MANAGER`).to(`tenant:${tenantId}:role:STAFF`).emit('kitchen:stock:alert', {
      tenantId,
      ...alertData,
      timestamp: new Date().toISOString()
    });
  }

  // Send menu item availability update
  sendMenuAvailabilityUpdate(tenantId: string, updates: Array<{
    menuItemId: string;
    menuItemName: string;
    isAvailable: boolean;
    reason?: string;
  }>) {
    if (!this.io) return;

    this.io.to('role:MANAGER').to('role:STAFF').emit('kitchen:menu:availability', {
      tenantId,
      updates,
      timestamp: new Date().toISOString()
    });
  }

  // Send real-time COGS and profit updates
  sendProfitabilityUpdate(tenantId: string, data: {
    orderId: string;
    orderNumber: string;
    totalCOGS: number;
    totalProfit: number;
    profitMargin: number;
    itemBreakdown: Array<{
      menuItemId: string;
      name: string;
      quantity: number;
      cogs: number;
      profit: number;
    }>;
  }) {
    if (!this.io) return;

    // Send to managers and admins only
    this.io.to('role:ADMIN').to('role:MANAGER').emit('kitchen:profitability:update', {
      tenantId,
      ...data,
      timestamp: new Date().toISOString()
    });
  }
}

// Export singleton instance
export const socketService = new SocketService(); 