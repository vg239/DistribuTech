import os
from django.core.management.base import BaseCommand
from django.db import transaction
from core.models import Role, Department, User, UserInfo
from django.contrib.auth.hashers import make_password

class Command(BaseCommand):
    help = 'Initialize database with roles, departments, and sample users'

    @transaction.atomic
    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.NOTICE('Starting data initialization...'))
        
        # Create roles if they don't exist
        roles = self._create_roles()
        
        # Create departments if they don't exist
        departments = self._create_departments()
        
        # Create sample users if they don't exist
        self._create_sample_users(roles, departments)
        
        self.stdout.write(self.style.SUCCESS('Data initialization completed successfully!'))
    
    def _create_roles(self):
        self.stdout.write('Creating roles...')
        roles = {
            'superadmin': Role.objects.get_or_create(name='SuperAdmin', 
                                                     description='Has full access to all features and administrative functions')[0],
            'admin': Role.objects.get_or_create(name='Administrator', 
                                               description='Can manage users, departments, and view reports')[0],
            'dept_manager': Role.objects.get_or_create(name='Department Manager', 
                                                      description='Can create orders and view department reports')[0],
            'warehouse_manager': Role.objects.get_or_create(name='Warehouse Manager', 
                                                          description='Can manage inventory and process orders')[0],
            'supplier': Role.objects.get_or_create(name='Supplier', 
                                                 description='Can update stock levels for their assigned items')[0],
            'staff': Role.objects.get_or_create(name='Staff', 
                                              description='Regular staff with basic access')[0],
        }
        self.stdout.write(self.style.SUCCESS(f'Created {len(roles)} roles'))
        return roles
    
    def _create_departments(self):
        self.stdout.write('Creating departments...')
        departments = {
            'it': Department.objects.get_or_create(name='IT Department', 
                                                 description='Information Technology')[0],
            'hr': Department.objects.get_or_create(name='HR Department', 
                                                 description='Human Resources')[0],
            'finance': Department.objects.get_or_create(name='Finance Department', 
                                                      description='Finance and Accounting')[0],
            'marketing': Department.objects.get_or_create(name='Marketing Department', 
                                                        description='Marketing and Sales')[0],
            'operations': Department.objects.get_or_create(name='Operations Department', 
                                                         description='Operations and Logistics')[0],
            'warehouse': Department.objects.get_or_create(name='Warehouse', 
                                                        description='Inventory Management')[0],
        }
        self.stdout.write(self.style.SUCCESS(f'Created {len(departments)} departments'))
        return departments
    
    def _create_sample_users(self, roles, departments):
        self.stdout.write('Creating sample users...')
        
        # Default password for all sample users
        default_password = make_password('password123')
        
        # Create SuperAdmin
        superadmin, created = User.objects.get_or_create(
            username='superadmin',
            defaults={
                'email': 'superadmin@example.com',
                'password': default_password,
                'is_active': True,
                'is_staff': True,
                'is_superuser': True,
                'role': roles['superadmin'],
                'department': departments['it']
            }
        )
        
        if created:
            UserInfo.objects.create(
                user=superadmin,
                first_name='Super',
                last_name='Admin',
                gender='Male',
                phone='1234567890'
            )
            self.stdout.write(self.style.SUCCESS('Created SuperAdmin user: superadmin / password123'))
        
        # Create Department Manager
        dept_manager, created = User.objects.get_or_create(
            username='deptmanager',
            defaults={
                'email': 'deptmanager@example.com',
                'password': default_password,
                'is_active': True,
                'role': roles['dept_manager'],
                'department': departments['marketing']
            }
        )
        
        if created:
            UserInfo.objects.create(
                user=dept_manager,
                first_name='Department',
                last_name='Manager',
                gender='Female',
                phone='2345678901'
            )
            self.stdout.write(self.style.SUCCESS('Created Department Manager user: deptmanager / password123'))
        
        # Create Warehouse Manager
        warehouse_manager, created = User.objects.get_or_create(
            username='warehousemanager',
            defaults={
                'email': 'warehouse@example.com',
                'password': default_password,
                'is_active': True,
                'role': roles['warehouse_manager'],
                'department': departments['warehouse']
            }
        )
        
        if created:
            UserInfo.objects.create(
                user=warehouse_manager,
                first_name='Warehouse',
                last_name='Manager',
                gender='Male',
                phone='3456789012'
            )
            self.stdout.write(self.style.SUCCESS('Created Warehouse Manager user: warehousemanager / password123'))
        
        # Create Staff user
        staff_user, created = User.objects.get_or_create(
            username='staff',
            defaults={
                'email': 'staff@example.com',
                'password': default_password,
                'is_active': True,
                'role': roles['staff'],
                'department': departments['hr']
            }
        )
        
        if created:
            UserInfo.objects.create(
                user=staff_user,
                first_name='Staff',
                last_name='User',
                gender='Female',
                phone='4567890123'
            )
            self.stdout.write(self.style.SUCCESS('Created Staff user: staff / password123')) 