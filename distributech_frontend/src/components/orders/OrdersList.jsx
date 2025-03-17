import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const API_URL = 'http://localhost:8000/api';

const OrderStatusBadge = ({ status }) => {
  let color;
  
  switch (status) {
    case 'Pending':
      color = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      break;
    case 'Processing':
      color = 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      break;
    case 'Shipped':
    case 'In Transit':
      color = 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300';
      break;
    case 'Delivered':
    case 'Completed':
      color = 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      break;
    case 'Cancelled':
      color = 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      break;
    default:
      color = 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
  }
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>
      {status}
    </span>
  );
};

const OrdersList = () => {
  const { user, token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  
  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      // Build query parameters
      let url = `${API_URL}/orders/`;
      const params = new URLSearchParams();
      
      // Apply status filter if not 'all'
      if (filter !== 'all') {
        params.append('status', filter);
      }
      
      // Add search query
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      
      // Add a cache-busting parameter to force a fresh request
      params.append('_t', Date.now());
      
      // For Department Managers, we rely on the backend's filtering by user department
      
      // Add params to URL if any exist
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const ordersData = response.data.results || response.data;
      
      // Set basic orders data immediately to ensure we at least show the orders
      setOrders(ordersData);
      
      // Then try to fetch additional details in the background
      try {
        // Fetch latest status for each order
        const ordersWithDetails = await Promise.all(
          ordersData.map(async (order) => {
            try {
              // Try to get status
              let latestStatus = null;
              try {
                const statusResponse = await axios.get(
                  `${API_URL}/order-status/?order=${order.id}&limit=1`,
                  { headers: { Authorization: `Bearer ${token}` } }
                );
                latestStatus = statusResponse.data.results?.[0] || null;
              } catch (statusErr) {
                console.log(`Could not fetch status for order ${order.id}:`, statusErr);
              }
              
              // Try to get user details
              let userDetails = null;
              try {
                if (order.user && order.user.id) {
                  const userResponse = await axios.get(
                    `${API_URL}/users/${order.user.id}/`,
                    { headers: { Authorization: `Bearer ${token}` } }
                  );
                  userDetails = userResponse.data;
                }
              } catch (userErr) {
                console.log(`Could not fetch user details for order ${order.id}:`, userErr);
              }
              
              return {
                ...order,
                latestStatus,
                userDetails
              };
            } catch (err) {
              console.error(`Error fetching details for order ${order.id}:`, err);
              return order;
            }
          })
        );
        
        // Update orders with detailed information if successful
        setOrders(ordersWithDetails);
      } catch (detailsError) {
        console.error("Error fetching order details, but basic orders are still available:", detailsError);
        // We don't set an error here because we still have the basic orders data
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load orders. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  // Effect to fetch orders when dependencies change
  useEffect(() => {
    fetchOrders();
  }, [token, filter, searchQuery, lastRefresh]);
  
  const handleRefresh = () => {
    setLastRefresh(Date.now());
  };

  const handleFilterChange = (e) => {
    setFilter(e.target.value);
  };
  
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };
  
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    // The fetchOrders effect will run automatically when searchQuery changes
  };
  
  // Check if we're coming from the create order page
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('refresh') === 'true') {
      // Clear the URL parameter
      window.history.replaceState({}, document.title, window.location.pathname);
      // Refresh the orders list
      handleRefresh();
    }
  }, []);
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text">Orders</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              View and track all orders in the system.
            </p>
          </div>
          
          <div className="flex gap-2 mt-4 md:mt-0">
            <button 
              onClick={handleRefresh}
              className="button-outline inline-flex items-center"
              disabled={loading}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
            
            {(user?.role?.name === 'Department Manager' || user?.role?.name === 'SuperAdmin') && (
              <Link
                to="/orders/new"
                className="button-primary inline-flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create New Order
              </Link>
            )}
          </div>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}
        
        {/* Filters and Search */}
        <div className="card mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div>
                <label htmlFor="statusFilter" className="form-label">Filter by Status</label>
                <select
                  id="statusFilter"
                  className="form-input"
                  value={filter}
                  onChange={handleFilterChange}
                >
                  <option value="all">All Orders</option>
                  <option value="Pending">Pending</option>
                  <option value="Processing">Processing</option>
                  <option value="Shipped">Shipped</option>
                  <option value="In Transit">In Transit</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            
            <form onSubmit={handleSearchSubmit} className="flex gap-2">
              <div className="flex-grow">
                <label htmlFor="search" className="form-label">Search Orders</label>
                <input
                  id="search"
                  type="text"
                  className="form-input"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
              </div>
              <button
                type="submit"
                className="button-primary self-end"
              >
                Search
              </button>
            </form>
          </div>
        </div>
        
        {/* Orders Table */}
        <div className="card overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p>No orders found</p>
              <p className="mt-2 text-sm">Try changing your filters or create a new order</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 dark:bg-gray-700">
                  <tr>
                    <th className="py-3 px-4 text-left">Order ID</th>
                    <th className="py-3 px-4 text-left">Created By</th>
                    <th className="py-3 px-4 text-left">Department</th>
                    <th className="py-3 px-4 text-left">Date</th>
                    <th className="py-3 px-4 text-left">Status</th>
                    <th className="py-3 px-4 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                  {orders.map(order => (
                    <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="py-3 px-4 font-medium">#{order.id}</td>
                      <td className="py-3 px-4">
                        {order.userDetails?.username || order.user?.username || 'Unknown'}
                      </td>
                      <td className="py-3 px-4">
                        {order.userDetails?.department?.name || order.user?.department?.name || 'Unknown'}
                      </td>
                      <td className="py-3 px-4">
                        {order.created_at ? new Date(order.created_at).toLocaleDateString() : 'Unknown date'}
                      </td>
                      <td className="py-3 px-4">
                        <OrderStatusBadge status={order.status || 'Unknown'} />
                      </td>
                      <td className="py-3 px-4">
                        <button className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 mr-3">
                          View
                        </button>
                        {user?.role?.name === 'Warehouse Manager' && (
                          <button className="text-secondary-600 hover:text-secondary-800 dark:text-secondary-400 dark:hover:text-secondary-300">
                            Update
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default OrdersList; 