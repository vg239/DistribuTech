# DistribuTech Setup Guide

This guide provides step-by-step instructions for setting up and running the DistribuTech inventory management system.

## Overview

DistribuTech consists of:
- **Backend**: Django REST Framework API
- **Frontend**: React application with Tailwind CSS
- **Database**: PostgreSQL

## Prerequisites

- Python 3.8+ 
- Node.js 16+
- PostgreSQL 12+
- pip and npm package managers

## Quick Setup (Automatic)

For automatic setup, use our initialization script:

```bash
# Make the script executable
chmod +x init-db.sh

# Run the script
./init-db.sh
```

The script will:
1. Create the PostgreSQL database
2. Initialize Django models
3. Create roles and departments
4. Load sample data for testing

## Manual Setup

If you prefer to set up manually, follow these steps:

### 1. Database Setup

```bash
# Connect to PostgreSQL
sudo -u postgres psql

# In PostgreSQL, create database and user
CREATE DATABASE distributech;
GRANT ALL PRIVILEGES ON DATABASE distributech TO postgres;
\q
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd distributech_backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py makemigrations
python manage.py migrate

# Initialize roles and departments
python manage.py shell -c "from core.models import Role, Department; [Role.objects.get_or_create(name=name) for name in ['SuperAdmin', 'Department Manager', 'Warehouse Manager', 'Supplier', 'Administrator']]; [Department.objects.get_or_create(name=name) for name in ['Administration', 'Operations', 'Production', 'IT', 'HR']]"

# Create initial data (sample data)
python create_initial_data.py
```

### 3. Frontend Setup

```bash
# Navigate to frontend directory
cd distributech_frontend

# Install dependencies
npm install
```

## Running the Application

### Start Backend

```bash
cd distributech_backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
python manage.py runserver
```

The backend API will be available at `http://localhost:8000/api/`.

### Start Frontend

```bash
cd distributech_frontend
npm run dev
```

The frontend will be available at `http://localhost:5173/`.

## Demo Accounts

The initial data script creates the following accounts:

| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | Administrator |
| warehouse | warehouse123 | Warehouse Manager |
| manager | manager123 | Department Manager |
| supplier | supplier123 | Supplier |
| superadmin | superadmin123 | SuperAdmin |

## Testing Order Creation

To test order creation:

1. **Log in as a Department Manager**:
   - Username: `manager`
   - Password: `manager123`

2. **Navigate to "New Order"** in the navigation bar

3. **Select items** from the inventory and add quantities

4. **Submit the order**

## Troubleshooting

### Registration Issues

If the registration form fails to load roles and departments:

1. Ensure the backend server is running
2. Check that the public API endpoints are working:
   - `http://localhost:8000/api/public/roles/`
   - `http://localhost:8000/api/public/departments/`

### Database Connection Issues

If you encounter database errors:

1. Verify PostgreSQL is running:
   ```bash
   sudo service postgresql status
   ```

2. Check connection settings in `.env` file:
   ```
   DB_NAME=distributech
   DB_USER=postgres
   DB_PASSWORD=postgres
   DB_HOST=localhost
   DB_PORT=5432
   ```

### Frontend API Connection

If the frontend can't connect to the backend:

1. Check that the API URL is correct in `src/contexts/AuthContext.jsx`
2. Ensure CORS is properly configured in the Django settings 