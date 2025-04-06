"""
Stock-related views for DistribuTech
"""
from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
import threading

from .models import Stock
from .serializers import StockSerializer
from .permissions import IsSuperAdmin, IsDepartmentManager, IsWarehouseManager, IsSupplier, IsAdministrator
from .utils.email_utils import send_stock_alert

class StockViewSet(viewsets.ModelViewSet):
    queryset = Stock.objects.all()
    serializer_class = StockSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['item', 'supplier']
    

    
    def perform_create(self, serializer):
        """Create stock and check if alerts need to be sent"""
        stock = serializer.save()
        self._check_stock_levels(stock)
    
    def perform_update(self, serializer):
        """Update stock and check if alerts need to be sent"""
        stock = serializer.save()
        self._check_stock_levels(stock)
    
    def _check_stock_levels(self, stock):
        """Check if stock levels are below threshold and send alert if needed"""
        if stock.current_stock <= stock.minimum_threshold:
            # Send email alert in a background thread
            email_thread = threading.Thread(
                target=send_stock_alert,
                args=(stock.item, stock)
            )
            email_thread.start()
    
    @action(detail=True, methods=['post'])
    def alert(self, request, pk=None):
        """Manually trigger a stock alert email"""
        stock = self.get_object()
        
        # Get email from request or use defaults
        email = request.data.get('email')
        
        # Send alert
        success = send_stock_alert(stock.item, stock, email)
        
        if success:
            return Response({
                'success': True,
                'message': f'Stock alert for {stock.item.name} sent successfully'
            })
        else:
            return Response({
                'success': False,
                'message': 'Failed to send stock alert. Check server logs for details.'
            }, status=500) 