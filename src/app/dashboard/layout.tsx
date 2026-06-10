import React from 'react';
import { Shell } from '@/components/console/shell';
import { SessionProvider } from '@/components/auth/session-provider';
import { SignInDialogProvider } from '@/components/auth/sign-in-dialog';

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <SessionProvider>
      <SignInDialogProvider>
        <Shell>{children}</Shell>
      </SignInDialogProvider>
    </SessionProvider>
  );
};

export default DashboardLayout;
