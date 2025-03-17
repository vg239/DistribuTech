import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

const DashboardCard = ({ title, value, icon, gradient = 'from-primary-500 to-primary-700' }) => (
  <motion.div
    whileHover={{ scale: 1.03 }}
    className="card overflow-hidden"
  >
    <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-10 rounded-xl`}></div>
    <div className="flex justify-between items-center">
      <div>
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">{title}</h3>
        <p className="text-2xl font-bold mt-2">{value}</p>
      </div>
      <div className="text-primary-600 dark:text-primary-400">
        {icon}
      </div>
    </div>
  </motion.div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    pendingOrders: 0,
    totalOrders: 0,
    lowStockItems: 0,
    recentComments: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // These would be actual API endpoints in a real application
        const ordersResponse = await axios.get(`${API_URL}/orders/?limit=1`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        
        const pendingOrdersResponse = await axios.get(`${API_URL}/orders/?status=Pending&limit=1`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        
        // Mock data for now
        setStats({
          pendingOrders: pendingOrdersResponse.data.count || 5,
          totalOrders: ordersResponse.data.count || 20,
          lowStockItems: 3,
          recentComments: 8,
        });
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  // Determine welcome message based on time of day
  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold gradient-text">
            {getWelcomeMessage()}, {user?.username || 'User'}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Welcome to your DistribuTech dashboard. Here's what's happening today.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-100 text-red-700 p-4 rounded-lg">{error}</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <DashboardCard
                title="Pending Orders"
                value={stats.pendingOrders}
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                }
                gradient="from-yellow-500 to-yellow-700"
              />
              
              <DashboardCard
                title="Total Orders"
                value={stats.totalOrders}
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                }
                gradient="from-primary-500 to-primary-700"
              />
              
              <DashboardCard
                title="Low Stock Items"
                value={stats.lowStockItems}
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                }
                gradient="from-red-500 to-red-700"
              />
              
              <DashboardCard
                title="Recent Comments"
                value={stats.recentComments}
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                }
                gradient="from-green-500 to-green-700"
              />
            </div>

            {/* Role specific sections */}
            {user?.role?.name === 'SuperAdmin' && (
              <div className="card mb-8">
                <h2 className="text-xl font-semibold mb-4">Administration Tools</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button className="button-primary">Manage Users</button>
                  <button className="button-primary">System Settings</button>
                  <button className="button-primary">Roles and Permissions</button>
                  <button className="button-primary">Audit Logs</button>
                </div>
              </div>
            )}

            {(user?.role?.name === 'Warehouse Manager' || user?.role?.name === 'SuperAdmin') && (
              <div className="card mb-8">
                <h2 className="text-xl font-semibold mb-4">Inventory Management</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button className="button-primary">Add Stock</button>
                  <button className="button-primary">Check Low Stock</button>
                  <button className="button-primary">Update Inventory</button>
                  <button className="button-primary">Stock Reports</button>
                </div>
              </div>
            )}

            {(user?.role?.name === 'Department Manager' || user?.role?.name === 'SuperAdmin') && (
              <div className="card mb-8">
                <h2 className="text-xl font-semibold mb-4">Order Management</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button className="button-primary">Create New Order</button>
                  <button className="button-primary">View My Department Orders</button>
                  <button className="button-primary">Track Order Status</button>
                  <button className="button-primary">Order History</button>
                </div>
              </div>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
};

export default Dashboard; 