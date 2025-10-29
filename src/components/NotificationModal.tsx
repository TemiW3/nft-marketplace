'use client'
import React from 'react'
import './NotificationModal.css'

interface NotificationModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  message: string
  type?: 'success' | 'error' | 'info'
}

export default function NotificationModal({ isOpen, onClose, title, message, type = 'info' }: NotificationModalProps) {
  if (!isOpen) return null

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅'
      case 'error':
        return '⚠️'
      case 'info':
      default:
        return 'ℹ️'
    }
  }

  const getColorClass = () => {
    switch (type) {
      case 'success':
        return 'notification-success'
      case 'error':
        return 'notification-error'
      case 'info':
      default:
        return 'notification-info'
    }
  }

  return (
    <div className="notification-overlay" onClick={onClose}>
      <div className={`notification-modal ${getColorClass()}`} onClick={(e) => e.stopPropagation()}>
        <div className="notification-icon">{getIcon()}</div>
        <div className="notification-content">
          <h3 className="notification-title">{title}</h3>
          <p className="notification-message">{message}</p>
        </div>
        <button className="notification-close" onClick={onClose}>
          ✕
        </button>
        <button className="notification-button" onClick={onClose}>
          OK
        </button>
      </div>
    </div>
  )
}
