"""
Management command to send notifications for a specific order
"""
from django.core.management.base import BaseCommand
from core.models import Order
from core.utils.email_utils import send_order_notification

class Command(BaseCommand):
    help = 'Send notification for a specific order'

    def add_arguments(self, parser):
        parser.add_argument(
            'order_id', 
            type=int, 
            help='ID of the order to send notification for'
        )
        parser.add_argument(
            '--email', 
            type=str, 
            help='Email address to send notification to (overrides default)'
        )
        parser.add_argument(
            '--dry-run', 
            action='store_true', 
            help='Check order but do not send email'
        )

    def handle(self, *args, **options):
        order_id = options['order_id']
        email = options.get('email')
        dry_run = options.get('dry_run', False)
        
        try:
            order = Order.objects.get(id=order_id)
        except Order.DoesNotExist:
            self.stdout.write(self.style.ERROR(f"Order with ID {order_id} does not exist"))
            return
        
        self.stdout.write(f"Preparing to send notification for Order #{order.id}")
        
        if dry_run:
            self.stdout.write(
                f"[DRY RUN] Would send notification for Order {order.id} "
                f"({order.get_status_display()}) to {email or 'default recipients'}"
            )
            self.stdout.write(self.style.WARNING("Dry run - no email was sent"))
            return
            
        success = send_order_notification(order, email)
        
        if success:
            self.stdout.write(self.style.SUCCESS(f"Notification sent for Order #{order.id}"))
        else:
            self.stdout.write(self.style.ERROR(f"Failed to send notification for Order #{order.id}")) 