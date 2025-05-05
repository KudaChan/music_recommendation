'use client';

import { useState } from 'react';
import { IoSend } from 'react-icons/io5';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isProcessing: boolean;
  placeholder?: string;
}

export default function ChatInput({ 
  onSendMessage, 
  isProcessing, 
  placeholder = "Type a message..." 
}: ChatInputProps) {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;
    
    onSendMessage(input);
    setInput('');
  };

  return (
    <div className="bg-[var(--neutral-100)] dark:bg-[var(--neutral-800)] border-t border-[var(--neutral-200)] dark:border-[var(--neutral-700)] p-2 w-full shadow-md rounded-b-md">
      <form onSubmit={handleSubmit} className="flex items-center">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          disabled={isProcessing}
          className="flex-1 p-2 rounded-full border border-r-0 border-[var(--neutral-300)] dark:border-[var(--neutral-600)] bg-[var(--neutral-100)] dark:bg-[var(--neutral-800)] text-[var(--neutral-800)] dark:text-[var(--neutral-200)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)] dark:focus:ring-[var(--primary-400)]"
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={isProcessing || !input.trim()}
          className="p-2 rounded-full bg-[var(--primary-600)] dark:bg-[var(--primary-400)] text-white disabled:opacity-50 disabled:hover:bg-[var(--primary-600)] transition-colors duration-200 flex items-center justify-center"
          aria-label="Send message"
        >
          <IoSend className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
