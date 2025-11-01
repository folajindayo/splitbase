"use client";

import { useState, useEffect } from "react";
import { useAppKitProvider } from "@reown/appkit/react";
import { BrowserProvider } from "ethers";
import {
  resolveNameToAddress,
  resolveAddressToName,
  isValidDomainName,
} from "@/lib/nameResolver";
import { isValidAddress } from "@/lib/utils";

interface AddressInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export default function AddressInput({
  value,
  onChange,
  placeholder = "0x... or name.eth",
  disabled = false,
  className = "",
}: AddressInputProps) {
  const { walletProvider } = useAppKitProvider("eip155");
  const [resolving, setResolving] = useState(false);
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null);
  const [resolvedName, setResolvedName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const resolveInput = async () => {
      if (!value || !value.trim()) {
        setResolvedAddress(null);
        setResolvedName(null);
        setError(null);
        return;
      }

      const trimmedValue = value.trim();

      // If it's a valid domain name, resolve to address
      if (isValidDomainName(trimmedValue)) {
        setResolving(true);
        setError(null);

        try {
          let provider: BrowserProvider | undefined;
          
          if (typeof window !== "undefined" && window.ethereum) {
            provider = new BrowserProvider(window.ethereum as any);
          } else if (walletProvider) {
            provider = new BrowserProvider(walletProvider as any);
          }

          const address = await resolveNameToAddress(trimmedValue, provider);

          if (address) {
            setResolvedAddress(address);
            setResolvedName(null);
            setError(null);
          } else {
            setResolvedAddress(null);
            setError("Unable to resolve name");
          }
        } catch (err) {
          console.error("Resolution error:", err);
          setResolvedAddress(null);
          setError("Failed to resolve name");
        } finally {
          setResolving(false);
        }
      }
      // If it's a valid address, try to reverse resolve to name
      else if (isValidAddress(trimmedValue)) {
        setResolving(true);
        setError(null);

        try {
          let provider: BrowserProvider | undefined;
          
          if (typeof window !== "undefined" && window.ethereum) {
            provider = new BrowserProvider(window.ethereum as any);
          } else if (walletProvider) {
            provider = new BrowserProvider(walletProvider as any);
          }

          const name = await resolveAddressToName(trimmedValue, provider);

          if (name) {
            setResolvedName(name);
            setResolvedAddress(null);
          } else {
            setResolvedName(null);
          }
          setError(null);
        } catch (err) {
          console.error("Reverse resolution error:", err);
          setResolvedName(null);
        } finally {
          setResolving(false);
        }
      } else {
        setResolvedAddress(null);
        setResolvedName(null);
        if (trimmedValue.includes(".")) {
          setError("Invalid domain or address");
        } else {
          setError(null);
        }
      }
    };

    // Debounce the resolution
    const timeoutId = setTimeout(resolveInput, 500);
    return () => clearTimeout(timeoutId);
  }, [value, walletProvider]);

  return (
    <div className="relative">
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          error ? "border-red-300" : ""
        } ${className}`}
        disabled={disabled}
      />

      {/* Resolving indicator */}
      {resolving && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-600"></div>
        </div>
      )}

      {/* Resolved address display */}
      {resolvedAddress && !resolving && (
        <div className="mt-1 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-green-600">✓</span>
            <span className="text-green-700">
              Resolves to:{" "}
              <span className="font-mono">{resolvedAddress.slice(0, 10)}...{resolvedAddress.slice(-8)}</span>
            </span>
          </div>
        </div>
      )}

      {/* Resolved name display */}
      {resolvedName && !resolving && (
        <div className="mt-1 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-blue-600">🏷️</span>
            <span className="text-blue-700">
              Name: <span className="font-medium">{resolvedName}</span>
            </span>
          </div>
        </div>
      )}

      {/* Error display */}
      {error && !resolving && (
        <div className="mt-1 text-xs text-red-600 flex items-center gap-1">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Helper text */}
      {!value && !error && (
        <div className="mt-1 text-xs text-gray-500">
          Enter an Ethereum address or ENS/Basename (e.g., vitalik.eth)
        </div>
      )}
    </div>
  );
}

