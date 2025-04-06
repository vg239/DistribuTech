# DistribuTech Backend

<img src="https://via.placeholder.com/300x100.png?text=DistribuTech+Logo" alt="DistribuTech Logo" style="display: block; margin: 0 auto;">

## Project Overview

DistribuTech is a web-based inventory management system designed to streamline supply chain processes. The system enables communication and coordination between various roles in an organization while maintaining transparent tracking of supply requests and deliveries.

**Team Members**:
- Dev Prajapati (231CS120)
- Patel Pal Bharat (231CS240)
- Swaraj Singh (231CS158)
- Vatsal Jay Gandhi (231CS164)

## Tech Stack

- **Backend**: Django/Django REST Framework
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Tokens)
- **API**: RESTful API architecture

## Project Structure

The project follows a standard Django project structure with a RESTful API implementation:

```
distributech_backend/
├── core/                      # Main application
│   ├── management/            # Custom management commands
│   │   └── commands/          # Management command files
│   │       ├── check_stock_levels.py  # Checks stock and sends alerts
│   │       ├── send_order_notification.py  # Sends order notifications
│   │       └── send_test_email.py  # Tests email configuration
│   ├── migrations/            # Database migrations
│   ├── __init__.py            # Package initialization
│   ├── admin.py               # Django Admin configuration
│   ├── apps.py                # App configuration
│   ├── example_views.py       # Example views for RBAC demonstration
│   ├── models.py              # Database models
│   ├── permissions.py         # RBAC permission classes and decorators
│   ├── serializers.py         # DRF serializers
│   ├── urls.py                # URL routing for the API
│   └── views.py               # API views
├── distributech/              # Project settings directory
│   ├── __init__.py            # Package initialization
│   ├── asgi.py                # ASGI configuration
│   ├── settings.py            # Project settings
│   ├── urls.py                # Main URL routing
│   └── wsgi.py                # WSGI configuration
├── venv/                      # Virtual environment (not tracked by git)
├── manage.py                  # Django management script
└── README.md                  # Project documentation
```

## Key Components

### `manage.py`

The `manage.py` file is a command-line utility that allows you to interact with the Django project. It's used for:
- Running the development server (`python manage.py runserver`)
- Creating database migrations (`python manage.py makemigrations`)
- Applying migrations (`python manage.py migrate`)
- Creating a superuser (`python manage.py createsuperuser`)
- Running custom management commands
- And many other administrative tasks

### Django Apps

In Django, an "app" is a self-contained module that provides a specific set of features. Our project has one main app:

- **core**: Contains all the models, views, serializers, and permissions for the inventory management system

### Models

The `models.py` file defines the database structure using Django's ORM (Object-Relational Mapping). Key models include:

- **User**: Custom user model extending Django's `AbstractBaseUser`
- **Role**: Defines user roles in the system
- **Department**: Defines departments in the organization
- **Order**: Represents orders placed by department managers
- **OrderStatus**: Tracks the status of orders
- **Item**: Catalog of items that can be ordered
- **OrderItem**: Items included in an order
- **Stock**: Inventory levels of items
- **Comment**: Comments on orders
- **Attachment**: Files attached to orders

### Role-Based Access Control (RBAC)

The RBAC system is implemented in `permissions.py` using two approaches:

1. **DRF Permission Classes**: Used in class-based views (ViewSets)
2. **Function Decorators**: Used in function-based views

#### Permission Classes

These classes extend Django REST Framework's `BasePermission` class:

- `IsSuperAdmin`: Checks if the user has the SuperAdmin role
- `IsDepartmentManager`: Checks if the user has the Department Manager role
- `IsWarehouseManager`: Checks if the user has the Warehouse Manager role
- `IsSupplier`: Checks if the user has the Supplier role
- `IsAdministrator`: Checks if the user has the Administrator role

Example usage in a ViewSet:

```python
class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all()
    permission_classes = [permissions.IsAuthenticated, IsDepartmentManager]
```

#### Function Decorators

These decorators can be applied to function-based views to restrict access:

- `@superadmin_required`: Only SuperAdmins can access
- `@department_manager_required`: Only Department Managers can access
- `@warehouse_manager_required`: Only Warehouse Managers can access
- `@supplier_required`: Only Suppliers can access
- `@administrator_required`: Only Administrators can access
- `@role_required(['Role1', 'Role2', ...])`: Only users with specified roles can access

Example usage of a decorator:

```python
@superadmin_required
def admin_dashboard(request):
    # Only SuperAdmins can access this view
    return render(request, 'admin_dashboard.html')
```

For examples of views using these decorators, see `example_views.py`.

### How the Decorators Work

1. When a user makes a request to a decorated view, the decorator checks if the user is authenticated.
2. If authenticated, it checks the user's role against the required role(s).
3. If the role matches, the request proceeds to the view function.
4. If the role doesn't match, or the user isn't authenticated, an HTTP 403 Forbidden response is returned.

The `role_required` decorator is more flexible as it accepts a list of allowed roles:

```python
@role_required(['Department Manager', 'Warehouse Manager'])
def shared_view(request):
    # Both Department Managers and Warehouse Managers can access this view
    return render(request, 'shared_view.html')
```

### API Views

The API views are implemented using Django REST Framework's ViewSets in `views.py`. Each ViewSet provides CRUD operations for a specific model, with appropriate permission checks.

Example:

```python
class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    
    def get_permissions(self):
        if self.action == 'create':
            # Only Department Managers can create orders
            permission_classes = [permissions.IsAuthenticated, IsDepartmentManager]
        elif self.action in ['update', 'partial_update']:
            # Department Managers, Warehouse Managers, and SuperAdmins can update orders
            permission_classes = [
                permissions.IsAuthenticated, 
                IsDepartmentManager | IsWarehouseManager | IsSuperAdmin
            ]
        else:
            # Default permissions
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]
```

### Email Notification System

The system includes an email notification system for:

1. **Order Notifications**: Sent when orders are created or updated
2. **Low Stock Alerts**: Sent when inventory items fall below their minimum threshold
3. **Test Emails**: For verifying email configuration

#### Email Utils

The email utilities are in `core/utils/email_utils.py` and provide functions for sending various types of emails:

- `send_email`: Base function for sending emails
- `send_order_notification`: Sends notifications for order updates
- `send_stock_alert`: Sends alerts for low stock levels
- `send_test_email`: Sends a test email to verify configuration

#### Management Commands

Command-line utilities for testing and using the email system:

- `check_stock_levels`: Checks inventory and sends alerts for low stock
  ```bash
  python manage.py check_stock_levels [--email user@example.com] [--dry-run]
  ```

- `send_order_notification`: Sends a notification for a specific order
  ```bash
  python manage.py send_order_notification ORDER_ID [--email user@example.com] [--dry-run]
  ```

- `send_test_email`: Sends a test email to verify configuration
  ```bash
  python manage.py send_test_email recipient@example.com
  ```

#### Email Configuration

Email settings are configured in `settings.py`. For testing, we use Mailtrap:

```python
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'sandbox.smtp.mailtrap.io'
EMAIL_PORT = 2525
EMAIL_USE_TLS = True
EMAIL_HOST_USER = '9b95507e4cc941'
EMAIL_HOST_PASSWORD = '0998606ce3fb67'
DEFAULT_FROM_EMAIL = 'DistribuTech <noreply@distributech.com>'
```

For a detailed guide on using the email notification system, see `EMAIL_NOTIFICATION_GUIDE.md`.

## Roles and Permissions

The system has five main roles:

1. **SuperAdmin**: Has unrestricted access to all features
2. **Administrator**: Can manage users, departments, and roles
3. **Department Manager**: Can create orders and track their status
4. **Warehouse Manager**: Can manage inventory and update order status
5. **Supplier**: Can update stock levels and manage inventory

## Database Configuration

The project is configured to use PostgreSQL. The database settings are in `settings.py` and can be customized using environment variables:

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('DB_NAME', 'distributech'),
        'USER': os.environ.get('DB_USER', 'postgres'),
        'PASSWORD': os.environ.get('DB_PASSWORD', 'postgres'),
        'HOST': os.environ.get('DB_HOST', 'localhost'),
        'PORT': os.environ.get('DB_PORT', '5432'),
    }
}
```

## Authentication

The API uses JWT (JSON Web Token) authentication via the `djangorestframework-simplejwt` package. Tokens are obtained by making a POST request to `/api/auth/token/` with username and password, and can be refreshed at `/api/auth/token/refresh/`.

## Setup and Installation

### Prerequisites

- Python 3.8 or higher
- PostgreSQL
- pip (Python package installer)

### Installation Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/distributech.git
   cd distributech/distributech_backend
   ```

2. Create and activate a virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows, use `venv\Scripts\activate`
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Set up the PostgreSQL database:
   ```bash
   # Create a PostgreSQL database named 'distributech'
   # You can also set environment variables for database configuration
   # DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT
   ```

5. Apply migrations:
   ```bash
   python manage.py migrate
   ```

6. Create a superuser:
   ```bash
   python manage.py createsuperuser
   ```

7. Run the development server:
   ```bash
   python manage.py runserver
   ```

The API will be available at `http://localhost:8000/api/`.

## Using the API

1. Get an access token:
   ```
   POST /api/auth/token/
   {
       "username": "your_username",
       "password": "your_password"
   }
   ```

2. Use the token for authenticated requests:
   ```
   GET /api/orders/
   Authorization: Bearer <your_token>
   ``` 