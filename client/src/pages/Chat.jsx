import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import authService from '../services/authService';
import { Link } from 'react-router-dom';
import './Chat.css';
import imageImage from '../icons/icon-image.png'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3005';
const MAX_IMAGE_BYTES = 500 * 1024;

const Chat = () => {
  const [messages, setMessages]     = useState([]);
  const [users, setUsers]           = useState([]);
  const [text, setText]             = useState('');
  const [connected, setConnected]   = useState(false);
  const [socketId, setSocketId]     = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageError, setImageError] = useState('');
  const [typingUsers, setTypingUsers] =useState([]);

  const socketRef  = useRef(null);
  const bottomRef  = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const currentUser = authService.getCurrentUser();

  // connect when mounting
  useEffect(() => {
    const socket = io(SOCKET_URL, { withCredentials: true });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      setSocketId(socket.id);

      // sends user data to server
      socket.emit('user:join', {
        name:   currentUser?.name   || 'Anonymous',
        avatar: currentUser?.avatar || ''
      });
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('chat:message', (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    socket.on('chat:system', (msg) => {
      setMessages(prev => [...prev, { ...msg, isSystem: true }]);
    });

    socket.on('users:update', (userList) => {
      setUsers(userList);
    });

    socket.on('chat:error', (err) => {
      setImageError(err.message || 'Error sending message');
    });

    // smbody is typing or stops typing
    socket.on('chat:typing', ({ sender, isTyping }) => {
      setTypingUsers(prev => {
        if (isTyping) {
          return prev.includes(sender) ? prev : [...prev, sender];
        }
        return prev.filter(name => name !== sender);
      });
    });

    return () => socket.disconnect();
  }, []);

  // scrolls to last msg
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if ((!text.trim() && !imagePreview) || !connected) return;
    socketRef.current.emit('chat:message', { text, image: imagePreview });
    setText('');
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    stopTyping();
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // shows "typing" w throttle n "stops typing" after 2s of inactivity
  const handleTextChange = (e) => {
    setText(e.target.value);
    if (!connected) return;

    socketRef.current.emit('chat:typing',  { isTyping: true });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(stopTyping, 2000);
  };

  const stopTyping = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    socketRef.current?.emit('chat:typing', { isTyping: false });
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    setImageError('');
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setImageError('Only image files areallowed');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setImageError('Image is too large (max 500KB)');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const formatTime = (iso) =>
    new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const isOwnMessage = (msg) =>
    msg.sender === currentUser?.name;

  return (
    <div className="chat-page">

      {/* user sidebar */}
      <aside className="chat-sidebar">
        <div className="sidebar-header">
          <h3>Online</h3>
          <span className="online-count">{users.length}</span>
        </div>
        <ul className="users-list">
          {users.map((u, i) => (
            <li key={i} className="user-item">
              <div className="user-avatar-sm">
                {u.name?.charAt(0).toUpperCase()}
              </div>
              <span className="user-name-sm">{u.name}</span>
              <span className="online-dot" />
            </li>
          ))}
        </ul>
      </aside>

      {/* main */}
      <div className="chat-main">

        {/* header */}
        <div className="chat-header">
          <div className="chat-header-info">
            <Link to="/dashboard" className="back-button">↩ Dashboard</Link>
            <h2>Team Chat</h2>
            <span className={`connection-status ${connected ? 'online' : 'offline'}`}>
              {connected ? 'Connected' : 'Connecting...'}
            </span>
          </div>
        </div>

        {/* msg */}
        <div className="chat-messages">
          {messages.length === 0 && (
            <div className="chat-empty">
              <p>No messages yet. Say hello! (˶ᵔᗜᵔ˶)ﾉﾞ</p>
            </div>
          )}

          {messages.map((msg, i) => {
            if (msg.isSystem) {
              return (
                <div key={i} className="system-message">
                  <span>{msg.text}</span>
                  <span className="msg-time">{formatTime(msg.timestamp)}</span>
                </div>
              );
            }

            const own = isOwnMessage(msg);
            return (
              <div key={msg.id || i} className={`message-wrapper ${own ? 'own' : 'other'}`}>
                {!own && (
                  <div className="msg-avatar">
                    {msg.sender?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="message-bubble-group">
                  {!own && (
                    <span className="msg-sender">{msg.sender}</span>
                  )}
                  <div className={`message-bubble ${own ? 'bubble-own' : 'bubble-other'}`}>
                    {msg.image && (
                      <img src={msg.image} alt="shared" className="chat-image" />
                    )}
                    {msg.text && <p>{msg.text}</p>}
                  </div>
                  <span className="msg-time">{formatTime(msg.timestamp)}</span>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* "typing" indicator */}
        {typingUsers.length > 0 && (
          <div className="typing-indicator">
            {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing ...
          </div>
        )}

        {/* input */}
        {imageError && <div className="chat-image-error">{imageError}</div>}
        {imagePreview && (
          <div className="chat-image-preview">
            <img src={imagePreview} alt="preview" />
            <button
              className="remove-image-btn"
              onClick={() => { setImagePreview(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
              title="Remove Image"
            >
              ✕
            </button>
          </div>
        )}
        <div className="chat-input-area">
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleImageSelect}
            className="chat-image-input"
            disabled={!connected}
          />
          <button
            type="button"
            className="btn btn-outline chat-attach-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={!connected}
            title="Attach Image"
          >
            <img src={imageImage} alt="Image Icon" />
          </button>
          <textarea
            className="chat-input"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Write a message... (Enter to send)"
            rows={1}
            disabled={!connected}
          />
          <button
            className="btn btn-primary chat-send-btn"
            onClick={sendMessage}
            disabled={(!text.trim() && !imagePreview) || !connected}
          >
            Send
          </button>
        </div>

      </div>
    </div>
  );
};

export default Chat;