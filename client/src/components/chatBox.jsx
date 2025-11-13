import { useState, useEffect, useRef } from 'react';
import { Send, Terminal } from 'lucide-react';

const ChatBox = ({ messages, onSendMessage, currentUserId }) => {
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (inputMessage.trim()) {
      onSendMessage(inputMessage.trim());
      setInputMessage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  return (
    <div className="bg-cyber-gray border border-matrix-900 rounded-lg overflow-hidden h-[calc(100vh-250px)] flex flex-col">
      {/* Chat Header */}
      <div className="bg-cyber-dark border-b border-matrix-900 px-4 py-3 flex items-center space-x-2">
        <Terminal className="w-4 h-4 text-matrix-500" />
        <span className="text-matrix-500 font-mono text-sm">SECURE CHANNEL</span>
        <div className="flex-1" />
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-matrix-500 rounded-full animate-pulse" />
          <span className="text-matrix-700 font-mono text-xs">ENCRYPTED</span>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-matrix-900 scrollbar-track-cyber-dark">
        {messages.length === 0 && (
          <div className="text-center text-matrix-800 font-mono text-sm py-8">
            <Terminal className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No messages yet. Start the conversation...</p>
          </div>
        )}

        {messages.map((msg, index) => {
          if (msg.type === 'system') {
            return (
              <div key={index} className="text-center">
                <div className="inline-block bg-cyber-dark border border-matrix-900 rounded px-3 py-1">
                  <span className="text-matrix-700 font-mono text-xs">{msg.content}</span>
                </div>
              </div>
            );
          }

          const isOwnMessage = msg.from === currentUserId;

          return (
            <div
              key={index}
              className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'} flex flex-col`}>
                {!isOwnMessage && (
                  <div className="flex items-center space-x-2 mb-1">
                    <div className="w-1.5 h-1.5 bg-matrix-500 rounded-full" />
                    <span className="text-matrix-600 font-mono text-xs">{msg.codename}</span>
                  </div>
                )}
                
                <div
                  className={`px-4 py-2 rounded-lg ${
                    isOwnMessage
                      ? 'bg-matrix-900 border border-matrix-700'
                      : 'bg-cyber-dark border border-matrix-900'
                  }`}
                >
                  <p className="text-matrix-400 font-mono text-sm whitespace-pre-wrap break-words">
                    {msg.content}
                  </p>
                </div>
                
                <span className="text-matrix-800 font-mono text-xs mt-1">
                  {formatTimestamp(msg.timestamp)}
                </span>
              </div>
            </div>
          );
        })}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-cyber-dark border-t border-matrix-900 p-4">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type message... (Enter to send)"
            className="flex-1 bg-cyber-gray border border-matrix-900 rounded px-4 py-2 text-matrix-400 font-mono text-sm focus:outline-none focus:border-matrix-700 transition-colors placeholder-matrix-800"
          />
          
          <button
            onClick={handleSend}
            disabled={!inputMessage.trim()}
            className="bg-matrix-700 hover:bg-matrix-600 disabled:bg-cyber-light disabled:cursor-not-allowed text-black px-4 py-2 rounded transition-all duration-200 flex items-center space-x-2 font-mono"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">SEND</span>
          </button>
        </div>
        
        <div className="mt-2 text-matrix-800 font-mono text-xs">
          <span className="flex items-center space-x-1">
            <span>⚡</span>
            <span>Messages are ephemeral and encrypted end-to-end</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default ChatBox;