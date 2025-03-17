#!/bin/sh

set -e

echo "Installing dependencies..."
pip install -r requirements.txt

echo "Making migrations..."
python manage.py makemigrations

echo "Applying migrations..."
python manage.py migrate

echo "Setting up initial data..."
# Run the init_data command for database initialization
python manage.py init_data || echo "Data initialization skipped (command may fail on first run)"

# Try to run the init_roles_depts command if it exists (for backward compatibility)
python manage.py init_roles_depts || echo "Roles and departments setup skipped (command may not exist)"

echo "Starting server..."
exec "$@"