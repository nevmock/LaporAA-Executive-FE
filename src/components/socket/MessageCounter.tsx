// MessageCounter Component - Real-time Unread Message Count
// Generated: July 4, 2025

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../../hooks/useSocket';
import { FiInbox } from 'react-icons/fi';
import { useRouter } from 'next/navigation';

interface MessageCounterProps {
  className?: string;
  showIcon?: boolean;
  onClick?: () => void;
}

interface UnreadMessage {
  sessionId: string;
  userId: string;
  userName: string;
  count: number;
  lastMessage: string;
  timestamp: Date;
}

const MessageCounter: React.FC<MessageCounterProps> = ({
  className = '',
  showIcon = true,
  onClick
}) => {
  const [unreadMessages, setUnreadMessages] = useState<UnreadMessage[]>([]);
  const [totalUnread, setTotalUnread] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  const socket = useSocket({
    autoJoinRooms: ['admin', 'dashboard'],
    eventHandlers: {
      'newMessage': handleNewMessage,
      'messageRead': handleMessageRead,
      'unreadCountUpdate': handleUnreadCountUpdate
    }
  });
  
  const router = useRouter();

  // Handle new incoming messages
  function handleNewMessage(data: unknown) {
    const messageData = data as {sessionId: string; user?: {name: string}; message: string; timestamp: string; from?: string; senderName?: string};
    console.log('📬 New message received for counter:', messageData);
    
    setUnreadMessages(prev => {
      const existing = prev.find(msg => msg.sessionId === messageData.sessionId);
      
      if (existing) {
        // Update existing conversation
        return prev.map(msg => 
          msg.sessionId === messageData.sessionId 
            ? {
                ...msg,
                count: msg.count + 1,
                lastMessage: messageData.message,
                timestamp: new Date(messageData.timestamp)
              }
            : msg
        );
      } else {
        // Add new conversation
        return [...prev, {
          sessionId: messageData.sessionId,
          userId: messageData.from || 'unknown',
          userName: messageData.senderName || messageData.user?.name || 'User',
          count: 1,
          lastMessage: messageData.message,
          timestamp: new Date(messageData.timestamp)
        }];
      }
    });
  }

  // Handle message read events
  function handleMessageRead(data: unknown) {
    const readData = data as {sessionId: string};
    console.log('👁️ Message read event:', readData);
    
    setUnreadMessages(prev => 
      prev.map(msg => 
        msg.sessionId === readData.sessionId 
          ? { ...msg, count: Math.max(0, msg.count - 1) }
          : msg
      ).filter(msg => msg.count > 0)
    );
  }

  // Handle unread count updates from server
  function handleUnreadCountUpdate(data: unknown) {
    const updateData = data as {unreadMessages?: UnreadMessage[]};
    console.log('🔄 Unread count update:', updateData);
    setUnreadMessages(updateData.unreadMessages || []);
  }

  // Calculate total unread count
  useEffect(() => {
    const total = unreadMessages.reduce((sum, msg) => sum + msg.count, 0);
    setTotalUnread(total);
  }, [unreadMessages]);

  const fetchUnreadCount = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Request current unread count from server
      socket.emit('getUnreadCount', {
        adminId: typeof window !== 'undefined' ? localStorage.getItem('nama_admin') : null,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ Error fetching unread count:', error);
    } finally {
      setIsLoading(false);
    }
  }, [socket]); // Added dependencies

  // Fetch initial unread count
  useEffect(() => {
    if (socket.isConnected) {
      fetchUnreadCount();
    }
  }, [socket.isConnected, fetchUnreadCount]); // Added missing dependency

  // Handle click - navigate to pengaduan page or custom handler
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      router.push('/pengaduan');
    }
  };

  if (isLoading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        {showIcon && <FiInbox className="w-5 h-5 text-gray-400" />}
        <div className="w-6 h-6 bg-gray-200 rounded-full animate-pulse"></div>
      </div>
    );
  }

  return (
    <>
      {showIcon && (
        <div 
          className={`relative flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity ${className}`}
          onClick={handleClick}
          title={`${totalUnread} pesan belum dibaca`}
        >
          <FiInbox className={`w-5 h-5 ${totalUnread > 0 ? 'text-blue-600' : 'text-gray-600'}`} />
          
          {totalUnread > 0 && (
            <div className="relative">
              <div className="bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
                {totalUnread > 99 ? '99+' : totalUnread}
              </div>
              
              {/* Pulse animation for new messages */}
              <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75"></div>
            </div>
          )}
          
          {/* Detailed tooltip on hover */}
          {totalUnread > 0 && (
            <div className="absolute top-full left-0 mt-2 bg-black text-white text-xs rounded px-2 py-1 opacity-0 hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
              {unreadMessages.length === 1 
                ? `1 percakapan (${totalUnread} pesan)`
                : `${unreadMessages.length} percakapan (${totalUnread} pesan)`
              }
            </div>
          )}
        </div>
      )}
      
      {!showIcon && totalUnread > 0 && (
        <div 
          className={`cursor-pointer hover:opacity-80 transition-opacity ${className || 'bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1'}`}
          onClick={handleClick}
          title={`${totalUnread} pesan belum dibaca`}
        >
          {totalUnread > 99 ? '99+' : totalUnread}
        </div>
      )}
    </>
  );
};

export default MessageCounter;
