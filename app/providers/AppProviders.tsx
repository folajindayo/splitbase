"use client";

import React, { ReactNode } from "react";
import { WalletProvider } from "@/contexts/WalletContext";
import { EscrowProvider } from "@/contexts/EscrowContext";

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <WalletProvider>
      <EscrowProvider>
        {children}
      </EscrowProvider>
    </WalletProvider>
  );
}

