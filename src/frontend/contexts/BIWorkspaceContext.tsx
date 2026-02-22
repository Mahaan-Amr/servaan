'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type BIWorkspace = 'ordering' | 'inventory' | 'merged';

interface BIWorkspaceContextType {
  workspace: BIWorkspace;
  setWorkspace: (workspace: BIWorkspace) => void;
  isOrderingWorkspace: boolean;
  isInventoryWorkspace: boolean;
  isMergedWorkspace: boolean;
}

const BIWorkspaceContext = createContext<BIWorkspaceContextType | undefined>(undefined);

interface BIWorkspaceProviderProps {
  children: ReactNode;
}

export function BIWorkspaceProvider({ children }: BIWorkspaceProviderProps) {
  // Initialize from localStorage or default to 'merged'
  const [workspace, setWorkspaceState] = useState<BIWorkspace>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('bi-workspace');
      if (saved === 'ordering' || saved === 'inventory' || saved === 'merged') {
        return saved;
      }
    }
    return 'merged';
  });

  // Save to localStorage whenever workspace changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('bi-workspace', workspace);
    }
  }, [workspace]);

  const setWorkspace = (newWorkspace: BIWorkspace) => {
    setWorkspaceState(newWorkspace);
  };

  const value: BIWorkspaceContextType = {
    workspace,
    setWorkspace,
    isOrderingWorkspace: workspace === 'ordering',
    isInventoryWorkspace: workspace === 'inventory',
    isMergedWorkspace: workspace === 'merged'
  };

  return (
    <BIWorkspaceContext.Provider value={value}>
      {children}
    </BIWorkspaceContext.Provider>
  );
}

export function useBIWorkspace(): BIWorkspaceContextType {
  const context = useContext(BIWorkspaceContext);
  if (context === undefined) {
    throw new Error('useBIWorkspace must be used within a BIWorkspaceProvider');
  }
  return context;
}

