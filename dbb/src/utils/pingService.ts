import { useState, useEffect } from 'react';

const RENDER_URLS = [
  'http://localhost:5000/api/orders',
  'https://bot-ir83.onrender.com/api/settings'
];

const PING_INTERVAL = 1 * 60 * 1000; // 14 minutes in milliseconds

export const usePingService = () => {
  const [lastPing, setLastPing] = useState<Date | null>(null);

  const pingSites = async () => {
    try {
      const results = await Promise.all(
        RENDER_URLS.map(url =>
          fetch(url, { mode: 'no-cors' })
            .then(() => console.log(`Pinged ${url} successfully`))
            .catch(err => console.error(`Failed to ping ${url}:`, err))
        )
      );
      setLastPing(new Date());
      return results;
    } catch (error) {
      console.error('Ping service error:', error);
    }
  };

  useEffect(() => {
    pingSites(); // Initial ping
    const interval = setInterval(pingSites, PING_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  return { lastPing };
};