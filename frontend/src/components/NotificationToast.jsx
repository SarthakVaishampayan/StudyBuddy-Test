import { useNotification } from '../context/NotificationContext';
import { Bell, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { useCallback, useEffect, useRef } from 'react';

const NotificationToast = () => {
  const { toasts, removeToast } = useNotification();
  const timersRef = useRef({});

  const startAutoClose = useCallback(
    (id) => {
      if (timersRef.current[id]) {
        clearTimeout(timersRef.current[id]);
      }
      timersRef.current[id] = setTimeout(() => {
        removeToast(id);
        delete timersRef.current[id];
      }, 3000);
    },
    [removeToast]
  );

  const pauseAutoClose = useCallback((id) => {
    if (timersRef.current[id]) {
      clearTimeout(timersRef.current[id]);
      delete timersRef.current[id];
    }
  }, []);

  useEffect(() => {
    toasts.forEach((toast) => {
      if (toast.autoClose !== false && !timersRef.current[toast.id]) {
        startAutoClose(toast.id);
      }
    });
  }, [toasts, startAutoClose]);

  useEffect(() => {
    return () => {
      Object.values(timersRef.current).forEach((t) => clearTimeout(t));
    };
  }, []);

  const getIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle size={16} className="me-2" />;
      case 'error':   return <AlertCircle size={16} className="me-2" />;
      default:        return <Bell size={16} className="me-2" />;
    }
  };

  const getBg = (type) => {
    switch (type) {
      case 'success': return 'bg-success';
      case 'error':   return 'bg-danger';
      default:        return 'bg-primary';
    }
  };

  return (
    <div
      className="toast-container position-fixed top-0 end-0 p-3"
      style={{ zIndex: 9999, marginTop: '70px' }}
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="toast show mb-2 border-0 shadow-lg"
          role="alert"
          style={{ minWidth: '280px', cursor: 'default' }}
          onMouseEnter={() => pauseAutoClose(toast.id)}
          onMouseLeave={() => startAutoClose(toast.id)}
        >
          <div className={`toast-header text-white ${getBg(toast.type)}`}>
            {getIcon(toast.type)}
            <strong className="me-auto text-capitalize">{toast.type}</strong>
            <button
              type="button"
              className="btn-close btn-close-white ms-2"
              onClick={() => {
                pauseAutoClose(toast.id);
                removeToast(toast.id);
              }}
              aria-label="Close"
            />
          </div>
          <div className="toast-body bg-white text-dark rounded-bottom">
            {toast.content}
          </div>
        </div>
      ))}
    </div>
  );
};

export default NotificationToast;
