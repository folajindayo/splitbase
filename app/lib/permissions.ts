import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Permission actions
export enum Permission {
  // User permissions
  USER_READ = 'user:read',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',
  USER_CREATE = 'user:create',
  
  // Escrow permissions
  ESCROW_READ = 'escrow:read',
  ESCROW_CREATE = 'escrow:create',
  ESCROW_UPDATE = 'escrow:update',
  ESCROW_DELETE = 'escrow:delete',
  ESCROW_RELEASE = 'escrow:release',
  ESCROW_CANCEL = 'escrow:cancel',
  
  // Payment permissions
  PAYMENT_READ = 'payment:read',
  PAYMENT_CREATE = 'payment:create',
  PAYMENT_PROCESS = 'payment:process',
  PAYMENT_REFUND = 'payment:refund',
  
  // Dispute permissions
  DISPUTE_READ = 'dispute:read',
  DISPUTE_CREATE = 'dispute:create',
  DISPUTE_RESOLVE = 'dispute:resolve',
  DISPUTE_MANAGE = 'dispute:manage',
  
  // Admin permissions
  ADMIN_ACCESS = 'admin:access',
  ADMIN_USERS = 'admin:users',
  ADMIN_SETTINGS = 'admin:settings',
  ADMIN_REPORTS = 'admin:reports',
  
  // System permissions
  SYSTEM_CONFIG = 'system:config',
  SYSTEM_LOGS = 'system:logs',
  SYSTEM_MAINTENANCE = 'system:maintenance',
}

// Predefined roles
export enum Role {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  USER = 'user',
  GUEST = 'guest',
}

// Role-permission mappings
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.SUPER_ADMIN]: Object.values(Permission), // All permissions
  
  [Role.ADMIN]: [
    Permission.USER_READ,
    Permission.USER_UPDATE,
    Permission.ESCROW_READ,
    Permission.ESCROW_CREATE,
    Permission.ESCROW_UPDATE,
    Permission.ESCROW_RELEASE,
    Permission.ESCROW_CANCEL,
    Permission.PAYMENT_READ,
    Permission.PAYMENT_CREATE,
    Permission.PAYMENT_PROCESS,
    Permission.DISPUTE_READ,
    Permission.DISPUTE_RESOLVE,
    Permission.DISPUTE_MANAGE,
    Permission.ADMIN_ACCESS,
    Permission.ADMIN_USERS,
    Permission.ADMIN_REPORTS,
  ],
  
  [Role.MODERATOR]: [
    Permission.USER_READ,
    Permission.ESCROW_READ,
    Permission.PAYMENT_READ,
    Permission.DISPUTE_READ,
    Permission.DISPUTE_MANAGE,
    Permission.ADMIN_ACCESS,
  ],
  
  [Role.USER]: [
    Permission.USER_READ,
    Permission.USER_UPDATE,
    Permission.ESCROW_READ,
    Permission.ESCROW_CREATE,
    Permission.ESCROW_UPDATE,
    Permission.PAYMENT_READ,
    Permission.PAYMENT_CREATE,
    Permission.DISPUTE_READ,
    Permission.DISPUTE_CREATE,
  ],
  
  [Role.GUEST]: [
    Permission.USER_READ,
    Permission.ESCROW_READ,
  ],
};

export interface UserPermissions {
  userId: string;
  roles: Role[];
  customPermissions: Permission[];
  deniedPermissions: Permission[];
}

class PermissionSystem {
  private static instance: PermissionSystem;
  private permissionCache: Map<string, UserPermissions> = new Map();
  private cacheTTL = 300000; // 5 minutes

  private constructor() {}

  static getInstance(): PermissionSystem {
    if (!PermissionSystem.instance) {
      PermissionSystem.instance = new PermissionSystem();
    }
    return PermissionSystem.instance;
  }

  // Get user permissions
  async getUserPermissions(userId: string): Promise<UserPermissions> {
    // Check cache
    const cached = this.permissionCache.get(userId);
    if (cached) {
      return cached;
    }

    try {
      // Fetch from database
      const { data, error } = await supabase
        .from('user_permissions')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      const permissions: UserPermissions = {
        userId,
        roles: data?.roles || [Role.USER],
        customPermissions: data?.custom_permissions || [],
        deniedPermissions: data?.denied_permissions || [],
      };

      // Cache the permissions
      this.permissionCache.set(userId, permissions);
      setTimeout(() => {
        this.permissionCache.delete(userId);
      }, this.cacheTTL);

      return permissions;
    } catch (error) {
      console.error('Failed to get user permissions:', error);
      // Return default permissions
      return {
        userId,
        roles: [Role.USER],
        customPermissions: [],
        deniedPermissions: [],
      };
    }
  }

  // Check if user has permission
  async hasPermission(userId: string, permission: Permission): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId);

    // Check if explicitly denied
    if (userPermissions.deniedPermissions.includes(permission)) {
      return false;
    }

    // Check custom permissions
    if (userPermissions.customPermissions.includes(permission)) {
      return true;
    }

    // Check role permissions
    for (const role of userPermissions.roles) {
      const rolePermissions = ROLE_PERMISSIONS[role];
      if (rolePermissions && rolePermissions.includes(permission)) {
        return true;
      }
    }

    return false;
  }

  // Check if user has any of the permissions
  async hasAnyPermission(userId: string, permissions: Permission[]): Promise<boolean> {
    for (const permission of permissions) {
      if (await this.hasPermission(userId, permission)) {
        return true;
      }
    }
    return false;
  }

  // Check if user has all permissions
  async hasAllPermissions(userId: string, permissions: Permission[]): Promise<boolean> {
    for (const permission of permissions) {
      if (!(await this.hasPermission(userId, permission))) {
        return false;
      }
    }
    return true;
  }

  // Check if user has role
  async hasRole(userId: string, role: Role): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId);
    return userPermissions.roles.includes(role);
  }

  // Check if user has any of the roles
  async hasAnyRole(userId: string, roles: Role[]): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId);
    return roles.some(role => userPermissions.roles.includes(role));
  }

  // Assign role to user
  async assignRole(userId: string, role: Role): Promise<boolean> {
    try {
      const userPermissions = await this.getUserPermissions(userId);

      if (userPermissions.roles.includes(role)) {
        return true; // Already has role
      }

      const updatedRoles = [...userPermissions.roles, role];

      const { error } = await supabase
        .from('user_permissions')
        .upsert({
          user_id: userId,
          roles: updatedRoles,
          custom_permissions: userPermissions.customPermissions,
          denied_permissions: userPermissions.deniedPermissions,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      // Clear cache
      this.permissionCache.delete(userId);

      return true;
    } catch (error) {
      console.error('Failed to assign role:', error);
      return false;
    }
  }

  // Remove role from user
  async removeRole(userId: string, role: Role): Promise<boolean> {
    try {
      const userPermissions = await this.getUserPermissions(userId);

      const updatedRoles = userPermissions.roles.filter(r => r !== role);

      const { error } = await supabase
        .from('user_permissions')
        .update({
          roles: updatedRoles,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (error) throw error;

      // Clear cache
      this.permissionCache.delete(userId);

      return true;
    } catch (error) {
      console.error('Failed to remove role:', error);
      return false;
    }
  }

  // Grant custom permission
  async grantPermission(userId: string, permission: Permission): Promise<boolean> {
    try {
      const userPermissions = await this.getUserPermissions(userId);

      if (userPermissions.customPermissions.includes(permission)) {
        return true; // Already has permission
      }

      const updatedPermissions = [...userPermissions.customPermissions, permission];

      const { error } = await supabase
        .from('user_permissions')
        .upsert({
          user_id: userId,
          roles: userPermissions.roles,
          custom_permissions: updatedPermissions,
          denied_permissions: userPermissions.deniedPermissions,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      // Clear cache
      this.permissionCache.delete(userId);

      return true;
    } catch (error) {
      console.error('Failed to grant permission:', error);
      return false;
    }
  }

  // Revoke custom permission
  async revokePermission(userId: string, permission: Permission): Promise<boolean> {
    try {
      const userPermissions = await this.getUserPermissions(userId);

      const updatedPermissions = userPermissions.customPermissions.filter(p => p !== permission);

      const { error } = await supabase
        .from('user_permissions')
        .update({
          custom_permissions: updatedPermissions,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (error) throw error;

      // Clear cache
      this.permissionCache.delete(userId);

      return true;
    } catch (error) {
      console.error('Failed to revoke permission:', error);
      return false;
    }
  }

  // Deny permission explicitly
  async denyPermission(userId: string, permission: Permission): Promise<boolean> {
    try {
      const userPermissions = await this.getUserPermissions(userId);

      if (userPermissions.deniedPermissions.includes(permission)) {
        return true; // Already denied
      }

      const updatedDeniedPermissions = [...userPermissions.deniedPermissions, permission];

      const { error } = await supabase
        .from('user_permissions')
        .upsert({
          user_id: userId,
          roles: userPermissions.roles,
          custom_permissions: userPermissions.customPermissions,
          denied_permissions: updatedDeniedPermissions,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      // Clear cache
      this.permissionCache.delete(userId);

      return true;
    } catch (error) {
      console.error('Failed to deny permission:', error);
      return false;
    }
  }

  // Get all permissions for a user (resolved)
  async getAllPermissions(userId: string): Promise<Permission[]> {
    const userPermissions = await this.getUserPermissions(userId);
    const allPermissions = new Set<Permission>();

    // Add role permissions
    for (const role of userPermissions.roles) {
      const rolePermissions = ROLE_PERMISSIONS[role];
      if (rolePermissions) {
        rolePermissions.forEach(p => allPermissions.add(p));
      }
    }

    // Add custom permissions
    userPermissions.customPermissions.forEach(p => allPermissions.add(p));

    // Remove denied permissions
    userPermissions.deniedPermissions.forEach(p => allPermissions.delete(p));

    return Array.from(allPermissions);
  }

  // Check resource ownership
  async canAccessResource(
    userId: string,
    resourceType: 'escrow' | 'payment' | 'dispute',
    resourceId: string,
    action: Permission
  ): Promise<boolean> {
    // Check if user has general permission
    if (!(await this.hasPermission(userId, action))) {
      return false;
    }

    try {
      // Check if user is owner or participant
      let query = supabase.from(resourceType + 's').select('*').eq('id', resourceId);

      if (resourceType === 'escrow') {
        query = query.or(`buyer_id.eq.${userId},seller_id.eq.${userId}`);
      } else {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query.single();

      if (error || !data) {
        // Check if user is admin
        return await this.hasAnyRole(userId, [Role.ADMIN, Role.SUPER_ADMIN]);
      }

      return true;
    } catch (error) {
      console.error('Failed to check resource access:', error);
      return false;
    }
  }

  // Clear cache for user
  clearCache(userId?: string): void {
    if (userId) {
      this.permissionCache.delete(userId);
    } else {
      this.permissionCache.clear();
    }
  }

  // Get permission hierarchy
  getPermissionHierarchy(permission: Permission): Permission[] {
    const parts = permission.split(':');
    const hierarchy: Permission[] = [];

    for (let i = 1; i <= parts.length; i++) {
      const perm = parts.slice(0, i).join(':') as Permission;
      hierarchy.push(perm);
    }

    return hierarchy;
  }
}

// Export singleton instance
export const permissions = PermissionSystem.getInstance();

// Middleware helper for Express/API routes
export const requirePermission = (permission: Permission) => {
  return async (req: any, res: any, next: any) => {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const hasPermission = await permissions.hasPermission(userId, permission);

    if (!hasPermission) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    }

    next();
  };
};

// Middleware helper for role checking
export const requireRole = (role: Role) => {
  return async (req: any, res: any, next: any) => {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const hasRole = await permissions.hasRole(userId, role);

    if (!hasRole) {
      return res.status(403).json({ error: 'Forbidden: Insufficient role' });
    }

    next();
  };
};

// Decorator for permission checking
export function RequirePermission(permission: Permission) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const userId = args[0]?.userId || args[0]?.user?.id;

      if (!userId) {
        throw new Error('Unauthorized: No user ID provided');
      }

      const hasPermission = await permissions.hasPermission(userId, permission);

      if (!hasPermission) {
        throw new Error('Forbidden: Insufficient permissions');
      }

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

// Convenience functions
export const checkPermission = (userId: string, permission: Permission) =>
  permissions.hasPermission(userId, permission);

export const checkRole = (userId: string, role: Role) =>
  permissions.hasRole(userId, role);

export const grantUserPermission = (userId: string, permission: Permission) =>
  permissions.grantPermission(userId, permission);

export const assignUserRole = (userId: string, role: Role) =>
  permissions.assignRole(userId, role);

export const getUserAllPermissions = (userId: string) =>
  permissions.getAllPermissions(userId);

