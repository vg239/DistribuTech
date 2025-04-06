"""
Email utilities for sending notifications in DistribuTech
"""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from django.conf import settings
from django.utils import timezone

def send_email(recipients, subject, html_content, text_content=None):
    """
    Simple function to send an email using the configured email settings
    
    Args:
        recipients: List or string of email addresses
        subject: Email subject
        html_content: HTML content of the email
        text_content: Plain text version (optional)
        
    Returns:
        Boolean indicating success or failure
    """
    # Process recipients if it's a string
    if isinstance(recipients, str):
        recipients = [r.strip() for r in recipients.split(',') if r.strip()]
    
    if not recipients:
        return False
    
    # Get email settings from Django settings
    smtp_server = settings.EMAIL_HOST
    smtp_port = settings.EMAIL_PORT
    smtp_user = settings.EMAIL_HOST_USER
    smtp_password = settings.EMAIL_HOST_PASSWORD
    from_email = settings.DEFAULT_FROM_EMAIL
    
    # Create message
    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From'] = from_email
    msg['To'] = ', '.join(recipients)
    
    # Attach text content if provided
    if text_content:
        msg.attach(MIMEText(text_content, 'plain'))
    
    # Attach HTML content
    msg.attach(MIMEText(html_content, 'html'))
    
    try:
        # Connect to SMTP server and send email
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            if settings.EMAIL_USE_TLS:
                server.starttls()
            
            if smtp_user and smtp_password:
                server.login(smtp_user, smtp_password)
            
            server.sendmail(from_email, recipients, msg.as_string())
            
        return True
    except Exception as e:
        print(f"Error sending email: {e}")
        return False

def send_order_notification(order, recipient_email=None):
    """
    Send an order notification email
    
    Args:
        order: Order object
        recipient_email: Optional email address (defaults to order creator's email)
        
    Returns:
        Boolean indicating success or failure
    """
    from core.models import OrderItem
    
    # If no recipient provided, use order creator's email
    if not recipient_email and hasattr(order.user, 'email'):
        recipient_email = order.user.email
    
    if not recipient_email:
        return False
    
    # Get order items
    order_items = OrderItem.objects.filter(order=order)
    
    # Format email content
    subject = f"Order #{order.id} Notification"
    
    # Build items table
    items_html = ""
    total = 0
    
    for item in order_items:
        item_total = item.quantity * item.price_at_order_time
        total += item_total
        items_html += f"""
        <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">{item.item.name}</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">{item.quantity}</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${float(item.price_at_order_time):.2f}</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${float(item_total):.2f}</td>
        </tr>
        """
    
    html_content = f"""
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
            <h1 style="color: #0284c7; margin: 0 0 10px;">Order Notification</h1>
            <p>Your order has been received and is being processed.</p>
        </div>
        
        <div style="margin-bottom: 20px;">
            <h2 style="color: #0284c7; border-bottom: 2px solid #0284c7; padding-bottom: 5px;">Order Details</h2>
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <th style="text-align: left; padding: 8px;">Order Number:</th>
                    <td style="padding: 8px;">#{order.id}</td>
                </tr>
                <tr>
                    <th style="text-align: left; padding: 8px;">Date:</th>
                    <td style="padding: 8px;">{order.created_at.strftime('%B %d, %Y')}</td>
                </tr>
                <tr>
                    <th style="text-align: left; padding: 8px;">Status:</th>
                    <td style="padding: 8px;">{order.status}</td>
                </tr>
                <tr>
                    <th style="text-align: left; padding: 8px;">Department:</th>
                    <td style="padding: 8px;">{order.user.department.name}</td>
                </tr>
            </table>
        </div>
        
        <div style="margin-bottom: 20px;">
            <h2 style="color: #0284c7; border-bottom: 2px solid #0284c7; padding-bottom: 5px;">Order Items</h2>
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background-color: #f5f5f5;">
                        <th style="text-align: left; padding: 8px; border-bottom: 2px solid #ddd;">Item</th>
                        <th style="text-align: left; padding: 8px; border-bottom: 2px solid #ddd;">Quantity</th>
                        <th style="text-align: left; padding: 8px; border-bottom: 2px solid #ddd;">Unit Price</th>
                        <th style="text-align: left; padding: 8px; border-bottom: 2px solid #ddd;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {items_html}
                    <tr>
                        <td colspan="3" style="text-align: right; padding: 8px; font-weight: bold;">Total:</td>
                        <td style="padding: 8px; font-weight: bold;">${float(total):.2f}</td>
                    </tr>
                </tbody>
            </table>
        </div>
        
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; font-size: 12px; color: #666;">
            <p>Thank you for your order. If you have any questions, please contact your department manager.</p>
            <p>This is an automated message from DistribuTech Inventory Management System.</p>
        </div>
    </body>
    </html>
    """
    
    # Send the email
    return send_email([recipient_email], subject, html_content)

def send_stock_alert(item, stock, recipient_email=None):
    """
    Send a stock alert notification when inventory is low
    
    Args:
        item: Item object
        stock: Stock object
        recipient_email: Optional email address
        
    Returns:
        Boolean indicating success or failure
    """
    # If no recipient provided, use a default list
    if not recipient_email:
        recipient_email = "inventory@distributech.com"
    
    # Format email content
    subject = f"Low Stock Alert: {item.name}"
    
    html_content = f"""
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #fff3f3; padding: 20px; border-radius: 5px; margin-bottom: 20px; border-left: 5px solid #ef4444;">
            <h1 style="color: #ef4444; margin: 0 0 10px;">Low Stock Alert</h1>
            <p>The following item has fallen below its minimum threshold.</p>
        </div>
        
        <div style="margin-bottom: 20px;">
            <h2 style="color: #0284c7; border-bottom: 2px solid #0284c7; padding-bottom: 5px;">Item Details</h2>
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <th style="text-align: left; padding: 8px;">Item Name:</th>
                    <td style="padding: 8px;">{item.name}</td>
                </tr>
                <tr>
                    <th style="text-align: left; padding: 8px;">Current Stock:</th>
                    <td style="padding: 8px;">{stock.current_stock} {item.measurement_unit or 'units'}</td>
                </tr>
                <tr>
                    <th style="text-align: left; padding: 8px;">Minimum Threshold:</th>
                    <td style="padding: 8px;">{stock.minimum_threshold} {item.measurement_unit or 'units'}</td>
                </tr>
                <tr>
                    <th style="text-align: left; padding: 8px;">Price:</th>
                    <td style="padding: 8px;">${float(item.price):.2f}</td>
                </tr>
                <tr>
                    <th style="text-align: left; padding: 8px;">Supplier:</th>
                    <td style="padding: 8px;">{stock.supplier.username}</td>
                </tr>
            </table>
        </div>
        
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; font-size: 12px; color: #666;">
            <p>Please take appropriate action to restock this item.</p>
            <p>This is an automated message from DistribuTech Inventory Management System.</p>
        </div>
    </body>
    </html>
    """
    
    # Send the email
    return send_email([recipient_email], subject, html_content)

def send_test_email(recipient_email):
    """
    Send a test email to verify email functionality
    
    Args:
        recipient_email: Email address to send test to
        
    Returns:
        Boolean indicating success or failure
    """
    # Format current time for the email
    current_time = timezone.now().strftime("%Y-%m-%d %H:%M:%S")
    
    # Format email content
    subject = "DistribuTech Email Test"
    
    html_content = f"""
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f0f9ff; padding: 20px; border-radius: 5px; margin-bottom: 20px; border-left: 5px solid #0ea5e9;">
            <h1 style="color: #0284c7; margin: 0 0 10px;">DistribuTech Email Test</h1>
            <p>This is a test email sent at {current_time}.</p>
        </div>
        
        <div style="margin-bottom: 20px;">
            <h2 style="color: #0284c7; border-bottom: 2px solid #0284c7; padding-bottom: 5px;">Email Features Test</h2>
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <th style="text-align: left; padding: 8px; border-bottom: 1px solid #ddd;">Feature</th>
                    <th style="text-align: left; padding: 8px; border-bottom: 1px solid #ddd;">Status</th>
                </tr>
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">Email Delivery</td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">✅ Working</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">HTML Formatting</td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">✅ Working</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">Styling & Layout</td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">✅ Working</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">Mailtrap Integration</td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">✅ Working</td>
                </tr>
            </table>
        </div>
        
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; font-size: 12px; color: #666;">
            <p>If you received this email, the email notification system is configured correctly.</p>
            <p>This is a test message from DistribuTech Inventory Management System.</p>
        </div>
    </body>
    </html>
    """
    
    # Send the email
    return send_email([recipient_email], subject, html_content) 