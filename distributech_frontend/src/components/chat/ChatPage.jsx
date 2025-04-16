import { ChatProvider } from '../../contexts/ChatContext';
import ConversationList from './ConversationList';
import ChatInterface from './ChatInterface';

const ChatPage = () => {
  return (
    <ChatProvider>
      <div className="h-screen flex flex-col">
        <div className="text-3xl font-bold text-gray-900 dark:text-white p-4 border-b border-gray-200 dark:border-gray-700">
          Messages
        </div>
        
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar with conversations list */}
          <div className="w-80 border-r border-gray-200 dark:border-gray-700">
            <ConversationList />
          </div>
          
          {/* Main chat interface */}
          <div className="flex-1">
            <ChatInterface />
          </div>
        </div>
      </div>
    </ChatProvider>
  );
};

export default ChatPage; 