import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, Check, CheckCheck, X, AlertTriangle, Scissors, Zap,
  Clock, CalendarCheck, UserCheck, CalendarClock, ArrowRight,
  Sparkles, ExternalLink
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import {
  getNotificationsForSession,
  markNotificationAsRead,
  markAllNotificationsAsRead
} from '../../services/notificationService';

export function NotificationBell({ session, role }) {
  const { demo } = useStore();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'
  const [notifications, setNotifications] = useState([]);
  const dropdownRef = useRef(null);

  const refreshNotifications = () => {
    if (!session) {
      setNotifications([]);
      return;
    }
    const list = getNotificationsForSession(session, demo);
    setNotifications(list);
  };

  useEffect(() => {
    refreshNotifications();
  }, [session, demo]);

  // Listen for storage or custom events
  useEffect(() => {
    const handleUpdate = () => refreshNotifications();
    window.addEventListener('biglanggwapo-notifications-updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('biglanggwapo-notifications-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [session, demo]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const filteredList = filter === 'unread' ? notifications.filter((n) => !n.read) : notifications;

  const handleItemClick = (notif) => {
    markNotificationAsRead(notif.id);
    refreshNotifications();
    if (notif.actionUrl) {
      setIsOpen(false);
      navigate(notif.actionUrl);
    }
  };

  const handleMarkAllRead = (e) => {
    e.stopPropagation();
    const ids = notifications.map((n) => n.id);
    markAllNotificationsAsRead(ids);
    refreshNotifications();
  };

  const getIconForType = (type) => {
    switch (type) {
      case 'queue-next':
      case 'chair-call':
        return <Zap size={15} style={{ color: '#d97706' }} />;
      case 'in-service':
        return <Scissors size={15} style={{ color: 'var(--gold)' }} />;
      case 'cancelled':
        return <AlertTriangle size={15} style={{ color: '#dc2626' }} />;
      case 'confirmed':
        return <CalendarCheck size={15} style={{ color: 'var(--green)' }} />;
      case 'customer-arrived':
        return <UserCheck size={15} style={{ color: 'var(--blue)' }} />;
      case 'pending-confirm':
        return <CalendarClock size={15} style={{ color: '#d97706' }} />;
      default:
        return <Bell size={15} style={{ color: 'var(--gold)' }} />;
    }
  };

  return (
    <div className="notification-bell-wrapper" ref={dropdownRef} style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <button
        type="button"
        className={`notification-bell-btn ${unreadCount > 0 ? 'has-unread' : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="View notifications"
        title={unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'Notifications'}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown-menu">
          <div className="notification-dropdown-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="notif-header-icon">
                <Bell size={15} />
              </div>
              <div>
                <strong style={{ fontSize: '13px', color: 'var(--ink)' }}>Notifications</strong>
                {unreadCount > 0 ? (
                  <span className="notif-count-pill">{unreadCount} new</span>
                ) : (
                  <span style={{ fontSize: '11px', color: 'var(--muted)', display: 'block' }}>All caught up</span>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {unreadCount > 0 && (
                <button
                  type="button"
                  className="notif-text-btn"
                  onClick={handleMarkAllRead}
                  title="Mark all as read"
                >
                  <CheckCheck size={13} />
                  <span>Mark read</span>
                </button>
              )}
              <button
                type="button"
                className="notif-close-btn"
                onClick={() => setIsOpen(false)}
                aria-label="Close notifications"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          <div className="notification-filter-tabs">
            <button
              type="button"
              className={filter === 'all' ? 'active' : ''}
              onClick={() => setFilter('all')}
            >
              All <span>{notifications.length}</span>
            </button>
            <button
              type="button"
              className={filter === 'unread' ? 'active' : ''}
              onClick={() => setFilter('unread')}
            >
              Unread <span>{unreadCount}</span>
            </button>
          </div>

          <div className="notification-list-scroll">
            {filteredList.length > 0 ? (
              filteredList.map((notif) => (
                <div
                  key={notif.id}
                  className={`notification-item ${!notif.read ? 'unread' : ''} ${notif.urgent ? 'urgent' : ''}`}
                  onClick={() => handleItemClick(notif)}
                >
                  <div className={`notification-item-icon ${notif.type || 'info'}`}>
                    {getIconForType(notif.type)}
                  </div>

                  <div className="notification-item-content">
                    <div className="notification-item-header">
                      <strong>{notif.title}</strong>
                      <span className="notification-item-time">{notif.time || 'Today'}</span>
                    </div>

                    <p className="notification-item-text">{notif.message}</p>

                    <div className="notification-item-actions">
                      {notif.actionLabel && (
                        <span className="notif-action-tag">
                          {notif.actionLabel} <ArrowRight size={11} />
                        </span>
                      )}
                      {notif.rebookUrl && (
                        <button
                          type="button"
                          className="notif-action-btn rebook"
                          onClick={(e) => {
                            e.stopPropagation();
                            markNotificationAsRead(notif.id);
                            refreshNotifications();
                            setIsOpen(false);
                            navigate(notif.rebookUrl);
                          }}
                        >
                          <Scissors size={11} /> {notif.rebookLabel || 'Rebook'}
                        </button>
                      )}
                    </div>
                  </div>

                  {!notif.read && <span className="notification-dot" title="Unread" />}
                </div>
              ))
            ) : (
              <div className="notification-empty-state">
                <div className="notif-empty-icon">
                  <Check size={22} />
                </div>
                <strong>No {filter === 'unread' ? 'unread ' : ''}notifications</strong>
                <p>When you have live queue updates or booking changes, they'll appear right here.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
