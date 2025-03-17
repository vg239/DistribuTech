import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';

// Memoed dashboard card to prevent unnecessary re-renders
const DashboardCard = React.memo(({ title, value, icon, gradient = 'from-primary-500 to-primary-700' }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden"
  >
    <div className={`h-2 bg-gradient-to-r ${gradient}`}></div>
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">{title}</h3>
          <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{value}</p>
        </div>
        <div className="text-primary-600 dark:text-primary-400">
          {icon}
        </div>
      </div>
    </div>
  </motion.div>
));

const StableDashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    orders: 0,
    pendingOrders: 0,
    inventory: 0,
    lowStockItems: 0
  });
  const [loading, setLoading] = useState(true);
  
  // Memoize the API call function to prevent recreation on every render
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Simulate API call delay - replace with real API calls
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock data - replace with actual API calls
      setDashboardData({
        orders: 42,
        pendingOrders: 7,
        inventory: 156,
        lowStockItems: 12
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Only fetch data once when component mounts
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);
  
  // Memoize welcome message to prevent recalculation
  const welcomeMessage = useMemo(() => {
    const hour = new Date().getHours();
    let greeting = '';
    
    if (hour < 12) {
      greeting = 'Good morning';
    } else if (hour < 18) {
      greeting = 'Good afternoon';
    } else {
      greeting = 'Good evening';
    }
    
    return `${greeting}, ${user?.user_info?.first_name || 'User'}!`;
  }, [user?.user_info?.first_name]);

  // Use container with fixed height to prevent layout shifts
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-8">{welcomeMessage}</h1>
      
      {loading ? (
        // Placeholder with same dimensions to prevent layout shifts
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-md h-[110px] animate-pulse">
              <div className="h-2 bg-gray-200 dark:bg-gray-700"></div>
              <div className="p-6">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <DashboardCard
            title="Total Orders"
            value={dashboardData.orders}
            icon={
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            }
          />
          <DashboardCard
            title="Pending Orders"
            value={dashboardData.pendingOrders}
            gradient="from-yellow-500 to-yellow-700"
            icon={
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <DashboardCard
            title="Inventory Items"
            value={dashboardData.inventory}
            gradient="from-secondary-500 to-secondary-700"
            icon={
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            }
          />
          <DashboardCard
            title="Low Stock Items"
            value={dashboardData.lowStockItems}
            gradient="from-red-500 to-red-700"
            icon={
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            }
          />
        </div>
      )}
      
      {/* Recent Activity Section */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Recent Activity</h2>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {loading ? (
              // Activity placeholders with fixed dimensions
              [...Array(3)].map((_, index) => (
                <div key={index} className="py-4 animate-pulse">
                  <div className="flex justify-between">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                  </div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mt-2"></div>
                </div>
              ))
            ) : (
              <>
                <div className="py-4">
                  <div className="flex justify-between">
                    <span className="font-medium">New order #1089</span>
                    <span className="text-gray-500 dark:text-gray-400 text-sm">Today, 10:30 AM</span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">Order created by Department Manager</p>
                </div>
                <div className="py-4">
                  <div className="flex justify-between">
                    <span className="font-medium">Stock update</span>
                    <span className="text-gray-500 dark:text-gray-400 text-sm">Yesterday, 2:15 PM</span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">Warehouse Manager updated inventory levels</p>
                </div>
                <div className="py-4">
                  <div className="flex justify-between">
                    <span className="font-medium">Order #1088 completed</span>
                    <span className="text-gray-500 dark:text-gray-400 text-sm">Yesterday, 11:45 AM</span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">Department Manager marked order as received</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Low Stock Alerts Section - only visible to Warehouse Manager and Admin roles */}
      {user?.role?.name === 'Warehouse Manager' || 
       user?.role?.name === 'SuperAdmin' || 
       user?.role?.name === 'Administrator' ? (
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Low Stock Alerts</h2>
        </div>
      ) : null}
    </div>
  );
};

export default StableDashboard; 