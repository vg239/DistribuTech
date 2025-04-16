import { useState } from 'react';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';

const ConversationList = () => {
  const { conversations, loading, error, fetchMessages, currentConversation, startConversationByUsername } = useChat();
  const { user } = useAuth();
  const [showNewChatForm, setShowNewChatForm] = useState(false);
  const [username, setUsername] = useState('');
  const [newChatError, setNewChatError] = useState('');

  const handleStartNewChat = async (e) => {
    e.preventDefault();
    setNewChatError('');
    
    if (!username.trim()) {
      setNewChatError('Username is required');
      return;
    }

    try {
      await startConversationByUsername(username);
      setUsername('');
      setShowNewChatForm(false);
    } catch (error) {
      setNewChatError(error.message || 'Failed to start conversation');
    }
  };

  const getParticipantName = (conversation) => {
    const otherParticipant = conversation.participants.find(
      participant => participant.id !== user?.id
    );
    
    return otherParticipant ? `${otherParticipant.username}` : 'Unknown User';
  };

  // Generate initials for avatar
  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Chats</h2>
          <span className="ml-2 bg-primary-500 text-white text-xs rounded-full px-2 py-0.5">
            {conversations.length}
          </span>
        </div>
        <button 
          onClick={() => setShowNewChatForm(!showNewChatForm)}
          className="text-gray-500 hover:text-primary-500 dark:text-gray-400 dark:hover:text-primary-400"
        >
          {showNewChatForm ? 
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            : 
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          }
        </button>
      </div>
      
      {showNewChatForm && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <form onSubmit={handleStartNewChat}>
            <div className="mb-2">
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Start a new conversation</label>
              <input 
                type="text" 
                id="username" 
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            {newChatError && <p className="text-red-500 text-sm mb-2">{newChatError}</p>}
            <button 
              type="submit" 
              className="w-full bg-primary-500 hover:bg-primary-600 text-white font-medium py-2 px-4 rounded-md transition duration-200"
            >
              Start Chat
            </button>
          </form>
        </div>
      )}
      
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>
          <input
            type="search"
            placeholder="Search conversations"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          />
        </div>
      </div>
      
      {loading ? (
        <div className="p-4 text-center flex-1 flex items-center justify-center">
          <div>
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Loading conversations...</p>
          </div>
        </div>
      ) : error ? (
        <div className="p-4 text-center text-red-500 flex-1 flex items-center justify-center">
          {error}
        </div>
      ) : conversations.length === 0 ? (
        <div className="p-4 text-center text-gray-500 dark:text-gray-400 flex-1 flex items-center justify-center">
          <div>
            <p>No conversations yet</p>
            <p className="mt-2">Start a new chat using the + button above</p>
          </div>
        </div>
      ) : (
        <ul className="overflow-y-auto flex-1">
          {conversations.map(conversation => {
            const name = getParticipantName(conversation);
            const lastMessage = conversation.messages && conversation.messages.length > 0 
              ? conversation.messages[conversation.messages.length - 1]
              : null;
            
            return (
              <li 
                key={conversation.id} 
                className={`hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-l-4 ${
                  currentConversation?.id === conversation.id 
                    ? 'border-primary-500 bg-gray-50 dark:bg-gray-700' 
                    : 'border-transparent'
                }`}
                onClick={() => fetchMessages(conversation.id)}
              >
                <div className="flex items-center px-4 py-3">
                  <div className="flex-shrink-0 mr-3">
                    <div className="h-12 w-12 rounded-full flex items-center justify-center bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-200 font-medium">
                      {getInitials(name)}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {name}
                      </h3>
                      {lastMessage && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap ml-1">
                          {new Date(lastMessage.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {lastMessage ? lastMessage.content : 'No messages yet'}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default ConversationList; 