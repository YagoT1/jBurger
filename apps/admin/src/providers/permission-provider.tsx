'use client';
import { createContext, useContext, type ReactNode } from 'react';
const PermissionContext = createContext<string[]>([]);
export function PermissionProvider({ children }: { children: ReactNode }) { return <PermissionContext.Provider value={['users.read', 'roles.read', 'permissions.read']}>{children}</PermissionContext.Provider>; }
export function usePermissions() { return useContext(PermissionContext); }
