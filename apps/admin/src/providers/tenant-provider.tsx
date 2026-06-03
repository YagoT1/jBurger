'use client';
import { createContext, useContext, type ReactNode } from 'react';
const TenantContext = createContext({ tenantId: 'tenant_demo', nombre: 'Tenant Demo' });
export function TenantProvider({ children }: { children: ReactNode }) { return <TenantContext.Provider value={{ tenantId: 'tenant_demo', nombre: 'Tenant Demo' }}>{children}</TenantContext.Provider>; }
export function useTenant() { return useContext(TenantContext); }
