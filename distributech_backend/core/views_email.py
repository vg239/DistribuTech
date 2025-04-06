"""
Views for handling email operations in DistribuTech
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from .models import Order, Item, Stock
from .utils.email_utils import send_test_email, send_order_notification, send_stock_alert

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def email_test(request):
    """
    Send a test email to verify email functionality
    Requires authentication
    
    POST payload:
    - email: Email address to send test to (optional, defaults to user email)
    """
    # Use provided email or fall back to user's email
    email = request.data.get('email', request.user.email)
    
    if not email:
        return Response({
            'success': False,
            'message': 'No email address provided or found in user profile'
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