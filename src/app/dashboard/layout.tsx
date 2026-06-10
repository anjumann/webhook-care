import React from 'react';
import { Shell } from '@/components/console/shell';
import { SessionProvider } from '@/components/auth/session-provider';

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <SessionProvider>
      <Shell>{children}</Shell>
    </SessionProvider>
  );
};

export default DashboardLayout;
