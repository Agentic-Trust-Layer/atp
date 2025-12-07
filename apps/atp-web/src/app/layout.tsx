import type { Metadata } from "next";
import dynamic from "next/dynamic";
import * as React from "react";
import { Providers } from "./providers";

const Web3AuthProvider = dynamic(
  () =>
    import("../components/Web3AuthProvider").then(
      (mod) => mod.Web3AuthProvider
    ),
  { ssr: false }
);

const WalletProvider = dynamic(
  () =>
    import("../components/WalletProvider").then((mod) => mod.WalletProvider),
  { ssr: false }
);

export const metadata: Metadata = {
  title: "Agentic Trust Protocol - Build the Agentic Web",
  description: "Create, validate, and discover AI agents on ERC-8004. Join innovators, entrepreneurs, and builders shaping the future of the agentic web. Build trust through alliances, become a validator, and discover agents through rich vertical ontologies.",
  icons: {
    icon: "/atplogo.png",
    shortcut: "/atplogo.png",
    apple: "/atplogo.png",
  },
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Web3AuthProvider>
          <WalletProvider>
            <Providers>{children}</Providers>
          </WalletProvider>
        </Web3AuthProvider>
      </body>
    </html>
  );
}

