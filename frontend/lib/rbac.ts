type UserLike = {
  id?: number;
  email?: string;
  roles?: string[];
} | null;

const ROLE_PERMISSIONS: Record<string, string[]> = {
  super_admin: [
    'admin.access',
    'users.read',
    'users.update',
    'users.delete',
    'users.roles.manage',
    'products.manage',
    'orders.read',
    'orders.manage',
    'bots.manage',
    'support.manage',
    'analytics.read',
    'system.manage',
    'profile.read',
    'profile.update',
    'orders.own',
    'bots.own',
    'support.own',
  ],
  admin: [
    'admin.access',
    'users.read',
    'users.update',
    'products.manage',
    'orders.read',
    'orders.manage',
    'bots.manage',
    'support.manage',
    'analytics.read',
    'profile.read',
    'profile.update',
  ],
  manager: [
    'users.read',
    'orders.read',
    'orders.manage',
    'support.manage',
    'analytics.read',
    'profile.read',
    'profile.update',
  ],
  user: [
    'profile.read',
    'profile.update',
    'orders.own',
    'bots.own',
    'support.own',
  ],
};

const getUserRoles = (user: UserLike): string[] => {
  if (!user) return [];
  const roles = Array.isArray(user.roles) ? user.roles.filter(Boolean) : [];
  return roles;
};

const isLegacyAdmin = (user: UserLike): boolean => {
  if (!user) return false;
  return user.id === 1 || Boolean(user.email?.endsWith('@admin.com'));
};

export const getUserPermissions = (user: UserLike): string[] => {
  const rolePermissions = new Set<string>();
  const roles = getUserRoles(user);

  roles.forEach((role) => {
    (ROLE_PERMISSIONS[role] || []).forEach((permission) => rolePermissions.add(permission));
  });

  if (isLegacyAdmin(user)) {
    rolePermissions.add('admin.access');
    rolePermissions.add('analytics.read');
    rolePermissions.add('support.manage');
    rolePermissions.add('users.read');
  }

  return Array.from(rolePermissions);
};

export const hasPermission = (user: UserLike, permission: string): boolean => {
  const permissions = getUserPermissions(user);
  return permissions.includes(permission);
};

export const hasAnyPermission = (user: UserLike, permissions: string[]): boolean => {
  return permissions.some((permission) => hasPermission(user, permission));
};
