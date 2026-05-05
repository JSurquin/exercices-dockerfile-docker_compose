'use client';

import { useEffect, useState } from 'react';

interface BuildIdDisplayProps {
  devOnly?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

const positionClasses: Record<string, string> = {
  'top-left': 'top-4 left-4',
  'top-right': 'top-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'bottom-right': 'bottom-4 right-4',
};

export default function BuildIdDisplay({
  devOnly = true,
  position = 'bottom-left',
}: BuildIdDisplayProps) {
  const [buildId, setBuildId] = useState('...');
  const [isVisible, setIsVisible] = useState(false);
  const [isProduction, setIsProduction] = useState(false);

  useEffect(() => {
    if (devOnly && process.env.NODE_ENV === 'production') {
      setIsProduction(true);
      return;
    }

    const fetchBuildId = async () => {
      try {
        const response = await fetch('/api/build-id', { cache: 'no-store' });
        const data = await response.json();
        setBuildId(data.buildId);
      } catch {
        setBuildId('error');
      }
    };

    fetchBuildId();
    const interval = setInterval(fetchBuildId, 10000);
    return () => clearInterval(interval);
  }, [devOnly]);

  if (isProduction && devOnly) return null;

  return (
    <div className={`fixed ${positionClasses[position]} z-[9999] transition-all duration-200`}>
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="mb-2 px-2 py-1 text-xs bg-gray-800 text-white rounded hover:bg-gray-700 transition-colors"
      >
        {isVisible ? 'Hide' : 'Build ID'}
      </button>

      {isVisible && (
        <div className="bg-black/90 text-white px-3 py-2 rounded-lg shadow-lg text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-gray-400">Build ID:</span>
            <span className="text-green-400 font-bold">{buildId}</span>
          </div>
          <div className="mt-1 text-gray-500 text-[10px]">
            Updated every 10s
          </div>
        </div>
      )}
    </div>
  );
}
