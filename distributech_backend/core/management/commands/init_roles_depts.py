from django.core.management.base import BaseCommand
from core.models import Role, Department

class Command(BaseCommand):
    help = 'Initialize roles and departments for DistribuTech'

    def handle(self, *args, **kwargs):
        # Create roles
        roles = [
            'SuperAdmin',
            'Department Manager',
            'Warehouse Manager',
            'Supplier',
            'Administrator',
        ]
        
        for role_name in roles:
            Role.objects.get_or_create(name=role_name)
            self.stdout.write(self.style.SUCCESS(f'Role "{role_name}" created or already exists'))
        
        # Create departments
        departments = [
            'Administration',
            'Operations',
            'Production',
            'Maintenance',
            'Research',
        ]
        
        for dept_name in departments:
            Department.objects.get_or_create(name=dept_name)
            self.stdout.write(self.style.SUCCESS(f'Department "{dept_name}" created or already exists'))
        
        self.stdout.write(self.style.SUCCESS('Successfully initialized roles and departments')) 