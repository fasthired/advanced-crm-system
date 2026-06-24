'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './auth-context';
import { adminApi } from './api-client';

type Worker = {
  id: string;
  email: string;
  full_name: string | null;
  role: 'user' | 'admin';
  account_status: string;
};

type AdminWorkerContextType = {
  selectedWorkerId: string;
  setSelectedWorkerId: (id: string) => void;
  workers: Worker[];
  loadingWorkers: boolean;
  refreshWorkers: () => Promise<void>;
};

const AdminWorkerContext = createContext<AdminWorkerContextType | undefined>(undefined);

export function AdminWorkerProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [selectedWorkerId, setSelectedWorkerIdState] = useState<string>('all');
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loadingWorkers, setLoadingWorkers] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('admin_selected_worker_id');
      if (saved) {
        setSelectedWorkerIdState(saved);
      }
    }
  }, []);

  const setSelectedWorkerId = (id: string) => {
    setSelectedWorkerIdState(id);
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_selected_worker_id', id);
    }
  };

  const refreshWorkers = async () => {
    if (user?.role !== 'admin') return;
    setLoadingWorkers(true);
    try {
      const data = await adminApi.getUsers();
      // Filter out admin user (optional, but good to only show worker roles in workers list)
      const workerList = ((data?.users || []) as any[]).map((w: any) => ({
        id: w.id,
        email: w.email,
        full_name: w.full_name,
        role: w.role,
        account_status: w.account_status,
      }));
      setWorkers(workerList);
    } catch (error) {
      console.error('Error fetching workers for admin context:', error);
    } finally {
      setLoadingWorkers(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      refreshWorkers();
    } else {
      setWorkers([]);
      setSelectedWorkerIdState('all');
    }
  }, [user?.role]);

  return (
    <AdminWorkerContext.Provider
      value={{
        selectedWorkerId,
        setSelectedWorkerId,
        workers,
        loadingWorkers,
        refreshWorkers,
      }}
    >
      {children}
    </AdminWorkerContext.Provider>
  );
}

export function useAdminWorker() {
  const context = useContext(AdminWorkerContext);
  if (context === undefined) {
    throw new Error('useAdminWorker must be used within an AdminWorkerProvider');
  }
  return context;
}
