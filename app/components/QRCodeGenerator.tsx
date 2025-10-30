"use client";

import { useState, useEffect, useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";

interface QRCodeGeneratorProps {
  address: string;
  amount?: string;
}

export default function QRCodeGenerator({ address, amount }: QRCodeGeneratorProps) {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  // Generate payment URL (EIP-681 format)
  const paymentUrl = amount 
    ? `ethereum:${address}?value=${parseFloat(amount) * 1e18}` 
    : `ethereum:${address}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleDownload = () => {
    const canvas = qrRef.current?.querySelector('canvas');
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `split-${address.slice(0, 10)}-qr.png`;
      link.href = url;
      link.click();
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">📱 Quick Deposit</h3>
        <button
          onClick={() => setShowQR(!showQR)}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          {showQR ? 'Hide QR' : 'Show QR'}
        </button>
      </div>

      {showQR && (
        <div className="space-y-4">
          <div ref={qrRef} className="flex justify-center p-6 bg-gray-50 rounded-lg">
            <QRCodeCanvas
              value={paymentUrl}
              size={200}
              level="H"
              includeMargin={true}
            />
          </div>

          <div className="space-y-2">
            <div className="text-sm text-gray-600 text-center">
              Scan to deposit {amount ? `${amount} ETH` : 'funds'}
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className="flex-1 py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg text-sm font-medium transition-colors"
              >
                {copied ? '✓ Copied!' : 'Copy Address'}
              </button>
              <button
                onClick={handleDownload}
                className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Download QR
              </button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
              <div className="font-medium mb-1">💡 Pro Tip</div>
              <div>Share this QR code to let anyone send ETH directly to this split contract. Funds are automatically distributed!</div>
            </div>
          </div>
        </div>
      )}

      {!showQR && (
        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
          <div className="flex-shrink-0 text-2xl">💳</div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-900">Deposit Address</div>
            <div className="text-xs font-mono text-gray-600 truncate">{address}</div>
          </div>
          <button
            onClick={handleCopy}
            className="flex-shrink-0 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors"
          >
            {copied ? '✓' : 'Copy'}
          </button>
        </div>
      )}
    </div>
  );
}

