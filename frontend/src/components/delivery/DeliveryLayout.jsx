import DashboardLayout from '../shared/DashboardLayout';
import ErrorBoundary from '../shared/ErrorBoundary';
import PropTypes from 'prop-types';
import { Outlet } from 'react-router-dom';

const DeliveryLayout = ({ children }) => {
  return (
    <ErrorBoundary>
      <DashboardLayout role="deliveryuser">
        {children || <Outlet />}
      </DashboardLayout>
    </ErrorBoundary>
  );
};

DeliveryLayout.propTypes = {
  children: PropTypes.node
};

export default DeliveryLayout; 