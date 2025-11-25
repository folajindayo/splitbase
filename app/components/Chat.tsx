import React, { useState, useEffect, useRef, ReactNode } from 'react';

import { View, Text, TextInput, Pressable, ScrollView, Image } from 'react-native';

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  timestamp: string;
  type?: 'text' | 'image' | 'file' | 'system';
  attachments?: Array<{
    id: string;
    name: string;
    url: string;
    type: string;
    size: number;
  }>;
  replyTo?: {
    id: string;
    content: string;
    senderName: string;
  };
  reactions?: Array<{
    emoji: string;
    users: string[];
  }>;
  edited?: boolean;
  editedAt?: string;
  deleted?: boolean;
}

export interface ChatUser {
  id: string;
  name: string;
  avatar?: string;
  online?: boolean;
  lastSeen?: string;
  typing?: boolean;
}

interface ChatProps {
  messages: ChatMessage[];
  currentUserId: string;
  otherUser?: ChatUser;
  onSendMessage: (content: string, attachments?: File[]) => void;
  onEditMessage?: (messageId: string, newContent: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  onReactToMessage?: (messageId: string, emoji: string) => void;
  onTyping?: (isTyping: boolean) => void;
  onLoadMore?: () => void;
  loading?: boolean;
  hasMore?: boolean;
  placeholder?: string;
  allowAttachments?: boolean;
  allowReactions?: boolean;
  allowEdit?: boolean;
  allowDelete?: boolean;
  className?: string;
}

export const Chat: React.FC<ChatProps> = ({
  messages,
  currentUserId,
  otherUser,
  onSendMessage,
  onEditMessage,
  onDeleteMessage,
  onReactToMessage,
  onTyping,
  onLoadMore,
  loading = false,
  hasMore = false,
  placeholder = 'Type a message...',
  allowAttachments = true,
  allowReactions = true,
  allowEdit = true,
  allowDelete = true,
  className = '',
}) => {
  const [inputValue, setInputValue] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollViewRef.current && messages.length > 0) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [messages.length]);

  // Handle typing indicator
  const handleInputChange = (text: string) => {
    setInputValue(text);

    if (onTyping) {
      onTyping(true);

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set new timeout to stop typing indicator
      typingTimeoutRef.current = setTimeout(() => {
        onTyping(false);
      }, 2000);
    }
  };

  // Handle send message
  const handleSend = () => {
    const trimmedValue = inputValue.trim();
    
    if (!trimmedValue && selectedFiles.length === 0) return;

    if (editingMessageId && onEditMessage) {
      onEditMessage(editingMessageId, trimmedValue);
      setEditingMessageId(null);
    } else {
      onSendMessage(trimmedValue, selectedFiles.length > 0 ? selectedFiles : undefined);
    }

    setInputValue('');
    setSelectedFiles([]);
    setReplyingTo(null);

    if (onTyping) {
      onTyping(false);
    }
  };

  // Handle edit
  const startEdit = (message: ChatMessage) => {
    setEditingMessageId(message.id);
    setInputValue(message.content);
  };

  // Cancel edit
  const cancelEdit = () => {
    setEditingMessageId(null);
    setInputValue('');
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMins = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMs / 3600000);
    const diffInDays = Math.floor(diffInMs / 86400000);

    if (diffInMins < 1) return 'Just now';
    if (diffInMins < 60) return `${diffInMins}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  };

  // Group messages by date
  const groupedMessages: Array<{ date: string; messages: ChatMessage[] }> = [];
  let currentDate = '';
  let currentGroup: ChatMessage[] = [];

  messages.forEach((message, index) => {
    const messageDate = new Date(message.timestamp).toDateString();
    
    if (messageDate !== currentDate) {
      if (currentGroup.length > 0) {
        groupedMessages.push({ date: currentDate, messages: currentGroup });
      }
      currentDate = messageDate;
      currentGroup = [message];
    } else {
      currentGroup.push(message);
    }

    // Push last group
    if (index === messages.length - 1) {
      groupedMessages.push({ date: currentDate, messages: currentGroup });
    }
  });

  return (
    <View className={`flex-1 bg-gray-50 dark:bg-gray-900 ${className}`}>
      {/* Chat Header */}
      {otherUser && (
        <View className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
          <View className="flex-row items-center">
            <View className="relative">
              <View className="w-10 h-10 bg-blue-600 rounded-full items-center justify-center">
                <Text className="text-white font-bold text-lg">
                  {otherUser.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              {otherUser.online && (
                <View className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800" />
              )}
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-base font-semibold text-gray-900 dark:text-white">
                {otherUser.name}
              </Text>
              {otherUser.typing ? (
                <Text className="text-sm text-green-600 dark:text-green-400">typing...</Text>
              ) : otherUser.online ? (
                <Text className="text-sm text-green-600 dark:text-green-400">Online</Text>
              ) : otherUser.lastSeen ? (
                <Text className="text-sm text-gray-500 dark:text-gray-400">
                  Last seen {formatTimestamp(otherUser.lastSeen)}
                </Text>
              ) : null}
            </View>
          </View>
        </View>
      )}

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        className="flex-1 px-4 py-4"
        onScroll={({ nativeEvent }) => {
          // Load more when scrolled to top
          if (nativeEvent.contentOffset.y <= 50 && hasMore && onLoadMore && !loading) {
            onLoadMore();
          }
        }}
      >
        {loading && (
          <View className="py-4 items-center">
            <Text className="text-sm text-gray-500 dark:text-gray-400">Loading...</Text>
          </View>
        )}

        {groupedMessages.map((group, groupIndex) => (
          <View key={groupIndex}>
            {/* Date divider */}
            <View className="flex-row items-center my-4">
              <View className="flex-1 h-px bg-gray-300 dark:bg-gray-600" />
              <Text className="px-3 text-xs text-gray-500 dark:text-gray-400">
                {group.date === new Date().toDateString() ? 'Today' : group.date}
              </Text>
              <View className="flex-1 h-px bg-gray-300 dark:bg-gray-600" />
            </View>

            {/* Messages */}
            {group.messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={message.senderId === currentUserId}
                onEdit={allowEdit ? () => startEdit(message) : undefined}
                onDelete={allowDelete && onDeleteMessage ? () => onDeleteMessage(message.id) : undefined}
                onReply={() => setReplyingTo(message)}
                onReact={
                  allowReactions && onReactToMessage
                    ? (emoji) => onReactToMessage(message.id, emoji)
                    : undefined
                }
              />
            ))}
          </View>
        ))}
      </ScrollView>

      {/* Reply preview */}
      {replyingTo && (
        <View className="bg-gray-100 dark:bg-gray-800 px-4 py-2 border-t border-gray-200 dark:border-gray-700 flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-xs text-gray-600 dark:text-gray-400">
              Replying to {replyingTo.senderName}
            </Text>
            <Text className="text-sm text-gray-900 dark:text-white" numberOfLines={1}>
              {replyingTo.content}
            </Text>
          </View>
          <Pressable onPress={() => setReplyingTo(null)}>
            <Text className="text-gray-500 text-xl">×</Text>
          </Pressable>
        </View>
      )}

      {/* Edit mode indicator */}
      {editingMessageId && (
        <View className="bg-yellow-100 dark:bg-yellow-900/20 px-4 py-2 border-t border-yellow-200 dark:border-yellow-800 flex-row items-center justify-between">
          <Text className="text-sm text-yellow-800 dark:text-yellow-300">Editing message</Text>
          <Pressable onPress={cancelEdit}>
            <Text className="text-yellow-800 dark:text-yellow-300 font-medium">Cancel</Text>
          </Pressable>
        </View>
      )}

      {/* Input Area */}
      <View className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-3">
        <View className="flex-row items-center space-x-2">
          {allowAttachments && (
            <Pressable className="p-2">
              <Text className="text-xl">📎</Text>
            </Pressable>
          )}
          <TextInput
            value={inputValue}
            onChangeText={handleInputChange}
            placeholder={placeholder}
            multiline
            className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full px-4 py-2 text-gray-900 dark:text-white max-h-24"
            placeholderTextColor="#9CA3AF"
          />
          <Pressable
            onPress={handleSend}
            disabled={!inputValue.trim() && selectedFiles.length === 0}
            className={`p-3 rounded-full ${
              inputValue.trim() || selectedFiles.length > 0
                ? 'bg-blue-600'
                : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <Text className="text-white text-xl">
              {editingMessageId ? '✓' : '➤'}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

interface MessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onReply?: () => void;
  onReact?: (emoji: string) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwn,
  onEdit,
  onDelete,
  onReply,
  onReact,
}) => {
  const [showActions, setShowActions] = useState(false);

  if (message.type === 'system') {
    return (
      <View className="py-2 items-center">
        <Text className="text-xs text-gray-500 dark:text-gray-400 text-center">
          {message.content}
        </Text>
      </View>
    );
  }

  return (
    <Pressable
      onLongPress={() => setShowActions(!showActions)}
      className={`flex-row mb-3 ${isOwn ? 'justify-end' : 'justify-start'}`}
    >
      <View className={`max-w-[80%] ${isOwn ? 'items-end' : 'items-start'}`}>
        {/* Reply preview */}
        {message.replyTo && (
          <View
            className={`mb-1 px-3 py-2 rounded-lg border-l-4 ${
              isOwn
                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500'
                : 'bg-gray-100 dark:bg-gray-700 border-gray-400'
            }`}
          >
            <Text className="text-xs text-gray-600 dark:text-gray-400">
              {message.replyTo.senderName}
            </Text>
            <Text className="text-xs text-gray-900 dark:text-white" numberOfLines={1}>
              {message.replyTo.content}
            </Text>
          </View>
        )}

        {/* Message bubble */}
        <View
          className={`px-4 py-2 rounded-2xl ${
            isOwn
              ? 'bg-blue-600 rounded-tr-sm'
              : 'bg-gray-200 dark:bg-gray-700 rounded-tl-sm'
          }`}
        >
          {message.deleted ? (
            <Text
              className={`text-sm italic ${
                isOwn ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              This message was deleted
            </Text>
          ) : (
            <>
              <Text
                className={`text-base ${
                  isOwn ? 'text-white' : 'text-gray-900 dark:text-white'
                }`}
              >
                {message.content}
              </Text>
              {message.edited && (
                <Text
                  className={`text-xs mt-1 ${
                    isOwn ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  (edited)
                </Text>
              )}
            </>
          )}
        </View>

        {/* Reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <View className="flex-row flex-wrap mt-1">
            {message.reactions.map((reaction, index) => (
              <Pressable
                key={index}
                onPress={() => onReact && onReact(reaction.emoji)}
                className="bg-gray-100 dark:bg-gray-700 rounded-full px-2 py-1 mr-1 mb-1 flex-row items-center"
              >
                <Text className="text-sm">{reaction.emoji}</Text>
                <Text className="text-xs text-gray-600 dark:text-gray-400 ml-1">
                  {reaction.users.length}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* Timestamp */}
        <Text className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>

        {/* Actions menu */}
        {showActions && (
          <View className="mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            {onReact && (
              <View className="flex-row p-2 border-b border-gray-200 dark:border-gray-700">
                {['👍', '❤️', '😂', '😮', '😢', '🙏'].map((emoji) => (
                  <Pressable
                    key={emoji}
                    onPress={() => {
                      onReact(emoji);
                      setShowActions(false);
                    }}
                    className="p-2"
                  >
                    <Text className="text-xl">{emoji}</Text>
                  </Pressable>
                ))}
              </View>
            )}
            {onReply && (
              <Pressable
                onPress={() => {
                  onReply();
                  setShowActions(false);
                }}
                className="px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Text className="text-sm text-gray-900 dark:text-white">Reply</Text>
              </Pressable>
            )}
            {isOwn && onEdit && !message.deleted && (
              <Pressable
                onPress={() => {
                  onEdit();
                  setShowActions(false);
                }}
                className="px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Text className="text-sm text-gray-900 dark:text-white">Edit</Text>
              </Pressable>
            )}
            {isOwn && onDelete && (
              <Pressable
                onPress={() => {
                  onDelete();
                  setShowActions(false);
                }}
                className="px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Text className="text-sm text-red-600">Delete</Text>
              </Pressable>
            )}
          </View>
        )}
      </View>
    </Pressable>
  );
};

