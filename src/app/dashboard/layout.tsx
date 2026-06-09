import React from 'react';
import { Shell } from '@/components/console/shell';

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  return <Shell>{children}</Shell>;
};

export default DashboardLayout;
