import React, { useState, useRef, useEffect } from 'react';
import { Send, Upload, X, Check, Loader2, Bot } from 'lucide-react';
import { toast } from 'react-hot-toast';

const WhatsAppSimulator = () => {
    const [messages, setMessages] = useState([
        { id: 1, type: 'text', content: '👋 Hi! Welcome to Nagar Alert Hub.', sender: 'bot', time: '10:00 AM' },
        { id: 2, type: 'text', content: 'I can help you report incidents. Type "Start" or say "Hi" to begin.', sender: 'bot', time: '10:00 AM' }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = { id: Date.now(), type: 'text', content: input, sender: 'user', time: getCurrentTime() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        simulateBotResponse(input);
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const userMsg = {
                    id: Date.now(),
                    type: 'image',
                    content: e.target.result,
                    sender: 'user',
                    time: getCurrentTime()
                };
                setMessages(prev => [...prev, userMsg]);
                simulateBotResponse(e.target.result); // Pass Data URI
            };
            reader.readAsDataURL(file);
        }
    };

    const simulateBotResponse = (userInput) => {
        setIsTyping(true);
        const lowerInput = (typeof userInput === 'string' ? userInput : '').toLowerCase();

        const addBotReply = (responseText) => {
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                type: 'text',
                content: responseText,
                sender: 'bot',
                time: getCurrentTime()
            }]);
            setIsTyping(false);
        };

        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';

        if (lowerInput === '__image__' || (typeof userInput === 'string' && userInput.startsWith('data:'))) {
            setTimeout(async () => {
                let responseText = `✅ *Thank you!*\n\nYour picture and location have been received and sent to your nearest authorities. We will look into it shortly.`;
                try {
                    const res = await fetch(`${API_BASE_URL}/api/whatsapp/simulate`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ message: 'Photo', type: 'image', senderNumber: '919999999999' })
                    });
                    const data = await res.json();
                    if (data.replies && data.replies.length) responseText = data.replies.join('\n\n');
                } catch (_) { /* use default */ }
                addBotReply(responseText);
            }, 1500);
            return;
        }

        // Text: call backend simulate to get real bot reply (Hi → language → location → photo flow)
        (async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/whatsapp/simulate`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: userInput, type: 'text', senderNumber: '919999999999' })
                });
                const data = await res.json();
                if (data.replies && data.replies.length) {
                    setTimeout(() => addBotReply(data.replies.join('\n\n')), 800);
                    return;
                }
            } catch (e) { console.error("Simulate failed", e); }
            // Fallback if backend unreachable
            setTimeout(() => {
                if (lowerInput.includes('start') || lowerInput.includes('hi') || lowerInput.includes('hello')) {
                    addBotReply("Welcome to Nagar Alert! 🚨\n\nPlease choose your language:\n*1.* English\n*2.* Hindi");
                } else if (/^(1|english|eng)$/.test(lowerInput)) {
                    addBotReply("Please share your *location* (use the 📎 attachment button and choose Location).");
                } else if (/^(2|hindi|hi|हिंदी)$/.test(lowerInput)) {
                    addBotReply("कृपया अपना *लोकेशन* भेजें (📎 अटैचमेंट बटन से Location चुनें)।");
                } else if (lowerInput.includes('status')) {
                    addBotReply("You can check your report status on the dashboard.");
                } else {
                    addBotReply("Type *Hi* or *Start* to report an issue.");
                }
            }, 800);
        })();
    };

    const getCurrentTime = () => {
        return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="w-full max-w-md mx-auto bg-[#efe7dd] dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] overflow-hidden shadow-2xl flex flex-col h-[600px]">
            {/* Header */}
            <div className="bg-[#008069] p-4 flex items-center gap-3 text-white shadow-md">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <Bot size={24} />
                </div>
                <div>
                    <h3 className="font-bold text-sm">Nagar Alert Assistant</h3>
                    <p className="text-[10px] opacity-80">Official Business Account</p>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-lg p-3 text-sm shadow-sm relative ${msg.sender === 'user'
                            ? 'bg-[#d9fdd3] dark:bg-green-900 text-slate-800 dark:text-slate-100 rounded-tr-none'
                            : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none'
                            }`}>
                            {msg.type === 'image' ? (
                                <div className="mb-1 rounded overflow-hidden">
                                    <img src={msg.content} alt="Upload" className="w-full h-auto" />
                                </div>
                            ) : (
                                <p className="whitespace-pre-wrap">{msg.content}</p>
                            )}
                            <span className="text-[10px] text-slate-400 block text-right mt-1">{msg.time}</span>
                        </div>
                    </div>
                ))}

                {isTyping && (
                    <div className="flex justify-start">
                        <div className="bg-white dark:bg-slate-800 rounded-2xl rounded-tl-none p-3 shadow-sm">
                            <Loader2 size={16} className="animate-spin text-green-600" />
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-3 bg-white dark:bg-slate-800 flex items-center gap-2">
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition"
                >
                    <Upload size={20} />
                </button>
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileUpload}
                />

                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Message..."
                    className="flex-1 bg-slate-100 dark:bg-slate-700 border-none rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                />

                <button
                    onClick={handleSend}
                    className="p-2 bg-[#008069] hover:bg-[#006d59] text-white rounded-full transition shadow-sm"
                >
                    <Send size={18} />
                </button>
            </div>
        </div>
    );
};

export default WhatsAppSimulator;
