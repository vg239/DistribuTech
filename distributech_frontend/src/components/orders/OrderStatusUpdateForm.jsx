import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

// Status options based on the OrderStatusChoices model
const STATUS_OPTIONS = [
  'Pending',
  'Processing',
  'Shipped',
  'In Transit',
  'Delivered',
  'Completed',
  'Cancelled',
];

// Status color mapping for badges
const STATUS_COLORS = {
  'Pending': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  'Processing': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  'Shipped': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
  'In Transit': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
  'Delivered': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  'Completed': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  'Cancelled': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

const StatusBadge = ({ status }) => {
  const colorClass = STATUS_COLORS[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
      {status}
    </span>
  );
};

const OrderStatusUpdateForm = ({ order, onStatusUpdated, onClose }) => {
  // Try to get the most recent status information for better initial values
  const mostRecentStatus = order?.statuses?.length > 0 ? order.statuses[0] : null;
  
  const [formData, setFormData] = useState({
    status: order?.status || 'Pending',
    current_location: mostRecentStatus?.current_location || '',
    remarks: '',
    expected_delivery_date: '',
    email: 'manager@distributech.com', // Default hardcoded manager email
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showStatusHistory, setShowStatusHistory] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // If order object changes, update form values
  useEffect(() => {
    if (order) {
      // Try to get the most recent status information
      const recentStatus = order?.statuses?.length > 0 ? order.statuses[0] : null;
      
      setFormData(prev => ({
        ...prev,
        status: order.status || prev.status,
        current_location: recentStatus?.current_location || prev.current_location,
      }));
    }
  }, [order]);

  const validateForm = () => {
    const errors = {};
    
    if (!formData.status) {
      errors.status = 'Status is required';
    }
    
    if (formData.expected_delivery_date) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(formData.expected_delivery_date)) {
        errors.expected_delivery_date = 'Date must be in YYYY-MM-DD format';
      }
    }
    
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear validation error when field is edited
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Use the public endpoint to update the order status
      const response = await axios.post(
        `${API_URL}/public/orders/${order.id}/status/`,
        formData
      );

      setSuccess(`Order status has been updated to ${formData.status}. Email notification was sent to ${formData.email || 'manager@distributech.com'}.`);
      
      // Call the callback to refresh the order details
      if (onStatusUpdated) {
        onStatusUpdated(response.data.order_status);
      }
      
      // Automatically close after successful update (optional)
      setTimeout(() => {
        if (onClose) onClose();
      }, 2000);
      
    } catch (err) {
      console.error('Error updating order status:', err);
      setError(err.response?.data?.message || 'Failed to update order status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleStatusHistory = () => {
    setShowStatusHistory(!showStatusHistory);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold gradient-text">Update Order Status</h2>
        <button 
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      {/* Order info summary */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-300 mb-2">ORDER #{order?.id}</h3>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-sm">
              <span className="font-medium">Current Status:</span>{' '}
              <StatusBadge status={order?.status || 'Unknown'} />
            </p>
            <p className="text-sm">
              <span className="font-medium">Department:</span>{' '}
              {order?.user?.department?.name || 'Unknown'}
            </p>
          </div>
          <div>
            <p className="text-sm">
              <span className="font-medium">Created By:</span>{' '}
              {order?.user?.username || 'Unknown'}
            </p>
            <p className="text-sm">
              <span className="font-medium">Created On:</span>{' '}
              {order?.created_at ? new Date(order.created_at).toLocaleDateString() : 'Unknown'}
            </p>
          </div>
        </div>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          {success}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="status" className="form-label">Status *</label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            className={`form-input ${validationErrors.status ? 'border-red-500' : ''}`}
            required
          >
            {STATUS_OPTIONS.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          {validationErrors.status && (
            <p className="text-red-500 text-xs mt-1">{validationErrors.status}</p>
          )}
        </div>
        
        <div className="mb-4">
          <label htmlFor="current_location" className="form-label">Current Location</label>
          <input
            id="current_location"
            name="current_location"
            type="text"
            value={formData.current_location}
            onChange={handleChange}
            className="form-input"
            placeholder="Warehouse, Transit Hub, etc."
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="remarks" className="form-label">Remarks</label>
          <textarea
            id="remarks"
            name="remarks"
            value={formData.remarks}
            onChange={handleChange}
            className="form-input"
            rows="3"
            placeholder="Any additional notes about this status update"
          ></textarea>
        </div>
        
        <div className="mb-4">
          <label htmlFor="expected_delivery_date" className="form-label">Expected Delivery Date</label>
          <input
            id="expected_delivery_date"
            name="expected_delivery_date"
            type="date"
            value={formData.expected_delivery_date}
            onChange={handleChange}
            className={`form-input ${validationErrors.expected_delivery_date ? 'border-red-500' : ''}`}
          />
          {validationErrors.expected_delivery_date && (
            <p className="text-red-500 text-xs mt-1">{validationErrors.expected_delivery_date}</p>
          )}
        </div>
        
        <div className="mb-6">
          <label htmlFor="email" className="form-label">Notification Email</label>
          <input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            className={`form-input ${validationErrors.email ? 'border-red-500' : ''}`}
            placeholder="Email to notify about this status change"
          />
          {validationErrors.email && (
            <p className="text-red-500 text-xs mt-1">{validationErrors.email}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">Defaults to manager@distributech.com if empty</p>
        </div>
        
        {order?.statuses?.length > 0 && (
          <div className="mb-6">
            <button 
              type="button" 
              onClick={toggleStatusHistory}
              className="text-primary-600 hover:underline text-sm flex items-center"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className={`h-4 w-4 mr-1 transform transition-transform ${showStatusHistory ? 'rotate-90' : ''}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              {showStatusHistory ? 'Hide Status History' : 'Show Status History'}
            </button>
            
            {showStatusHistory && (
              <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
                <h4 className="text-sm font-medium mb-2">Status History</h4>
                <ul className="space-y-3 max-h-40 overflow-y-auto">
                  {order.statuses.map(status => (
                    <li key={status.id} className="text-sm border-l-2 border-primary-500 pl-3">
                      <div className="flex items-center">
                        <StatusBadge status={status.status} />
                        <span className="ml-2 text-gray-500 dark:text-gray-400">
                          {new Date(status.location_timestamp).toLocaleString()}
                        </span>
                      </div>
                      {status.current_location && (
                        <p className="text-xs mt-1">Location: {status.current_location}</p>
                      )}
                      {status.remarks && (
                        <p className="text-xs mt-1">Note: {status.remarks}</p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
        
        <div className="flex justify-end space-x-3">
          <button 
            type="button"
            onClick={onClose} 
            className="button-outline"
            disabled={loading}
          >
            Cancel
          </button>
          <button 
            type="submit"
            className="button-primary"
            disabled={loading}
          >
            {loading ? (
              <div className="inline-block animate-spin rounded-full h-5 w-5 border-t-2 border-white"></div>
            ) : (
              'Update Status'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default OrderStatusUpdateForm; 