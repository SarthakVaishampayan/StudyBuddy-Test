import { useEffect, useState } from 'react';

export const yyyyMmDdLocal = (d = new Date()) => {
  const x = new Date(d);
  x.setMinutes(x.getMinutes() - x.getTimezoneOffset());
  return x.toISOString().slice(0, 10);
};

export const useLiveLocalDay = () => {
  const [day, setDay] = useState(() => yyyyMmDdLocal());

  useEffect(() => {
    const id = setInterval(() => {
      const next = yyyyMmDdLocal();
      setDay((prev) => (prev === next ? prev : next));
    }, 30 * 1000);

    return () => clearInterval(id);
  }, []);

  return day; // "YYYY-MM-DD"
};
