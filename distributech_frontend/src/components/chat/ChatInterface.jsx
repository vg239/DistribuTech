import { useState, useEffect, useRef } from 'react';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';

const ChatInterface = () => {
  const { currentConversation, messages, sendMessage, loading } = useChat();
  const { user } = useAuth();
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;
    
    await sendMessage(newMessage);
    setNewMessage('');
  };

  const getParticipantName = () => {
    if (!currentConversation) return '';
    
    const otherParticipant = currentConversation.participants.find(
      participant => participant.id !== user?.id
    );
    
    return otherParticipant ? `${otherParticipant.username}` : 'Unknown User';
  };

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Get initials for avatar
  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (!currentConversation) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-800">
        <div className="text-center p-6">
          <div className="mb-4 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">No conversation selected</h3>
          <p className="mt-2 text-gray-500 dark:text-gray-400">Select a conversation or start a new one</p>
        </div>
      </div>
    );
  }

  const participantName = getParticipantName();

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="flex items-center px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-full flex items-center justify-center bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-200 font-medium mr-3">
            {getInitials(participantName)}
          </div>
          <div>
            <h2 className="text-base font-medium text-gray-900 dark:text-white">{participantName}</h2>
            {currentConversation.online && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center">
                  <span className="h-2 w-2 rounded-full bg-green-500 mr-1"></span> Online
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Messages area */}
      <div className="flex-1 p-4 overflow-y-auto bg-gray-50 dark:bg-gray-900">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex justify-center items-center h-full">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <p>No messages yet</p>
              <p className="mt-1">Start the conversation by sending a message</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map(message => {
              const isCurrentUser = message.sender.id === user?.id;
              return (
                <div 
                  key={message.id}
                  className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isCurrentUser && (
                    <div className="flex-shrink-0 mr-2">
                      <div className="h-8 w-8 rounded-full flex items-center justify-center bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-200 text-xs font-medium">
                        {getInitials(message.sender.username)}
                      </div>
                    </div>
                  )}
                  <div 
                    className={`max-w-xs sm:max-w-sm rounded-2xl px-4 py-2 ${
                      isCurrentUser 
                        ? 'bg-primary-500 text-white rounded-tr-none' 
                        : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-tl-none shadow-sm'
                    }`}
                  >
                    <div className="text-sm">{message.content}</div>
                    <div className={`text-xs mt-1 text-right ${
                      isCurrentUser 
                        ? 'text-primary-100' 
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {formatMessageTime(message.timestamp)}
                    </div>
                  </div>
                  {isCurrentUser && (
                    <div className="flex-shrink-0 ml-2">
                      <div className="h-8 w-8 rounded-full flex items-center justify-center bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-200 text-xs font-medium">
                        {getInitials(user.username)}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      {/* Message input area */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
          <button 
            type="button" 
            className="text-gray-500 hover:text-primary-500 dark:text-gray-400 dark:hover:text-primary-400"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>
          <input 
            type="text" 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 rounded-full border-gray-300 focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          <button 
            type="submit" 
            className="p-2 rounded-full bg-primary-500 hover:bg-primary-600 text-white transition duration-200"
            disabled={loading || !newMessage.trim()}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface; 