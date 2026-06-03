'use client';
import { createContext, useContext, type ReactNode } from 'react';
const BranchContext = createContext({ branchId: 'branch_demo', nombre: 'Sucursal Demo' });
export function BranchProvider({ children }: { children: ReactNode }) { return <BranchContext.Provider value={{ branchId: 'branch_demo', nombre: 'Sucursal Demo' }}>{children}</BranchContext.Provider>; }
export function useBranch() { return useContext(BranchContext); }
