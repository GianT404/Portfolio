'use client';

import { contactLinks } from '@/data/portfolio';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { database } from '@/lib/firebase';
import { ref, push, onValue, serverTimestamp } from 'firebase/database';

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

// Component Chatbox minimal
const MinimalChatbox = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [senderName, setSenderName] = useState('');
  const [isNamed, setIsNamed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Supported file types
  const supportedFileTypes = {
    images: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/tiff'],
    audio: ['audio/mpeg', 'audio/mp3'],
    video: ['video/mp4']
  };

  // Helper function to get file type category
  const getFileTypeCategory = (fileType: string) => {
    if (supportedFileTypes.images.includes(fileType)) return 'image';
    if (supportedFileTypes.audio.includes(fileType)) return 'audio';
    if (supportedFileTypes.video.includes(fileType)) return 'video';
    return 'unknown';
  };

  // Helper function to format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Convert file to base64 for storage
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  // Auto scroll to bottom - chỉ scroll trong container
  useEffect(() => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      // Sử dụng setTimeout để đảm bảo DOM đã update
      setTimeout(() => {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth'
        });
      }, 100);
    }
  }, [messages]);

  // Load messages for specific user from Firebase
  useEffect(() => {
    if (!isNamed || !senderName) return;

    // Tạo unique user ID dựa trên tên và timestamp
    const storedUserId = localStorage.getItem('chatUserId');
    let userId = storedUserId;
    
    if (!userId) {
      userId = `${senderName.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
      localStorage.setItem('chatUserId', userId);
    }

    const userMessagesRef = ref(database, `conversations/${userId}/messages`);
    const unsubscribe = onValue(userMessagesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const messagesList = Object.entries(data).map(([key, value]: [string, any]) => ({
          id: key,
          ...value
        }));
        // Sắp xếp theo timestamp
        messagesList.sort((a, b) => a.timestamp - b.timestamp);
        setMessages(messagesList);
      } else {
        setMessages([]);
      }
    });

    return () => unsubscribe();
  }, [isNamed, senderName]);

  // Check if user has name stored
  useEffect(() => {
    const storedName = localStorage.getItem('chatUserName');
    if (storedName) {
      setSenderName(storedName);
      setIsNamed(true);
    }
  }, []);

  // Handle name submission
  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (senderName.trim()) {
      localStorage.setItem('chatUserName', senderName.trim());
      setIsNamed(true);
    }
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    const allSupportedTypes = [
      ...supportedFileTypes.images,
      ...supportedFileTypes.audio,
      ...supportedFileTypes.video
    ];

    if (!allSupportedTypes.includes(file.type)) {
      alert('File type not supported. Please select a JPEG, PNG, GIF, BMP, TIFF, MP3, or MP4 file.');
      return;
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      alert('File too large. Please select a file smaller than 10MB.');
      return;
    }

    setSelectedFile(file);
  };

  // Send file message
  const sendFileMessage = async () => {
    if (!selectedFile || uploading) return;

    setUploading(true);
    try {
      const userId = localStorage.getItem('chatUserId');
      if (!userId) return;

      // Convert file to base64
      const fileBase64 = await fileToBase64(selectedFile);
      const fileTypeCategory = getFileTypeCategory(selectedFile.type);

      // Lưu tin nhắn file vào Firebase
      const userMessagesRef = ref(database, `conversations/${userId}/messages`);
      await push(userMessagesRef, {
        text: `[${fileTypeCategory.toUpperCase()}] ${selectedFile.name}`,
        sender: 'user',
        senderName: senderName,
        timestamp: serverTimestamp(),
        fileUrl: fileBase64,
        fileName: selectedFile.name,
        fileType: selectedFile.type,
        fileSize: selectedFile.size
      });

      // Cập nhật thông tin user
      const userInfoRef = ref(database, `conversations/${userId}/userInfo`);
      await push(userInfoRef, {
        name: senderName,
        lastActive: serverTimestamp(),
        hasUnreadMessages: true
      });

      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error sending file:', error);
      alert('An error occurred while sending the file. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // Send message to Firebase
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!newMessage.trim() || isLoading) return;

    setIsLoading(true);
    try {
      const userId = localStorage.getItem('chatUserId');
      if (!userId) return;

      // Lưu tin nhắn vào conversation riêng của user
      const userMessagesRef = ref(database, `conversations/${userId}/messages`);
      await push(userMessagesRef, {
        text: newMessage.trim(),
        sender: 'user',
        senderName: senderName,
        timestamp: serverTimestamp()
      });

      // Cập nhật thông tin user
      const userInfoRef = ref(database, `conversations/${userId}/userInfo`);
      await push(userInfoRef, {
        name: senderName,
        lastActive: serverTimestamp(),
        hasUnreadMessages: true
      });

      setNewMessage('');
    } catch (error) {
      console.error('Lỗi gửi tin nhắn:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4 text-xs uppercase tracking-[0.32em] text-black/50">
        <span className="inline-block h-[1px] w-12 bg-black/18" />
        SAY HI
      </div>
      
      {/* Name input form nếu chưa đặt tên */}
      {!isNamed ? (
        <div className="bg-white/60 rounded-3xl border border-black/15 p-6 flex flex-col items-center gap-4">
          <div className="text-center">
            <h3 className="text-lg font-medium text-black mb-2">Hi there!</h3>
            <p className="text-sm text-black/60">Please let me know your name to start chatting</p>
          </div>
          
          <form onSubmit={handleNameSubmit} className="w-full max-w-sm">
            <div className="flex gap-2">
              <input
                type="text"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="Enter your name..."
                className="flex-1 px-4 py-2 rounded-2xl border border-black/15 bg-white/80 text-sm focus:outline-none focus:border-black/30 transition-colors"
                required
              />
              <motion.button
                type="submit"
                disabled={!senderName.trim()}
                className="px-4 py-2 rounded-2xl bg-black text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black/80 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Let's go
              </motion.button>
            </div>
          </form>
        </div>
      ) : (
        /* Messages container */
        <div className="bg-white/60 rounded-3xl border border-black/15 p-6 h-80 flex flex-col">
        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto space-y-3 mb-4">
          {messages.length === 0 ? (
            <p className="text-black/40 text-sm text-center py-8">
             Let's start the conversation!
            </p>
          ) : (
            messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm ${
                    message.sender === 'user'
                      ? 'bg-black text-white'
                      : 'bg-gray-100 text-black'
                  }`}
                >
                  {message.sender === 'admin' && message.senderName && (
                    <p className="text-xs opacity-60 mb-1">{message.senderName}</p>
                  )}
                  
                  {/* Render file attachment */}
                  {message.fileUrl && (
                    <div className="mb-2">
                      {getFileTypeCategory(message.fileType || '') === 'image' && (
                        <img 
                          src={message.fileUrl} 
                          alt={message.fileName}
                          className="max-w-full h-auto rounded-lg cursor-pointer hover:opacity-80"
                          onClick={() => window.open(message.fileUrl, '_blank')}
                        />
                      )}
                      
                      {getFileTypeCategory(message.fileType || '') === 'video' && (
                        <video 
                          src={message.fileUrl} 
                          controls
                          className="max-w-full h-auto rounded-lg"
                        />
                      )}
                      
                      {getFileTypeCategory(message.fileType || '') === 'audio' && (
                        <audio 
                          src={message.fileUrl} 
                          controls
                          className="w-full"
                        />
                      )}
                      
                      <div className="flex items-center gap-2 mt-1 text-xs opacity-70">
                        <span>📎</span>
                        <span>{message.fileName}</span>
                        {message.fileSize && (
                          <span>({formatFileSize(message.fileSize)})</span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {message.text && !message.fileUrl && <p>{message.text}</p>}
                  {message.text && message.fileUrl && message.text !== `[${getFileTypeCategory(message.fileType || '').toUpperCase()}] ${message.fileName}` && (
                    <p className="mt-2">{message.text}</p>
                  )}
                </div>
              </motion.div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
        
        {/* File preview */}
        {selectedFile && (
          <div className="mb-3 p-3 bg-gray-50 rounded-2xl border border-black/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <span>📎</span>
                <span className="font-medium">{selectedFile.name}</span>
                <span className="text-black/50">({formatFileSize(selectedFile.size)})</span>
              </div>
              <button
                onClick={() => {
                  setSelectedFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="text-red-500 hover:text-red-700 text-sm"
              >
                ✕
              </button>
            </div>
            
            {/* File preview */}
            {getFileTypeCategory(selectedFile.type) === 'image' && (
              <div className="mt-2">
                <img 
                  src={URL.createObjectURL(selectedFile)} 
                  alt="Preview"
                  className="max-w-[150px] h-auto rounded-lg"
                />
              </div>
            )}
            
            <button
              onClick={sendFileMessage}
              disabled={uploading}
              className="mt-2 px-3 py-1 bg-black text-white text-xs rounded-lg hover:bg-black/80 disabled:opacity-50"
            >
              {uploading ? 'Đang gửi...' : 'Gửi file'}
            </button>
          </div>
        )}
        
        {/* Input form */}
        <form onSubmit={sendMessage} className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  e.stopPropagation();
                  sendMessage(e);
                }
              }}
              placeholder="Type your message..."
              className="flex-1 px-4 py-2 rounded-2xl border border-black/15 bg-white/80 text-sm focus:outline-none focus:border-black/30 transition-colors"
              disabled={isLoading}
            />
            
            {/* File upload button */}
            <motion.button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-2 rounded-2xl border border-black/15 bg-white/80 text-black/70 text-sm hover:bg-white transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              📎
            </motion.button>
            
            <motion.button
              type="submit"
              disabled={!newMessage.trim() || isLoading}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                sendMessage(e);
              }}
              className="px-4 py-2 rounded-2xl bg-black text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black/80 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isLoading ? '⏳' : '↗'}
            </motion.button>
          </div>
          
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.gif,.bmp,.tiff,.mp3,.mp4"
            onChange={handleFileSelect}
            className="hidden"
          />
        </form>
      </div>
      )}
    </div>
  );
};

export function ContactSection() {
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrImage, setQrImage] = useState('');

  const handleZaloClick = (qrImageSrc: string) => {
    setQrImage(qrImageSrc);
    setShowQRModal(true);
  };

  return (
    <section id="contact" className="relative z-10 py-32">
      <motion.div
        className="page-shell rounded-[36px] border border-black/12 bg-white/65 px-10 py-14 md:px-16 md:py-18"
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 120, damping: 26 }}
        viewport={{ once: true, amount: 0.4 }}
      >
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.85fr)]">
          <MinimalChatbox />

          <div className="grid gap-4 text-sm text-black/70">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4 text-xs uppercase tracking-[0.32em] text-black/50">
                <span className="inline-block h-[1px] w-12 bg-black/18" />
                Quick Contact
              </div>
              
              {contactLinks.map((contact, index) => {
                // Render Zalo với QR code
                if (contact.hasQR) {
                  return (
                    <motion.div
                      key={index}
                      className="flex items-center gap-6 rounded-3xl border border-black/15 bg-white px-6 py-5 cursor-pointer"
                      whileHover={{ y: -4 }}
                      transition={{ type: 'spring', stiffness: 240, damping: 26 }}
                      onClick={() => handleZaloClick(contact.qrImage)}
                    >
                      <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-2xl bg-gray-50 border border-black/10">
                        <img 
                          src="/images/icon_zalo.png" 
                          alt="Zalo Icon"
                          className="w-6 h-6 object-contain"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs uppercase tracking-[0.3em] text-black/45">{contact.label}</p>
                        <p className="mt-1 text-base">{contact.hint}</p>
                        
                      </div>
                      <div className="flex-shrink-0 w-16 h-16">
                        <img 
                          src={contact.qrImage} 
                          alt={`${contact.label} QR Code`}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      </div>
                    </motion.div>
                  );
                }

                // Render các link thường (Gmail, Github)
                return (
                  <motion.a
                    key={index}
                    href={contact.href}
                    className="flex items-center gap-6 rounded-3xl border border-black/15 bg-white px-6 py-5 cursor-pointer"
                    target="_blank"
                    rel="noreferrer"
                    whileHover={{ y: -4 }}
                    transition={{ type: 'spring', stiffness: 240, damping: 26 }}
                    data-hoverable
                  >
                    <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-2xl bg-gray-50 border border-black/10">
                      {contact.icon === 'gmail' && (
                        <svg className="w-5 h-5 text-black/70" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" fill="#EA4335"/>
                        </svg>
                      )}
                      {contact.icon === 'github' && (
                        <svg className="w-5 h-5 text-black/70" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 0C5.374 0 0 5.373 0 12 0 17.302 3.438 21.8 8.207 23.387c.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.30 3.297-1.30.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                        </svg>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs uppercase tracking-[0.3em] text-black/45">{contact.label}</p>
                      <p className="mt-1 text-base">{contact.value}</p>
                      
                    </div>
                    <div className="flex-shrink-0">
                      <span className="text-lg">↗</span>
                    </div>
                  </motion.a>
                );
              })}
              
            </div>
          </div>
        </div>
      </motion.div>

      {/* Modal QR Zoom */}
      <AnimatePresence>
        {showQRModal && (
          <motion.div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowQRModal(false)}
          >
            <motion.div
              className="bg-white rounded-3xl p-8 max-w-md w-full"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col items-center gap-6">
                <div className="flex items-center gap-3">
                  <img 
                    src="/images/icon_zalo.png" 
                    alt="Zalo Icon"
                    className="w-8 h-8 object-contain"
                  />
                </div>
                
                <div className="w-full max-w-xs">
                  <img 
                    src={qrImage} 
                    alt="Zalo QR Code"
                    className="w-full h-auto rounded-2xl border border-black/10"
                  />
                </div>
                
                <p className="text-sm text-black/60 text-center">
                  Scan this QR code with Zalo to connect with me!
                </p>
                
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}