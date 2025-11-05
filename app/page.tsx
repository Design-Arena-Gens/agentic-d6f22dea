'use client'

import { useState, useEffect } from 'react'

interface Target {
  id: string
  text: string
  date: string
  completed: boolean
  locked: boolean
  createdAt: number
}

interface Notification {
  id: string
  title: string
  message: string
  type: 'success' | 'info'
}

export default function Home() {
  const [targets, setTargets] = useState<Target[]>([])
  const [inputValue, setInputValue] = useState('')
  const [notification, setNotification] = useState<Notification | null>(null)
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default')

  useEffect(() => {
    const stored = localStorage.getItem('targets')
    if (stored) {
      setTargets(JSON.parse(stored))
    }

    if ('Notification' in window) {
      setNotificationPermission(Notification.permission)
    }

    const checkInterval = setInterval(checkTargets, 60000)
    checkTargets()

    return () => clearInterval(checkInterval)
  }, [])

  useEffect(() => {
    localStorage.setItem('targets', JSON.stringify(targets))
  }, [targets])

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission()
      setNotificationPermission(permission)

      if (permission === 'granted') {
        showNotification('Notifications Enabled', 'You will receive reminders about your targets!', 'success')
      }
    }
  }

  const showNotification = (title: string, message: string, type: 'success' | 'info') => {
    const id = Date.now().toString()
    setNotification({ id, title, message, type })

    setTimeout(() => {
      setNotification(null)
    }, 5000)
  }

  const sendBrowserNotification = (title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '🎯',
        badge: '🎯'
      })
    }
  }

  const checkTargets = () => {
    const stored = localStorage.getItem('targets')
    if (!stored) return

    const currentTargets: Target[] = JSON.parse(stored)
    const today = new Date().toDateString()

    currentTargets.forEach(target => {
      if (!target.completed && target.date === today) {
        const timeSinceCreated = Date.now() - target.createdAt
        const hoursSinceCreated = timeSinceCreated / (1000 * 60 * 60)

        if (hoursSinceCreated > 0.1) {
          sendBrowserNotification(
            '🎯 Target Reminder',
            `Don't forget: ${target.text}`
          )
        }
      }
    })
  }

  const addTarget = () => {
    if (!inputValue.trim()) return

    if (notificationPermission !== 'granted') {
      requestNotificationPermission()
    }

    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)

    const newTarget: Target = {
      id: Date.now().toString(),
      text: inputValue.trim(),
      date: tomorrow.toDateString(),
      completed: false,
      locked: true,
      createdAt: Date.now()
    }

    setTargets([...targets, newTarget])
    setInputValue('')
    showNotification('Target Locked! 🔒', `"${newTarget.text}" is set for tomorrow`, 'success')
  }

  const toggleComplete = (id: string) => {
    const updatedTargets = targets.map(target => {
      if (target.id === id) {
        const newCompleted = !target.completed
        if (newCompleted) {
          showNotification('Target Completed! 🎉', `Great job completing: ${target.text}`, 'success')
          sendBrowserNotification('🎉 Target Completed!', target.text)
        }
        return { ...target, completed: newCompleted }
      }
      return target
    })
    setTargets(updatedTargets)
  }

  const deleteTarget = (id: string) => {
    setTargets(targets.filter(target => target.id !== id))
    showNotification('Target Removed', 'Target has been deleted', 'info')
  }

  const stats = {
    total: targets.length,
    completed: targets.filter(t => t.completed).length,
    pending: targets.filter(t => !t.completed).length
  }

  const isToday = (dateString: string) => {
    return dateString === new Date().toDateString()
  }

  const isTomorrow = (dateString: string) => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return dateString === tomorrow.toDateString()
  }

  const formatDate = (dateString: string) => {
    if (isToday(dateString)) return 'Today'
    if (isTomorrow(dateString)) return 'Tomorrow'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="container">
      <div className="header">
        <h1>🎯 Target Locker</h1>
        <p>Lock your targets for tomorrow and achieve your goals</p>
      </div>

      <div className="card">
        <div className="stats">
          <div className="stat-card">
            <div className="stat-number">{stats.total}</div>
            <div className="stat-label">Total Targets</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.completed}</div>
            <div className="stat-label">Completed</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.pending}</div>
            <div className="stat-label">Pending</div>
          </div>
        </div>

        <div className="input-section">
          <input
            type="text"
            className="input-field"
            placeholder="What's your target for tomorrow?"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addTarget()}
          />
          <button
            className="btn btn-primary"
            onClick={addTarget}
            disabled={!inputValue.trim()}
          >
            Lock Target 🔒
          </button>
        </div>

        {notificationPermission !== 'granted' && (
          <div style={{
            padding: '15px',
            background: '#fef3c7',
            borderRadius: '10px',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            <p style={{ marginBottom: '10px', color: '#92400e' }}>
              Enable notifications to receive reminders!
            </p>
            <button
              className="btn btn-primary btn-small"
              onClick={requestNotificationPermission}
            >
              Enable Notifications 🔔
            </button>
          </div>
        )}

        {targets.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🎯</div>
            <div className="empty-state-text">No targets yet. Lock your first target for tomorrow!</div>
          </div>
        ) : (
          <ul className="targets-list">
            {targets.map(target => (
              <li key={target.id} className={`target-item ${target.completed ? 'completed' : ''}`}>
                <div className="target-content">
                  <div>
                    <div className={`target-text ${target.completed ? 'completed' : ''}`}>
                      {target.text}
                    </div>
                    <div className="target-date">
                      <span className="date-display">📅 {formatDate(target.date)}</span>
                      {target.locked && !target.completed && (
                        <span className="locked-badge">🔒 Locked</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="target-actions">
                  <button
                    className={`btn btn-small ${target.completed ? 'btn-primary' : 'btn-success'}`}
                    onClick={() => toggleComplete(target.id)}
                  >
                    {target.completed ? '↩️ Undo' : '✓ Complete'}
                  </button>
                  <button
                    className="btn btn-small btn-danger"
                    onClick={() => deleteTarget(target.id)}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {notification && (
        <div className={`notification ${notification.type}`}>
          <div className="notification-icon">
            {notification.type === 'success' ? '✅' : 'ℹ️'}
          </div>
          <div className="notification-content">
            <div className="notification-title">{notification.title}</div>
            <div className="notification-message">{notification.message}</div>
          </div>
        </div>
      )}
    </div>
  )
}
