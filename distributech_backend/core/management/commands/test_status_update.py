"""
Management command to test order status update functionality
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from core.models import Order, OrderStatus, OrderStatusChoices
from core.utils.email_utils import send_status_change_notification

class Command(BaseCommand):
    help = 'Test order status update and email notification'

    def add_arguments(self, parser):
        parser.add_argument(
            'order_id', 
            type=int, 
            help='ID of the order to update'
        )
        parser.add_argument(
            '--status', 
            type=str, 
            default='Processing',
            help='New status (Pending, Processing, Shipped, etc.)'
        )
        parser.add_argument(
            '--location', 
            type=str, 
            default='Test Location',
            help='Current location of the order'
        )
        parser.add_argument(
            '--email', 
            type=str, 
            help='Email address to send notification to (defaults to manager@distributech.com)'
        )
        parser.add_argument(
            '--remarks', 
            type=str, 
            default='Status updated via management command',
            help='Remarks about the status update'
        )

    def handle(self, *args, **options):
        order_id = options['order_id']
        status = options['status']
        location = options['location']
        email = options.get('email')
        remarks = options['remarks']
        
        # Validate status
        if status not in dict(OrderStatusChoices.choices):
            self.stderr.write(self.style.ERROR(
                f"Invalid status '{status}'. Valid options are: {', '.join(dict(OrderStatusChoices.choices).keys())}"
            ))
            return
        
        try:
            # Get order
            order = Order.objects.get(id=order_id)
        except Order.DoesNotExist:
            self.stderr.write(self.style.ERROR(f"Order with ID {order_id} not found"))
            return
        
        self.stdout.write(f"Current status of Order #{order_id}: {order.status}")
        
        # Create new order status
        order_status = OrderStatus.objects.create(
            order=order,
            status=status,
            current_location=location,
            location_timestamp=timezone.now(),
            remarks=remarks,
            expected_delivery_date=timezone.now().date() + timezone.timedelta(days=7)
        )
        
        # Update order status field
        order.status = status
        order.save()
        
        self.stdout.write(self.style.SUCCESS(f"Order status updated to: {status}"))
        
        # Send notification email
        if email:
            self.stdout.write(f"Sending email notification to: {email}")
        else:
            self.stdout.write("Sending email notification to default manager address")
        
        success = send_status_change_notification(order_status, email)
        
        if success:
            self.stdout.write(self.style.SUCCESS("Email notification sent successfully"))
        else:
            self.stderr.write(self.style.ERROR("Failed to send email notification")) 