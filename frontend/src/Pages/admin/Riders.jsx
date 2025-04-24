import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { FaSearch, FaCheck, FaTimes, FaUserEdit, FaTruck } from 'react-icons/fa';

const Riders = () => {
  const [riders, setRiders] = useState([]);
  const [filteredRiders, setFilteredRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRider, setSelectedRider] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Fetch riders on component mount
  useEffect(() => {
    fetchRiders();
  }, []);

  // Filter riders based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredRiders(riders);
    } else {
      const filtered = riders.filter(rider => {
        const fullName = `${rider.firstName} ${rider.lastName}`.toLowerCase();
        const email = rider.email.toLowerCase();
        const phone = rider.phone.toLowerCase();
        const search = searchTerm.toLowerCase();
        
        return fullName.includes(search) || 
               email.includes(search) || 
               phone.includes(search);
      });
      setFilteredRiders(filtered);
    }
  }, [searchTerm, riders]);

  // Fetch all riders (users with role 'delivery_rider')
  const fetchRiders = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/delivery/staff');
      if (response.data.success) {
        setRiders(response.data.deliveryStaff);
        setFilteredRiders(response.data.deliveryStaff);
      } else {
        toast.error('Failed to fetch riders');
      }
    } catch (error) {
      console.error('Error fetching riders:', error);
      toast.error('Error fetching riders');
    } finally {
      setLoading(false);
    }
  };

  // Handle rider approval
  const handleApproveRider = async (approved) => {
    if (!selectedRider) return;
    
    try {
      setLoading(true);
      const response = await axios.put(`/api/admin/riders/${selectedRider._id}/approve`, {
        approved
      });
      
      if (response.data.success) {
        toast.success(approved ? 'Rider approved successfully' : 'Rider approval revoked');
        // Update rider in state
        const updatedRiders = riders.map(rider => {
          if (rider._id === selectedRider._id) {
            return {
              ...rider,
              deliveryRiderDetails: {
                ...rider.deliveryRiderDetails,
                approved
              }
            };
          }
          return rider;
        });
        setRiders(updatedRiders);
        setShowApprovalModal(false);
      } else {
        toast.error('Failed to update rider approval status');
      }
    } catch (error) {
      console.error('Error updating rider approval:', error);
      toast.error('Error updating rider approval status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="flex flex-col gap-4 mb-6">
        <h1 className="text-2xl font-bold">Delivery Riders</h1>
        
        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search riders by name, email, or phone..."
              className="w-full p-2 pl-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-yumrun-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Riders Table */}
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Vehicle
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Deliveries
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center">
                  Loading riders...
                </td>
              </tr>
            ) : filteredRiders.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center">
                  No riders found
                </td>
              </tr>
            ) : (
              filteredRiders.map((rider) => (
                <tr key={rider._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        <img 
                          className="h-10 w-10 rounded-full object-cover"
                          src={rider.profilePic || "/assets/img/default-avatar.png"} 
                          alt={rider.fullName} 
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{rider.fullName}</div>
                        <div className="text-sm text-gray-500">Joined: {new Date(rider.createdAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{rider.email}</div>
                    <div className="text-sm text-gray-500">{rider.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 capitalize">
                      {rider.deliveryRiderDetails?.vehicleType || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {rider.deliveryRiderDetails?.licenseNumber || 'No license info'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      rider.deliveryRiderDetails?.approved 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {rider.deliveryRiderDetails?.approved ? 'Approved' : 'Pending Approval'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {rider.deliveryRiderDetails?.completedDeliveries || 0} completed
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedRider(rider);
                          setShowDetailsModal(true);
                        }}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="View Details"
                      >
                        <FaUserEdit />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedRider(rider);
                          setShowApprovalModal(true);
                        }}
                        className={`${
                          rider.deliveryRiderDetails?.approved
                            ? 'text-red-600 hover:text-red-900'
                            : 'text-green-600 hover:text-green-900'
                        }`}
                        title={rider.deliveryRiderDetails?.approved ? 'Revoke Approval' : 'Approve Rider'}
                      >
                        {rider.deliveryRiderDetails?.approved ? <FaTimes /> : <FaCheck />}
                      </button>
                      <button
                        onClick={() => window.location.href = `/admin/deliveries?riderId=${rider._id}`}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Deliveries"
                      >
                        <FaTruck />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Approval Modal */}
      {showApprovalModal && selectedRider && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black opacity-40" onClick={() => setShowApprovalModal(false)}></div>
            <div className="relative p-6 bg-white rounded-lg shadow-xl max-w-md mx-auto">
              <h3 className="text-lg font-bold mb-4">
                {selectedRider.deliveryRiderDetails?.approved ? 'Revoke Approval' : 'Approve Rider'}
              </h3>
              <p className="mb-4">
                {selectedRider.deliveryRiderDetails?.approved
                  ? `Are you sure you want to revoke approval for ${selectedRider.fullName}? They will not be able to deliver orders until approved again.`
                  : `Approve ${selectedRider.fullName} as a delivery rider? This will allow them to be assigned orders for delivery.`
                }
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowApprovalModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleApproveRider(!selectedRider.deliveryRiderDetails?.approved)}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-md ${
                    selectedRider.deliveryRiderDetails?.approved
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {selectedRider.deliveryRiderDetails?.approved ? 'Revoke Approval' : 'Approve'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedRider && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black opacity-40" onClick={() => setShowDetailsModal(false)}></div>
            <div className="relative p-6 bg-white rounded-lg shadow-xl max-w-xl mx-auto">
              <h3 className="text-lg font-bold mb-4">Rider Details: {selectedRider.fullName}</h3>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-500">Contact Information</p>
                  <p><strong>Email:</strong> {selectedRider.email}</p>
                  <p><strong>Phone:</strong> {selectedRider.phone}</p>
                  <p><strong>Joined:</strong> {new Date(selectedRider.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Vehicle Details</p>
                  <p><strong>Type:</strong> {selectedRider.deliveryRiderDetails?.vehicleType || 'N/A'}</p>
                  <p><strong>License:</strong> {selectedRider.deliveryRiderDetails?.licenseNumber || 'N/A'}</p>
                  <p>
                    <strong>Registration:</strong> 
                    {selectedRider.deliveryRiderDetails?.vehicleRegistrationNumber || 'N/A'}
                  </p>
                </div>
              </div>
              
              <div className="mt-4">
                <p className="text-sm text-gray-500">Status</p>
                <p><strong>Account status:</strong> {selectedRider.isActive ? 'Active' : 'Inactive'}</p>
                <p><strong>Approval status:</strong> {selectedRider.deliveryRiderDetails?.approved ? 'Approved' : 'Pending Approval'}</p>
                <p><strong>Deliveries completed:</strong> {selectedRider.deliveryRiderDetails?.completedDeliveries || 0}</p>
                <p><strong>Rating:</strong> {selectedRider.deliveryRiderDetails?.ratings?.average || 'No ratings'} ({selectedRider.deliveryRiderDetails?.ratings?.count || 0} reviews)</p>
              </div>
              
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Riders; 