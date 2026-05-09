import { createContext, useContext, useEffect, useRef, useState } from 'react';

const TimerContext = createContext(null);

export const TimerProvider = ({ children }) => {
  const [mode, setMode] = useState('stopwatch');

  const [elapsedTime, setElapsedTime] = useState(0);

  const [initialTime, setInitialTime] = useState(0);

  const [timerRunning, setTimerRunning] = useState(false);

  const [sessionEnded, setSessionEnded] = useState(false);

  const intervalRef = useRef(null);

  const clearTick = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
  };

  const getTimeStudied = () => {
    if (mode === 'stopwatch') return elapsedTime;
    return Math.max(0, (initialTime || 0) - (elapsedTime || 0));
  };

  const stopAndAskToLog = () => {
    setTimerRunning(false);
    clearTick();
    setSessionEnded(true);
  };

  const discardSession = () => {
    setSessionEnded(false);
    setTimerRunning(false);
    clearTick();

    if (mode === 'stopwatch') {
      setElapsedTime(0);
    } else {
      setElapsedTime(initialTime || 0);
    }
  };

  const restartSession = () => {
    setSessionEnded(false);
    clearTick();

    if (mode === 'stopwatch') {
      setElapsedTime(0);
      setTimerRunning(true);
      return;
    }

    setElapsedTime(initialTime || 0);
    setTimerRunning(true);
  };

  const fireBrowserNotification = async (title, body) => {
    try {
      if (!('Notification' in window)) return;
      if (Notification.permission === 'granted') {
        new Notification(title, { body });
        return;
      }
      if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          new Notification(title, { body });
        }
      }
    } catch (e) {
    }
  };

  useEffect(() => {
    if (!timerRunning) {
      clearTick();
      return;
    }

    intervalRef.current = setInterval(() => {
      setElapsedTime(prev => {
        if (mode === 'stopwatch') return prev + 1;

        if (prev <= 1) {
          setTimerRunning(false);
          setSessionEnded(true);

          fireBrowserNotification(
            'Countdown finished',
            'Log your study time, restart, or discard this session.'
          );

          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearTick();
  }, [timerRunning, mode]);

  return (
    <TimerContext.Provider
      value={{
        mode,
        setMode,
        elapsedTime,
        setElapsedTime,
        initialTime,
        setInitialTime,
        timerRunning,
        setTimerRunning,
        getTimeStudied,

        sessionEnded,
        setSessionEnded,
        stopAndAskToLog,
        restartSession,
        discardSession,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
};

export const useTimer = () => useContext(TimerContext);
