"""
Management command to check stock levels and send alerts
"""
from django.core.management.base import BaseCommand
from django.db import models
from core.models import Stock
from core.utils.email_utils import send_stock_alert

class Command(BaseCommand):
    help = 'Check stock levels and send alerts for items below threshold'

    def add_arguments(self, parser):
        parser.add_argument(
            '--email', 
            type=str, 
            help='Email address to send alerts to (overrides default)'
        )
        parser.add_argument(
            '--dry-run', 
            action='store_true', 
            help='Check levels but do not send emails'
        )

    def handle(self, *args, **options):
        email = options.get('email')
        dry_run = options.get('dry_run', False)
        
        self.stdout.write("Checking stock levels...")
        
        # Get all stock items where current_stock <= minimum_threshold
        low_stock_items = Stock.objects.filter(current_stock__lte=models.F('minimum_threshold'))
        
        if not low_stock_items.exists():
            self.stdout.write(self.style.SUCCESS("No items below minimum threshold found"))
            return
        
        self.stdout.write(f"Found {low_stock_items.count()} items below minimum threshold:")
        
        for stock in low_stock_items:
            item = stock.item
            self.stdout.write(f"- {item.name}: {stock.current_stock} / {stock.minimum_threshold} {item.measurement_unit or 'units'}")
            
            if not dry_run:
                success = send_stock_alert(item, stock, email)
                if success:
                    self.stdout.write(self.style.SUCCESS(f"  Alert sent for {item.name}"))
                else:
                    self.stdout.write(self.style.ERROR(f"  Failed to send alert for {item.name}"))
            
        if dry_run:
            self.stdout.write(self.style.WARNING("Dry run - no emails were sent"))
        else:
            self.stdout.write(self.style.SUCCESS(f"Finished checking stock levels. Alerts sent for {low_stock_items.count()} items")) 