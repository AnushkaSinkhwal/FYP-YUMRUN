import DashboardLayout from '../shared/DashboardLayout';
import ErrorBoundary from '../shared/ErrorBoundary';
import PropTypes from 'prop-types';

const DeliveryLayout = ({ children }) => {
  return (
    <ErrorBoundary>
      <DashboardLayout role="deliveryUser">
        {children}
      </DashboardLayout>
    </ErrorBoundary>
  );
};

DeliveryLayout.propTypes = {
  children: PropTypes.node
};

export default DeliveryLayout; 