"use client";

import { useState } from "react";
import { truncateAddress, getBaseScanUrl } from "@/lib/utils";
import { DEFAULT_CHAIN_ID } from "@/lib/constants";

interface ShareableSplitProps {
  splitAddress: string;
  recipients: Array<{ wallet_address: string; percentage: number }>;
  totalDistributed?: string;
}

export default function ShareableSplit({ splitAddress, recipients, totalDistributed }: ShareableSplitProps) {
  const [copied, setCopied] = useState(false);
  const [showEmbed, setShowEmbed] = useState(false);

  const shareUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/splits/${splitAddress}`
    : '';

  const embedCode = `<iframe src="${shareUrl}?embed=true" width="100%" height="600" frameborder="0"></iframe>`;

  const shareText = `Check out this payment split on SplitBase! ${recipients.length} recipients sharing funds automatically. ${shareUrl}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleCopyEmbed = async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      alert('Embed code copied! Paste it in your website HTML.');
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleShareTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
    window.open(twitterUrl, '_blank', 'noopener,noreferrer');
  };

  const handleShareTelegram = () => {
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent('Check out this payment split on SplitBase!')}`;
    window.open(telegramUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold mb-4">🔗 Share Split</h3>

      {/* Quick Share Links */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={shareUrl}
            readOnly
            className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono text-gray-700"
          />
          <button
            onClick={handleCopyLink}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleShareTwitter}
            className="flex-1 py-2 px-4 bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
            </svg>
            Twitter
          </button>
          <button
            onClick={handleShareTelegram}
            className="flex-1 py-2 px-4 bg-[#0088cc] hover:bg-[#0077b5] text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.901-.903-1.056-.692-1.653-1.123-2.678-1.799-1.185-.781-.417-1.21.258-1.911.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.008-1.252-.241-1.865-.44-.752-.244-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635.099-.002.321.023.465.141.122.099.155.232.171.326.016.094.036.307.02.474z"/>
            </svg>
            Telegram
          </button>
        </div>
      </div>

      {/* Split Preview Card */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200 mb-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="text-sm font-medium text-gray-900">Split Contract</div>
            <div className="text-xs font-mono text-gray-600 mt-1">{truncateAddress(splitAddress)}</div>
          </div>
          <a
            href={getBaseScanUrl(splitAddress, DEFAULT_CHAIN_ID, 'address')}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:text-blue-700"
          >
            BaseScan ↗
          </a>
        </div>
        
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-gray-600 text-xs">Recipients</div>
            <div className="font-semibold text-gray-900">{recipients.length}</div>
          </div>
          <div>
            <div className="text-gray-600 text-xs">Total Distributed</div>
            <div className="font-semibold text-gray-900">{totalDistributed || '0.0'} ETH</div>
          </div>
        </div>
      </div>

      {/* Embed Code */}
      <button
        onClick={() => setShowEmbed(!showEmbed)}
        className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg text-sm font-medium transition-colors"
      >
        {showEmbed ? 'Hide' : 'Show'} Embed Code
      </button>

      {showEmbed && (
        <div className="mt-3 space-y-2">
          <textarea
            value={embedCode}
            readOnly
            rows={3}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono text-gray-700 resize-none"
          />
          <button
            onClick={handleCopyEmbed}
            className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Copy Embed Code
          </button>
          <p className="text-xs text-gray-600 text-center">
            Paste this code in your website to embed this split
          </p>
        </div>
      )}
    </div>
  );
}

