interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatMessage({ role, content }: ChatMessageProps) {
  return (
    <div 
      className={`p-3 rounded-lg ${
        role === 'user' 
          ? 'ml-auto bg-[var(--primary-600)] dark:bg-[var(--primary-400)] text-white dark:text-black max-w-[80%]' 
          : 'bg-[var(--neutral-100)] dark:bg-[var(--neutral-800)] text-[var(--neutral-800)] dark:text-[var(--neutral-200)] max-w-[90%]'
      }`}
    >
      {content}
    </div>
  );
}
