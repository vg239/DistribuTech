import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import ItemDetailForm from './ItemDetailForm';

const API_URL = 'http://localhost:8000/api';

const InventoryManagement = () => {
  const { user } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [itemForm, setItemForm] = useState({ name: '', description: '', measurement_unit: '', price: 0 });
  const [stockForm, setStockForm] = useState({ current_stock: 0, minimum_threshold: 0 });
  
  // States for filtering and search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  
  // New state for item detail modal
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  
  // New state for loading details
  const [loadingItemId, setLoadingItemId] = useState(null);
  
  // Add success message state
  const [successMessage, setSuccessMessage] = useState(null);
  
  // Add state for stock alert form and status
  const [alertEmail, setAlertEmail] = useState('');
  const [alertLoading, setAlertLoading] = useState(false);
  const [alertResponse, setAlertResponse] = useState(null);
  
  useEffect(() => {
    fetchInventory();
  }, []);
  
  const fetchInventory = async () => {
    try {
      setLoading(true);
      console.log('Fetching inventory data...');
      
      // Use public endpoints for both items and stock
      const itemsResponse = await axios.get(`${API_URL}/public/items/`);
      console.log('Items data received:', itemsResponse.data);
      
      const stockResponse = await axios.get(`${API_URL}/public/stock/`);
      console.log('Stock data received:', stockResponse.data);
      
      // Combine item and stock data
      const combinedInventory = itemsResponse.data.map(item => {
        // Find corresponding stock data for this item
        const stockItem = stockResponse.data.find(stock => stock.item.id === item.id);
        
        return {
          ...item,
          stock: stockItem ? {
            id: stockItem.id,
            current_stock: stockItem.current_stock,
            minimum_threshold: stockItem.minimum_threshold,
            supplier: stockItem.supplier
          } : null
        };
      });
      
      console.log('Combined inventory data:', combinedInventory);
      setInventory(combinedInventory);
    } catch (err) {
      console.error('Error fetching inventory:', err);
      setError('Failed to load inventory data. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Apply filters, search, and sorting to inventory data
  const getFilteredInventory = () => {
    console.log('Applying filters, search and sorting...');
    let result = [...inventory];
    
    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(item => 
        item.name.toLowerCase().includes(query) || 
        item.description.toLowerCase().includes(query)
      );
    }
    
    // Apply low stock filter
    if (filterLowStock) {
      result = result.filter(item => 
        item.stock && item.stock.current_stock <= item.stock.minimum_threshold
      );
    }
    
    // Apply sorting
    result.sort((a, b) => {
      // Handle null stock values
      if (sortBy.startsWith('stock.') && (!a.stock || !b.stock)) {
        return !a.stock ? 1 : -1;
      }
      
      let aValue, bValue;
      
      if (sortBy === 'name') {
        aValue = a.name;
        bValue = b.name;
      } else if (sortBy === 'price') {
        aValue = parseFloat(a.price);
        bValue = parseFloat(b.price);
      } else if (sortBy === 'stock.current_stock') {
        aValue = a.stock ? a.stock.current_stock : 0;
        bValue = b.stock ? b.stock.current_stock : 0;
      } else if (sortBy === 'stock.minimum_threshold') {
        aValue = a.stock ? a.stock.minimum_threshold : 0;
        bValue = b.stock ? b.stock.minimum_threshold : 0;
      }
      
      // Perform the actual comparison
      if (typeof aValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue) 
          : bValue.localeCompare(aValue);
      } else {
        return sortOrder === 'asc' 
          ? aValue - bValue 
          : bValue - aValue;
      }
    });
    
    console.log('Filtered inventory:', result);
    return result;
  };
  
  // Handle different form actions
  const handleEditItem = (item) => {
    console.log('Editing item:', item);
    setCurrentItem(item);
    setItemForm({
      name: item.name,
      description: item.description,
      measurement_unit: item.measurement_unit || '',
      price: item.price
    });
    
    if (item.stock) {
      setStockForm({
        current_stock: item.stock.current_stock,
        minimum_threshold: item.stock.minimum_threshold
      });
    } else {
      setStockForm({ current_stock: 0, minimum_threshold: 0 });
    }
    
    setIsEditing(true);
    setIsAdding(false);
  };
  
  const handleAddNewItem = () => {
    console.log('Adding new item');
    setCurrentItem(null);
    setItemForm({
      name: '',
      description: '',
      measurement_unit: '',
      price: 0
    });
    
    setStockForm({
      current_stock: 0,
      minimum_threshold: 0
    });
    
    setIsAdding(true);
    setIsEditing(false);
  };
  
  const handleCancelEdit = () => {
    console.log('Canceling edit/add');
    setIsEditing(false);
    setIsAdding(false);
    setCurrentItem(null);
  };
  
  const handleItemFormChange = (e) => {
    const { name, value } = e.target;
    setItemForm({
      ...itemForm,
      [name]: name === 'price' ? parseFloat(value) : value
    });
  };
  
  const handleStockFormChange = (e) => {
    const { name, value } = e.target;
    setStockForm({
      ...stockForm,
      [name]: parseInt(value, 10)
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      if (isAdding) {
        console.log('Submitting new item:', { item: itemForm, stock: stockForm });
        
        // First create the item
        const itemResponse = await axios.post(`${API_URL}/items/`, {
          name: itemForm.name,
          description: itemForm.description,
          measurement_unit: itemForm.measurement_unit,
          price: itemForm.price
        });
        
        console.log('Item created:', itemResponse.data);
        
        // Then create the stock for this item
        const stockResponse = await axios.post(`${API_URL}/stock/`, {
          item: itemResponse.data.id,
          current_stock: stockForm.current_stock,
          minimum_threshold: stockForm.minimum_threshold
        });
        
        console.log('Stock created:', stockResponse.data);
        
        // After successful API calls, refresh the inventory
        setIsAdding(false);
        setSuccessMessage(`Item "${itemResponse.data.name}" added successfully!`);
        
        // Clear success message after 5 seconds
        setTimeout(() => {
          setSuccessMessage(null);
        }, 5000);
        
        fetchInventory();
      }
    } catch (err) {
      console.error('Error submitting item:', err);
      setError(err.response?.data?.detail || 'Failed to create item. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Filter and search handlers
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };
  
  const handleToggleLowStock = () => {
    setFilterLowStock(!filterLowStock);
  };
  
  const handleSortChange = (field) => {
    if (sortBy === field) {
      // If already sorting by this field, toggle the order
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // If sorting by a new field, default to ascending
      setSortBy(field);
      setSortOrder('asc');
    }
  };
  
  // New function to view item details
  const handleViewDetails = async (item) => {
    console.log('Viewing details for item:', item);
    setLoadingItemId(item.id);
    
    try {
      // Fetch the latest item data to ensure we have the most current information
      const itemResponse = await axios.get(`${API_URL}/public/items/${item.id}/`);
      let stockData = null;
      
      if (item.stock) {
        const stockResponse = await axios.get(`${API_URL}/public/stock/${item.stock.id}/`);
        stockData = stockResponse.data;
      }
      
      setSelectedItem({
        ...itemResponse.data,
        stock: stockData
      });
      
      setDetailModalOpen(true);
    } catch (err) {
      console.error('Error fetching item details:', err);
      setError('Failed to load item details. Please try again.');
    } finally {
      setLoadingItemId(null);
    }
  };
  
  const handleItemUpdate = (updatedData) => {
    console.log('Item updated:', updatedData);
    
    // Update the item in the inventory array
    const updatedInventory = inventory.map(item => {
      if (item.id === updatedData.item.id) {
        return {
          ...updatedData.item,
          stock: updatedData.stock
        };
      }
      return item;
    });
    
    // Update the state
    setInventory(updatedInventory);
    setIsEditing(false);
    setCurrentItem(null);
  };
  
  // Add function to handle sending stock alerts
  const handleSendAlert = async (stockId) => {
    setAlertLoading(true);
    setAlertResponse(null);
    
    try {
      const response = await axios.post(`${API_URL}/stock/${stockId}/alert/`, {
        email: alertEmail || undefined
      });
      
      setAlertResponse({
        success: true,
        message: response.data.message || 'Stock alert sent successfully!'
      });
    } catch (err) {
      setAlertResponse({
        success: false,
        message: err.response?.data?.message || 'Failed to send alert.'
      });
      console.error('Error sending stock alert:', err);
    } finally {
      setAlertLoading(false);
    }
  };
  
  // Get filtered inventory based on current filters
  const filteredInventory = getFilteredInventory();
  
  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text">Inventory Management</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Manage stock levels, item details, and inventory thresholds.
            </p>
          </div>
          
          {(user?.role?.name === 'Warehouse Manager' || user?.role?.name === 'SuperAdmin') && (
            <button 
              onClick={handleAddNewItem}
              className="button-primary mt-4 md:mt-0 inline-flex items-center"
              disabled={isEditing || isAdding}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add New Item
            </button>
          )}
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}
        
        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
            {successMessage}
          </div>
        )}
        
        {/* Filters and Search */}
        <div className="card mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div>
                <button
                  onClick={handleToggleLowStock}
                  className={`px-4 py-2 rounded-lg ${
                    filterLowStock 
                      ? 'bg-red-500 text-white' 
                      : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                  }`}
                >
                  {filterLowStock ? 'All Items' : 'Show Low Stock Only'}
                </button>
              </div>
            </div>
            
            <form className="flex gap-2">
              <div className="flex-grow">
                <input
                  type="text"
                  placeholder="Search items..."
                  className="form-input"
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
              </div>
              <button 
                type="button"
                onClick={fetchInventory}
                className="button-outline"
              >
                Refresh
              </button>
            </form>
          </div>
        </div>
        
        {/* Edit/Add Form - replaced with ItemDetailForm component when editing */}
        {isEditing && currentItem && currentItem.stock && (
          <div className="card mb-6">
            <ItemDetailForm 
              item={currentItem} 
              stock={currentItem.stock}
              onUpdate={handleItemUpdate}
              onClose={() => setIsEditing(false)}
            />
          </div>
        )}
        
        {/* Keep the original form only for adding new items */}
        {isAdding && (
          <div className="card mb-6">
            <h2 className="text-xl font-bold mb-4">Add New Item</h2>
            
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Item Details</h3>
                
                <div className="mb-4">
                  <label htmlFor="name" className="form-label">Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={itemForm.name}
                    onChange={handleItemFormChange}
                    className="form-input"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="description" className="form-label">Description</label>
                  <textarea
                    id="description"
                    name="description"
                    value={itemForm.description}
                    onChange={handleItemFormChange}
                    className="form-input"
                    rows="3"
                  ></textarea>
                </div>
                
                <div className="mb-4">
                  <label htmlFor="measurement_unit" className="form-label">Measurement Unit</label>
                  <input
                    type="text"
                    id="measurement_unit"
                    name="measurement_unit"
                    value={itemForm.measurement_unit}
                    onChange={handleItemFormChange}
                    className="form-input"
                    placeholder="e.g., kg, pcs, liters"
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="price" className="form-label">Price</label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={itemForm.price}
                    onChange={handleItemFormChange}
                    className="form-input"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-3">Stock Information</h3>
                
                <div className="mb-4">
                  <label htmlFor="current_stock" className="form-label">Current Stock</label>
                  <input
                    type="number"
                    id="current_stock"
                    name="current_stock"
                    value={stockForm.current_stock}
                    onChange={handleStockFormChange}
                    className="form-input"
                    min="0"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="minimum_threshold" className="form-label">Minimum Threshold</label>
                  <input
                    type="number"
                    id="minimum_threshold"
                    name="minimum_threshold"
                    value={stockForm.minimum_threshold}
                    onChange={handleStockFormChange}
                    className="form-input"
                    min="0"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Stock levels below this value will trigger low stock alerts.
                  </p>
                </div>
                
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="button-outline"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="button-primary"
                  >
                    Add Item
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
        
        {/* Inventory Table */}
        <div className="card">
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
          ) : filteredInventory.length === 0 ? (
            <div className="text-center py-12">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <h3 className="text-xl font-medium text-gray-500">No inventory items found</h3>
              <p className="text-gray-500 mt-2">
                {searchQuery || filterLowStock
                  ? 'Try adjusting your search or filters'
                  : 'Add some items to get started'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 dark:bg-gray-700">
                  <tr>
                    <th 
                      className="py-3 px-4 text-left cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600"
                      onClick={() => handleSortChange('name')}
                    >
                      <div className="flex items-center">
                        Name
                        {sortBy === 'name' && (
                          <span className="ml-1">
                            {sortOrder === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th className="py-3 px-4 text-left">Description</th>
                    <th 
                      className="py-3 px-4 text-left cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600"
                      onClick={() => handleSortChange('price')}
                    >
                      <div className="flex items-center">
                        Price
                        {sortBy === 'price' && (
                          <span className="ml-1">
                            {sortOrder === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="py-3 px-4 text-left cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600"
                      onClick={() => handleSortChange('stock.current_stock')}
                    >
                      <div className="flex items-center">
                        Current Stock
                        {sortBy === 'stock.current_stock' && (
                          <span className="ml-1">
                            {sortOrder === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="py-3 px-4 text-left cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600"
                      onClick={() => handleSortChange('stock.minimum_threshold')}
                    >
                      <div className="flex items-center">
                        Min. Threshold
                        {sortBy === 'stock.minimum_threshold' && (
                          <span className="ml-1">
                            {sortOrder === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th className="py-3 px-4 text-left">Status</th>
                    <th className="py-3 px-4 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                  {filteredInventory.map(item => (
                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="py-3 px-4 font-medium">{item.name}</td>
                      <td className="py-3 px-4">
                        <div className="max-w-xs truncate">{item.description}</div>
                      </td>
                      <td className="py-3 px-4">${parseFloat(item.price).toFixed(2)}</td>
                      <td className="py-3 px-4">
                        {item.stock ? item.stock.current_stock : 'N/A'} {item.measurement_unit}
                      </td>
                      <td className="py-3 px-4">
                        {item.stock ? item.stock.minimum_threshold : 'N/A'} {item.measurement_unit}
                      </td>
                      <td className="py-3 px-4">
                        {item.stock ? (
                          item.stock.current_stock <= item.stock.minimum_threshold ? (
                            <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium dark:bg-red-900 dark:text-red-300">
                              Low Stock
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium dark:bg-green-900 dark:text-green-300">
                              In Stock
                            </span>
                          )
                        ) : (
                          <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium dark:bg-gray-800 dark:text-gray-300">
                            Not Tracked
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {(user?.role?.name === 'Warehouse Manager' || user?.role?.name === 'SuperAdmin') && (
                          <button
                            className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 mr-3"
                            onClick={() => handleEditItem(item)}
                            disabled={isEditing || isAdding}
                          >
                            Edit
                          </button>
                        )}
                        <button 
                          className="text-secondary-600 hover:text-secondary-800 dark:text-secondary-400 dark:hover:text-secondary-300"
                          onClick={() => handleViewDetails(item)}
                          disabled={loadingItemId === item.id}
                        >
                          {loadingItemId === item.id ? (
                            <span className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-secondary-600 dark:border-secondary-400"></span>
                          ) : (
                            'View Details'
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {/* Item Detail Modal */}
        {detailModalOpen && selectedItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold gradient-text">Item Details</h2>
                  <button 
                    onClick={() => {
                      setDetailModalOpen(false);
                      setAlertResponse(null);
                      setAlertEmail('');
                    }}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h3 className="text-xl font-semibold mb-3">Item Information</h3>
                    <p><span className="font-medium">Name:</span> {selectedItem.name}</p>
                    <p><span className="font-medium">Description:</span> {selectedItem.description}</p>
                    <p><span className="font-medium">Price:</span> ${parseFloat(selectedItem.price).toFixed(2)}</p>
                    <p><span className="font-medium">Measurement Unit:</span> {selectedItem.measurement_unit}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-semibold mb-3">Stock Information</h3>
                    {selectedItem.stock ? (
                      <>
                        <p><span className="font-medium">Current Stock:</span> {selectedItem.stock.current_stock} {selectedItem.measurement_unit}</p>
                        <p><span className="font-medium">Minimum Threshold:</span> {selectedItem.stock.minimum_threshold} {selectedItem.measurement_unit}</p>
                        <p><span className="font-medium">Status:</span> 
                          {selectedItem.stock.current_stock <= selectedItem.stock.minimum_threshold ? (
                            <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium dark:bg-red-900 dark:text-red-300">
                              Low Stock
                            </span>
                          ) : (
                            <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium dark:bg-green-900 dark:text-green-300">
                              In Stock
                            </span>
                          )}
                        </p>
                        {selectedItem.stock.supplier && (
                          <p><span className="font-medium">Supplier:</span> {selectedItem.stock.supplier}</p>
                        )}
                      </>
                    ) : (
                      <p>No stock information available</p>
                    )}
                  </div>
                </div>
                
                {/* Stock Alert Section - Only show for items with low stock */}
                {selectedItem.stock && selectedItem.stock.current_stock <= selectedItem.stock.minimum_threshold && (
                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <h3 className="text-xl font-semibold gradient-text mb-4">Send Stock Alert</h3>
                    
                    <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
                      <p>This item is currently below minimum threshold. Consider sending a stock alert.</p>
                    </div>
                    
                    {alertResponse && (
                      <div className={`${alertResponse.success ? 'bg-green-100 border-green-400 text-green-700' : 'bg-red-100 border-red-400 text-red-700'} px-4 py-3 border rounded mb-4`}>
                        {alertResponse.message}
                      </div>
                    )}
                    
                    <div className="mt-4">
                      <div className="mb-4">
                        <label htmlFor="alertEmail" className="form-label">Notification Email (Optional)</label>
                        <input
                          type="email"
                          id="alertEmail"
                          value={alertEmail}
                          onChange={(e) => setAlertEmail(e.target.value)}
                          className="form-input"
                          placeholder="Enter email or leave empty for default recipient"
                        />
                        <p className="text-sm text-gray-500 mt-1">
                          If left empty, the alert will be sent to the system's default recipient.
                        </p>
                      </div>
                      
                      <button
                        onClick={() => handleSendAlert(selectedItem.stock.id)}
                        className="button-secondary w-full"
                        disabled={alertLoading}
                      >
                        {alertLoading ? (
                          <div className="inline-block animate-spin rounded-full h-5 w-5 border-t-2 border-white"></div>
                        ) : (
                          'Send Stock Alert'
                        )}
                      </button>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end space-x-3 mt-6">
                  {(user?.role?.name === 'Warehouse Manager' || user?.role?.name === 'SuperAdmin') && selectedItem.stock && (
                    <button
                      onClick={() => {
                        setDetailModalOpen(false);
                        setAlertResponse(null);
                        setAlertEmail('');
                        handleEditItem(selectedItem);
                      }}
                      className="button-primary"
                    >
                      Edit Item
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setDetailModalOpen(false);
                      setAlertResponse(null);
                      setAlertEmail('');
                    }}
                    className="button-outline"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default InventoryManagement; 