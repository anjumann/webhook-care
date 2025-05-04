import React from 'react';
import Header from '@/components/header';

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className='max-w-7xl mx-auto'>
      <Header />
      <main className='mx-auto w-11/12'>{children}</main>
    </div>
  );
};

export default DashboardLayout; 