import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, Trash2, ArrowRight, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { aiApi } from '../../services/api';
import './AiAssistant.css';

const SUGGESTIONS = [
    "How many active contracts do we have?",
    "Which contracts are expiring soon?",
    "Show low-stock items",
    "How many loyalty members do we have?",
    "Give me a business overview"
];

const AiAssistant = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const navigate = useNavigate();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    const handleSend = async (queryOverride) => {
        const query = queryOverride || inputValue;
        if (!query.trim()) return;

        const userMsg = { id: Date.now(), role: 'user', text: query };
        setMessages(prev => [...prev, userMsg]);
        setInputValue('');
        setIsLoading(true);

        try {
            const res = await aiApi.askQuestion({ query });
            const aiMsg = {
                id: Date.now() + 1,
                role: 'ai',
                text: res.data.text,
                visuals: res.data.visuals || [],
                action: res.data.action
            };
            setMessages(prev => [...prev, aiMsg]);
        } catch (error) {
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                role: 'ai',
                text: "I couldn't retrieve the latest BOMS data. Please try again.",
                isError: true
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleActionClick = (url) => {
        setIsOpen(false);
        navigate(url);
    };

    return (
        <div className="ai-assistant-container">
            {/* Floating Button */}
            {!isOpen && (
                <button 
                    className="ai-floating-btn" 
                    onClick={() => setIsOpen(true)}
                    title="BOMS AI Assistant"
                >
                    <Sparkles size={24} />
                    <span className="ai-btn-glow"></span>
                </button>
            )}

            {/* Chat Panel */}
            {isOpen && (
                <div className="ai-chat-panel">
                    {/* Header */}
                    <div className="ai-chat-header">
                        <div className="ai-header-left">
                            <div className="ai-header-icon">
                                <Sparkles size={20} />
                            </div>
                            <div className="ai-header-info">
                                <h3>BOMS AI</h3>
                                <span>Your intelligent BOMS assistant</span>
                            </div>
                        </div>
                        <div className="ai-header-right">
                            <div className="ai-status">
                                <span className="status-dot"></span> Online
                            </div>
                            <button className="ai-close-btn" onClick={() => setIsOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div className="ai-chat-body">
                        {messages.length === 0 ? (
                            <div className="ai-empty-state">
                                <div className="ai-empty-icon">
                                    <Sparkles size={32} />
                                </div>
                                <h4>How can I help?</h4>
                                <p>Ask me about your BOMS data, contracts, inventory or customer loyalty.</p>
                                <div className="ai-suggestions">
                                    {SUGGESTIONS.map((sug, idx) => (
                                        <button key={idx} className="ai-suggestion-chip" onClick={() => handleSend(sug)}>
                                            {sug}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="ai-messages-list">
                                <div className="ai-history-actions">
                                    <button className="ai-clear-btn" onClick={() => setMessages([])}>
                                        <Trash2 size={12} /> Clear conversation
                                    </button>
                                </div>
                                {messages.map(msg => (
                                    <div key={msg.id} className={`ai-message ${msg.role === 'user' ? 'msg-user' : 'msg-ai'} ${msg.isError ? 'msg-error' : ''}`}>
                                        {msg.role === 'ai' && (
                                            <div className="ai-avatar">
                                                <Sparkles size={14} />
                                            </div>
                                        )}
                                        <div className="ai-bubble-content">
                                            <p className="ai-text">{msg.text}</p>
                                            
                                            {/* Visual Renderers */}
                                            {msg.visuals && msg.visuals.length > 0 && (
                                                <div className="ai-visuals-container">
                                                    {msg.visuals.map((vis, idx) => (
                                                        <div key={idx} className={`ai-visual ai-visual-${vis.type}`}>
                                                            {vis.title && <h5>{vis.title}</h5>}
                                                            {vis.type === 'kpi' && (
                                                                <div className="ai-kpi-grid">
                                                                    {vis.items.map((item, i) => (
                                                                        <div key={i} className="ai-kpi-item">{item}</div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                            {vis.type === 'list' && (
                                                                <ul className="ai-compact-list">
                                                                    {vis.items.map((item, i) => (
                                                                        <li key={i}>{item}</li>
                                                                    ))}
                                                                </ul>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Action Links */}
                                            {msg.action && (
                                                <button className="ai-action-link" onClick={() => handleActionClick(msg.action.url)}>
                                                    {msg.action.label} <ArrowRight size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {isLoading && (
                                    <div className="ai-message msg-ai loading">
                                        <div className="ai-avatar"><Sparkles size={14} /></div>
                                        <div className="ai-bubble-content">
                                            <div className="ai-typing-indicator">
                                                <span></span><span></span><span></span>
                                            </div>
                                            <span className="ai-analyzing-text">Analyzing BOMS data...</span>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                        )}
                    </div>

                    {/* Input Area */}
                    <div className="ai-chat-footer">
                        <div className="ai-input-wrapper">
                            <input 
                                type="text"
                                placeholder="Ask BOMS anything..."
                                value={inputValue}
                                onChange={e => setInputValue(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSend()}
                            />
                            <button 
                                className="ai-send-btn" 
                                onClick={() => handleSend()}
                                disabled={!inputValue.trim() || isLoading}
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AiAssistant;
