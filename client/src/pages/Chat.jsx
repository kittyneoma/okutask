import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import authService from '../services/authService';
import { Link } from 'react-router-dom';
import './Chat.css';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const Chat = () => {
  const [messages, setMessages]     = useState([]);
  const [users, setUsers]           = useState([]);
  const [text, setText]             = useState('');
  const [connected, setConnected]   = useState(false);
  const [socketId, setSocketId]     = useState(null);

  const socketRef  = useRef(null);
  const bottomRef  = useRef(null);
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

    return () => socket.disconnect();
  }, []);

  // scrolls to last msg
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!text.trim() || !connected) return;
    socketRef.current.emit('chat:message', { text });
    setText('');
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
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

        {/* mssg */}
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
                    <p>{msg.text}</p>
                  </div>
                  <span className="msg-time">{formatTime(msg.timestamp)}</span>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* input */}
        <div className="chat-input-area">
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
            disabled={!text.trim() || !connected}
          >
            Send
          </button>
        </div>

      </div>
    </div>
  );
};

export default Chat;