from django.core.management.base import BaseCommand, CommandError
from core.models import Order, OrderStatus
from django.utils import timezone
import datetime

class Command(BaseCommand):
    help = 'Updates order statuses automatically for orders that are missing status entries'

    def add_arguments(self, parser):
        parser.add_argument('--days', type=int, default=7, help='Number of days to look back for orders')
        parser.add_argument('--status', type=str, default='Pending', help='Status to set for orders (Pending, Processing, Shipped, etc.)')
        parser.add_argument('--dry-run', action='store_true', help='Only show what would be done without actually updating')

    def handle(self, *args, **options):
        # Get orders from the last N days
        days = options['days']
        status = options['status']
        dry_run = options['dry_run']
        
        cutoff_date = timezone.now() - datetime.timedelta(days=days)
        
        # Find orders that don't have an OrderStatus entry
        orders_without_status = []
        recent_orders = Order.objects.filter(created_at__gte=cutoff_date)
        
        for order in recent_orders:
            if not OrderStatus.objects.filter(order=order).exists():
                orders_without_status.append(order)
        
        self.stdout.write(f"Found {len(orders_without_status)} orders without status entries")
        
        if dry_run:
            self.stdout.write(self.style.WARNING("Dry run mode - no changes will be made"))
            
        # Create OrderStatus entries for orders without them
        created_count = 0
        for order in orders_without_status:
            if not dry_run:
                OrderStatus.objects.create(
                    order=order,
                    status=status,
                    location_timestamp=timezone.now(),
                    remarks=f"Auto-created status for order {order.id}",
                    expected_delivery_date=timezone.now().date() + datetime.timedelta(days=7)
                )
                created_count += 1
            
            self.stdout.write(f"Order #{order.id} - Created by: {order.user.username} - Current status: {order.status}")
        
        if not dry_run:
            self.stdout.write(self.style.SUCCESS(f"Successfully created {created_count} order status entries"))
        else:
            self.stdout.write(self.style.SUCCESS(f"Would create {len(orders_without_status)} order status entries")) 