"use client";

import { useState, useEffect } from "react";
import { getRemainingTimeBreakdown, formatReleaseDate } from "@/lib/escrowTimeLock";

interface TimeLockCountdownProps {
  releaseDate: string;
  autoRelease: boolean;
}

export default function TimeLockCountdown({ releaseDate, autoRelease }: TimeLockCountdownProps) {
  const [timeRemaining, setTimeRemaining] = useState(getRemainingTimeBreakdown(releaseDate));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(getRemainingTimeBreakdown(releaseDate));
    }, 1000);

    return () => clearInterval(interval);
  }, [releaseDate]);

  if (timeRemaining.expired) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white text-xl">
            ✓
          </div>
          <div>
            <h3 className="font-semibold text-green-900">Time Lock Expired</h3>
            <p className="text-sm text-green-700">
              Release date: {formatReleaseDate(releaseDate)}
            </p>
          </div>
        </div>
        {autoRelease && (
          <div className="mt-3 text-sm text-green-700">
            Auto-release is enabled. Funds can be released automatically.
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white text-xl">
          ⏱
        </div>
        <div>
          <h3 className="font-semibold text-blue-900">Time Lock Active</h3>
          <p className="text-sm text-blue-700">
            Release date: {formatReleaseDate(releaseDate)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-3">
        <div className="bg-white rounded-lg p-3 text-center">
          <div className="text-3xl font-bold text-blue-900">
            {timeRemaining.days}
          </div>
          <div className="text-xs text-blue-600 font-medium">Days</div>
        </div>
        <div className="bg-white rounded-lg p-3 text-center">
          <div className="text-3xl font-bold text-blue-900">
            {timeRemaining.hours}
          </div>
          <div className="text-xs text-blue-600 font-medium">Hours</div>
        </div>
        <div className="bg-white rounded-lg p-3 text-center">
          <div className="text-3xl font-bold text-blue-900">
            {timeRemaining.minutes}
          </div>
          <div className="text-xs text-blue-600 font-medium">Minutes</div>
        </div>
        <div className="bg-white rounded-lg p-3 text-center">
          <div className="text-3xl font-bold text-blue-900">
            {timeRemaining.seconds}
          </div>
          <div className="text-xs text-blue-600 font-medium">Seconds</div>
        </div>
      </div>

      {autoRelease && (
        <div className="bg-blue-100 rounded-lg p-3 text-sm text-blue-800">
          ⚡ Auto-release enabled - funds will be released automatically after the time lock expires
        </div>
      )}
    </div>
  );
}

