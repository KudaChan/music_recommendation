'use client';

import { useEffect, useRef } from 'react';
import ChatMessage from './ChatMessage';
import { Message } from '@/app/types';

interface ChatWindowProps {
  messages: Message[];
  isProcessing: boolean;
}

export default function ChatWindow({ messages, isProcessing }: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isProcessing]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-16">
      {messages.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-center p-4">
          <div className="w-16 h-16 bg-[var(--primary-100)] dark:bg-[var(--primary-900)] rounded-full flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[var(--primary-600)] dark:text-[var(--primary-400)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-[var(--primary-800)] dark:text-[var(--primary-300)]">Start a conversation</h3>
          <p className="text-[var(--neutral-600)] dark:text-[var(--neutral-400)] text-sm">
            Ask for music recommendations based on your mood, genre preferences, or favorite artists.
          </p>
        </div>
      ) : (
        messages.map((message, index) => (
          <ChatMessage key={index} role={message.role} content={message.content} />
        ))
      )}
      
      {isProcessing && (
        <div className="flex space-x-2 p-3 bg-[var(--neutral-100)] dark:bg-[var(--neutral-800)] rounded-lg max-w-[80%]">
          <div className="w-2 h-2 bg-[var(--primary-600)] dark:bg-[var(--primary-400)] rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-[var(--primary-600)] dark:bg-[var(--primary-400)] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 bg-[var(--primary-600)] dark:bg-[var(--primary-400)] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
        </div>
      )}
      
      <div ref={messagesEndRef} />
    </div>
  );
}
