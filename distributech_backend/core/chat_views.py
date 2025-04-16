from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Q

from .models import User, Conversation, Message
from .serializers import (
    UserSerializer, ConversationSerializer, 
    ConversationDetailSerializer, MessageSerializer
)
from .permissions import IsAuthenticatedAndActive


class ConversationViewSet(viewsets.ModelViewSet):
    queryset = Conversation.objects.all()
    serializer_class = ConversationSerializer
    permission_classes = [IsAuthenticatedAndActive]
    
    def get_serializer_class(self):
        if self.action == 'retrieve' or self.action == 'messages':
            return ConversationDetailSerializer
        return ConversationSerializer
    
    def get_queryset(self):
        user = self.request.user
        return Conversation.objects.filter(participants=user)
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Extract user ids from the validated data
        participant_ids = serializer.validated_data.pop('participants')
        
        # Ensure the requesting user is included in the participants
        if request.user.id not in [user.id for user in participant_ids]:
            participant_ids.append(request.user)
        
        # Check if a conversation with these exact participants already exists
        # Get all conversations where the requesting user is a participant
        user_conversations = Conversation.objects.filter(participants=request.user)
        
        # For each conversation, check if it contains exactly the same participants
        for conversation in user_conversations:
            conversation_participants = set(conversation.participants.all().values_list('id', flat=True))
            request_participants = set(user.id for user in participant_ids)
            
            if conversation_participants == request_participants:
                return Response(
                    ConversationSerializer(conversation).data, 
                    status=status.HTTP_200_OK
                )
        
        # Create a new conversation if none exists
        conversation = Conversation.objects.create(**serializer.validated_data)
        conversation.participants.set(participant_ids)
        conversation.save()
        
        headers = self.get_success_headers(serializer.data)
        return Response(
            ConversationSerializer(conversation).data, 
            status=status.HTTP_201_CREATED, 
            headers=headers
        )
    
    @action(detail=True, methods=['post'])
    def messages(self, request, pk=None):
        conversation = self.get_object()
        print(f"Processing message in conversation {pk} by user {request.user.username}")
        
        serializer = MessageSerializer(data=request.data)
        print(f"Request data: {request.data}")
        
        if serializer.is_valid():
            print(f"Serializer is valid")
            message = serializer.save(
                conversation=conversation,
                sender=request.user
            )
            print(f"Message saved with ID: {message.id}")
            # Update conversation's last activity timestamp
            conversation.save()  # This will trigger auto_now update on updated_at field
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        print(f"Serializer errors: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def find_by_username(self, request):
        """Find or create a conversation with a user by their username"""
        username = request.data.get('username')
        
        if not username:
            return Response(
                {"error": "Username is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            other_user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response(
                {"error": f"User with username {username} not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Don't allow conversations with yourself
        if other_user.id == request.user.id:
            return Response(
                {"error": "Cannot create conversation with yourself"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Find existing conversation between these users
        user_conversations = Conversation.objects.filter(participants=request.user)
        for conversation in user_conversations:
            if conversation.participants.filter(id=other_user.id).exists():
                return Response(
                    ConversationDetailSerializer(conversation).data, 
                    status=status.HTTP_200_OK
                )
        
        # Create new conversation if none exists
        conversation = Conversation.objects.create()
        conversation.participants.add(request.user, other_user)
        
        return Response(
            ConversationDetailSerializer(conversation).data, 
            status=status.HTTP_201_CREATED
        )


class MessageViewSet(viewsets.ModelViewSet):
    queryset = Message.objects.all()
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticatedAndActive]
    
    def get_queryset(self):
        user = self.request.user
        return Message.objects.filter(
            Q(conversation__participants=user)
        ).distinct()
    
    def perform_create(self, serializer):
        conversation = serializer.validated_data.get('conversation')
        
        # Check if user is part of the conversation
        if not conversation.participants.filter(id=self.request.user.id).exists():
            raise permissions.PermissionDenied("You are not a participant in this conversation")
        
        serializer.save(sender=self.request.user)
        
        # Update conversation's last activity timestamp
        conversation.save()  # This will trigger auto_now update on updated_at field
    
    @action(detail=False, methods=['post'])
    def mark_read(self, request):
        conversation_id = request.data.get('conversation_id')
        if not conversation_id:
            return Response(
                {"error": "Conversation ID is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            conversation = Conversation.objects.get(id=conversation_id)
        except Conversation.DoesNotExist:
            return Response(
                {"error": "Conversation not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if user is part of the conversation
        if not conversation.participants.filter(id=request.user.id).exists():
            return Response(
                {"error": "You are not a participant in this conversation"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Mark all messages not sent by the user as read
        unread_messages = Message.objects.filter(
            conversation=conversation,
            is_read=False
        ).exclude(sender=request.user)
        
        updated_count = unread_messages.update(is_read=True)
        
        return Response(
            {"message": f"Marked {updated_count} messages as read"}, 
            status=status.HTTP_200_OK
        ) 