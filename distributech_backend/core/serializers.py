from rest_framework import serializers
from .models import (
    User, UserInfo, Role, Department, Order, OrderStatus, 
    Item, OrderItem, Stock, Comment, Attachment
)

class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ['id', 'name']

class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = ['id', 'name']

class UserInfoSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserInfo
        fields = [
            'user', 'first_name', 'last_name', 'gender', 'phone',
            'country', 'city', 'address', 'postal_code', 'date_of_birth'
        ]

class UserSerializer(serializers.ModelSerializer):
    role = RoleSerializer(read_only=True)
    department = DepartmentSerializer(read_only=True)
    role_id = serializers.PrimaryKeyRelatedField(
        queryset=Role.objects.all(), source='role', write_only=True
    )
    department_id = serializers.PrimaryKeyRelatedField(
        queryset=Department.objects.all(), source='department', write_only=True
    )
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'role', 'department', 
            'role_id', 'department_id', 'created_at', 'updated_at'
        ]
        extra_kwargs = {
            'password': {'write_only': True}
        }
    
    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = User.objects.create(**validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user

class UserDetailSerializer(UserSerializer):
    user_info = UserInfoSerializer(read_only=True)
    
    class Meta(UserSerializer.Meta):
        fields = UserSerializer.Meta.fields + ['user_info']

class ItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = Item
        fields = ['id', 'name', 'description', 'measurement_unit', 'price', 'created_at']

class OrderItemSerializer(serializers.ModelSerializer):
    item = ItemSerializer(read_only=True)
    item_id = serializers.PrimaryKeyRelatedField(
        queryset=Item.objects.all(), source='item', write_only=True
    )
    
    class Meta:
        model = OrderItem
        fields = ['id', 'order', 'item', 'item_id', 'quantity', 'price_at_order_time']

class StockSerializer(serializers.ModelSerializer):
    item = ItemSerializer(read_only=True)
    item_id = serializers.PrimaryKeyRelatedField(
        queryset=Item.objects.all(), source='item', write_only=True
    )
    supplier = UserSerializer(read_only=True)
    supplier_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source='supplier', write_only=True
    )
    
    class Meta:
        model = Stock
        fields = [
            'id', 'item', 'item_id', 'current_stock', 
            'minimum_threshold', 'supplier', 'supplier_id', 'updated_at'
        ]

class CommentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source='user', write_only=True
    )
    
    class Meta:
        model = Comment
        fields = ['id', 'order', 'user', 'user_id', 'comment_text', 'created_at']

class AttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attachment
        fields = ['id', 'order', 'file_url', 'uploaded_at']

class OrderStatusSerializer(serializers.ModelSerializer):
    updated_by = UserSerializer(read_only=True)
    updated_by_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source='updated_by', write_only=True, required=False
    )
    
    class Meta:
        model = OrderStatus
        fields = [
            'id', 'order', 'status', 'current_location', 'location_timestamp',
            'updated_by', 'updated_by_id', 'remarks', 'expected_delivery_date'
        ]

class OrderSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source='user', write_only=True
    )
    
    class Meta:
        model = Order
        fields = ['id', 'user', 'user_id', 'status', 'created_at', 'updated_at']

class OrderDetailSerializer(OrderSerializer):
    order_items = OrderItemSerializer(many=True, read_only=True, source='orderitem_set')
    comments = CommentSerializer(many=True, read_only=True, source='comment_set')
    attachments = AttachmentSerializer(many=True, read_only=True, source='attachment_set')
    order_statuses = OrderStatusSerializer(many=True, read_only=True, source='orderstatus_set')
    
    class Meta(OrderSerializer.Meta):
        fields = OrderSerializer.Meta.fields + ['order_items', 'comments', 'attachments', 'order_statuses'] 