import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import OrderStatusUpdateForm from './OrderStatusUpdateForm';

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
  const { user } = useAuth(); // No need for token anymore
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetailModalOpen, setOrderDetailModalOpen] = useState(false);
  const [statusUpdateFormOpen, setStatusUpdateFormOpen] = useState(false);
  const [statusUpdateSuccess, setStatusUpdateSuccess] = useState(false);
  const [updateButtonLoading, setUpdateButtonLoading] = useState(false);
  
  // Check if user is admin (admin123 username or Administrator role)
  const isAdmin = user?.username === 'admin123' || user?.role?.name === 'Administrator';
  
  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      // Use the public orders endpoint that doesn't require authentication
      const response = await axios.get(`${API_URL}/public/orders/`);
      
      // Get orders from response
      const ordersData = response.data;
      
      // Filter orders client-side based on status if filter is set
      let filteredOrders = ordersData;
      if (filter !== 'all') {
        filteredOrders = ordersData.filter(order => order.status === filter);
      }
      
      // Filter by search query if present (case insensitive search on order ID and status)
      if (searchQuery) {
        const lowerQuery = searchQuery.toLowerCase();
        filteredOrders = filteredOrders.filter(order => 
          String(order.id).includes(lowerQuery) || 
          order.status.toLowerCase().includes(lowerQuery)
        );
      }
      
      // For each order, fetch the latest status
      const ordersWithLatestStatus = await Promise.all(
        filteredOrders.map(async (order) => {
          try {
            // Get the latest status
            const statusResponse = await axios.get(`${API_URL}/public/order-status/?order=${order.id}`);
            const statuses = statusResponse.data;
            const latestStatus = statuses.length > 0 ? statuses[0] : null;
            
            // Get order items
            const itemsResponse = await axios.get(`${API_URL}/public/order-items/?order=${order.id}`);
            const orderItems = itemsResponse.data;
            
            return {
              ...order,
              latestStatus,
              items: orderItems
            };
          } catch (error) {
            console.error(`Error fetching details for order ${order.id}:`, error);
            return order;
          }
        })
      );
      
      // Set the enhanced orders
      setOrders(ordersWithLatestStatus);
      
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
  }, [filter, searchQuery, lastRefresh]);
  
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
  
  const handleViewOrder = async (orderId) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/public/orders/${orderId}/`);
      setSelectedOrder(response.data);
      setOrderDetailModalOpen(true);
    } catch (error) {
      console.error(`Error fetching order details for order ${orderId}:`, error);
      setError('Failed to load order details. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle clicking "Update Status" from the table row
  const handleUpdateStatusFromTable = async (orderId) => {
    setUpdateButtonLoading(true);
    try {
      await handleViewOrder(orderId);
      // Wait a moment for the modal to open and render
      setTimeout(() => {
        openStatusUpdateForm();
        setUpdateButtonLoading(false);
      }, 500);
    } catch (error) {
      setUpdateButtonLoading(false);
      setError('Failed to load order details for update. Please try again.');
    }
  };
  
  const closeOrderDetailModal = () => {
    setOrderDetailModalOpen(false);
    setSelectedOrder(null);
    setStatusUpdateFormOpen(false);
    
    // If we had a successful status update, refresh the orders list
    if (statusUpdateSuccess) {
      setStatusUpdateSuccess(false);
      handleRefresh();
    }
  };
  
  const openStatusUpdateForm = () => {
    setStatusUpdateFormOpen(true);
  };
  
  const closeStatusUpdateForm = () => {
    setStatusUpdateFormOpen(false);
  };
  
  const handleStatusUpdated = (updatedStatus) => {
    // Update the selected order with the new status
    if (selectedOrder) {
      setSelectedOrder(prev => ({
        ...prev,
        status: updatedStatus.status,
        statuses: [updatedStatus, ...(prev.statuses || [])]
      }));
      
      // Also update the order in the main list
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === selectedOrder.id 
            ? { ...order, status: updatedStatus.status }
            : order
        )
      );
      
      // Set status update success flag
      setStatusUpdateSuccess(true);
      
      // Reset the form state
      setStatusUpdateFormOpen(false);
    }
  };
  
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
        
        {statusUpdateSuccess && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
            Order status has been updated successfully. Email notification has been sent.
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
                    <th className="py-3 px-4 text-left">Items</th>
                    <th className="py-3 px-4 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                  {orders.map(order => (
                    <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="py-3 px-4 font-medium">#{order.id}</td>
                      <td className="py-3 px-4">
                        {order.user?.username || 'Unknown'}
                      </td>
                      <td className="py-3 px-4">
                        {order.user?.department?.name || 'Unknown'}
                      </td>
                      <td className="py-3 px-4">
                        {order.created_at ? new Date(order.created_at).toLocaleDateString() : 'Unknown date'}
                      </td>
                      <td className="py-3 px-4">
                        <OrderStatusBadge status={order.status || 'Unknown'} />
                      </td>
                      <td className="py-3 px-4">
                        {order.items?.length || order.order_items?.length || 0} items
                      </td>
                      <td className="py-3 px-4">
                        <button 
                          className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 mr-3"
                          onClick={() => handleViewOrder(order.id)}
                          disabled={loading || updateButtonLoading}
                        >
                          View
                        </button>
                        {isAdmin && (
                          <button 
                            className="text-secondary-600 hover:text-secondary-800 dark:text-secondary-400 dark:hover:text-secondary-300 inline-flex items-center"
                            onClick={() => handleUpdateStatusFromTable(order.id)}
                            disabled={loading || updateButtonLoading}
                          >
                            {updateButtonLoading ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-secondary-600 mr-1"></div>
                                <span>Updating...</span>
                              </>
                            ) : (
                              'Update Status'
                            )}
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
        
        {/* Order Detail Modal */}
        {orderDetailModalOpen && selectedOrder && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
              {statusUpdateFormOpen ? (
                <OrderStatusUpdateForm 
                  order={selectedOrder} 
                  onStatusUpdated={handleStatusUpdated}
                  onClose={closeStatusUpdateForm}
                />
              ) : (
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold gradient-text">Order #{selectedOrder.id}</h2>
                    <div className="flex items-center">
                      {isAdmin && (
                        <button 
                          onClick={openStatusUpdateForm}
                          className="text-secondary-600 hover:text-secondary-800 dark:text-secondary-400 dark:hover:text-secondary-300 mr-4 inline-flex items-center"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Update Status
                        </button>
                      )}
                      <button 
                        onClick={closeOrderDetailModal}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  {statusUpdateSuccess && (
                    <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                      Order status has been updated successfully. Email notification has been sent.
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">Order Information</h3>
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <p className="mb-1"><span className="font-medium">Status:</span> <OrderStatusBadge status={selectedOrder.status} /></p>
                        <p className="mb-1"><span className="font-medium">Created:</span> {new Date(selectedOrder.created_at).toLocaleString()}</p>
                        <p className="mb-1"><span className="font-medium">Last Updated:</span> {new Date(selectedOrder.updated_at).toLocaleString()}</p>
                        <p className="mb-1"><span className="font-medium">Total:</span> ${selectedOrder.total.toFixed(2)}</p>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">Customer Information</h3>
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <p className="mb-1"><span className="font-medium">Name:</span> {selectedOrder.user.username}</p>
                        <p className="mb-1"><span className="font-medium">Email:</span> {selectedOrder.user.email}</p>
                        <p className="mb-1"><span className="font-medium">Department:</span> {selectedOrder.user.department.name}</p>
                      </div>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">Order Items</h3>
                  <div className="overflow-x-auto bg-gray-50 dark:bg-gray-700 rounded-lg mb-6">
                    <table className="w-full">
                      <thead className="bg-gray-100 dark:bg-gray-600">
                        <tr>
                          <th className="py-2 px-4 text-left">Item</th>
                          <th className="py-2 px-4 text-left">Quantity</th>
                          <th className="py-2 px-4 text-left">Unit Price</th>
                          <th className="py-2 px-4 text-left">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                        {selectedOrder.items.map(item => (
                          <tr key={item.id}>
                            <td className="py-2 px-4">
                              <div>
                                <div className="font-medium">{item.item.name}</div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">{item.item.description}</div>
                              </div>
                            </td>
                            <td className="py-2 px-4">{item.quantity} {item.item.measurement_unit || 'units'}</td>
                            <td className="py-2 px-4">${item.price_at_order_time.toFixed(2)}</td>
                            <td className="py-2 px-4">${item.total.toFixed(2)}</td>
                          </tr>
                        ))}
                        <tr className="bg-gray-100 dark:bg-gray-600">
                          <td colSpan="3" className="py-2 px-4 text-right font-bold">Total:</td>
                          <td className="py-2 px-4 font-bold">${selectedOrder.total.toFixed(2)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  
                  {selectedOrder.statuses.length > 0 && (
                    <>
                      <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">Order Status History</h3>
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                        <ul className="space-y-3">
                          {selectedOrder.statuses.map(status => (
                            <li key={status.id} className="border-l-2 border-primary-500 pl-4">
                              <div className="font-medium"><OrderStatusBadge status={status.status} /></div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {new Date(status.location_timestamp).toLocaleString()}
                                {status.updated_by && ` by ${status.updated_by}`}
                              </div>
                              {status.remarks && <div className="mt-1">{status.remarks}</div>}
                              {status.expected_delivery_date && (
                                <div className="mt-1 text-sm">
                                  Expected delivery: {new Date(status.expected_delivery_date).toLocaleDateString()}
                                </div>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </>
                  )}
                  
                  {selectedOrder.comments.length > 0 && (
                    <>
                      <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">Comments</h3>
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                        <ul className="space-y-3">
                          {selectedOrder.comments.map(comment => (
                            <li key={comment.id} className="border-l-2 border-secondary-500 pl-4">
                              <div className="font-medium">{comment.user.username}</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {new Date(comment.created_at).toLocaleString()}
                              </div>
                              <div className="mt-1">{comment.comment_text}</div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </>
                  )}
                  
                  <div className="flex justify-end space-x-3">
                    <button 
                      onClick={closeOrderDetailModal} 
                      className="button-outline"
                    >
                      Close
                    </button>
                    <button 
                      className="button-primary"
                      onClick={() => window.print()}
                    >
                      Print Order
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default OrdersList; 