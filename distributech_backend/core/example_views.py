from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from rest_framework.decorators import api_view
from .permissions import (
    superadmin_required, department_manager_required, 
    warehouse_manager_required, supplier_required, 
    administrator_required, role_required
)

# Example function using superadmin_required decorator
@superadmin_required
@api_view(['GET'])
def system_stats(request):
    """
    Only SuperAdmins can access system statistics
    """
    # This view is restricted to SuperAdmin role only
    return JsonResponse({
        'users_count': 150,
        'orders_count': 320,
        'pending_orders': 45,
        'system_uptime': '7 days'
    })

# Example function using department_manager_required decorator
@department_manager_required
@api_view(['GET'])
def department_dashboard(request):
    """
    Only Department Managers can access their department dashboard
    """
    # This view is restricted to Department Manager role only
    department_name = request.user.department.name
    return JsonResponse({
        'department': department_name,
        'pending_orders': 12,
        'ordered_items': 56,
        'team_members': 8
    })

# Example function using warehouse_manager_required decorator
@warehouse_manager_required
@api_view(['GET'])
def warehouse_status(request):
    """
    Only Warehouse Managers can access warehouse status
    """
    # This view is restricted to Warehouse Manager role only
    return JsonResponse({
        'total_items': 487,
        'out_of_stock_items': 12,
        'pending_shipments': 8,
        'space_available': '60%'
    })

# Example function using supplier_required decorator
@supplier_required
@api_view(['GET'])
def supplier_dashboard(request):
    """
    Only Suppliers can access their supply dashboard
    """
    # This view is restricted to Supplier role only
    return JsonResponse({
        'supplied_items': 23,
        'pending_orders': 5,
        'total_revenue': '$15,000',
        'satisfaction_rate': '92%'
    })

# Example function using administrator_required decorator
@administrator_required
@api_view(['GET'])
def admin_panel(request):
    """
    Only Administrators can access the admin panel
    """
    # This view is restricted to Administrator role only
    return JsonResponse({
        'system_health': 'Good',
        'recent_activities': 15,
        'user_management_tasks': 3,
        'maintenance_tasks': 2
    })

# Example function using role_required decorator with multiple roles
@role_required(['Department Manager', 'Warehouse Manager'])
@api_view(['GET'])
def order_verification(request):
    """
    Only Department Managers and Warehouse Managers can verify orders
    """
    # This view is restricted to both Department Manager and Warehouse Manager roles
    return JsonResponse({
        'orders_to_verify': 7,
        'verification_queue': 'Normal',
        'last_verified': '2023-04-25 14:30'
    })

# Example function using role_required decorator with all roles except Supplier
@role_required(['SuperAdmin', 'Administrator', 'Department Manager', 'Warehouse Manager'])
@api_view(['GET'])
def internal_communications(request):
    """
    All internal team members except Suppliers can access this
    """
    # This view is restricted to all roles except Supplier
    return JsonResponse({
        'announcements': 2,
        'meetings': 3,
        'urgent_notices': 0
    })

# Public view accessible to any authenticated user regardless of role
@api_view(['GET'])
def public_data(request):
    """
    Any authenticated user can access this view
    """
    # This view is accessible to any authenticated user
    return JsonResponse({
        'company_name': 'DistribuTech',
        'contact_email': 'info@distributech.com',
        'business_hours': '9 AM - 5 PM'
    }) 