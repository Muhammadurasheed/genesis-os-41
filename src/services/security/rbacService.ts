/**
 * Role-Based Access Control (RBAC) Service - FAANG Level Implementation
 * Provides enterprise-grade authorization and permission management
 */

interface Permission {
  id: string;
  resource: string;
  action: string;
  conditions?: Record<string, any>;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[]; // Permission IDs
  inherited?: string[]; // Parent role IDs
}

interface User {
  id: string;
  roles: string[];
  attributes: Record<string, any>;
}

export class RBACService {
  private permissions: Map<string, Permission> = new Map();
  private roles: Map<string, Role> = new Map();
  private users: Map<string, User> = new Map();

  constructor() {
    console.log('🔐 RBAC Service initialized');
    this.setupDefaultRoles();
  }

  // Permission management
  createPermission(permission: Permission): void {
    this.permissions.set(permission.id, permission);
    console.log(`✅ Created permission: ${permission.id}`);
  }

  // Role management
  createRole(role: Role): void {
    this.roles.set(role.id, role);
    console.log(`👤 Created role: ${role.name}`);
  }

  // User management
  assignRole(userId: string, roleId: string): boolean {
    const user = this.users.get(userId) || { id: userId, roles: [], attributes: {} };
    if (!user.roles.includes(roleId)) {
      user.roles.push(roleId);
      this.users.set(userId, user);
      return true;
    }
    return false;
  }

  // Authorization check
  hasPermission(userId: string, resource: string, action: string): boolean {
    const user = this.users.get(userId);
    if (!user) return false;

    for (const roleId of user.roles) {
      const role = this.roles.get(roleId);
      if (!role) continue;

      for (const permissionId of role.permissions) {
        const permission = this.permissions.get(permissionId);
        if (permission?.resource === resource && permission?.action === action) {
          return true;
        }
      }
    }
    return false;
  }

  private setupDefaultRoles(): void {
    // Setup default permissions and roles
    this.createPermission({ id: 'read_workflows', resource: 'workflow', action: 'read' });
    this.createPermission({ id: 'write_workflows', resource: 'workflow', action: 'write' });
    this.createPermission({ id: 'admin_system', resource: 'system', action: 'admin' });

    this.createRole({
      id: 'viewer',
      name: 'Viewer',
      description: 'Can view workflows and data',
      permissions: ['read_workflows']
    });

    this.createRole({
      id: 'editor',
      name: 'Editor', 
      description: 'Can create and edit workflows',
      permissions: ['read_workflows', 'write_workflows']
    });

    this.createRole({
      id: 'admin',
      name: 'Administrator',
      description: 'Full system access',
      permissions: ['read_workflows', 'write_workflows', 'admin_system']
    });
  }

  shutdown(): void {
    this.permissions.clear();
    this.roles.clear();
    this.users.clear();
    console.log('🛑 RBAC Service shut down');
  }
}

export const rbacService = new RBACService();