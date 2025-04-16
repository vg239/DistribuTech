"""
Views for handling email operations in DistribuTech
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
import datetime

from .models import Order, Item, Stock, OrderStatus, OrderStatusChoices
from .utils.email_utils import send_test_email, send_order_notification, send_stock_alert, send_status_change_notification
from .serializers import OrderStatusSerializer

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def email_test(request):
    """
    Test the email functionality (authenticated)
    """
    # Get email from request or use logged-in user's email
    email = request.data.get('email', request.user.email)
    
    if not email:
        return Response({
            'success': False,
            'message': 'Email is required'
        }, status=400)
    
    # Send test email
    success = send_test_email(email)
    
    if success:
        return Response({
            'success': True,
            'message': f'Test email sent successfully to {email}'
        })
    else:
        return Response({
            'success': False,
            'message': 'Failed to send test email. Check server logs for details.'
        }, status=500)

@api_view(['POST'])
@permission_classes([AllowAny])
def public_email_test(request):
    """
    Send a test email without requiring authentication
    
    POST payload:
    - email: Email address to send test to (required)
    """
    email = request.data.get('email')
    
    if not email:
        return Response({
            'success': False,
            'message': 'Email address is required'
        }, status=400)
    
    # Send test email
    success = send_test_email(email)
    
    if success:
        return Response({
            'success': True,
            'message': f'Test email sent successfully to {email}'
        })
    else:
        return Response({
            'success': False,
            'message': 'Failed to send test email. Check server logs for details.'
        }, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def order_notification(request, order_id):
    """
    Send an order notification email
    
    URL parameters:
    - order_id: ID of the order to send notification for
    
    POST payload:
    - email: Email address to send to (optional, defaults to order creator's email)
    """
    # Get the order
    order = get_object_or_404(Order, id=order_id)
    
    # Use provided email or let the function use defaults
    email = request.data.get('email')
    
    # Send order notification
    success = send_order_notification(order, email)
    
    if success:
        return Response({
            'success': True,
            'message': f'Order notification for Order #{order_id} sent successfully'
        })
    else:
        return Response({
            'success': False,
            'message': 'Failed to send order notification. Check server logs for details.'
        }, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def stock_alert(request, item_id):
    """
    Send a stock alert email
    
    URL parameters:
    - item_id: ID of the item to send stock alert for
    
    POST payload:
    - email: Email address to send to (optional)
    """
    # Get the item and its stock
    item = get_object_or_404(Item, id=item_id)
    stock = get_object_or_404(Stock, item=item)
    
    # Use provided email or let the function use defaults
    email = request.data.get('email')
    
    # Send stock alert
    success = send_stock_alert(item, stock, email)
    
    if success:
        return Response({
            'success': True,
            'message': f'Stock alert for {item.name} sent successfully'
        })
    else:
        return Response({
            'success': False,
            'message': 'Failed to send stock alert. Check server logs for details.'
        }, status=500)

@api_view(['POST'])
@permission_classes([AllowAny])
def update_order_status(request, order_id):
    """
    Update order status and send notification email
    This endpoint is intentionally left without permission restrictions as requested
    
    Request params:
    - status: New status (Pending, Processing, Shipped, etc.)
    - current_location: Current location of the order
    - remarks: Any additional remarks
    - expected_delivery_date: Expected delivery date (YYYY-MM-DD)
    - email: Optional email to send notification to (defaults to manager@distributech.com)
    """
    try:
        # Get order
        order = Order.objects.get(id=order_id)
    except Order.DoesNotExist:
        return Response({
            'success': False,
            'message': f'Order with ID {order_id} not found'
        }, status=404)
    
    # Get data from request
    status = request.data.get('status')
    current_location = request.data.get('current_location', '')
    remarks = request.data.get('remarks', '')
    expected_delivery_date_str = request.data.get('expected_delivery_date')
    notification_email = request.data.get('email')
    
    # Validate status
    if not status:
        return Response({
            'success': False,
            'message': 'Status is required'
        }, status=400)
    
    # Check if status is valid
    if status not in dict(OrderStatusChoices.choices):
        return Response({
            'success': False,
            'message': f'Invalid status. Valid options are: {", ".join(dict(OrderStatusChoices.choices).keys())}'
        }, status=400)
    
    # Parse expected delivery date if provided
    expected_delivery_date = None
    if expected_delivery_date_str:
        try:
            expected_delivery_date = datetime.datetime.strptime(expected_delivery_date_str, '%Y-%m-%d').date()
        except ValueError:
            return Response({
                'success': False,
                'message': 'Invalid expected_delivery_date format. Use YYYY-MM-DD.'
            }, status=400)
    
    # Create new order status
    order_status = OrderStatus.objects.create(
        order=order,
        status=status,
        current_location=current_location,
        location_timestamp=timezone.now(),
        remarks=remarks,
        expected_delivery_date=expected_delivery_date,
        updated_by=request.user if request.user.is_authenticated else None
    )
    
    # Update order status field
    order.status = status
    order.save()
    
    # Send notification email
    success = send_status_change_notification(order_status, notification_email)
    
    return Response({
        'success': True,
        'message': f'Order status updated to {status}',
        'notification_sent': success,
        'order_status': OrderStatusSerializer(order_status).data
    }) 