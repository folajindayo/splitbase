"use client";

import { useState, useRef } from "react";
import QRCode from "qrcode";

interface ShareEscrowModalProps {
  escrowId: string;
  escrowTitle: string;
  onClose: () => void;
}

export default function ShareEscrowModal({ escrowId, escrowTitle, onClose }: ShareEscrowModalProps) {
  const [qrCode, setQrCode] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const escrowUrl = `${window.location.origin}/escrow/${escrowId}`;

  const generateQRCode = async () => {
    try {
      const canvas = canvasRef.current;
      if (canvas) {
        await QRCode.toCanvas(canvas, escrowUrl, {
          width: 256,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
        });
        const dataUrl = canvas.toDataURL("image/png");
        setQrCode(dataUrl);
      }
    } catch (err) {
      console.error("Error generating QR code:", err);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(escrowUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const downloadQRCode = () => {
    if (qrCode) {
      const link = document.createElement("a");
      link.download = `escrow-${escrowTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-qr.png`;
      link.href = qrCode;
      link.click();
    }
  };

  // Generate QR code on mount
  useState(() => {
    generateQRCode();
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Share Escrow</h2>
            <p className="text-sm text-gray-500 mt-1">{escrowTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {/* QR Code */}
          <div className="flex justify-center mb-6">
            <div className="bg-white p-4 rounded-xl border-2 border-gray-200">
              <canvas ref={canvasRef} className="block" />
            </div>
          </div>

          {/* Share URL */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Escrow Link
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={escrowUrl}
                readOnly
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm font-mono"
              />
              <button
                onClick={copyToClipboard}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-all"
              >
                {copied ? "✓ Copied" : "Copy"}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={downloadQRCode}
              disabled={!qrCode}
              className="w-full px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              📥 Download QR Code
            </button>

            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: escrowTitle,
                    text: `View escrow: ${escrowTitle}`,
                    url: escrowUrl,
                  }).catch(err => console.error("Error sharing:", err));
                }
              }}
              className="w-full px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              🔗 Share Link
            </button>
          </div>

          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-700">
              💡 Anyone with this link can view the escrow details. Only authorized parties (buyer/seller) can take actions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

