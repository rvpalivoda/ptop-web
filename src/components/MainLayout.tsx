import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { BottomNav } from './BottomNav';

export const MainLayout = () => (
  <>
    <Header />
    <Outlet />
    <BottomNav />
  </>
);

export default MainLayout;
