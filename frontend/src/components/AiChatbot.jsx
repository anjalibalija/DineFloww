import { useState, useRef, useEffect } from 'react';
import { Sparkles, MessageSquare, X, Send, User, Bot, HelpCircle } from 'lucide-react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';

const AiChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: 'Hello! I am your DineFlow AI assistant. Ask me to find cuisines, tables, or restaurants in your city! (e.g. "I want Italian in Mumbai under ₹₹")'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const location = useLocation();

  // Hide chatbot on admin routes
  const isAdminRoute = location.pathname.startsWith('/admin');

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  if (isAdminRoute) return null;

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: input
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await axios.post('/api/ai/chat', { message: userMessage.text });
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'bot',
        text: res.data.data.reply
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'bot',
        text: 'Sorry, I am facing connectivity issues. Please try again later.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const renderMessageText = (text) => {
    // Basic markdown link parser: [text](url)
    const regex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      const [fullMatch, linkText, linkUrl] = match;
      const index = match.index;

      if (index > lastIndex) {
        // Handle pre-link text, preserve formatting/newlines by splitting on \n
        parts.push(...text.substring(lastIndex, index).split('\n').map((line, idx) => (
          <span key={`text-${index}-${idx}`}>
            {idx > 0 && <br />}
            {line}
          </span>
        )));
      }

      parts.push(
        <a
          key={`link-${index}`}
          href={linkUrl}
          className="text-gold-500 font-bold underline hover:text-gold-600 transition-colors mx-1"
        >
          {linkText}
        </a>
      );

      lastIndex = index + fullMatch.length;
    }

    if (lastIndex < text.length) {
      parts.push(...text.substring(lastIndex).split('\n').map((line, idx) => (
        <span key={`tail-${idx}`}>
          {idx > 0 && <br />}
          {line}
        </span>
      )));
    }

    return parts.length > 0 ? parts : text;
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-brown-900 text-cream-100 hover:bg-gold-500 hover:text-brown-900 transition-all duration-300 p-4 rounded-full shadow-2xl flex items-center gap-2 border border-gold-500/20 group hover:scale-105"
        >
          <Sparkles className="animate-pulse text-gold-500 group-hover:text-brown-900" size={22} />
          <span className="font-semibold text-sm max-w-0 overflow-hidden group-hover:max-w-[120px] transition-all duration-500 ease-out whitespace-nowrap">
            AI Assistant
          </span>
        </button>
      )}

      {/* Expanded Chat Box */}
      {isOpen && (
        <div className="w-[380px] h-[500px] bg-brown-900 rounded-3xl border border-gold-500/30 flex flex-col shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300">
          
          {/* Header */}
          <div className="bg-black/40 p-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="bg-gold-500/10 text-gold-500 p-2 rounded-xl">
                <Sparkles size={18} />
              </div>
              <div>
                <h3 className="font-serif font-bold text-cream-100 text-sm">DineFlow AI Concierge</h3>
                <span className="text-[10px] text-green-400 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 bg-green-400 rounded-full animate-ping" /> Online
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-cream-200/50 hover:text-cream-100 hover:bg-white/5 p-1.5 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-grow p-4 overflow-y-auto space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 max-w-[85%] ${
                  msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
                }`}
              >
                <div
                  className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold
                    ${
                      msg.sender === 'user'
                        ? 'bg-gold-500 text-brown-900'
                        : 'bg-white/10 text-gold-500'
                    }`}
                >
                  {msg.sender === 'user' ? <User size={14} /> : <Bot size={14} />}
                </div>
                <div
                  className={`p-3 rounded-2xl text-xs leading-relaxed shadow-sm
                    ${
                      msg.sender === 'user'
                        ? 'bg-gold-500 text-brown-900 rounded-tr-none font-medium'
                        : 'bg-black/20 text-cream-100 border border-white/5 rounded-tl-none'
                    }`}
                >
                  {renderMessageText(msg.text)}
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex gap-2.5 max-w-[80%]">
                <div className="h-8 w-8 rounded-xl bg-white/10 text-gold-500 flex items-center justify-center shrink-0">
                  <Bot size={14} />
                </div>
                <div className="bg-black/20 text-cream-100 border border-white/5 p-3 rounded-2xl rounded-tl-none text-xs flex items-center gap-1">
                  <span className="h-1.5 w-1.5 bg-gold-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="h-1.5 w-1.5 bg-gold-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="h-1.5 w-1.5 bg-gold-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions */}
          <div className="px-4 py-2 bg-black/10 border-t border-white/5 flex gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-none">
            <button
              onClick={() => setInput("Show Italian cafes in Pune")}
              className="bg-white/5 hover:bg-white/10 text-[10px] text-cream-200 border border-white/5 px-2.5 py-1 rounded-full transition-colors"
            >
              🇮🇹 Pune Italian
            </button>
            <button
              onClick={() => setInput("Budget options under ₹")}
              className="bg-white/5 hover:bg-white/10 text-[10px] text-cream-200 border border-white/5 px-2.5 py-1 rounded-full transition-colors"
            >
              💵 Budget (₹)
            </button>
            <button
              onClick={() => setInput("Top rated restaurants")}
              className="bg-white/5 hover:bg-white/10 text-[10px] text-cream-200 border border-white/5 px-2.5 py-1 rounded-full transition-colors"
            >
              ⭐ Top Rated
            </button>
          </div>

          {/* Input Footer */}
          <form onSubmit={handleSend} className="p-3 bg-black/30 border-t border-white/10 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type message..."
              autoComplete="one-time-code"
              className="flex-grow bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-cream-100 placeholder-cream-200/30 focus:outline-none focus:border-gold-500 transition-colors"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-gold-500 hover:bg-gold-600 disabled:opacity-50 text-brown-900 p-2 rounded-xl transition-all shadow-md flex items-center justify-center"
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default AiChatbot;
