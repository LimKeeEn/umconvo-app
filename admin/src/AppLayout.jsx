import Sidebar from './sidebar';
import { Outlet } from 'react-router-dom';

const AppLayout = () => (
  <div className="flex">
    <Sidebar />
    <main className="ml-[250px] flex-1 p-6 bg-[#E9F0FF] min-h-screen">
      <Outlet /> {/* Render current route here */}
    </main>
  </div>
);

export default AppLayout;