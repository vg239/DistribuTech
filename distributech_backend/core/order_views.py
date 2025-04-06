"""
Order-related views for DistribuTech
"""
from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
import threading

from .models import Order
from .serializers import OrderSerializer, OrderDetailSerializer
from .permissions import IsSuperAdmin, IsDepartmentManager, IsWarehouseManager, IsSupplier, IsAdministrator
from .utils.email_utils import send_order_notification

class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all().order_by('-created_at')
    serializer_class = OrderSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['status', 'user__department']
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return OrderDetailSerializer
        return OrderSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [permissions.IsAuthenticated]
        elif self.action == 'create':
            permission_classes = [permissions.IsAuthenticated, IsDepartmentManager]
        elif self.action in ['update', 'partial_update']:
            permission_classes = [permissions.IsAuthenticated, IsDepartmentManager | IsWarehouseManager | IsSuperAdmin]
        elif self.action == 'destroy':
            permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]
        else:
            permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        user = self.request.user
        if user.role.name in ['SuperAdmin', 'Administrator', 'Warehouse Manager', 'Supplier']:
            return Order.objects.all()
        # Department managers can only see their department's orders
        elif user.role.name == 'Department Manager':
            return Order.objects.filter(user__department=user.department)
        return Order.objects.none()
    
    def perform_create(self, serializer):
        """Create order and send notification email"""
        # Save the order
        order = serializer.save()
        
        # Send email notification in a background thread to not block the request
        email_thread = threading.Thread(
            target=send_order_notification,
            args=(order,)
        )
        email_thread.start()
        
    @action(detail=True, methods=['post'])
    def notify(self, request, pk=None):
        """Manually send notification email for an order"""
        order = self.get_object()
        
        # Get email from request or use order user's email
        email = request.data.get('email', order.user.email)
        
        # Send notification
        success = send_order_notification(order, email)
        
        if success:
            return Response({
                'success': True,
                'message': f'Order notification for Order #{order.id} sent successfully'
            })
        else:
            return Response({
                'success': False,
                'message': 'Failed to send order notification. Check server logs for details.'
            }, status=500) 