'use client';

import { useLinkStatus } from 'next/link';
import { useEffect, useState } from 'react';

export default function LoadingIndicator() {
  const { pending } = useLinkStatus();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (pending) {
      setProgress(0);
      // Simulate progress
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return 90;
          return prev + Math.random() * 15;
        });
      }, 100);

      return () => clearInterval(interval);
    } else {
      // Complete the progress when done
      setProgress(100);
      setTimeout(() => setProgress(0), 200);
    }
  }, [pending]);

  if (!pending && progress === 0) return null;

  return (
    <div
      role="status"
      aria-label="Loading"
      className="fixed left-0 top-0 z-[9999] h-1 w-full bg-transparent"
    >
      <div
        className="h-full bg-blue-500 transition-all duration-300 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
