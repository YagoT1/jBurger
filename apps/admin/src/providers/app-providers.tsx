'use client';
import type { ReactNode } from 'react';
import { AuthProvider } from './auth-provider.js';
import { BranchProvider } from './branch-provider.js';
import { PermissionProvider } from './permission-provider.js';
import { TenantProvider } from './tenant-provider.js';
export function AppProviders({ children }: { children: ReactNode }) { return <AuthProvider><TenantProvider><BranchProvider><PermissionProvider>{children}</PermissionProvider></BranchProvider></TenantProvider></AuthProvider>; }
