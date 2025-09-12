import { useState, useEffect } from 'react';
import { formatRemainingTime, getRemainingTime } from '../lib/timeUtils';

interface TimeDisplayProps {
  deadlineUnix: number;
  className?: string;
}

export default function TimeDisplay({ deadlineUnix, className = '' }: TimeDisplayProps) {
  const [timeLeft, setTimeLeft] = useState(getRemainingTime(deadlineUnix));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getRemainingTime(deadlineUnix));
    }, 1000);

    return () => clearInterval(interval);
  }, [deadlineUnix]);

  const getStatusColor = () => {
    if (timeLeft.isExpired) return 'text-red-400';
    if (timeLeft.total < 3600) return 'text-yellow-400'; // Less than 1 hour
    return 'text-green-400';
  };

  const getStatusText = () => {
    if (timeLeft.isExpired) return 'EXPIRED';
    if (timeLeft.total < 3600) return 'ENDING SOON';
    return 'ACTIVE';
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-400">Time Remaining</span>
        <span className={`text-sm font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </span>
      </div>
      
      <div className={`text-lg font-mono ${getStatusColor()}`}>
        {timeLeft.isExpired ? (
          '00:00:00'
        ) : (
          `${timeLeft.days.toString().padStart(2, '0')}:${timeLeft.hours.toString().padStart(2, '0')}:${timeLeft.minutes.toString().padStart(2, '0')}:${timeLeft.seconds.toString().padStart(2, '0')}`
        )}
      </div>
      
      <div className="text-xs text-gray-500">
        Deadline: {new Date(deadlineUnix * 1000).toLocaleString()}
      </div>
      
      <div className="text-xs text-gray-500 font-mono">
        Unix: {deadlineUnix}
      </div>
    </div>
  );
}
