import React, { useState, useEffect, useRef } from 'react';
import { XMarkIcon, PaperAirplaneIcon, CubeIcon, UserIcon, ClipboardDocumentIcon, WandSparklesIcon } from './icons';
import { chatWithDesignAI } from '../services/geminiService';

interface DesignChatModalProps {
  contextItem: {
    imageUrl: string;
    imageData: {
      base64: string;
      mimeType: string;
    };
  };
  onClose: () => void;
  onCopyToPrompt: (prompt: string) => void;
}

export interface ChatMessage {
  sender: 'user' | 'model';
  text: string;
}

const parseSummaryAndPrompt = (text: string): { summary: string; prompt: string } | null => {
  const summaryMatch = text.match(/\*\*Design Plan Summary\*\*\s*([\s\S]*?)\*\*Recommended Prompt\*\*/);
  const promptMatch = text.match(/\*\*Recommended Prompt\*\*\s*([\s\S]*)/);

  if (summaryMatch && promptMatch) {
    return {
      summary: summaryMatch[1].trim(),
      prompt: promptMatch[1].trim()
    };
  }
  return null;
};

const simpleMarkdown = (text: string) => {
    return text
        .replace(/^\s*[\*-]\s+/gm, '<li>')
        .replace(/<\/li>\s*<li>/g, '</li><li>')
        .replace(/<li>/g, '<li class="ml-4 list-disc">');
};


export const DesignChatModal: React.FC<DesignChatModalProps> = ({ contextItem, onClose, onCopyToPrompt }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const handleSend = async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading) return;

    const newUserMessage: ChatMessage = { sender: 'user', text: trimmedInput };
    setMessages(prev => [...prev, newUserMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const responseText = await chatWithDesignAI(contextItem.imageData, [...messages, newUserMessage], trimmedInput);
      const aiMessage: ChatMessage = { sender: 'model', text: responseText };
      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Sorry, I couldn't get a response. ${errorMessage}`);
      // Remove the user's message if the call fails, so they can try again.
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinalizePlan = async () => {
    if (isLoading || messages.length === 0) return;
    setIsLoading(true);
    setError(null);
    try {
      const responseText = await chatWithDesignAI(contextItem.imageData, messages, '_FINALIZE_DESIGN_PLAN_');
      const aiMessage: ChatMessage = { sender: 'model', text: responseText };
      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Sorry, I couldn't generate the plan. ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    onCopyToPrompt(text);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="design-chat-title"
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative bg-slate-800 border border-slate-700 rounded-2xl max-w-4xl w-full h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex-shrink-0 flex items-center justify-between p-4 border-b border-slate-700">
          <h2 id="design-chat-title" className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <CubeIcon className="w-6 h-6 text-indigo-400" />
            AI Design Chat
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
            aria-label="Close chat"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </header>

        <div className="flex-grow flex flex-col md:flex-row overflow-hidden">
          <div className="md:w-1/2 flex-shrink-0 p-4 bg-slate-900/50">
            <img
              src={contextItem.imageUrl}
              alt="Current design context"
              className="w-full h-full object-contain rounded-lg"
            />
          </div>

          <div className="md:w-1/2 flex flex-col h-full">
            <div className="flex-grow overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && !isLoading && (
                  <div className="text-center text-slate-400 mt-8">
                      <p className="font-semibold">Ask me anything about this design!</p>
                      <p className="text-sm mt-2">e.g., "What style is this chair?" or "Suggest a good accent color."</p>
                  </div>
              )}
              {messages.map((msg, index) => {
                  const planParts = parseSummaryAndPrompt(msg.text);
                  if (planParts) {
                    return (
                        <div key={index} className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center">
                                <CubeIcon className="w-5 h-5 text-white" />
                            </div>
                            <div className="max-w-xs md:max-w-sm p-4 rounded-lg bg-slate-700 text-slate-200 rounded-bl-none space-y-3">
                                <div>
                                    <h4 className="font-bold text-indigo-300">Design Plan Summary</h4>
                                    <ul className="text-sm text-slate-300 mt-1 space-y-1" dangerouslySetInnerHTML={{ __html: simpleMarkdown(planParts.summary) }} />
                                </div>
                                <div className="border-t border-slate-600/50 my-2"></div>
                                <div>
                                    <h4 className="font-bold text-indigo-300">Recommended Prompt</h4>
                                    <p className="text-sm text-slate-300 mt-1 italic">"{planParts.prompt}"</p>
                                </div>
                                <button
                                    onClick={() => handleCopy(planParts.prompt)}
                                    className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                                >
                                    <ClipboardDocumentIcon className="w-4 h-4" />
                                    Use This Prompt
                                </button>
                            </div>
                        </div>
                    );
                  }
                  return (
                    <div key={index} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                       {msg.sender === 'model' && (
                           <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center">
                               <CubeIcon className="w-5 h-5 text-white" />
                           </div>
                       )}
                      <div className={`relative max-w-xs md:max-w-sm p-3 rounded-lg ${msg.sender === 'user' ? 'bg-slate-600 text-slate-100 rounded-br-none' : 'bg-slate-700 text-slate-200 rounded-bl-none'}`}>
                        <p className="text-sm" dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br />') }} />
                         {msg.sender === 'model' && (
                            <button
                                onClick={() => handleCopy(msg.text)}
                                className="absolute -bottom-3 -right-3 p-1.5 bg-slate-600 hover:bg-indigo-600 rounded-full text-slate-300 hover:text-white transition-all duration-200"
                                title="Copy to prompt and close"
                            >
                                <ClipboardDocumentIcon className="w-4 h-4" />
                            </button>
                         )}
                      </div>
                       {msg.sender === 'user' && (
                           <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-500 flex items-center justify-center">
                               <UserIcon className="w-5 h-5 text-white" />
                           </div>
                       )}
                    </div>
                  )
              })}
               {isLoading && (
                <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center">
                        <CubeIcon className="w-5 h-5 text-white" />
                    </div>
                    <div className="max-w-xs md:max-w-sm p-3 rounded-lg bg-slate-700 text-slate-200 rounded-bl-none">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></div>
                        </div>
                    </div>
                </div>
              )}
              {error && <p className="text-sm text-red-400 text-center">{error}</p>}
              <div ref={chatEndRef} />
            </div>

            <div className="flex-shrink-0 p-4 border-t border-slate-700 bg-slate-800">
              <div className="flex items-center gap-3">
                <button
                    onClick={handleFinalizePlan}
                    disabled={isLoading || messages.length === 0}
                    className="p-2.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
                    aria-label="Finalize design plan and generate prompt"
                    title="Finalize design plan and generate prompt"
                >
                    <WandSparklesIcon className="w-5 h-5" />
                </button>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask a question or finalize plan..."
                  className="flex-grow bg-slate-900/70 border border-slate-600 rounded-lg p-2.5 text-sm text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  disabled={isLoading}
                />
                <button
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  className="p-2.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
                  aria-label="Send message"
                >
                  <PaperAirplaneIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
