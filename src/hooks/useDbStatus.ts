'use client';

import { useState, useEffect } from 'react';

interface DbStatus {
  database: 'connected' | 'disconnected';
  mode: 'production' | 'demo';
  timestamp: string;
  error?: string;
}

export function useDbStatus() {
  const [status, setStatus] = useState<DbStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkStatus() {
      try {
        const response = await fetch('/api/status');
        const data = await response.json();
        setStatus(data);
      } catch (error) {
        console.error('Failed to check database status:', error);
        // Assume demo mode if we can't check status
        setStatus({
          database: 'disconnected',
          mode: 'demo',
          timestamp: new Date().toISOString(),
          error: 'Status check failed',
        });
      } finally {
        setIsLoading(false);
      }
    }

    checkStatus();
  }, []);

  return {
    status,
    isLoading,
    isDemoMode: status?.mode === 'demo',
    isDatabaseConnected: status?.database === 'connected',
  };
}