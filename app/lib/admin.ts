import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export enum AdminRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  SUPPORT = 'support',
}

export enum AdminPermission {
  // User management
  VIEW_USERS = 'view_users',
  CREATE_USERS = 'create_users',
  EDIT_USERS = 'edit_users',
  DELETE_USERS = 'delete_users',
  BAN_USERS = 'ban_users',

  // Escrow management
  VIEW_ESCROWS = 'view_escrows',
  EDIT_ESCROWS = 'edit_escrows',
  CANCEL_ESCROWS = 'cancel_escrows',
  RESOLVE_DISPUTES = 'resolve_disputes',

  // Payment management
  VIEW_PAYMENTS = 'view_payments',
  REFUND_PAYMENTS = 'refund_payments',

  // Document management
  VIEW_DOCUMENTS = 'view_documents',
  APPROVE_DOCUMENTS = 'approve_documents',
  REJECT_DOCUMENTS = 'reject_documents',

  // System management
  VIEW_LOGS = 'view_logs',
  VIEW_ANALYTICS = 'view_analytics',
  MANAGE_SETTINGS = 'manage_settings',
  MANAGE_ADMINS = 'manage_admins',
}

export interface Admin {
  id: string;
  userId: string;
  role: AdminRole;
  permissions: AdminPermission[];
  name: string;
  email: string;
  avatar?: string;
  active: boolean;
  lastLoginAt?: string;
  createdAt: string;
  createdBy?: string;
}

export interface AdminActivity {
  id: string;
  adminId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  timestamp: string;
}

export interface DashboardStats {
  users: {
    total: number;
    active: number;
    new: number;
    growth: number;
  };
  escrows: {
    total: number;
    active: number;
    completed: number;
    disputed: number;
    value: number;
  };
  payments: {
    total: number;
    volume: number;
    successRate: number;
    averageAmount: number;
  };
  documents: {
    total: number;
    pending: number;
    verified: number;
    rejected: number;
  };
  revenue: {
    total: number;
    fees: number;
    growth: number;
  };
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'down';
  uptime: number;
  services: {
    database: { status: 'up' | 'down'; responseTime: number };
    api: { status: 'up' | 'down'; responseTime: number };
    payment: { status: 'up' | 'down'; responseTime: number };
    storage: { status: 'up' | 'down'; responseTime: number };
  };
  metrics: {
    cpu: number;
    memory: number;
    disk: number;
    network: number;
  };
}

class AdminSystem {
  private static instance: AdminSystem;

  private readonly rolePermissions: Record<AdminRole, AdminPermission[]> = {
    [AdminRole.SUPER_ADMIN]: Object.values(AdminPermission),
    [AdminRole.ADMIN]: [
      AdminPermission.VIEW_USERS,
      AdminPermission.EDIT_USERS,
      AdminPermission.BAN_USERS,
      AdminPermission.VIEW_ESCROWS,
      AdminPermission.EDIT_ESCROWS,
      AdminPermission.CANCEL_ESCROWS,
      AdminPermission.RESOLVE_DISPUTES,
      AdminPermission.VIEW_PAYMENTS,
      AdminPermission.REFUND_PAYMENTS,
      AdminPermission.VIEW_DOCUMENTS,
      AdminPermission.APPROVE_DOCUMENTS,
      AdminPermission.REJECT_DOCUMENTS,
      AdminPermission.VIEW_LOGS,
      AdminPermission.VIEW_ANALYTICS,
    ],
    [AdminRole.MODERATOR]: [
      AdminPermission.VIEW_USERS,
      AdminPermission.BAN_USERS,
      AdminPermission.VIEW_ESCROWS,
      AdminPermission.VIEW_DOCUMENTS,
      AdminPermission.APPROVE_DOCUMENTS,
      AdminPermission.REJECT_DOCUMENTS,
      AdminPermission.VIEW_LOGS,
    ],
    [AdminRole.SUPPORT]: [
      AdminPermission.VIEW_USERS,
      AdminPermission.VIEW_ESCROWS,
      AdminPermission.VIEW_PAYMENTS,
      AdminPermission.VIEW_DOCUMENTS,
      AdminPermission.VIEW_LOGS,
    ],
  };

  private constructor() {}

  static getInstance(): AdminSystem {
    if (!AdminSystem.instance) {
      AdminSystem.instance = new AdminSystem();
    }
    return AdminSystem.instance;
  }

  // Create admin
  async createAdmin(
    data: {
      userId: string;
      role: AdminRole;
      name: string;
      email: string;
      avatar?: string;
    },
    createdBy: string
  ): Promise<Admin> {
    try {
      const permissions = this.rolePermissions[data.role];

      const adminData = {
        user_id: data.userId,
        role: data.role,
        permissions,
        name: data.name,
        email: data.email,
        avatar: data.avatar,
        active: true,
        created_at: new Date().toISOString(),
        created_by: createdBy,
      };

      const { data: admin, error } = await supabase
        .from('admins')
        .insert(adminData)
        .select()
        .single();

      if (error) throw error;

      // Log activity
      await this.logActivity({
        adminId: createdBy,
        action: 'create_admin',
        resource: 'admin',
        resourceId: admin.id,
        details: { role: data.role, email: data.email },
      });

      return this.mapToAdmin(admin);
    } catch (error: any) {
      console.error('Failed to create admin:', error);
      throw error;
    }
  }

  // Get admin
  async getAdmin(adminId: string): Promise<Admin | null> {
    try {
      const { data, error } = await supabase
        .from('admins')
        .select('*')
        .eq('id', adminId)
        .single();

      if (error || !data) return null;

      return this.mapToAdmin(data);
    } catch (error) {
      console.error('Failed to get admin:', error);
      return null;
    }
  }

  // Get admin by user ID
  async getAdminByUserId(userId: string): Promise<Admin | null> {
    try {
      const { data, error } = await supabase
        .from('admins')
        .select('*')
        .eq('user_id', userId)
        .eq('active', true)
        .single();

      if (error || !data) return null;

      return this.mapToAdmin(data);
    } catch (error) {
      console.error('Failed to get admin by user ID:', error);
      return null;
    }
  }

  // List admins
  async listAdmins(filter: {
    role?: AdminRole;
    active?: boolean;
    limit?: number;
  } = {}): Promise<Admin[]> {
    try {
      let query = supabase.from('admins').select('*');

      if (filter.role) {
        query = query.eq('role', filter.role);
      }

      if (filter.active !== undefined) {
        query = query.eq('active', filter.active);
      }

      query = query.order('created_at', { ascending: false });

      if (filter.limit) {
        query = query.limit(filter.limit);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(this.mapToAdmin);
    } catch (error) {
      console.error('Failed to list admins:', error);
      return [];
    }
  }

  // Update admin
  async updateAdmin(
    adminId: string,
    updates: {
      role?: AdminRole;
      active?: boolean;
      name?: string;
      avatar?: string;
    },
    updatedBy: string
  ): Promise<boolean> {
    try {
      const updateData: any = {};

      if (updates.role) {
        updateData.role = updates.role;
        updateData.permissions = this.rolePermissions[updates.role];
      }

      if (updates.active !== undefined) {
        updateData.active = updates.active;
      }

      if (updates.name) {
        updateData.name = updates.name;
      }

      if (updates.avatar) {
        updateData.avatar = updates.avatar;
      }

      const { error } = await supabase
        .from('admins')
        .update(updateData)
        .eq('id', adminId);

      if (error) throw error;

      // Log activity
      await this.logActivity({
        adminId: updatedBy,
        action: 'update_admin',
        resource: 'admin',
        resourceId: adminId,
        details: updates,
      });

      return true;
    } catch (error) {
      console.error('Failed to update admin:', error);
      return false;
    }
  }

  // Delete admin
  async deleteAdmin(adminId: string, deletedBy: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('admins')
        .delete()
        .eq('id', adminId);

      if (error) throw error;

      // Log activity
      await this.logActivity({
        adminId: deletedBy,
        action: 'delete_admin',
        resource: 'admin',
        resourceId: adminId,
      });

      return true;
    } catch (error) {
      console.error('Failed to delete admin:', error);
      return false;
    }
  }

  // Check permission
  hasPermission(admin: Admin, permission: AdminPermission): boolean {
    return admin.permissions.includes(permission);
  }

  // Check multiple permissions
  hasAllPermissions(admin: Admin, permissions: AdminPermission[]): boolean {
    return permissions.every((p) => admin.permissions.includes(p));
  }

  // Check any permission
  hasAnyPermission(admin: Admin, permissions: AdminPermission[]): boolean {
    return permissions.some((p) => admin.permissions.includes(p));
  }

  // Log admin activity
  async logActivity(activity: Omit<AdminActivity, 'id' | 'timestamp'>): Promise<void> {
    try {
      await supabase.from('admin_activities').insert({
        admin_id: activity.adminId,
        action: activity.action,
        resource: activity.resource,
        resource_id: activity.resourceId,
        details: activity.details,
        ip_address: activity.ipAddress,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to log admin activity:', error);
    }
  }

  // Get admin activities
  async getActivities(filter: {
    adminId?: string;
    action?: string;
    resource?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  } = {}): Promise<AdminActivity[]> {
    try {
      let query = supabase.from('admin_activities').select('*');

      if (filter.adminId) {
        query = query.eq('admin_id', filter.adminId);
      }

      if (filter.action) {
        query = query.eq('action', filter.action);
      }

      if (filter.resource) {
        query = query.eq('resource', filter.resource);
      }

      if (filter.startDate) {
        query = query.gte('timestamp', filter.startDate);
      }

      if (filter.endDate) {
        query = query.lte('timestamp', filter.endDate);
      }

      query = query.order('timestamp', { ascending: false });

      if (filter.limit) {
        query = query.limit(filter.limit);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map((activity) => ({
        id: activity.id,
        adminId: activity.admin_id,
        action: activity.action,
        resource: activity.resource,
        resourceId: activity.resource_id,
        details: activity.details,
        ipAddress: activity.ip_address,
        timestamp: activity.timestamp,
      }));
    } catch (error) {
      console.error('Failed to get admin activities:', error);
      return [];
    }
  }

  // Get dashboard statistics
  async getDashboardStats(timeRange?: {
    startDate?: string;
    endDate?: string;
  }): Promise<DashboardStats> {
    try {
      // In production, these would be actual database queries
      // This is a simplified mock implementation

      const stats: DashboardStats = {
        users: {
          total: 0,
          active: 0,
          new: 0,
          growth: 0,
        },
        escrows: {
          total: 0,
          active: 0,
          completed: 0,
          disputed: 0,
          value: 0,
        },
        payments: {
          total: 0,
          volume: 0,
          successRate: 0,
          averageAmount: 0,
        },
        documents: {
          total: 0,
          pending: 0,
          verified: 0,
          rejected: 0,
        },
        revenue: {
          total: 0,
          fees: 0,
          growth: 0,
        },
      };

      // Get user stats
      const { data: users } = await supabase.from('users').select('id, created_at');
      stats.users.total = users?.length || 0;

      // Get escrow stats
      const { data: escrows } = await supabase
        .from('escrows')
        .select('status, amount');
      stats.escrows.total = escrows?.length || 0;
      stats.escrows.active = escrows?.filter((e) => e.status === 'in_progress').length || 0;
      stats.escrows.completed = escrows?.filter((e) => e.status === 'completed').length || 0;
      stats.escrows.disputed = escrows?.filter((e) => e.status === 'disputed').length || 0;
      stats.escrows.value = escrows?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0;

      // Get payment stats
      const { data: payments } = await supabase
        .from('payments')
        .select('status, amount');
      stats.payments.total = payments?.length || 0;
      stats.payments.volume = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
      const successful = payments?.filter((p) => p.status === 'completed').length || 0;
      stats.payments.successRate =
        stats.payments.total > 0 ? (successful / stats.payments.total) * 100 : 0;
      stats.payments.averageAmount =
        stats.payments.total > 0 ? stats.payments.volume / stats.payments.total : 0;

      // Get document stats
      const { data: documents } = await supabase.from('documents').select('status');
      stats.documents.total = documents?.length || 0;
      stats.documents.pending = documents?.filter((d) => d.status === 'pending_review').length || 0;
      stats.documents.verified = documents?.filter((d) => d.status === 'verified').length || 0;
      stats.documents.rejected = documents?.filter((d) => d.status === 'rejected').length || 0;

      return stats;
    } catch (error) {
      console.error('Failed to get dashboard stats:', error);
      throw error;
    }
  }

  // Get system health
  async getSystemHealth(): Promise<SystemHealth> {
    try {
      const health: SystemHealth = {
        status: 'healthy',
        uptime: process.uptime(),
        services: {
          database: { status: 'up', responseTime: 0 },
          api: { status: 'up', responseTime: 0 },
          payment: { status: 'up', responseTime: 0 },
          storage: { status: 'up', responseTime: 0 },
        },
        metrics: {
          cpu: 0,
          memory: 0,
          disk: 0,
          network: 0,
        },
      };

      // Check database
      const dbStart = Date.now();
      try {
        await supabase.from('users').select('id').limit(1);
        health.services.database.status = 'up';
        health.services.database.responseTime = Date.now() - dbStart;
      } catch (error) {
        health.services.database.status = 'down';
        health.status = 'degraded';
      }

      // Mock other services
      health.services.api.responseTime = Math.random() * 100;
      health.services.payment.responseTime = Math.random() * 200;
      health.services.storage.responseTime = Math.random() * 150;

      // Mock metrics
      const memUsage = process.memoryUsage();
      health.metrics.memory = (memUsage.heapUsed / memUsage.heapTotal) * 100;
      health.metrics.cpu = Math.random() * 100;
      health.metrics.disk = Math.random() * 100;
      health.metrics.network = Math.random() * 100;

      return health;
    } catch (error) {
      console.error('Failed to get system health:', error);
      return {
        status: 'down',
        uptime: 0,
        services: {
          database: { status: 'down', responseTime: 0 },
          api: { status: 'down', responseTime: 0 },
          payment: { status: 'down', responseTime: 0 },
          storage: { status: 'down', responseTime: 0 },
        },
        metrics: {
          cpu: 0,
          memory: 0,
          disk: 0,
          network: 0,
        },
      };
    }
  }

  // Map database record to Admin
  private mapToAdmin(data: any): Admin {
    return {
      id: data.id,
      userId: data.user_id,
      role: data.role,
      permissions: data.permissions || [],
      name: data.name,
      email: data.email,
      avatar: data.avatar,
      active: data.active,
      lastLoginAt: data.last_login_at,
      createdAt: data.created_at,
      createdBy: data.created_by,
    };
  }

  // Admin middleware
  requireAdmin(permissions?: AdminPermission[]) {
    return async (req: any, res: any, next: any) => {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const admin = await this.getAdminByUserId(req.user.id);

      if (!admin || !admin.active) {
        return res.status(403).json({ error: 'Admin access required' });
      }

      if (permissions && !this.hasAnyPermission(admin, permissions)) {
        return res.status(403).json({
          error: 'Insufficient permissions',
          required: permissions,
        });
      }

      req.admin = admin;
      next();
    };
  }
}

// Export singleton instance
export const adminSystem = AdminSystem.getInstance();

// Convenience functions
export const createAdmin = (data: any, createdBy: string) =>
  adminSystem.createAdmin(data, createdBy);

export const getAdmin = (adminId: string) => adminSystem.getAdmin(adminId);

export const hasPermission = (admin: Admin, permission: AdminPermission) =>
  adminSystem.hasPermission(admin, permission);

export const getDashboardStats = (timeRange?: any) =>
  adminSystem.getDashboardStats(timeRange);

export const getSystemHealth = () => adminSystem.getSystemHealth();

export const requireAdmin = (permissions?: AdminPermission[]) =>
  adminSystem.requireAdmin(permissions);

