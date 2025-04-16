import { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';

export const ChatContext = createContext();

export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }) => {
  const { authAxios, isAuthenticated, user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all conversations for the current user
  const fetchConversations = async () => {
    if (!isAuthenticated) return;
    
    try {
      setLoading(true);
      const response = await authAxios.get('/conversations/');
      setConversations(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setError('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  // Fetch messages for a specific conversation
  const fetchMessages = async (conversationId) => {
    if (!conversationId) return;
    
    try {
      setLoading(true);
      const response = await authAxios.get(`/conversations/${conversationId}/`);
      setCurrentConversation(response.data);
      setMessages(response.data.messages || []);
      
      // Mark messages as read
      await authAxios.post('/messages/mark_read/', {
        conversation_id: conversationId
      });
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  // Send a message in the current conversation
  const sendMessage = async (content) => {
    if (!currentConversation) return;
    
    console.log('Sending message:', { 
      conversationId: currentConversation.id, 
      content
    });
    
    try {
      const response = await authAxios.post(`/conversations/${currentConversation.id}/messages/`, {
        content,
        conversation: currentConversation.id,
        sender_id: user.id
      });
      
      console.log('Message sent successfully:', response.data);
      
      // Update messages list with the new message
      setMessages(prevMessages => [...prevMessages, response.data]);
      return response.data;
    } catch (error) {
      console.error('Error sending message:', error.response?.data || error.message || error);
      setError('Failed to send message');
      return null;
    }
  };

  // Start a new conversation with a user by username
  const startConversationByUsername = async (username) => {
    try {
      setLoading(true);
      const response = await authAxios.post('/conversations/find_by_username/', {
        username
      });
      
      // Update conversation list with the new conversation
      await fetchConversations();
      
      // Set the current conversation to the new one
      setCurrentConversation(response.data);
      setMessages(response.data.messages || []);
      
      return response.data;
    } catch (error) {
      console.error('Error starting conversation:', error);
      setError(error.response?.data?.error || 'Failed to start conversation');
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchConversations();
    }
  }, [isAuthenticated]);

  const value = {
    conversations,
    currentConversation,
    messages,
    loading,
    error,
    fetchConversations,
    fetchMessages,
    sendMessage,
    startConversationByUsername,
    setCurrentConversation
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}; 