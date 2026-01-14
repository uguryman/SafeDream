import { createContext, useContext, useState, useCallback } from 'react'

/**
 * Toast Context
 * Global toast bildirimleri için context
 */
const ToastContext = createContext()

/**
 * Toast Hook
 * Toast göstermek için custom hook
 */
export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}

/**
 * Toast Provider
 * Uygulamanın en üstüne sarılmalı
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  // Toast göster
  const showToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = Date.now()
    const newToast = { id, message, type, duration }

    setToasts(prev => [...prev, newToast])

    // Otomatik kaldır
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }

    return id
  }, [])

  // Toast kaldır
  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  // Kısa yollar
  const success = useCallback((message, duration) => showToast(message, 'success', duration), [showToast])
  const error = useCallback((message, duration) => showToast(message, 'error', duration), [showToast])
  const info = useCallback((message, duration) => showToast(message, 'info', duration), [showToast])
  const warning = useCallback((message, duration) => showToast(message, 'warning', duration), [showToast])

  return (
    <ToastContext.Provider value={{ showToast, success, error, info, warning, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  )
}

/**
 * Toast Container
 * Toast'ları ekranda gösteren container
 */
function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-3 max-w-md">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  )
}

/**
 * Toast Item
 * Tek bir toast bildirimi
 */
function ToastItem({ toast, onRemove }) {
  const { id, message, type } = toast

  // Toast tipine göre stil
  const getToastStyle = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-500/90',
          border: 'border-green-400',
          icon: '✅',
        }
      case 'error':
        return {
          bg: 'bg-red-500/90',
          border: 'border-red-400',
          icon: '❌',
        }
      case 'warning':
        return {
          bg: 'bg-yellow-500/90',
          border: 'border-yellow-400',
          icon: '⚠️',
        }
      case 'info':
      default:
        return {
          bg: 'bg-blue-500/90',
          border: 'border-blue-400',
          icon: 'ℹ️',
        }
    }
  }

  const style = getToastStyle()

  return (
    <div
      className={`${style.bg} ${style.border} border backdrop-blur-md rounded-lg p-4 shadow-lg min-w-[300px] animate-slide-in-right flex items-start gap-3`}
    >
      <span className="text-2xl flex-shrink-0">{style.icon}</span>
      <div className="flex-1">
        <p className="text-white text-sm font-medium break-words whitespace-pre-wrap">{message}</p>
      </div>
      <button
        onClick={() => onRemove(id)}
        className="text-white/80 hover:text-white transition-colors flex-shrink-0 text-lg leading-none"
      >
        ×
      </button>
    </div>
  )
}

export default ToastProvider
