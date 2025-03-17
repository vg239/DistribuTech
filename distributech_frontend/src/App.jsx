import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import FeatureSection from './components/FeatureSection';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import StableDashboard from './components/dashboard/StableDashboard';
import OrdersList from './components/orders/OrdersList';
import CreateOrder from './components/orders/CreateOrder';
import InventoryManagement from './components/inventory/InventoryManagement';
import './App.css';

// Protected route component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  // If allowedRoles is empty or the user's role is in the allowedRoles list
  if (allowedRoles.length === 0 || allowedRoles.includes(user?.role?.name)) {
    return children;
  }
  
  // If user doesn't have the required role
  return <Navigate to="/dashboard" />;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="page-container">
            <Navbar />
            <main>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={
                  <>
                    <HeroSection />
                    <FeatureSection />
                  </>
                } />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                {/* Protected routes */}
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <StableDashboard />
                  </ProtectedRoute>
                } />
                
                <Route path="/orders" element={
                  <ProtectedRoute>
                    <OrdersList />
                  </ProtectedRoute>
                } />
                
                <Route path="/orders/new" element={
                  <ProtectedRoute allowedRoles={['Department Manager', 'SuperAdmin']}>
                    <CreateOrder />
                  </ProtectedRoute>
                } />
                
                <Route path="/inventory" element={
                  <ProtectedRoute allowedRoles={['Warehouse Manager', 'SuperAdmin', 'Administrator']}>
                    <InventoryManagement />
                  </ProtectedRoute>
                } />
                
                {/* Fallback route */}
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </main>
            <footer className="py-8 text-center text-gray-600 dark:text-gray-400">
              <p>© 2025 DistribuTech. All rights reserved.</p>
            </footer>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
