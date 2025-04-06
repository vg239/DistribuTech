# DistribuTech 📦

DistribuTech is a comprehensive supply chain and inventory management system designed for businesses that need to track inventory, manage orders, and coordinate between various departments.

![DistribuTech Logo](https://via.placeholder.com/1200x400.png?text=DistribuTech+Inventory+Management)

## Features

- **Multi-role Access Control**: Different permissions for Department Managers, Warehouse Managers, Administrators, etc.
- **Order Management**: Create, track, and manage orders through their entire lifecycle
- **Inventory Tracking**: Real-time stock management with automatic updates
- **Email Notifications**: Automated alerts for low stock, order updates, and more
- **Analytics & Reporting**: Track key metrics across your supply chain

## Project Structure

The project consists of two main components:

1. **Backend** (`distributech_backend/`): Django REST API
2. **Frontend** (`distributech_frontend/`): React application

## Setup & Installation

### Prerequisites

- Python 3.8+
- Node.js 14+
- PostgreSQL
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd distributech_backend
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Apply migrations:
   ```bash
   python manage.py migrate
   ```

5. Create a superuser:
   ```bash
   python manage.py createsuperuser
   ```

6. Start the backend server:
   ```bash
   python manage.py runserver
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd distributech_frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. Access the application at `http://localhost:5173`

## Email Notification System

DistribuTech includes a comprehensive email notification system that alerts users about:

1. **Order Updates**: Notifications when orders are created, processed, shipped, etc.
2. **Low Stock Alerts**: Warnings when inventory falls below defined thresholds
3. **Test Emails**: For verifying system configuration

### Configuration

Email settings can be configured in the backend `settings.py` file. The system supports:

- SMTP email backends for production
- Console backend for development (prints emails to console)
- File-based backend for testing (saves emails to a directory)
- Mailtrap integration for testing real emails without sending to real recipients

See `distributech_backend/EMAIL_NOTIFICATION_GUIDE.md` for detailed instructions.

### Testing Email Functionality

Use the provided management commands to test email functionality:

```bash
# Send a test email
python manage.py send_test_email recipient@example.com

# Check stock levels and send alerts
python manage.py check_stock_levels

# Send notification for a specific order
python manage.py send_order_notification 123
```

## API Documentation

The RESTful API includes endpoints for:

- User authentication and management
- Order creation and tracking
- Inventory management
- Email notifications
- Analytical data

For detailed API documentation, run the backend server and visit:
`http://localhost:8000/api/docs/`

## Roles & Permissions

The system implements role-based access control with the following roles:

1. **SuperAdmin**: Complete access to all functionality
2. **Administrator**: Manage users, departments, and system settings
3. **Department Manager**: Create orders and track deliveries
4. **Warehouse Manager**: Manage inventory and process orders
5. **Supplier**: Update stock levels and manage product catalog

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- Team Members
- Faculty Mentors
- Open Source Communities
