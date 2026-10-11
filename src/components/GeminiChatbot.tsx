import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquareText,
  X,
  Send,
  Sparkles,
  Brain,
  RotateCcw,
  Bot,
  User,
  ShieldCheck,
  Zap,
  Film,
  Minimize2,
  Maximize2
} from 'lucide-react';
import { ChatMessage } from '../types/recap';

interface GeminiChatbotProps {
  isOpen: boolean;
  onClose: () => void;
  uiLang: 'my' | 'en';
}

export const GeminiChatbot: React.FC<GeminiChatbotProps> = ({
  isOpen,
  onClose,
  uiLang,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        uiLang === 'my'
          ? 'မင်္ဂလာပါ! ကျွန်တော်ကတော့ MovieRecap AI ဒါရိုက်တာဖြစ်ပါတယ်။ သင့်ရုပ်ရှင်ဇာတ်ကားများအတွက် စိတ်လှုပ်ရှားဖွယ် ဇာတ်ညွှန်းများ ရေးသားပေးခြင်း၊ မြန်မာဘာသာ ပြန်ဆိုပေးခြင်းနှင့် မူပိုင်ခွင့် (Copyright Strike) ကင်းလွတ်စေရန် အကြံဉာဏ်များ ပေးနိုင်ပါသည်။ ဘာများ ကူညီပေးရမလဲခင်ဗျာ?'
          : 'Greetings! I am your MovieRecap AI Director. I can help you craft viral recap scripts in Burmese and English, write gripping hooks, and optimize anti-copyright measures (mirror flip, 5-second freeze frames). What movie are we recapping today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      modelUsed: 'gemini-3.5-flash',
    },
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [model, setModel] = useState<'gemini-3.5-flash' | 'gemini-3.1-pro-preview' | 'gemini-3.1-flash-lite'>('gemini-3.5-flash');
  const [useThinking, setUseThinking] = useState(false);
  const [roleMode, setRoleMode] = useState<'director' | 'copyright' | 'hook'>('director');
  const [isExpanded, setIsExpanded] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (!isOpen) return null;

  const getSystemInstruction = () => {
    if (roleMode === 'copyright') {
      return 'You are a Copyright Protection & Fair Use Specialist for movie recap channels on YouTube, Facebook, and TikTok. You explain how horizontal mirroring, 5-second freeze intervals, pitch shifting, audio replacement, and micro-zooming prevent automated Content ID claims.';
    }
    if (roleMode === 'hook') {
      return 'You are a Viral Hook Doctor specializing in movie summaries. You craft the most irresistible, high-retention 3-second opening hooks in Burmese (မြန်မာဘာသာ) and English that stop viewers from scrolling.';
    }
    return 'You are the MovieRecap AI Director & Storyboard Assistant (ရုပ်ရှင်ဇာတ်လမ်းပြော အကြံပေး AI). You help creators structure suspenseful, captivating movie recaps in Burmese and English with scene pacing and emotional resonance.';
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    if (!textToSend) setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newHistory.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          model,
          useThinking,
          systemInstruction: getSystemInstruction(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to get response');
      }

      const botReply: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: data.modelUsed,
        thoughtProcess: data.thinkingUsed ? 'Deep reasoning with ThinkingLevel.HIGH' : undefined,
      };

      setMessages((prev) => [...prev, botReply]);
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content:
          uiLang === 'my'
            ? `တောင်းပန်ပါသည်။ ချိတ်ဆက်မှု အခက်အခဲရှိနေပါသည်: ${err.message}`
            : `Sorry, an error occurred: ${err.message}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    {
      my: 'ဒီဇာတ်ကားအတွက် ပထမ ၃ စက္ကန့် Viral Hook ရေးပေးပါ',
      en: 'Write a viral 3-second hook for my movie recap',
    },
    {
      my: 'မြန်မာစကားပြော Voiceover ဇာတ်ညွှန်းကို ပိုသည်းထိတ်ရင်ဖိုဖြစ်အောင် ပြင်ပေးပါ',
      en: 'Make the Burmese voiceover narration more suspenseful',
    },
    {
      my: 'ဘယ်ညာပြောင်းတာနဲ့ ၅ စက္ကန့် Freeze လုပ်တာက Copyright မငြိအောင် ဘယ်လိုကာကွယ်သလဲ?',
      en: 'How do mirror flip and 5s freeze frames prevent Content ID strikes?',
    },
    {
      my: 'မထင်မှတ်ထားတဲ့ ဇာတ်ကွက်လှည့်ကွက် (Plot Twist) ကို ဘယ်လိုတင်ဆက်ရမလဲ?',
      en: 'How should I reveal the big plot twist in the recap outro?',
    },
  ];

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 transition-all flex flex-col bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-2xl ${
        isExpanded
          ? 'w-[94vw] sm:w-[650px] h-[85vh]'
          : 'w-[92vw] sm:w-[460px] h-[580px]'
      }`}
    >
      {/* Chat Header */}
      <div className="p-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center text-white shadow-md">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-100 flex items-center space-x-1.5">
              <span>{uiLang === 'my' ? 'AI ဇာတ်ညွှန်း လက်ထောက်' : 'Gemini Recap Director'}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </h3>
            <span className="text-[10px] text-slate-400">
              {model} {useThinking ? '• Thinking High' : ''}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title={isExpanded ? 'Minimize' : 'Expand'}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Role & Model Toolbar */}
      <div className="px-4 py-2 bg-slate-950/60 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Role selector */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setRoleMode('director')}
            className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
              roleMode === 'director' ? 'bg-rose-500/20 text-rose-300' : 'text-slate-400'
            }`}
          >
            Director
          </button>
          <button
            onClick={() => setRoleMode('hook')}
            className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
              roleMode === 'hook' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400'
            }`}
          >
            Viral Hook
          </button>
          <button
            onClick={() => setRoleMode('copyright')}
            className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
              roleMode === 'copyright' ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-400'
            }`}
          >
            Copyright Anti-Strike
          </button>
        </div>

        {/* Model & Thinking Mode controls */}
        <div className="flex items-center space-x-2">
          <select
            value={model}
            onChange={(e) => setModel(e.target.value as any)}
            className="bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-[10px] text-slate-300 focus:outline-none"
          >
            <option value="gemini-3.5-flash">gemini-3.5-flash (General)</option>
            <option value="gemini-3.1-pro-preview">gemini-3.1-pro-preview (Complex)</option>
            <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Fast)</option>
          </select>

          <label
            className="flex items-center space-x-1 text-[10px] text-slate-300 cursor-pointer"
            title="Enable High Thinking Mode (gemini-3.1-pro-preview with ThinkingLevel.HIGH)"
          >
            <input
              type="checkbox"
              checked={useThinking}
              onChange={(e) => {
                setUseThinking(e.target.checked);
                if (e.target.checked) setModel('gemini-3.1-pro-preview');
              }}
              className="w-3 h-3 text-rose-600 bg-slate-900 border-slate-700 rounded"
            />
            <span className="flex items-center space-x-0.5 font-medium">
              <Brain className="w-3 h-3 text-amber-400" />
              <span>Thinking High</span>
            </span>
          </label>
        </div>
      </div>

      {/* Messages Thread */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex items-start space-x-2.5 ${
              m.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
            }`}
          >
            <div
              className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                m.role === 'user'
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-800 border border-slate-700 text-amber-400'
              }`}
            >
              {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div
              className={`max-w-[82%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'bg-rose-600 text-white rounded-tr-none'
                  : 'bg-slate-950/80 border border-slate-800 text-slate-200 rounded-tl-none'
              }`}
            >
              {m.thoughtProcess && (
                <div className="mb-2 pb-1.5 border-b border-slate-800 flex items-center space-x-1.5 text-[10px] text-amber-400 font-mono">
                  <Brain className="w-3 h-3" />
                  <span>{m.thoughtProcess}</span>
                </div>
              )}
              <p className="whitespace-pre-wrap">{m.content}</p>
              <div className="mt-1 flex items-center justify-between text-[9px] opacity-60">
                <span>{m.modelUsed || ''}</span>
                <span>{m.timestamp}</span>
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start space-x-2.5">
            <div className="w-7 h-7 rounded-xl bg-slate-800 border border-slate-700 text-amber-400 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl rounded-tl-none p-3.5 text-xs text-slate-400 flex items-center space-x-2">
              <RotateCcw className="w-3.5 h-3.5 animate-spin text-rose-500" />
              <span>
                {useThinking
                  ? 'Gemini 3.1 Pro Thinking with High Reasoning...'
                  : 'Gemini is drafting response...'}
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts */}
      <div className="px-3 py-2 bg-slate-950/60 border-t border-slate-800/80 flex items-center space-x-1.5 overflow-x-auto no-scrollbar">
        {quickPrompts.map((qp, i) => (
          <button
            key={i}
            onClick={() => handleSendMessage(uiLang === 'my' ? qp.my : qp.en)}
            className="shrink-0 px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-[11px] transition-colors"
          >
            {uiLang === 'my' ? qp.my : qp.en}
          </button>
        ))}
      </div>

      {/* Input bar */}
      <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center space-x-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSendMessage();
          }}
          placeholder={
            uiLang === 'my'
              ? 'ဇာတ်ညွှန်း သို့မဟုတ် မူပိုင်ခွင့် အကြောင်း မေးမြန်းရန်...'
              : 'Ask about script twists, hooks, or copyright evasion...'
          }
          className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500"
        />

        <button
          onClick={() => handleSendMessage()}
          disabled={!input.trim() || isLoading}
          className="w-10 h-10 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white flex items-center justify-center transition-colors shadow-md shadow-rose-950/40 shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
