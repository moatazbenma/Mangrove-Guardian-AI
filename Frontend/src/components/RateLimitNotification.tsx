import { useState, useEffect } from 'react';

interface Notification {
  id: string;
  message: string;
  type: 'error' | 'warning' | 'success' | 'rateLimited';
  duration: number;
  retryAfter?: number;
  timeLeft?: number;
}

export function RateLimitNotification() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const handleErrorNotification = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { message, type = 'error', retryAfter = 5 } = customEvent.detail;
      
      const id = `notification-${Date.now()}`;
      // Errors stay for 15 seconds, rate limits stay for retry duration
      const duration = type === 'rateLimited' ? (retryAfter * 1000 || 60000) : 15000;
      
      const newNotification: Notification = {
        id,
        message,
        type,
        duration,
        retryAfter,
        timeLeft: Math.ceil(duration / 1000),
      };

      setNotifications((prev) => [...prev, newNotification]);

      // Auto-remove notification after duration
      const timeout = setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }, duration);

      // Return cleanup function
      return () => clearTimeout(timeout);
    };

    window.addEventListener('errorNotification', handleErrorNotification as EventListener);
    return () => window.removeEventListener('errorNotification', handleErrorNotification as EventListener);
  }, []);

  // Update time left for each notification
  useEffect(() => {
    if (notifications.length === 0) return;

    const interval = setInterval(() => {
      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          timeLeft: Math.max(0, (n.timeLeft || 0) - 1),
        }))
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [notifications.length]);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-3 max-w-sm">
      {notifications.map((notification) => {
        const isRateLimit = notification.type === 'rateLimited';
        const bgColor = isRateLimit ? 'from-rose-50 to-rose-100' : 'from-red-50 to-red-100';
        const borderColor = isRateLimit ? 'border-rose-300' : 'border-red-300';
        const textColor = isRateLimit ? 'text-rose-600' : 'text-red-600';
        const textDarkColor = isRateLimit ? 'text-rose-900' : 'text-red-900';
        const iconColor = isRateLimit ? 'text-rose-600' : 'text-red-600';
        const progressBgColor = isRateLimit ? 'bg-rose-200' : 'bg-red-200';
        const progressColor = isRateLimit ? 'bg-rose-500' : 'bg-red-500';

        return (
          <div
            key={notification.id}
            className={`rounded-lg border-2 ${borderColor} bg-linear-to-br ${bgColor} p-4 shadow-lg overflow-hidden`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                {isRateLimit ? (
                  <svg className={`h-5 w-5 ${iconColor}`} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" />
                  </svg>
                ) : (
                  <svg className={`h-5 w-5 ${iconColor}`} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold ${textDarkColor}`}>
                  {isRateLimit ? 'Rate Limit Exceeded' : 'Error'}
                </p>
                <p className={`mt-1 text-sm ${textColor} overflow-anywhere`}>{notification.message}</p>
                <p className={`mt-2 text-xs ${textColor} opacity-75`}>
                  Closes in {notification.timeLeft}s
                </p>
              </div>
              <button
                onClick={() => setNotifications((prev) => prev.filter((n) => n.id !== notification.id))}
                className={`shrink-0 ${textColor} opacity-50 hover:opacity-100 transition`}
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
            {/* Progress bar */}
            <div className={`mt-3 h-1 ${progressBgColor} rounded-full overflow-hidden`}>
              <div
                className={`h-full ${progressColor} transition-all duration-500`}
                style={{
                  width: `${((notification.duration - (notification.timeLeft || 0) * 1000) / notification.duration) * 100}%`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
