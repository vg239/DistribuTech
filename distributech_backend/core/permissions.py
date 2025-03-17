from functools import wraps
from rest_framework.permissions import BasePermission
from django.http import HttpResponseForbidden

# Role-based permission classes for DRF
class IsSuperAdmin(BasePermission):
    """
    Permission check for SuperAdmin role
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role.name == 'SuperAdmin'

class IsDepartmentManager(BasePermission):
    """
    Permission check for Department Manager role
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role.name == 'Department Manager'

class IsWarehouseManager(BasePermission):
    """
    Permission check for Warehouse Manager role
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role.name == 'Warehouse Manager'

class IsSupplier(BasePermission):
    """
    Permission check for Supplier role
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role.name == 'Supplier'

class IsAdministrator(BasePermission):
    """
    Permission check for Administrator role
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role.name == 'Administrator'

# Function decorators for view functions
def superadmin_required(view_func):
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        if request.user.is_authenticated and request.user.role.name == 'SuperAdmin':
            return view_func(request, *args, **kwargs)
        return HttpResponseForbidden("You don't have permission to access this resource.")
    return _wrapped_view

def department_manager_required(view_func):
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        if request.user.is_authenticated and request.user.role.name == 'Department Manager':
            return view_func(request, *args, **kwargs)
        return HttpResponseForbidden("You don't have permission to access this resource.")
    return _wrapped_view

def warehouse_manager_required(view_func):
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        if request.user.is_authenticated and request.user.role.name == 'Warehouse Manager':
            return view_func(request, *args, **kwargs)
        return HttpResponseForbidden("You don't have permission to access this resource.")
    return _wrapped_view

def supplier_required(view_func):
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        if request.user.is_authenticated and request.user.role.name == 'Supplier':
            return view_func(request, *args, **kwargs)
        return HttpResponseForbidden("You don't have permission to access this resource.")
    return _wrapped_view

def administrator_required(view_func):
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        if request.user.is_authenticated and request.user.role.name == 'Administrator':
            return view_func(request, *args, **kwargs)
        return HttpResponseForbidden("You don't have permission to access this resource.")
    return _wrapped_view

# More flexible decorator that accepts multiple roles
def role_required(allowed_roles):
    def decorator(view_func):
        @wraps(view_func)
        def _wrapped_view(request, *args, **kwargs):
            if request.user.is_authenticated and request.user.role.name in allowed_roles:
                return view_func(request, *args, **kwargs)
            return HttpResponseForbidden("You don't have permission to access this resource.")
        return _wrapped_view
    return decorator 