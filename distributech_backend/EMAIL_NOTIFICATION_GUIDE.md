# Email Notification System Guide

This guide explains how to use the email notification system in DistribuTech.

## Available Email Notifications

The system can send email notifications for:

1. **Order Updates** - When orders are created or status changes
2. **Low Stock Alerts** - When inventory items fall below minimum threshold
3. **Test Emails** - For verifying email configuration

## Configuration

Email settings are configured in `distributech/settings.py`:

```python
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'sandbox.smtp.mailtrap.io'
EMAIL_PORT = 2525
EMAIL_USE_TLS = True
EMAIL_HOST_USER = '9b95507e4cc941'
EMAIL_HOST_PASSWORD = '0998606ce3fb67'
DEFAULT_FROM_EMAIL = 'DistribuTech <noreply@distributech.com>'
```

For production, replace these with your actual SMTP server details.

## API Endpoints

### Send Test Email
```
POST /api/email/test/
{
  "email": "recipient@example.com",
  "subject": "Optional custom subject"
}
```

### Send Order Notification
```
POST /api/email/order-notification/{order_id}/
{
  "email": "optional-recipient@example.com" 
}
```

### Trigger Stock Alert
```
POST /api/stock/{stock_id}/alert/
{
  "email": "optional-recipient@example.com"
}
```

## Management Commands

### Send Test Email
```bash
python manage.py send_test_email recipient@example.com
```

### Check Stock Levels
```bash
# Check and send alerts
python manage.py check_stock_levels

# Check without sending emails
python manage.py check_stock_levels --dry-run

# Send to specific email
python manage.py check_stock_levels --email warehouse@example.com
```

### Send Order Notification
```bash
# Send notification for order #123
python manage.py send_order_notification 123

# Send to specific email
python manage.py send_order_notification 123 --email manager@example.com

# Check without sending
python manage.py send_order_notification 123 --dry-run
```

## Automatic Notifications

The system automatically sends:

1. Order notifications when orders are created or updated
2. Stock alerts when stock is updated and falls below minimum threshold

## Email Templates

Email templates use a simple HTML structure with the following information:

### Order Notifications
- Order ID and reference number
- Customer details
- Order status
- Items in the order
- Total value
- Department responsible

### Stock Alerts
- Item name and SKU
- Current stock level
- Minimum threshold
- Measurement unit
- Warehouse location (if available)
- Reorder suggestions

## Troubleshooting

If emails are not being sent:

1. Check email settings in `settings.py`
2. Verify SMTP server connection
3. Check logs for email sending errors
4. Try sending a test email through the management command
5. Ensure recipient email addresses are valid

## Setting Up for Different Environments

### Development
Use the console backend to view emails in the console:
```python
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
```

### Testing
Use the file backend to save emails to files:
```python
EMAIL_BACKEND = 'django.core.mail.backends.filebased.EmailBackend'
EMAIL_FILE_PATH = 'sent_emails'
```

### Production
Use a real SMTP server:
```python
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
# Configure other SMTP settings
``` 