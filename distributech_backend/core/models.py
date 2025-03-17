from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.utils import timezone

# Enum for gender choices
class Gender(models.TextChoices):
    MALE = 'Male', 'Male'
    FEMALE = 'Female', 'Female'
    OTHER = 'Other', 'Other'

# Enum for order status choices
class OrderStatusChoices(models.TextChoices):
    PENDING = 'Pending', 'Pending'
    PROCESSING = 'Processing', 'Processing'
    SHIPPED = 'Shipped', 'Shipped'
    IN_TRANSIT = 'In Transit', 'In Transit'
    DELIVERED = 'Delivered', 'Delivered'
    COMPLETED = 'Completed', 'Completed'
    CANCELLED = 'Cancelled', 'Cancelled'

# Custom user manager
class UserManager(BaseUserManager):
    def create_user(self, username, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        if not username:
            raise ValueError('The Username field must be set')
        
        email = self.normalize_email(email)
        user = self.model(username=username, email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, username, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        
        # Get or create superadmin role
        from .models import Role, Department
        superadmin_role, _ = Role.objects.get_or_create(name='SuperAdmin')
        admin_dept, _ = Department.objects.get_or_create(name='Administration')
        
        extra_fields.setdefault('role_id', superadmin_role.id)
        extra_fields.setdefault('department_id', admin_dept.id)
        
        return self.create_user(username, email, password, **extra_fields)

# Role model
class Role(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=50, unique=True, null=False)
    
    def __str__(self):
        return self.name

# Department model
class Department(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100, unique=True, null=False)
    
    def __str__(self):
        return self.name

# Custom User model
class User(AbstractBaseUser, PermissionsMixin):
    id = models.AutoField(primary_key=True)
    username = models.CharField(max_length=50, unique=True, null=False)
    email = models.EmailField(max_length=100, unique=True, null=False)
    password_hash = models.CharField(max_length=255, null=False)
    role = models.ForeignKey(Role, on_delete=models.CASCADE, null=False)
    department = models.ForeignKey(Department, on_delete=models.CASCADE, null=False)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Required for AbstractBaseUser
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    
    objects = UserManager()
    
    USERNAME_FIELD = 'username'
    EMAIL_FIELD = 'email'
    REQUIRED_FIELDS = ['email']
    
    def __str__(self):
        return self.username
    
    def save(self, *args, **kwargs):
        # This ensures that password_hash is always the same as the hashed password
        if self.password and not self._password:
            self.password_hash = self.password
        super().save(*args, **kwargs)

# User Info model
class UserInfo(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True)
    first_name = models.CharField(max_length=50, null=False)
    last_name = models.CharField(max_length=50, null=False)
    gender = models.CharField(max_length=10, choices=Gender.choices, null=False)
    phone = models.CharField(max_length=20, null=True, blank=True)
    country = models.CharField(max_length=50, null=True, blank=True)
    city = models.CharField(max_length=50, null=True, blank=True)
    address = models.TextField(null=True, blank=True)
    postal_code = models.CharField(max_length=20, null=True, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.first_name} {self.last_name}"

# Order model
class Order(models.Model):
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=False)
    status = models.CharField(max_length=50, null=False)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Order #{self.id}"

# Order Status model
class OrderStatus(models.Model):
    id = models.AutoField(primary_key=True)
    order = models.ForeignKey(Order, on_delete=models.CASCADE, null=False)
    status = models.CharField(max_length=20, choices=OrderStatusChoices.choices, null=False)
    current_location = models.CharField(max_length=255, null=True, blank=True)
    location_timestamp = models.DateTimeField(null=False)
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    remarks = models.TextField(null=True, blank=True)
    expected_delivery_date = models.DateField(null=True, blank=True)
    
    def __str__(self):
        return f"Status: {self.status} for {self.order}"

# Item model
class Item(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100, null=False)
    description = models.TextField(null=True, blank=True)
    measurement_unit = models.CharField(max_length=50, null=True, blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, null=False)
    created_at = models.DateTimeField(default=timezone.now)
    
    def __str__(self):
        return self.name

# Order Item model
class OrderItem(models.Model):
    id = models.AutoField(primary_key=True)
    order = models.ForeignKey(Order, on_delete=models.CASCADE, null=False)
    item = models.ForeignKey(Item, on_delete=models.CASCADE, null=False)
    quantity = models.IntegerField(null=False)
    price_at_order_time = models.DecimalField(max_digits=10, decimal_places=2, null=False)
    
    def __str__(self):
        return f"{self.quantity} x {self.item.name} in Order #{self.order.id}"

# Stock model
class Stock(models.Model):
    id = models.AutoField(primary_key=True)
    item = models.ForeignKey(Item, on_delete=models.CASCADE, null=False)
    current_stock = models.IntegerField(null=False)
    minimum_threshold = models.IntegerField(null=False)
    supplier = models.ForeignKey(User, on_delete=models.CASCADE, null=False)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Stock for {self.item.name}: {self.current_stock}"

# Comment model
class Comment(models.Model):
    id = models.AutoField(primary_key=True)
    order = models.ForeignKey(Order, on_delete=models.CASCADE, null=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=False)
    comment_text = models.TextField(null=False)
    created_at = models.DateTimeField(default=timezone.now)
    
    def __str__(self):
        return f"Comment by {self.user.username} on Order #{self.order.id}"

# Attachment model
class Attachment(models.Model):
    id = models.AutoField(primary_key=True)
    order = models.ForeignKey(Order, on_delete=models.CASCADE, null=False)
    file_url = models.TextField(null=False)
    uploaded_at = models.DateTimeField(default=timezone.now)
    
    def __str__(self):
        return f"Attachment for Order #{self.order.id}"
