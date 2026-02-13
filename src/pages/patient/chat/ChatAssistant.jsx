import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../../hooks/useAuth'
import { Link } from 'react-router-dom'
import { 
  FaArrowLeft, 
  FaPaperPlane, 
  FaRobot, 
  FaUser, 
  FaTrash,
  FaCalendar,
  FaPills,
  FaClockRotateLeft,
  FaPlus,
  FaCircleInfo
} from 'react-icons/fa6'
import ReactMarkdown from 'react-markdown'
import { 
  generateResponse, 
  getQuickActions, 
  saveChatHistory, 
  loadChatHistory,
  clearChatHistory 
} from '../../../utils/chatAssistantUtils'
import toast from 'react-hot-toast'

export default function ChatAssistant() {
  const { currentUser } = useAuth()
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [quickActions] = useState(getQuickActions())
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const [showClearConfirm, setShowClearConfirm] = useState(false)

  // Load chat history on mount
  useEffect(() => {
    const history = loadChatHistory()
    if (history.length > 0) {
      setMessages(history)
    } else {
      // Welcome message
      const welcomeMessage = {
        id: Date.now(),
        text: `Hello! 👋 I'm your healthcare assistant. I can help you with:\n\n• Appointment information\n• Prescription details\n• Medical history\n• Health questions\n• Clinic information\n\nHow can I assist you today?`,
        sender: 'assistant',
        timestamp: new Date().toISOString()
      }
      setMessages([welcomeMessage])
    }
  }, [])

  // Save chat history when messages change
  useEffect(() => {
    if (messages.length > 0) {
      saveChatHistory(messages)
    }
  }, [messages])

  // Auto-scroll to bottom
  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const getIconForAction = (iconName) => {
    const icons = {
      calendar: FaCalendar,
      pills: FaPills,
      history: FaClockRotateLeft,
      plus: FaPlus,
      info: FaCircleInfo
    }
    return icons[iconName] || FaCircleInfo
  }

  const handleSendMessage = async (messageText = inputMessage) => {
    if (!messageText.trim()) return

    const userMessage = {
      id: Date.now(),
      text: messageText.trim(),
      sender: 'user',
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsTyping(true)

    try {
      // Simulate typing delay for better UX
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const response = await generateResponse(messageText, currentUser.email)
      
      const assistantMessage = {
        id: Date.now() + 1,
        text: response,
        sender: 'assistant',
        timestamp: new Date().toISOString()
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error generating response:', error)
      toast.error('Failed to get response. Please try again.')
      
      const errorMessage = {
        id: Date.now() + 1,
        text: "I'm sorry, I encountered an error. Please try asking your question again.",
        sender: 'assistant',
        timestamp: new Date().toISOString()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const handleQuickAction = (actionText) => {
    handleSendMessage(actionText)
  }

  const handleClearChat = () => {
    setShowClearConfirm(true)
  }

  const confirmClearChat = () => {
    clearChatHistory()
    const welcomeMessage = {
      id: Date.now(),
      text: `Chat history cleared. How can I help you today?`,
      sender: 'assistant',
      timestamp: new Date().toISOString()
    }
    setMessages([welcomeMessage])
    setShowClearConfirm(false)
    toast.success('Chat history cleared')
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white flex flex-col relative">
      {/* Header */}
      <header className="bg-white/5 backdrop-blur-xl border-b border-white/10 p-4 flex-shrink-0">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Link to="/patient" className="w-10 h-10 bg-cyan-500/20 rounded-xl flex items-center justify-center hover:bg-cyan-500/30 transition-colors">
              <FaArrowLeft className="w-5 h-5 text-cyan-400" />
            </Link>
            <div>
              <h1 className="text-xl font-bold flex items-center space-x-2">
                <FaRobot className="w-6 h-6 text-cyan-400" />
                <span>Health Assistant</span>
              </h1>
              <p className="text-sm text-slate-400">Ask me anything about your health</p>
            </div>
          </div>
          <button
            onClick={handleClearChat}
            className="flex items-center space-x-2 bg-red-500/20 hover:bg-red-500/30 px-4 py-2 rounded-xl transition-colors"
            title="Clear chat history"
          >
            <FaTrash className="w-4 h-4 text-red-400" />
            <span className="text-red-400 font-medium hidden sm:inline">Clear Chat</span>
          </button>
        </div>
      </header>

      {/* Chat Messages */}
      <main className="flex-1 flex flex-col min-h-0 p-4 md:p-6">
        <div className="max-w-4xl mx-auto w-full flex-1 overflow-y-auto space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-start space-x-2 max-w-[80%] ${message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.sender === 'user' 
                    ? 'bg-green-500/20' 
                    : 'bg-cyan-500/20'
                }`}>
                  {message.sender === 'user' ? (
                    <FaUser className="w-4 h-4 text-green-400" />
                  ) : (
                    <FaRobot className="w-4 h-4 text-cyan-400" />
                  )}
                </div>

                {/* Message Bubble */}
                <div className={`rounded-2xl p-4 ${
                  message.sender === 'user'
                    ? 'bg-green-500/20 border border-green-500/30'
                    : 'bg-white/5 border border-white/10'
                } max-w-full overflow-hidden`}>
                  <div className="text-sm leading-relaxed">
                    {message.sender === 'user' ? (
                      <div className="whitespace-pre-wrap break-words">{message.text}</div>
                    ) : (
                      <ReactMarkdown 
                        components={{
                          ul: ({node, ...props}) => <ul className="list-disc pl-4 space-y-1" {...props} />,
                          ol: ({node, ...props}) => <ol className="list-decimal pl-4 space-y-1" {...props} />,
                          li: ({node, ...props}) => <li className="pl-1" {...props} />,
                          p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                          strong: ({node, ...props}) => <span className="font-bold text-cyan-200" {...props} />,
                          a: ({node, ...props}) => <a className="text-cyan-400 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,
                        }}
                      >
                        {message.text}
                      </ReactMarkdown>
                    )}
                  </div>
                  <div className={`text-xs mt-2 ${
                    message.sender === 'user' ? 'text-green-400/60' : 'text-slate-400'
                  }`}>
                    {formatTimestamp(message.timestamp)}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="flex items-start space-x-2 max-w-[80%]">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-cyan-500/20">
                  <FaRobot className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Quick Actions - Always Visible */}
      <div className="flex-shrink-0 p-4 bg-white/5 border-t border-white/10">
        <div className="max-w-4xl mx-auto">
          <p className="text-sm text-slate-400 mb-3">Quick actions:</p>
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action) => {
              const IconComponent = getIconForAction(action.icon)
              return (
                <button
                  key={action.id}
                  onClick={() => handleQuickAction(action.text)}
                  className="flex items-center space-x-2 bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-2 rounded-xl transition-colors text-sm"
                >
                  <IconComponent className="w-4 h-4 text-cyan-400" />
                  <span>{action.text}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 p-4 bg-white/5 border-t border-white/10">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-end space-x-3">
            <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              <textarea
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message here..."
                rows="1"
                className="w-full bg-transparent text-white placeholder-slate-400 px-4 py-3 focus:outline-none resize-none max-h-32"
                style={{ minHeight: '48px' }}
              />
            </div>
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputMessage.trim() || isTyping}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed text-white p-3 rounded-2xl transition-all duration-300 transform hover:scale-105 disabled:transform-none disabled:scale-100 shadow-lg shadow-cyan-500/25"
            >
              <FaPaperPlane className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-2 text-center">
            Press Enter to send • Shift+Enter for new line
          </p>
        </div>
      </div>

      {/* Clear Chat Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold mb-2 text-white">Clear Chat History?</h3>
            <p className="text-slate-400 mb-6">
              This will remove all your messages and the assistant's responses. This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmClearChat}
                className="flex-1 px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium transition-colors shadow-lg shadow-red-500/25"
              >
                Clear Chat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
