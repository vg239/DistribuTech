import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

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
    
    if (isAdding) {
      console.log('Submitting new item:', { item: itemForm, stock: stockForm });
      // Add implementation for adding item
      // For now, we'll just show what would be sent
      alert('Add functionality would submit: ' + JSON.stringify({ item: itemForm, stock: stockForm }));
    } else if (isEditing) {
      console.log('Updating item:', currentItem.id, { item: itemForm, stock: stockForm });
      // Add implementation for editing item
      // For now, we'll just show what would be sent
      alert('Edit functionality would submit: ' + JSON.stringify({ id: currentItem.id, item: itemForm, stock: stockForm }));
    }
    
    // In a real app, you would make the API calls here
    // After successful API call:
    setIsEditing(false);
    setIsAdding(false);
    fetchInventory(); // Refresh data
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
        
        {/* Edit/Add Form */}
        {(isEditing || isAdding) && (
          <div className="card mb-6">
            <h2 className="text-xl font-bold mb-4">
              {isAdding ? 'Add New Item' : 'Edit Item'}
            </h2>
            
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
                    {isAdding ? 'Add Item' : 'Save Changes'}
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
                        <button className="text-secondary-600 hover:text-secondary-800 dark:text-secondary-400 dark:hover:text-secondary-300">
                          View Details
                        </button>
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

export default InventoryManagement; 