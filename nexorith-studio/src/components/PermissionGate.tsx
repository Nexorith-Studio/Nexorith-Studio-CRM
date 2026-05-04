import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Permission } from '../types';

interface PermissionGateProps {
  children: React.ReactNode;
  permission: Permission;
  fallback?: React.ReactNode;
}

export const PermissionGate = ({ children, permission, fallback = null }: PermissionGateProps) => {
  const { hasPermission } = useAuth();

  if (!hasPermission(permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
