import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const API_URL = 'http://localhost:8000/api';

const InventoryManagement = () => {
  const { user, token } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLowStock, setShowLowStock] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemForm, setItemForm] = useState({
    name: '',
    description: '',
    measurement_unit: '',
    price: '',
  });
  const [stockForm, setStockForm] = useState({
    current_stock: '',
    minimum_threshold: '',
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [isNewItem, setIsNewItem] = useState(false);
  
  useEffect(() => {
    fetchInventory();
  }, [token, searchQuery, showLowStock]);
  
  const fetchInventory = async () => {
    try {
      setLoading(true);
      
      // Fetch items
      let url = `${API_URL}/items/`;
      if (searchQuery) {
        url += `?search=${searchQuery}`;
      }
      
      const itemsResponse = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Get stock information for each item
      const itemsWithStock = await Promise.all(
        (itemsResponse.data.results || itemsResponse.data).map(async (item) => {
          try {
            const stockResponse = await axios.get(`${API_URL}/stock/?item_id=${item.id}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            
            const stockInfo = stockResponse.data.results?.[0] || { 
              current_stock: 0, 
              minimum_threshold: 0 
            };
            
            const fullItem = {
              ...item,
              stock: stockInfo.current_stock,
              stockId: stockInfo.id,
              minimumThreshold: stockInfo.minimum_threshold,
              lowStock: stockInfo.current_stock <= stockInfo.minimum_threshold
            };
            
            return fullItem;
          } catch (err) {
            console.error(`Error fetching stock for item ${item.id}:`, err);
            return { 
              ...item, 
              stock: 0, 
              minimumThreshold: 0, 
              lowStock: true 
            };
          }
        })
      );
      
      // Filter low stock items if needed
      const filteredItems = showLowStock 
        ? itemsWithStock.filter(item => item.lowStock) 
        : itemsWithStock;
      
      setInventory(filteredItems);
    } catch (err) {
      console.error('Error fetching inventory:', err);
      setError('Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };
  
  const handleEditItem = (item) => {
    setEditingItem(item);
    setItemForm({
      name: item.name,
      description: item.description || '',
      measurement_unit: item.measurement_unit || '',
      price: item.price,
    });
    setStockForm({
      current_stock: item.stock || 0,
      minimum_threshold: item.minimumThreshold || 0,
    });
    setIsNewItem(false);
    setModalOpen(true);
  };
  
  const handleAddNewItem = () => {
    setEditingItem(null);
    setItemForm({
      name: '',
      description: '',
      measurement_unit: '',
      price: '',
    });
    setStockForm({
      current_stock: 0,
      minimum_threshold: 0,
    });
    setIsNewItem(true);
    setModalOpen(true);
  };
  
  const handleItemFormChange = (e) => {
    const { name, value } = e.target;
    setItemForm(prev => ({ ...prev, [name]: value }));
  };
  
  const handleStockFormChange = (e) => {
    const { name, value } = e.target;
    setStockForm(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      let itemId;
      
      if (isNewItem) {
        // Create new item
        const itemResponse = await axios.post(`${API_URL}/items/`, {
          name: itemForm.name,
          description: itemForm.description,
          measurement_unit: itemForm.measurement_unit,
          price: parseFloat(itemForm.price),
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        itemId = itemResponse.data.id;
        
        // Create stock for the new item
        await axios.post(`${API_URL}/stock/`, {
          item_id: itemId,
          current_stock: parseInt(stockForm.current_stock),
          minimum_threshold: parseInt(stockForm.minimum_threshold),
          supplier_id: user.id,
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        // Update existing item
        await axios.patch(`${API_URL}/items/${editingItem.id}/`, {
          name: itemForm.name,
          description: itemForm.description,
          measurement_unit: itemForm.measurement_unit,
          price: parseFloat(itemForm.price),
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Update stock
        if (editingItem.stockId) {
          await axios.patch(`${API_URL}/stock/${editingItem.stockId}/`, {
            current_stock: parseInt(stockForm.current_stock),
            minimum_threshold: parseInt(stockForm.minimum_threshold),
            supplier_id: user.id,
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
        } else {
          // Create stock if it doesn't exist
          await axios.post(`${API_URL}/stock/`, {
            item_id: editingItem.id,
            current_stock: parseInt(stockForm.current_stock),
            minimum_threshold: parseInt(stockForm.minimum_threshold),
            supplier_id: user.id,
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
        }
      }
      
      // Close modal and refetch inventory
      setModalOpen(false);
      fetchInventory();
    } catch (err) {
      console.error('Error saving item:', err);
      setError('Failed to save item. Please try again.');
    } finally {
      setLoading(false);
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
            <h1 className="text-3xl font-bold gradient-text">Inventory Management</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Add, update, and monitor inventory levels.
            </p>
          </div>
          
          <button
            onClick={handleAddNewItem}
            className="button-primary mt-4 md:mt-0 inline-flex items-center"
            disabled={loading}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add New Item
          </button>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}
        
        {/* Search and Filter */}
        <div className="card mb-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div className="md:w-1/2">
              <label htmlFor="search" className="form-label">Search Inventory</label>
              <input
                type="text"
                id="search"
                placeholder="Search by name or description..."
                className="form-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="lowStock"
                className="h-4 w-4 text-primary-600 dark:text-primary-400"
                checked={showLowStock}
                onChange={(e) => setShowLowStock(e.target.checked)}
              />
              <label htmlFor="lowStock" className="text-gray-700 dark:text-gray-300">
                Show Low Stock Items Only
              </label>
            </div>
          </div>
        </div>
        
        {/* Inventory Table */}
        <div className="card overflow-hidden">
          {loading && !modalOpen ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
            </div>
          ) : inventory.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p>No inventory items found</p>
              <p className="mt-2 text-sm">Try changing your search criteria or add new items</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 dark:bg-gray-700">
                  <tr>
                    <th className="py-3 px-4 text-left">Name</th>
                    <th className="py-3 px-4 text-left">Description</th>
                    <th className="py-3 px-4 text-left">Price</th>
                    <th className="py-3 px-4 text-left">Unit</th>
                    <th className="py-3 px-4 text-left">Current Stock</th>
                    <th className="py-3 px-4 text-left">Min. Threshold</th>
                    <th className="py-3 px-4 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                  {inventory.map(item => (
                    <tr key={item.id} className={`hover:bg-gray-50 dark:hover:bg-gray-800 ${item.lowStock ? 'bg-red-50 dark:bg-red-900/20' : ''}`}>
                      <td className="py-3 px-4 font-medium">{item.name}</td>
                      <td className="py-3 px-4">{item.description ? item.description.substring(0, 30) + (item.description.length > 30 ? '...' : '') : '-'}</td>
                      <td className="py-3 px-4">${parseFloat(item.price).toFixed(2)}</td>
                      <td className="py-3 px-4">{item.measurement_unit || '-'}</td>
                      <td className={`py-3 px-4 ${item.lowStock ? 'text-red-600 dark:text-red-400 font-semibold' : ''}`}>
                        {item.stock}
                      </td>
                      <td className="py-3 px-4">{item.minimumThreshold}</td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleEditItem(item)}
                          className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {/* Modal for adding/editing items */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-gray-500 opacity-75 dark:bg-gray-900 dark:opacity-75"></div>
              </div>
              
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
              
              <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <form onSubmit={handleSubmit}>
                  <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100 mb-4">
                      {isNewItem ? 'Add New Item' : 'Edit Item'}
                    </h3>
                    
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label htmlFor="name" className="form-label">Item Name*</label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          className="form-input"
                          value={itemForm.name}
                          onChange={handleItemFormChange}
                          required
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="description" className="form-label">Description</label>
                        <textarea
                          id="description"
                          name="description"
                          className="form-input h-24"
                          value={itemForm.description}
                          onChange={handleItemFormChange}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="measurement_unit" className="form-label">Unit</label>
                          <input
                            type="text"
                            id="measurement_unit"
                            name="measurement_unit"
                            className="form-input"
                            value={itemForm.measurement_unit}
                            onChange={handleItemFormChange}
                            placeholder="e.g., kg, unit, box"
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="price" className="form-label">Price*</label>
                          <input
                            type="number"
                            id="price"
                            name="price"
                            className="form-input"
                            value={itemForm.price}
                            onChange={handleItemFormChange}
                            min="0"
                            step="0.01"
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="current_stock" className="form-label">Current Stock*</label>
                          <input
                            type="number"
                            id="current_stock"
                            name="current_stock"
                            className="form-input"
                            value={stockForm.current_stock}
                            onChange={handleStockFormChange}
                            min="0"
                            required
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="minimum_threshold" className="form-label">Min. Threshold*</label>
                          <input
                            type="number"
                            id="minimum_threshold"
                            name="minimum_threshold"
                            className="form-input"
                            value={stockForm.minimum_threshold}
                            onChange={handleStockFormChange}
                            min="0"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                    <button
                      type="submit"
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
                      disabled={loading}
                    >
                      {loading ? (
                        <div className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-white"></div>
                      ) : (
                        isNewItem ? 'Add Item' : 'Save Changes'
                      )}
                    </button>
                    <button
                      type="button"
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                      onClick={() => setModalOpen(false)}
                      disabled={loading}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default InventoryManagement; 