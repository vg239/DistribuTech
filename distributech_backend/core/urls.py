from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    UserViewSet, RoleViewSet, DepartmentViewSet, OrderViewSet,
    OrderStatusViewSet, ItemViewSet, OrderItemViewSet, StockViewSet,
    CommentViewSet, AttachmentViewSet, public_roles, public_departments
)

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'roles', RoleViewSet)
router.register(r'departments', DepartmentViewSet)
router.register(r'orders', OrderViewSet)
router.register(r'order-status', OrderStatusViewSet)
router.register(r'items', ItemViewSet)
router.register(r'order-items', OrderItemViewSet)
router.register(r'stock', StockViewSet)
router.register(r'comments', CommentViewSet)
router.register(r'attachments', AttachmentViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Public endpoints that don't require authentication
    path('public/roles/', public_roles, name='public-roles'),
    path('public/departments/', public_departments, name='public-departments'),
] 