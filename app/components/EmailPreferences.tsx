"use client";

import { useState } from "react";
import { isValidEmail } from "@/lib/email";

interface EmailPreferencesProps {
  recipientEmail?: string;
  emailNotifications?: boolean;
  onUpdate: (email: string, notifications: boolean) => void;
  disabled?: boolean;
}

export default function EmailPreferences({
  recipientEmail = "",
  emailNotifications = false,
  onUpdate,
  disabled = false,
}: EmailPreferencesProps) {
  const [email, setEmail] = useState(recipientEmail);
  const [notifications, setNotifications] = useState(emailNotifications);
  const [error, setError] = useState("");

  const handleEmailChange = (value: string) => {
    setEmail(value);
    setError("");
    
    // Validate email if not empty
    if (value && !isValidEmail(value)) {
      setError("Invalid email address");
    }
  };

  const handleNotificationsChange = (checked: boolean) => {
    setNotifications(checked);
    
    // If enabling notifications, validate email
    if (checked && email && !isValidEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }
    
    if (checked && !email) {
      setError("Please enter an email address");
      return;
    }
    
    // Update parent component
    if (checked && email && isValidEmail(email)) {
      onUpdate(email, checked);
    } else if (!checked) {
      onUpdate(email, false);
    }
  };

  const handleSave = () => {
    if (notifications && !email) {
      setError("Please enter an email address");
      return;
    }
    
    if (email && !isValidEmail(email)) {
      setError("Invalid email address");
      return;
    }
    
    onUpdate(email, notifications);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-start gap-3 mb-4">
        <div className="text-2xl">📧</div>
        <div className="flex-1">
          <h3 className="text-base font-semibold text-gray-900 mb-1">
            Email Notifications
          </h3>
          <p className="text-sm text-gray-600">
            Get notified when you receive payments
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Email Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => handleEmailChange(e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              error ? "border-red-300" : "border-gray-300"
            }`}
            disabled={disabled}
          />
          {error && (
            <p className="mt-1 text-xs text-red-600">{error}</p>
          )}
        </div>

        {/* Notification Toggle */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex-1">
            <label htmlFor="email-notifications" className="text-sm font-medium text-gray-900 cursor-pointer">
              Enable email notifications
            </label>
            <p className="text-xs text-gray-500 mt-0.5">
              Receive an email when payments are distributed
            </p>
          </div>
          <div className="relative inline-block w-11 h-6 ml-4">
            <input
              id="email-notifications"
              type="checkbox"
              checked={notifications}
              onChange={(e) => handleNotificationsChange(e.target.checked)}
              disabled={disabled || (!!email && !isValidEmail(email))}
              className="sr-only peer"
            />
            <label
              htmlFor="email-notifications"
              className="absolute cursor-pointer top-0 left-0 right-0 bottom-0 bg-gray-300 rounded-full transition-colors peer-checked:bg-blue-600 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"
            >
              <span className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-5" />
            </label>
          </div>
        </div>

        {/* Info Box */}
        {notifications && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <span className="text-blue-600 text-sm">ℹ️</span>
              <div className="text-xs text-blue-800">
                <p className="font-medium mb-1">What you'll receive:</p>
                <ul className="list-disc list-inside space-y-0.5 text-blue-700">
                  <li>Payment distribution alerts</li>
                  <li>Transaction confirmations</li>
                  <li>Split contract updates</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Save Button (optional - for manual save) */}
        {email !== recipientEmail || notifications !== emailNotifications ? (
          <button
            onClick={handleSave}
            disabled={disabled || (notifications && !email) || (!!email && !isValidEmail(email))}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Save Preferences
          </button>
        ) : null}
      </div>
    </div>
  );
}

