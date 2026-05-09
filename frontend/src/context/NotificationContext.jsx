/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useReducer } from 'react';

const NotificationContext = createContext(null);

const notificationReducer = (state, action) => {
  switch (action.type) {
    case 'ADD':
      return {
        ...state,
        toasts: [action.payload, ...state.toasts],
      };
    case 'REMOVE':
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.payload.id),
      };
    default:
      return state;
  }
};

export const NotificationProvider = ({ children }) => {
  const [state, dispatch] = useReducer(notificationReducer, {
    toasts: [],
  });

  const showNotification = (content, type = 'info', autoClose = true) => {
    const id = Date.now();
    const toast = {
      id,
      content,
      type,
      autoClose,
      createdAt: Date.now(),
    };
    dispatch({ type: 'ADD', payload: toast });
  };

  const removeToast = (id) => {
    dispatch({ type: 'REMOVE', payload: { id } });
  };

  const notifyError = (msg) => showNotification(msg, 'error');
  const notifyInfo = (msg) => showNotification(msg, 'info');
  const notifySuccess = (msg) => showNotification(msg, 'success');

  return (
    <NotificationContext.Provider
      value={{
        toasts: state.toasts,
        removeToast,
        showNotification,
        notifyError,
        notifyInfo,
        notifySuccess,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotification must be used inside NotificationProvider');
  }
  return ctx;
};
