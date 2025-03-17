#!/bin/bash

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════╗"
echo "║                                                          ║"
echo "║   DistribuTech - Inventory Management System             ║"
echo "║   Database Initialization Script                         ║"
echo "║                                                          ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Error: Python 3 is not installed.${NC}"
    echo "Please install Python 3 and try again."
    exit 1
fi

# Backend setup
echo -e "${GREEN}Setting up backend environment...${NC}"
cd distributech_backend

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}Creating virtual environment...${NC}"
    python3 -m venv venv
fi

# Activate virtual environment
echo -e "${YELLOW}Activating virtual environment...${NC}"
source venv/bin/activate

# Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
pip install -r requirements.txt

# Create PostgreSQL database
echo -e "${YELLOW}Setting up PostgreSQL database...${NC}"
echo -e "${YELLOW}Database name: distributech${NC}"
echo -e "${GREEN}Please enter PostgreSQL superuser (postgres) password if prompted${NC}"

# Check if database exists
if sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw distributech; then
    echo -e "${GREEN}Database 'distributech' already exists.${NC}"
else
    echo -e "${YELLOW}Creating database 'distributech'...${NC}"
    sudo -u postgres psql -c "CREATE DATABASE distributech;"
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE distributech TO postgres;"
    echo -e "${GREEN}Database created successfully!${NC}"
fi

# Create tables
echo -e "${YELLOW}Running migrations...${NC}"
python manage.py makemigrations
python manage.py migrate

# Create superuser if needed
echo -e "${YELLOW}Do you want to create a superuser? (y/n)${NC}"
read create_superuser
if [ "$create_superuser" = "y" ]; then
    python manage.py createsuperuser
fi

# Initialize roles and departments
echo -e "${YELLOW}Initializing roles and departments...${NC}"
python manage.py shell -c "from core.models import Role, Department; [Role.objects.get_or_create(name=name) for name in ['SuperAdmin', 'Department Manager', 'Warehouse Manager', 'Supplier', 'Administrator']]; [Department.objects.get_or_create(name=name) for name in ['Administration', 'Operations', 'Production', 'IT', 'HR']]"

# Create sample data using our custom script
echo -e "${YELLOW}Creating sample data...${NC}"
python create_initial_data.py

echo -e "${GREEN}Database initialization complete!${NC}"
echo -e ""
echo -e "${YELLOW}Next steps:${NC}"
echo -e "1. Start the backend server: ${BLUE}cd distributech_backend && source venv/bin/activate && python manage.py runserver${NC}"
echo -e "2. Start the frontend: ${BLUE}cd distributech_frontend && npm run dev${NC}"
echo -e "3. Access the app at: ${BLUE}http://localhost:5173${NC}"
echo -e ""
echo -e "${YELLOW}Demo accounts (all passwords match usernames):${NC}"
echo -e "- admin / admin123"
echo -e "- warehouse / warehouse123"
echo -e "- manager / manager123"
echo -e "- supplier / supplier123"
echo -e "- superadmin / superadmin123" 