import React from 'react';
import { Outlet } from 'react-router-dom';
import SideNav from '../../components/app/SideNav';
import BottomNav from '../../components/app/BottomNav';

const MainApp: React.FC = () => {
  return (
    <div className="min-h-screen bg-dark-100 text-white flex font-sans">
      <SideNav />
      <main className="flex-1 flex flex-col pb-16 md:pb-0">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
};

export default MainApp;
