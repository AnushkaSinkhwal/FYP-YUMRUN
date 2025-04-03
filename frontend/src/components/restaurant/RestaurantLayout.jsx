import { Outlet } from 'react-router-dom';
import DashboardLayout from '../shared/DashboardLayout';
import { useAuth } from '../../context/AuthContext';

const RestaurantLayout = () => {
  const { currentUser } = useAuth();
  console.log('RestaurantLayout - currentUser:', currentUser);
  
  return (
    <DashboardLayout role="restaurant">
      <Outlet />
    </DashboardLayout>
  );
};

export default RestaurantLayout; 