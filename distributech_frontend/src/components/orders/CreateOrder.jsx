import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

const CreateOrder = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [items, setItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  useEffect(() => {
    fetchItems();
  }, []);
  
  const fetchItems = async () => {
    try {
      setLoading(true);
      // Use the public items endpoint
      const response = await axios.get(`${API_URL}/public/items/`);
      const itemsData = response.data;
      
      // Use public stock endpoint instead of authenticated one
      const stockResponse = await axios.get(`${API_URL}/public/stock/`);
      const stockData = stockResponse.data;
      
      // Combine item and stock data
      const itemsWithStock = itemsData.map(item => {
        const stockInfo = stockData.find(stock => stock.item.id === item.id);
        return {
          ...item,
          currentStock: stockInfo ? stockInfo.current_stock : 0,
          minimumThreshold: stockInfo ? stockInfo.minimum_threshold : 0,
        };
      });
      
      setItems(itemsWithStock);
    } catch (error) {
      console.error('Error fetching items:', error);
      setError('Failed to load inventory items. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddItem = (item) => {
    // Check if item is already in the order
    if (selectedItems.some(selectedItem => selectedItem.id === item.id)) {
      // Update quantity if already in order
      setSelectedItems(prevItems => 
        prevItems.map(selectedItem => 
          selectedItem.id === item.id 
            ? { ...selectedItem, quantity: selectedItem.quantity + 1 } 
            : selectedItem
        )
      );
    } else {
      // Add new item with quantity 1
      setSelectedItems(prevItems => [
        ...prevItems, 
        { 
          ...item, 
          quantity: 1,
          price_at_order_time: item.price
        }
      ]);
    }
  };
  
  const handleRemoveItem = (itemId) => {
    setSelectedItems(prevItems => prevItems.filter(item => item.id !== itemId));
  };
  
  const handleQuantityChange = (itemId, quantity) => {
    // Don't allow negative or zero quantities
    if (quantity <= 0) return;
    
    // Don't allow ordering more than available stock
    const item = items.find(item => item.id === itemId);
    if (item && quantity > item.currentStock) {
      setError(`Only ${item.currentStock} units of ${item.name} available in stock.`);
      return;
    }
    
    setSelectedItems(prevItems => 
      prevItems.map(item => 
        item.id === itemId 
          ? { ...item, quantity } 
          : item
      )
    );
    
    // Clear any previous error
    setError(null);
  };
  
  const calculateTotal = () => {
    return selectedItems.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2);
  };
  
  const handleSubmitOrder = async () => {
    if (selectedItems.length === 0) {
      setError('Please add at least one item to your order.');
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      // Step 1: Create the order first - using the regular endpoint for now
      // since we want to maintain user association
      const orderResponse = await axios.post(`${API_URL}/orders/`, {
        user_id: user.id,
        status: 'Pending'
      });
      
      const orderId = orderResponse.data.id;
      
      // Step 2: Add order items
      const orderItemPromises = selectedItems.map(item => 
        axios.post(`${API_URL}/order-items/`, {
          order: orderId,
          item_id: item.id,
          quantity: item.quantity,
          price_at_order_time: item.price
        })
      );
      
      await Promise.all(orderItemPromises);
      
      // Step 3: Create initial order status - but don't fail the entire process if this step fails
      try {
        await axios.post(`${API_URL}/order-status/`, {
          order: orderId,
          status: 'Pending',
          location_timestamp: new Date().toISOString(),
          remarks: 'Order created',
          expected_delivery_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 7 days from now
        });
      } catch (statusError) {
        // Log the error but continue with order creation
        console.warn('Could not create order status:', statusError);
      }
      
      // Mark as success regardless of order status creation
      setSuccess(true);
      
      // Clear selected items
      setSelectedItems([]);
      
      // Navigate back to orders list after a short delay
      setTimeout(() => {
        navigate('/orders?refresh=true');
      }, 2000);
      
    } catch (error) {
      console.error('Error creating order:', error);
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          'An error occurred while creating your order. Please try again.';
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-8">Create New Order</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
          <div className="flex">
            <div className="py-1">
              <svg className="fill-current h-6 w-6 text-green-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zm12.73-1.41A8 8 0 1 0 4.34 4.34a8 8 0 0 0 11.32 11.32zM9 11V9h2v6H9v-4zm0-6h2v2H9V5z"/>
              </svg>
            </div>
            <div>
              <p className="font-bold">Order created successfully!</p>
              <p className="text-sm">An email notification has been sent to the relevant departments. Redirecting to orders list...</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Available Items */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Available Items</h2>
            
            {loading ? (
              <div className="animate-pulse">
                {[...Array(5)].map((_, index) => (
                  <div key={index} className="border-b border-gray-200 dark:border-gray-700 py-4">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {items.map(item => (
                  <div key={item.id} className="py-4 flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-medium text-gray-800 dark:text-white">{item.name}</h3>
                      <p className="text-gray-600 dark:text-gray-300">{item.description}</p>
                      <div className="flex items-center mt-1">
                        <span className="text-gray-500 dark:text-gray-400 text-sm mr-4">Price: ${item.price}</span>
                        <span className={`text-sm ${item.currentStock > item.minimumThreshold ? 'text-green-600' : 'text-red-600'}`}>
                          In stock: {item.currentStock} {item.measurement_unit}
                        </span>
                      </div>
                    </div>
                    <button 
                      className="button-outline flex items-center"
                      onClick={() => handleAddItem(item)}
                      disabled={item.currentStock === 0}
                    >
                      {item.currentStock === 0 ? 'Out of Stock' : 'Add to Order'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 sticky top-4">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Order Summary</h2>
            
            {selectedItems.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">No items added yet.</p>
            ) : (
              <>
                <div className="divide-y divide-gray-200 dark:divide-gray-700 mb-6">
                  {selectedItems.map(item => (
                    <div key={item.id} className="py-3">
                      <div className="flex justify-between">
                        <span className="font-medium">{item.name}</span>
                        <button 
                          className="text-red-600 hover:text-red-800"
                          onClick={() => handleRemoveItem(item.id)}
                        >
                          Remove
                        </button>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <div className="flex items-center">
                          <button 
                            className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center"
                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                          >
                            -
                          </button>
                          <span className="mx-3">{item.quantity}</span>
                          <button 
                            className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center"
                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                          >
                            +
                          </button>
                        </div>
                        <span>${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-6">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span>${calculateTotal()}</span>
                  </div>
                </div>
              </>
            )}
            
            <button 
              className="w-full button-primary py-3 flex justify-center items-center"
              onClick={handleSubmitOrder}
              disabled={selectedItems.length === 0 || submitting || success}
            >
              {submitting ? (
                <div className="inline-block animate-spin rounded-full h-5 w-5 border-t-2 border-white"></div>
              ) : (
                'Submit Order'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateOrder; 