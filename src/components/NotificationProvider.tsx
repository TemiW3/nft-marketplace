'use client'

import React, { createContext, useCallback, useContext, useState, ReactNode } from 'react'
import NotificationModal from './NotificationModal'

type NotificationType = 'success' | 'error' | 'info'

type ShowArgs = {
  title: string
  message: string
  type?: NotificationType
  onClose?: () => void
}

type NotificationContextValue = {
  showNotification: (args: ShowArgs) => void
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined)

export const useNotification = (): NotificationContextValue => {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotification must be used within NotificationProvider')
  return ctx
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [type, setType] = useState<NotificationType>('info')
  const [onCloseCb, setOnCloseCb] = useState<undefined | (() => void)>()

  const showNotification = useCallback(({ title, message, type = 'info', onClose }: ShowArgs) => {
    setTitle(title)
    setMessage(message)
    setType(type)
    setOnCloseCb(() => onClose)
    setIsOpen(true)
  }, [])

  const handleClose = () => {
    setIsOpen(false)
    if (onCloseCb) onCloseCb()
    setOnCloseCb(undefined)
  }

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      <NotificationModal isOpen={isOpen} onClose={handleClose} title={title} message={message} type={type} />
    </NotificationContext.Provider>
  )
}
