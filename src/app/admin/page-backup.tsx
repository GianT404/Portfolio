'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { database } from '@/lib/firebase';
import { ref, onValue, push, serverTimestamp } from 'firebase/database';

// Interface cho tin nhắn
interface Message {
  id?: string;
  text: string;
  sender: 'user' | 'admin';
  timestamp: any;
  senderName?: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
}

// Interface cho conversation
interface Conversation {
  id: string;
  userInfo: {
    name: string;
    lastActive: any;
    hasUnreadMessages?: boolean;
  };
  messages: Message[];
  lastMessage?: Message;
}

// Enhanced Search Component
const SearchBar = ({ searchTerm, onSearch }: { searchTerm: string; onSearch: (term: string) => void }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative mb-6"
    >
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Tìm kiếm cuộc trò chuyện..."
          className="w-full px-12 py-3 rounded-2xl border border-black/10 bg-white/70 backdrop-blur-sm text-sm focus:outline-none focus:border-black/30 focus:bg-white/90 transition-all duration-200"
        />
        <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-black/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
    </motion.div>
  );
};

// Enhanced Status Indicator
const StatusIndicator = ({ isActive, unreadCount }: { isActive: boolean; unreadCount: number }) => {
  return (
    <div className="flex items-center gap-2">
      <motion.div
        animate={{ scale: isActive ? [1, 1.2, 1] : 1 }}
        transition={{ duration: 2, repeat: isActive ? Infinity : 0 }}
        className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-400' : 'bg-gray-300'}`}
      />
      {unreadCount > 0 && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full min-w-[20px] text-center"
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </motion.span>
      )}
    </div>
  );
};

// Modern Conversation Card
const ConversationCard = ({ 
  conversation, 
  isSelected, 
  onClick 
}: { 
  conversation: Conversation;
  isSelected: boolean;
  onClick: () => void;
}) => {
  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Vừa xong';
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} giờ trước`;
    return date.toLocaleDateString('vi-VN');
  };

  return (
    <motion.div
      layout
      whileHover={{ y: -2, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`relative p-4 rounded-3xl cursor-pointer transition-all duration-300 ${
        isSelected
          ? 'bg-gradient-to-r from-black to-gray-800 text-white shadow-2xl'
          : 'bg-white/60 backdrop-blur-sm border border-black/10 hover:bg-white/80 hover:shadow-lg'
      }`}
    >
      {/* Glow effect for selected card */}
      {isSelected && (
        <motion.div
          className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-400/20 to-purple-400/20 blur-xl"
          animate={{ opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
              isSelected ? 'bg-white/20' : 'bg-gradient-to-br from-blue-400 to-purple-500 text-white'
            }`}>
              {conversation.userInfo.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-medium text-sm">{conversation.userInfo.name}</p>
              <p className={`text-xs ${isSelected ? 'text-white/60' : 'text-black/50'}`}>
                {formatTime(conversation.userInfo.lastActive)}
              </p>
            </div>
          </div>
          <StatusIndicator 
            isActive={conversation.userInfo.hasUnreadMessages || false}
            unreadCount={conversation.userInfo.hasUnreadMessages ? 1 : 0}
          />
        </div>
        
        {conversation.lastMessage && (
          <div className={`text-xs truncate ${isSelected ? 'text-white/70' : 'text-black/60'}`}>
            {conversation.lastMessage.fileUrl ? (
              <span className="flex items-center gap-1">
                <span>📎</span>
                {conversation.lastMessage.fileName || 'File attachment'}
              </span>
            ) : (
              conversation.lastMessage.text
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Enhanced Message Bubble
const MessageBubble = ({ message, isLast }: { message: Message; isLast: boolean }) => {
  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  const getFileTypeCategory = (fileType: string) => {
    const supportedFileTypes = {
      images: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/tiff'],
      audio: ['audio/mpeg', 'audio/mp3'],
      video: ['video/mp4']
    };
    
    if (supportedFileTypes.images.includes(fileType)) return 'image';
    if (supportedFileTypes.audio.includes(fileType)) return 'audio';
    if (supportedFileTypes.video.includes(fileType)) return 'video';
    return 'unknown';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      className={`flex ${message.sender === 'admin' ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div className={`relative max-w-[70%] group ${message.sender === 'admin' ? 'ml-12' : 'mr-12'}`}>
        {/* Avatar for user messages */}
        {message.sender === 'user' && (
          <div className="absolute -left-10 top-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-medium">
            {message.senderName?.charAt(0).toUpperCase()}
          </div>
        )}
        
        <div
          className={`px-4 py-3 rounded-3xl relative ${
            message.sender === 'admin'
              ? 'bg-gradient-to-br from-black to-gray-800 text-white'
              : 'bg-white/80 backdrop-blur-sm text-black border border-black/10'
          }`}
        >
          {/* Message tail */}
          <div className={`absolute top-4 w-3 h-3 transform rotate-45 ${
            message.sender === 'admin'
              ? 'right-[-6px] bg-black'
              : 'left-[-6px] bg-white/80 border-l border-t border-black/10'
          }`} />
          
          {message.sender === 'user' && message.senderName && (
            <p className="text-xs font-medium opacity-70 mb-2">{message.senderName}</p>
          )}
          
          {/* File attachment rendering */}
          {message.fileUrl && (
            <div className="mb-2">
              {getFileTypeCategory(message.fileType || '') === 'image' && (
                <motion.img 
                  whileHover={{ scale: 1.05 }}
                  src={message.fileUrl} 
                  alt={message.fileName}
                  className="max-w-full h-auto rounded-2xl cursor-pointer hover:shadow-lg transition-shadow max-h-60 object-contain"
                  onClick={() => window.open(message.fileUrl, '_blank')}
                />
              )}
              
              {getFileTypeCategory(message.fileType || '') === 'video' && (
                <video 
                  src={message.fileUrl} 
                  controls
                  className="max-w-full h-auto rounded-2xl max-h-60"
                />
              )}
              
              {getFileTypeCategory(message.fileType || '') === 'audio' && (
                <audio 
                  src={message.fileUrl} 
                  controls
                  className="w-full"
                />
              )}
              
              <div className="flex items-center gap-2 mt-2 text-xs opacity-70">
                <span>📎</span>
                <span>{message.fileName}</span>
                {message.fileSize && (
                  <span>({formatFileSize(message.fileSize)})</span>
                )}
              </div>
            </div>
          )}
          
          {message.text && !message.fileUrl && <p className="text-sm leading-relaxed">{message.text}</p>}
          {message.text && message.fileUrl && message.text !== `[${getFileTypeCategory(message.fileType || '').toUpperCase()}] ${message.fileName}` && (
            <p className="text-sm leading-relaxed mt-2">{message.text}</p>
          )}
          
          <p className="text-xs opacity-50 mt-2">{formatTime(message.timestamp)}</p>
        </div>
        
        {/* Message status indicator */}
        {message.sender === 'admin' && isLast && (
          <div className="flex justify-end mt-1">
            <span className="text-xs text-green-500">✓ Đã gửi</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Enhanced Stats Component
const AdminStats = ({ conversations }: { conversations: Conversation[] }) => {
  const totalMessages = conversations.reduce((acc, conv) => acc + conv.messages.length, 0);
  const totalUsers = conversations.length;
  const unreadConversations = conversations.filter(conv => conv.userInfo.hasUnreadMessages).length;
  const activeToday = conversations.filter(conv => {
    const lastActive = new Date(conv.userInfo.lastActive);
    const today = new Date();
    return lastActive.toDateString() === today.toDateString();
  }).length;

  const stats = [
    { label: 'Tổng tin nhắn', value: totalMessages, icon: '💬', color: 'from-blue-500 to-blue-600' },
    { label: 'Người dùng', value: totalUsers, icon: '👥', color: 'from-green-500 to-green-600' },
    { label: 'Chưa đọc', value: unreadConversations, icon: '🔔', color: 'from-red-500 to-red-600' },
    { label: 'Hoạt động hôm nay', value: activeToday, icon: '⚡', color: 'from-purple-500 to-purple-600' }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="relative p-6 rounded-3xl bg-white/60 backdrop-blur-sm border border-black/10 overflow-hidden group hover:shadow-xl transition-shadow duration-300"
        >
          <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{stat.icon}</span>
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-3xl font-bold text-black"
              >
                {stat.value}
              </motion.div>
            </div>
            <p className="text-xs uppercase tracking-wider text-black/60 font-medium">{stat.label}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default function AdminPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Filter conversations based on search term
  const filteredConversations = conversations.filter(conv =>
    conv.userInfo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.lastMessage?.text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Authentication
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin123') {
      setIsAuthenticated(true);
    } else {
      alert('Mật khẩu không đúng!');
    }
  };

  // Load conversations
  useEffect(() => {
    if (!isAuthenticated) return;

    const conversationsRef = ref(database, 'conversations');
    const unsubscribe = onValue(conversationsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const conversationsList: Conversation[] = Object.entries(data).map(([key, value]: [string, any]) => {
          const messages = value.messages ? Object.entries(value.messages).map(([msgKey, msgValue]: [string, any]) => ({
            id: msgKey,
            ...msgValue
          })) : [];
          
          const userInfoEntries = value.userInfo ? Object.values(value.userInfo) : [];
          const latestUserInfo = userInfoEntries[userInfoEntries.length - 1] as any;
          
          return {
            id: key,
            userInfo: latestUserInfo || { name: 'Unknown', lastActive: Date.now() },
            messages: messages.sort((a, b) => a.timestamp - b.timestamp),
            lastMessage: messages[messages.length - 1]
          };
        });
        
        conversationsList.sort((a, b) => b.userInfo.lastActive - a.userInfo.lastActive);
        setConversations(conversationsList);
      }
    });

    return () => unsubscribe();
  }, [isAuthenticated]);

  // Load messages for selected conversation
  useEffect(() => {
    if (!selectedConversation) return;

    const selectedConv = conversations.find(conv => conv.id === selectedConversation);
    if (selectedConv) {
      setMessages(selectedConv.messages);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [selectedConversation, conversations]);

  // Send message
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || isLoading) return;

    setIsLoading(true);
    try {
      const messagesRef = ref(database, `conversations/${selectedConversation}/messages`);
      await push(messagesRef, {
        text: newMessage.trim(),
        sender: 'admin',
        timestamp: serverTimestamp()
      });
      setNewMessage('');
    } catch (error) {
      console.error('Lỗi gửi tin nhắn:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 border border-black/10 w-full max-w-md"
        >
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">🔐 Admin Panel</h1>
            <p className="text-black/60">Nhập mật khẩu để truy cập</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mật khẩu"
              className="w-full px-4 py-3 rounded-2xl border border-black/10 bg-white/70 focus:outline-none focus:border-black/30 transition-colors"
              required
            />
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="w-full py-3 bg-black text-white rounded-2xl hover:bg-black/80 transition-colors"
            >
              Đăng nhập
            </motion.button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-sm border-b border-black/10 p-6"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <span className="text-3xl">💬</span>
              Admin Dashboard
            </h1>
            <p className="text-black/60 text-sm mt-1">Quản lý tin nhắn và cuộc trò chuyện</p>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsAuthenticated(false)}
            className="px-4 py-2 bg-red-500 text-white rounded-2xl hover:bg-red-600 transition-colors text-sm"
          >
            Đăng xuất
          </motion.button>
        </div>
      </motion.header>

      <div className="max-w-7xl mx-auto p-6">
        {/* Stats */}
        <AdminStats conversations={conversations} />

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Conversations List */}
          <div className="lg:col-span-1">
            <SearchBar searchTerm={searchTerm} onSearch={setSearchTerm} />
            
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white/40 backdrop-blur-sm rounded-3xl p-6 border border-black/10 max-h-[600px] overflow-y-auto"
            >
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span>📋</span>
                Cuộc trò chuyện ({filteredConversations.length})
              </h2>
              
              <div className="space-y-3">
                {filteredConversations.map((conv) => (
                  <ConversationCard
                    key={conv.id}
                    conversation={conv}
                    isSelected={selectedConversation === conv.id}
                    onClick={() => setSelectedConversation(conv.id)}
                  />
                ))}
              </div>
            </motion.div>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-2">
            {selectedConversation ? (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white/40 backdrop-blur-sm rounded-3xl border border-black/10 h-[600px] flex flex-col"
              >
                {/* Chat Header */}
                <div className="p-6 border-b border-black/10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-medium">
                      {conversations.find(c => c.id === selectedConversation)?.userInfo.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold">
                        {conversations.find(c => c.id === selectedConversation)?.userInfo.name}
                      </h3>
                      <p className="text-sm text-black/60">
                        {messages.length} tin nhắn
                      </p>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 p-6 overflow-y-auto">
                  {messages.map((message, index) => (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      isLast={index === messages.length - 1}
                    />
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="p-6 border-t border-black/10">
                  <form onSubmit={sendMessage} className="flex gap-3">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Nhập tin nhắn..."
                      className="flex-1 px-4 py-3 rounded-2xl border border-black/10 bg-white/70 focus:outline-none focus:border-black/30 focus:bg-white/90 transition-all"
                      disabled={isLoading}
                    />
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={!newMessage.trim() || isLoading}
                      className="px-6 py-3 bg-black text-white rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black/80 transition-colors"
                    >
                      {isLoading ? '⏳' : '↗'}
                    </motion.button>
                  </form>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white/40 backdrop-blur-sm rounded-3xl border border-black/10 h-[600px] flex items-center justify-center"
              >
                <div className="text-center">
                  <div className="text-6xl mb-4">💬</div>
                  <h3 className="text-xl font-semibold mb-2">Chọn cuộc trò chuyện</h3>
                  <p className="text-black/60">Chọn một cuộc trò chuyện để bắt đầu phản hồi</p>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}