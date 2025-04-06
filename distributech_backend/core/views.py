from django.shortcuts import render
from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import (
    User, UserInfo, Role, Department, Order, OrderStatus,
    Item, OrderItem, Stock, Comment, Attachment
)
from .serializers import (
    UserSerializer, UserDetailSerializer, UserInfoSerializer, RoleSerializer,
    DepartmentSerializer, OrderSerializer, OrderDetailSerializer, OrderStatusSerializer,
    ItemSerializer, OrderItemSerializer, StockSerializer, CommentSerializer,
    AttachmentSerializer
)
from .permissions import (
    IsSuperAdmin, IsDepartmentManager, IsWarehouseManager,
    IsSupplier, IsAdministrator
)
from rest_framework.permissions import AllowAny

class RoleViewSet(viewsets.ModelViewSet):
    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]

class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [permissions.IsAuthenticated, IsSuperAdmin | IsAdministrator]

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated, IsSuperAdmin | IsAdministrator]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['role', 'department']
    search_fields = ['username', 'email']
    
    def get_serializer_class(self):
        if self.action == 'retrieve' or self.action == 'me':
            return UserDetailSerializer
        return UserSerializer
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def me(self, request):
        serializer = UserDetailSerializer(request.user)
        return Response(serializer.data)

class ItemViewSet(viewsets.ModelViewSet):
    queryset = Item.objects.all()
    serializer_class = ItemSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    search_fields = ['name', 'description']
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [permissions.IsAuthenticated]
        elif self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [permissions.IsAuthenticated, IsWarehouseManager | IsSupplier | IsSuperAdmin]
        else:
            permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]
        return [permission() for permission in permission_classes]

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
        
        # Send email notification asynchronously (don't block the request)
        from .utils.email_utils import send_order_notification
        import threading
        
        # Create a thread to send the email
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
        from .utils.email_utils import send_order_notification
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

class OrderStatusViewSet(viewsets.ModelViewSet):
    queryset = OrderStatus.objects.all().order_by('-location_timestamp')
    serializer_class = OrderStatusSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['order', 'status']
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'create', 'update', 'partial_update']:
            permission_classes = [permissions.IsAuthenticated]
        elif self.action == 'destroy':
            permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]
        else:
            permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]
        return [permission() for permission in permission_classes]
    
    def perform_create(self, serializer):
        serializer.save(updated_by=self.request.user)

class OrderItemViewSet(viewsets.ModelViewSet):
    queryset = OrderItem.objects.all()
    serializer_class = OrderItemSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['order', 'item']
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [permissions.IsAuthenticated]
        elif self.action == 'create':
            permission_classes = [permissions.IsAuthenticated, IsDepartmentManager | IsSuperAdmin]
        elif self.action in ['update', 'partial_update', 'destroy']:
            permission_classes = [permissions.IsAuthenticated, IsDepartmentManager | IsSuperAdmin]
        else:
            permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]
        return [permission() for permission in permission_classes]

class StockViewSet(viewsets.ModelViewSet):
    queryset = Stock.objects.all()
    serializer_class = StockSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['item', 'supplier']
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [permissions.IsAuthenticated]
        elif self.action in ['create', 'update', 'partial_update']:
            permission_classes = [permissions.IsAuthenticated, IsWarehouseManager | IsSupplier | IsSuperAdmin]
        elif self.action == 'destroy':
            permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]
        else:
            permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]
        return [permission() for permission in permission_classes]

class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['order', 'user']
    search_fields = ['comment_text']
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'create']:
            permission_classes = [permissions.IsAuthenticated]
        elif self.action in ['update', 'partial_update']:
            permission_classes = [permissions.IsAuthenticated]  # You can only update your own comments
        elif self.action == 'destroy':
            permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]
        else:
            permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]
        return [permission() for permission in permission_classes]
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        # Check if the user is updating their own comment
        if instance.user != request.user and not request.user.role.name == 'SuperAdmin':
            return Response(
                {"detail": "You can only update your own comments."},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().update(request, *args, **kwargs)

class AttachmentViewSet(viewsets.ModelViewSet):
    queryset = Attachment.objects.all()
    serializer_class = AttachmentSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['order']
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [permissions.IsAuthenticated]
        elif self.action == 'create':
            permission_classes = [permissions.IsAuthenticated]  # Anyone authenticated can add attachments
        elif self.action in ['update', 'partial_update', 'destroy']:
            permission_classes = [permissions.IsAuthenticated, IsSuperAdmin | IsAdministrator]
        else:
            permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]
        return [permission() for permission in permission_classes]

@api_view(['GET'])
@permission_classes([AllowAny])
def public_roles(request):
    """
    Public endpoint to get all roles (used for registration)
    """
    roles = Role.objects.all()
    serializer = RoleSerializer(roles, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([AllowAny])
def public_departments(request):
    """
    Public endpoint to get all departments (used for registration)
    """
    departments = Department.objects.all()
    serializer = DepartmentSerializer(departments, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([AllowAny])
def public_orders(request):
    """
    Public endpoint to get all orders without authentication
    """
    orders = Order.objects.all().order_by('-created_at')
    
    # Get query parameters
    status = request.query_params.get('status', None)
    
    # Filter by status if provided
    if status:
        orders = orders.filter(status=status)
    
    # Use the detail serializer to include all related data
    serializer = OrderDetailSerializer(orders, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([AllowAny])
def public_items(request):
    """
    Public endpoint to get all items without authentication
    """
    items = Item.objects.all()
    serializer = ItemSerializer(items, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([AllowAny])
def public_order_items(request):
    """
    Public endpoint to get order items without authentication
    """
    # Get query parameter for order id
    order_id = request.query_params.get('order', None)
    
    if order_id:
        order_items = OrderItem.objects.filter(order_id=order_id)
    else:
        order_items = OrderItem.objects.all()
    
    serializer = OrderItemSerializer(order_items, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([AllowAny])
def public_stock(request):
    """
    Public endpoint to get stock information without authentication
    """
    # Get query parameter for item id
    item_id = request.query_params.get('item', None)
    
    if item_id:
        stock_items = Stock.objects.filter(item_id=item_id)
    else:
        stock_items = Stock.objects.all()
    
    serializer = StockSerializer(stock_items, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([AllowAny])
def public_order_status(request):
    """
    Public endpoint to get order status information without authentication
    """
    # Get query parameter for order id
    order_id = request.query_params.get('order', None)
    
    if order_id:
        order_statuses = OrderStatus.objects.filter(order_id=order_id).order_by('-location_timestamp')
    else:
        order_statuses = OrderStatus.objects.all().order_by('-location_timestamp')
    
    serializer = OrderStatusSerializer(order_statuses, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([AllowAny])
def public_order_detail(request, order_id):
    """
    Get detailed information about a specific order including items, statuses, etc.
    This endpoint is public and doesn't require authentication.
    
    URL parameters:
    - order_id: ID of the order to fetch
    """
    try:
        # Get order with related data
        order = Order.objects.get(id=order_id)
        
        # Get order items
        order_items = OrderItem.objects.filter(order=order).select_related('item')
        
        # Get order statuses
        order_statuses = OrderStatus.objects.filter(order=order).order_by('-location_timestamp')
        
        # Get comments
        comments = Comment.objects.filter(order=order).select_related('user').order_by('-created_at')
        
        # Get attachments
        attachments = Attachment.objects.filter(order=order)
        
        # Format order data
        order_data = {
            'id': order.id,
            'status': order.status,
            'created_at': order.created_at,
            'updated_at': order.updated_at,
            'user': {
                'id': order.user.id,
                'username': order.user.username,
                'email': order.user.email,
                'department': {
                    'id': order.user.department.id,
                    'name': order.user.department.name
                }
            },
            'items': [
                {
                    'id': order_item.id,
                    'item': {
                        'id': order_item.item.id,
                        'name': order_item.item.name,
                        'description': order_item.item.description,
                        'measurement_unit': order_item.item.measurement_unit,
                        'price': float(order_item.item.price)
                    },
                    'quantity': order_item.quantity,
                    'price_at_order_time': float(order_item.price_at_order_time),
                    'total': float(order_item.quantity * order_item.price_at_order_time)
                }
                for order_item in order_items
            ],
            'statuses': [
                {
                    'id': status.id,
                    'status': status.status,
                    'current_location': status.current_location,
                    'location_timestamp': status.location_timestamp,
                    'remarks': status.remarks,
                    'expected_delivery_date': status.expected_delivery_date,
                    'updated_by': status.updated_by.username if status.updated_by else None
                }
                for status in order_statuses
            ],
            'comments': [
                {
                    'id': comment.id,
                    'comment_text': comment.comment_text,
                    'created_at': comment.created_at,
                    'user': {
                        'id': comment.user.id,
                        'username': comment.user.username
                    }
                }
                for comment in comments
            ],
            'attachments': [
                {
                    'id': attachment.id,
                    'file_url': attachment.file_url,
                    'uploaded_at': attachment.uploaded_at
                }
                for attachment in attachments
            ]
        }
        
        # Calculate order total
        total = sum(item['total'] for item in order_data['items'])
        order_data['total'] = total
        
        return Response(order_data)
        
    except Order.DoesNotExist:
        return Response({'error': f'Order with ID {order_id} not found'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=500)
