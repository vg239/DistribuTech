"""
Management command to test email functionality
"""
from django.core.management.base import BaseCommand
from core.utils.email_utils import send_test_email

class Command(BaseCommand):
    help = 'Send a test email to verify email configuration'

    def add_arguments(self, parser):
        parser.add_argument('email', type=str, help='Email address to send test to')

    def handle(self, *args, **options):
        email = options['email']
        self.stdout.write(f"Sending test email to {email}...")
        
        success = send_test_email(email)
        
        if success:
            self.stdout.write(self.style.SUCCESS(f"Test email sent successfully to {email}"))
        else:
            self.stdout.write(self.style.ERROR(f"Failed to send test email to {email}"))
            self.stdout.write("Check the email settings in your settings.py file") 