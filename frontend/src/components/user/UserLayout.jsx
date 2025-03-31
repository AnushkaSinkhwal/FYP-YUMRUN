import { Outlet } from 'react-router-dom';
import DashboardLayout from '../shared/DashboardLayout';

const UserLayout = () => {
  return (
    <DashboardLayout role="user">
      <Outlet />
    </DashboardLayout>
  );
};

export default UserLayout; 