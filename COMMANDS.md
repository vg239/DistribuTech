# DistribuTech Quick Start Commands

Here are the complete commands to set up and run DistribuTech without using any scripts. Copy and paste these into your terminal.

## Database Setup

```bash
# Create PostgreSQL database
sudo -u postgres psql -c "CREATE DATABASE distributech;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE distributech TO postgres;"
```

## Backend Setup

```bash
# Setup backend
cd distributech_backend && \
python3 -m venv venv && \
source venv/bin/activate && \
pip install -r requirements.txt && \
python manage.py makemigrations && \
python manage.py migrate && \
python manage.py shell -c "from core.models import Role, Department; [Role.objects.get_or_create(name=name) for name in ['SuperAdmin', 'Department Manager', 'Warehouse Manager', 'Supplier', 'Administrator']]; [Department.objects.get_or_create(name=name) for name in ['Administration', 'Operations', 'Production', 'IT', 'HR']]"
```

## Create Sample Data

```bash
# Create the data initialization script
cat > distributech_backend/create_initial_data.py << 'EOF'
import os
import django
import random
from django.utils import timezone
from django.db import transaction

# Initialize Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'distributech.settings')
django.setup()

# Now import the models
from django.contrib.auth.hashers import make_password
from core.models import (
    Role, Department, User, UserInfo, Item, Stock, 
    Order, OrderItem, OrderStatus, Gender
)

@transaction.atomic
def create_roles():
    """Create default roles if they don't exist"""
    print("Creating roles...")
    roles = [
        'SuperAdmin',
        'Department Manager',
        'Warehouse Manager',
        'Supplier',
        'Administrator',
    ]
    
    created_roles = []
    for role_name in roles:
        role, created = Role.objects.get_or_create(name=role_name)
        created_roles.append(role)
        if created:
            print(f"Created role: {role_name}")
        else:
            print(f"Role already exists: {role_name}")
    
    return created_roles

@transaction.atomic
def create_departments():
    """Create default departments if they don't exist"""
    print("Creating departments...")
    departments = [
        'Administration',
        'Operations',
        'Production',
        'Maintenance',
        'Research',
        'IT',
        'HR',
        'Finance',
    ]
    
    created_departments = []
    for dept_name in departments:
        dept, created = Department.objects.get_or_create(name=dept_name)
        created_departments.append(dept)
        if created:
            print(f"Created department: {dept_name}")
        else:
            print(f"Department already exists: {dept_name}")
    
    return created_departments

@transaction.atomic
def create_users(roles, departments):
    """Create default users if they don't exist"""
    print("Creating users...")
    
    # Find role objects
    superadmin_role = next((r for r in roles if r.name == 'SuperAdmin'), None)
    admin_role = next((r for r in roles if r.name == 'Administrator'), None)
    dept_manager_role = next((r for r in roles if r.name == 'Department Manager'), None)
    warehouse_manager_role = next((r for r in roles if r.name == 'Warehouse Manager'), None)
    supplier_role = next((r for r in roles if r.name == 'Supplier'), None)
    
    # Find department objects
    admin_dept = next((d for d in departments if d.name == 'Administration'), None)
    ops_dept = next((d for d in departments if d.name == 'Operations'), None)
    it_dept = next((d for d in departments if d.name == 'IT'), None)
    hr_dept = next((d for d in departments if d.name == 'HR'), None)
    
    # Create demo users with proper roles and departments
    users = [
        {
            'username': 'admin',
            'email': 'admin@example.com',
            'password': 'admin123',
            'first_name': 'Admin',
            'last_name': 'User',
            'role': admin_role,
            'department': admin_dept,
            'is_staff': True,
        },
        {
            'username': 'warehouse',
            'email': 'warehouse@example.com',
            'password': 'warehouse123',
            'first_name': 'Warehouse',
            'last_name': 'Manager',
            'role': warehouse_manager_role,
            'department': ops_dept,
        },
        {
            'username': 'manager',
            'email': 'manager@example.com',
            'password': 'manager123',
            'first_name': 'Department',
            'last_name': 'Manager',
            'role': dept_manager_role,
            'department': hr_dept,
        },
        {
            'username': 'supplier',
            'email': 'supplier@example.com',
            'password': 'supplier123',
            'first_name': 'Supplier',
            'last_name': 'Contact',
            'role': supplier_role,
            'department': ops_dept,
        },
        {
            'username': 'superadmin',
            'email': 'superadmin@example.com',
            'password': 'superadmin123',
            'first_name': 'Super',
            'last_name': 'Admin',
            'role': superadmin_role,
            'department': admin_dept,
            'is_staff': True,
        },
    ]
    
    created_users = []
    for user_data in users:
        username = user_data['username']
        email = user_data['email']
        
        # Check if user exists
        if User.objects.filter(username=username).exists():
            print(f"User already exists: {username}")
            user = User.objects.get(username=username)
        else:
            # Create user
            user = User.objects.create(
                username=username,
                email=email,
                is_staff=user_data.get('is_staff', False),
                is_active=True,
                role=user_data['role'],
                department=user_data['department'],
            )
            user.set_password(user_data['password'])
            user.save()
            print(f"Created user: {username}")
            
            # Create user info
            UserInfo.objects.create(
                user=user,
                first_name=user_data['first_name'],
                last_name=user_data['last_name'],
                gender=Gender.MALE,  # Default gender
                phone=f"+1555{random.randint(1000000, 9999999)}",
                country="United States",
                city="New York",
                address="123 Main St",
                postal_code="10001",
                date_of_birth=timezone.now().date().replace(year=1990, month=1, day=1),
            )
            print(f"Created user info for: {username}")
        
        created_users.append(user)
    
    return created_users

@transaction.atomic
def create_items():
    """Create sample inventory items"""
    print("Creating inventory items...")
    
    items_data = [
        {
            'name': 'Laptop - Basic Model',
            'description': 'Entry-level laptop for basic office tasks',
            'measurement_unit': 'unit',
            'price': 599.99,
        },
        {
            'name': 'Laptop - Pro Model',
            'description': 'High-performance laptop for developers and designers',
            'measurement_unit': 'unit',
            'price': 1299.99,
        },
        {
            'name': 'Office Chair',
            'description': 'Ergonomic office chair with lumbar support',
            'measurement_unit': 'unit',
            'price': 149.99,
        },
        {
            'name': 'Desk - Standard',
            'description': 'Standard office desk, 160x80cm',
            'measurement_unit': 'unit',
            'price': 199.99,
        },
        {
            'name': 'Desk - Executive',
            'description': 'Executive office desk with drawers, 200x100cm',
            'measurement_unit': 'unit',
            'price': 349.99,
        },
        {
            'name': 'Monitor - 24"',
            'description': '24-inch Full HD monitor',
            'measurement_unit': 'unit',
            'price': 179.99,
        },
        {
            'name': 'Monitor - 27" 4K',
            'description': '27-inch 4K Ultra HD monitor',
            'measurement_unit': 'unit',
            'price': 299.99,
        },
        {
            'name': 'Keyboard - Mechanical',
            'description': 'Mechanical keyboard with RGB lighting',
            'measurement_unit': 'unit',
            'price': 89.99,
        },
        {
            'name': 'Mouse - Gaming',
            'description': 'High-precision gaming mouse',
            'measurement_unit': 'unit',
            'price': 59.99,
        },
        {
            'name': 'Headset - Wireless',
            'description': 'Wireless headset with noise cancellation',
            'measurement_unit': 'unit',
            'price': 129.99,
        },
    ]
    
    created_items = []
    for item_data in items_data:
        name = item_data['name']
        
        # Check if item exists
        if Item.objects.filter(name=name).exists():
            print(f"Item already exists: {name}")
            item = Item.objects.get(name=name)
        else:
            # Create item
            item = Item.objects.create(
                name=name,
                description=item_data['description'],
                measurement_unit=item_data['measurement_unit'],
                price=item_data['price'],
            )
            print(f"Created item: {name}")
        
        created_items.append(item)
    
    return created_items

@transaction.atomic
def create_stock(items, warehouse_manager):
    """Create stock entries for items"""
    print("Creating stock entries...")
    
    created_stock = []
    for item in items:
        # Check if stock exists
        if Stock.objects.filter(item=item).exists():
            print(f"Stock already exists for: {item.name}")
            stock = Stock.objects.get(item=item)
            created_stock.append(stock)
            continue
        
        # Random stock level, ensuring some items have low stock for testing
        current_stock = random.randint(0, 30)
        # Random threshold between 5 and 15
        minimum_threshold = random.randint(5, 15)
        
        stock = Stock.objects.create(
            item=item,
            current_stock=current_stock,
            minimum_threshold=minimum_threshold,
            supplier=warehouse_manager,  # The warehouse manager is temporarily the supplier
        )
        print(f"Created stock for: {item.name} (Current: {current_stock}, Threshold: {minimum_threshold})")
        created_stock.append(stock)
    
    return created_stock

@transaction.atomic
def create_orders(users, items):
    """Create sample orders"""
    print("Creating sample orders...")
    
    # Get a department manager
    dept_manager = next((user for user in users if user.role.name == 'Department Manager'), None)
    
    if not dept_manager:
        print("No department manager found, skipping order creation")
        return []
    
    # Create 5 sample orders with different statuses
    statuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Completed']
    
    created_orders = []
    for i, status in enumerate(statuses):
        # Create order
        order = Order.objects.create(
            user=dept_manager,
            status=status,
            created_at=timezone.now() - timezone.timedelta(days=i*2)  # Each order a few days apart
        )
        
        # Add 2-5 random items to the order
        num_items = random.randint(2, 5)
        for _ in range(num_items):
            item = random.choice(items)
            OrderItem.objects.create(
                order=order,
                item=item,
                quantity=random.randint(1, 5),
                price_at_order_time=item.price
            )
        
        # Create order status entry
        OrderStatus.objects.create(
            order=order,
            status=status,
            location_timestamp=timezone.now(),
            remarks=f"Order {status.lower()}",
            expected_delivery_date=timezone.now().date() + timezone.timedelta(days=7) if status != 'Delivered' else None
        )
        
        print(f"Created order: ID {order.id}, Status: {status}, Items: {num_items}")
        created_orders.append(order)
    
    return created_orders

@transaction.atomic
def main():
    """Main function to run all data creation"""
    print("Starting data initialization...")
    
    roles = create_roles()
    departments = create_departments()
    users = create_users(roles, departments)
    items = create_items()
    
    # Get warehouse manager for stock creation
    warehouse_manager = next((user for user in users if user.role.name == 'Warehouse Manager'), None)
    if warehouse_manager:
        stocks = create_stock(items, warehouse_manager)
        orders = create_orders(users, items)
    else:
        print("No warehouse manager found, skipping stock and order creation")
    
    print("Data initialization complete!")

if __name__ == "__main__":
    main()
EOF

# Run the data initialization script
cd distributech_backend && source venv/bin/activate && python create_initial_data.py
```

## Create Public API Endpoints (to fix registration)

```bash
# Add public API views
cd distributech_backend && source venv/bin/activate

# Add to views.py
echo "
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

@api_view(['GET'])
@permission_classes([AllowAny])
def public_roles(request):
    """
    Public endpoint to get all roles (used for registration)
    """
    roles = Role.objects.all()
    serializer = RoleSerializer(roles, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([AllowAny])
def public_departments(request):
    """
    Public endpoint to get all departments (used for registration)
    """
    departments = Department.objects.all()
    serializer = DepartmentSerializer(departments, many=True)
    return Response(serializer.data)
" >> core/views.py

# Update URLs
sed -i "/from .views import (/,/)/ s/)/, public_roles, public_departments)/" core/urls.py
echo "
# Public endpoints that don't require authentication
path('public/roles/', public_roles, name='public-roles'),
path('public/departments/', public_departments, name='public-departments'),
" >> core/urls.py
```

## Update Frontend to Use Public Endpoints

```bash
# Update Register.jsx to use public endpoints
cd distributech_frontend && sed -i "s|axios.get(\`\${API_URL}/roles/\`)|axios.get(\`\${API_URL}/public/roles/\`)|g" src/components/auth/Register.jsx && sed -i "s|axios.get(\`\${API_URL}/departments/\`)|axios.get(\`\${API_URL}/public/departments/\`)|g" src/components/auth/Register.jsx
```

## Start Servers

```bash
# Start backend (in one terminal)
cd distributech_backend && source venv/bin/activate && python manage.py runserver

# Start frontend (in another terminal)
cd distributech_frontend && npm install && npm run dev
```

## Demo Login Credentials

| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | Administrator |
| warehouse | warehouse123 | Warehouse Manager |
| manager | manager123 | Department Manager |
| supplier | supplier123 | Supplier |
| superadmin | superadmin123 | SuperAdmin | 