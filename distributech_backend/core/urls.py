from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    UserViewSet, RoleViewSet, DepartmentViewSet,
    OrderStatusViewSet, ItemViewSet, OrderItemViewSet,
    CommentViewSet, AttachmentViewSet, public_roles, public_departments,
    public_orders, public_items, public_order_items, public_stock,
    public_order_status, public_order_detail
)
from .order_views import OrderViewSet
from .stock_views import StockViewSet
from .chat_views import ConversationViewSet, MessageViewSet
from .views_email import (
    email_test, public_email_test, order_notification, stock_alert,
    update_order_status
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
router.register(r'conversations', ConversationViewSet)
router.register(r'messages', MessageViewSet)

# Register action routes manually
stock_alert_route = StockViewSet.as_view({'post': 'alert'})
order_notify_route = OrderViewSet.as_view({'post': 'notify'})

urlpatterns = [
    path('', include(router.urls)),
    path('auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Email endpoints
    path('email/test/', email_test, name='email-test'),
    path('public/email/test/', public_email_test, name='public-email-test'),
    path('orders/<int:order_id>/notify/', order_notification, name='order-notification'),
    path('items/<int:item_id>/stock-alert/', stock_alert, name='stock-alert'),
    
    # Order status update endpoint (public)
    path('public/orders/<int:order_id>/status/', update_order_status, name='update-order-status'),
    
    # Public endpoints that don't require authentication
    path('public/roles/', public_roles, name='public-roles'),
    path('public/departments/', public_departments, name='public-departments'),
    path('public/orders/', public_orders, name='public-orders'),
    path('public/orders/<int:order_id>/', public_order_detail, name='public-order-detail'),
    path('public/items/', public_items, name='public-items'),
    path('public/order-items/', public_order_items, name='public-order-items'),
    path('public/stock/', public_stock, name='public-stock'),
    path('public/order-status/', public_order_status, name='public-order-status'),
] 