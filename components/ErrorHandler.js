'use client';

import { useEffect } from 'react';

/**
 * Global error handler for uncaught promise rejections.
 * Suppresses unhandled rejections whose reason.message includes "Connection closed"
 * (e.g. certain Next.js chunk loading errors) from being logged in the console.
 */
export default function ErrorHandler() {
  useEffect(() => {
    const handleUnhandledRejection = (event) => {
      // Check if this is a "Connection closed" error from Next.js chunks
      if (event.reason?.message?.includes('Connection closed')) {
        // Prevent the error from being logged to console
        event.preventDefault();
        return;
      }

      // For other errors, you can log them or handle them differently
      // Uncomment below to see what other errors might be occurring:
      // console.warn('Unhandled promise rejection:', event.reason);
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return null;
}
