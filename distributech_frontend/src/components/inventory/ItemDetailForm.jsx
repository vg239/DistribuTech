import React, { useState } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

const ItemDetailForm = ({ item, stock, onUpdate, onClose }) => {
  const [formData, setFormData] = useState({
    name: item?.name || '',
    description: item?.description || '',
    measurement_unit: item?.measurement_unit || '',
    price: item?.price || 0,
    current_stock: stock?.current_stock || 0,
    minimum_threshold: stock?.minimum_threshold || 0
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [alertSent, setAlertSent] = useState(false);
  const [alertResponse, setAlertResponse] = useState(null);
  const [alertEmail, setAlertEmail] = useState('');
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'price' || name === 'current_stock' || name === 'minimum_threshold' 
        ? parseFloat(value) 
        : value
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Update the item
      const itemResponse = await axios.patch(`${API_URL}/items/${item.id}/`, {
        name: formData.name,
        description: formData.description,
        measurement_unit: formData.measurement_unit,
        price: formData.price
      });
      
      // Update the stock
      const stockResponse = await axios.patch(`${API_URL}/stock/${stock.id}/`, {
        current_stock: formData.current_stock,
        minimum_threshold: formData.minimum_threshold
      });
      
      setSuccess('Item and stock updated successfully!');
      
      // Notify parent component
      if (onUpdate) {
        onUpdate({
          item: itemResponse.data,
          stock: stockResponse.data
        });
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'An error occurred while updating the item.');
      console.error('Error updating item:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSendAlert = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAlertResponse(null);
    
    try {
      const response = await axios.post(`${API_URL}/stock/${stock.id}/alert/`, {
        email: alertEmail || undefined
      });
      
      setAlertSent(true);
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
      setLoading(false);
    }
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold gradient-text">
          {item ? 'Update Item' : 'Add New Item'}
        </h2>
        {onClose && (
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label htmlFor="name" className="form-label">Item Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>
          
          <div>
            <label htmlFor="price" className="form-label">Price</label>
            <input
              type="number"
              id="price"
              name="price"
              min="0"
              step="0.01"
              value={formData.price}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>
          
          <div>
            <label htmlFor="measurement_unit" className="form-label">Measurement Unit</label>
            <input
              type="text"
              id="measurement_unit"
              name="measurement_unit"
              value={formData.measurement_unit}
              onChange={handleChange}
              className="form-input"
              placeholder="e.g., kg, liters, boxes"
            />
          </div>
          
          <div>
            <label htmlFor="current_stock" className="form-label">Current Stock</label>
            <input
              type="number"
              id="current_stock"
              name="current_stock"
              min="0"
              value={formData.current_stock}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>
          
          <div>
            <label htmlFor="minimum_threshold" className="form-label">Minimum Threshold</label>
            <input
              type="number"
              id="minimum_threshold"
              name="minimum_threshold"
              min="0"
              value={formData.minimum_threshold}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>
          
          <div className="md:col-span-2">
            <label htmlFor="description" className="form-label">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="form-input"
              rows="3"
            ></textarea>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="button-outline"
              disabled={loading}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="button-primary"
            disabled={loading}
          >
            {loading ? (
              <div className="inline-block animate-spin rounded-full h-5 w-5 border-t-2 border-white"></div>
            ) : (
              'Update Item'
            )}
          </button>
        </div>
      </form>
      
      {/* Stock Alert Section */}
      <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
        <h3 className="text-xl font-bold gradient-text mb-4">Send Stock Alert</h3>
        
        {formData.current_stock <= formData.minimum_threshold && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
            <p>This item is currently below minimum threshold. Consider sending a stock alert.</p>
          </div>
        )}
        
        {alertResponse && (
          <div className={`${alertResponse.success ? 'bg-green-100 border-green-400 text-green-700' : 'bg-red-100 border-red-400 text-red-700'} px-4 py-3 border rounded mb-4`}>
            {alertResponse.message}
          </div>
        )}
        
        <form onSubmit={handleSendAlert} className="mt-4">
          <div className="mb-4">
            <label htmlFor="alertEmail" className="form-label">Notification Email (Optional)</label>
            <input
              type="email"
              id="alertEmail"
              name="alertEmail"
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
            type="submit"
            className={`button-${alertSent ? 'outline' : 'secondary'} w-full`}
            disabled={loading}
          >
            {loading ? (
              <div className="inline-block animate-spin rounded-full h-5 w-5 border-t-2 border-white"></div>
            ) : alertSent ? (
              'Send Another Alert'
            ) : (
              'Send Stock Alert'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ItemDetailForm; 