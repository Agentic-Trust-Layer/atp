 "use client";

import React, { useCallback, useMemo, useState } from "react";
import { Button, Tooltip, Snackbar, Alert } from "@mui/material";
import { buildDid8004 } from "@agentic-trust/core";
import { useConnection } from "./connection-context";
import { useWallet } from "./WalletProvider";
import { associateUserWithAgent, saveUserProfile } from "../app/service/userProfileService";

type Props = {
  agentId: string;
  chainId: number;
  agentAccount: string | null;
  ownerAddress: string | null;
  agentName: string | null;
  did8004: string;
};

export function AddAgentToMyListButton({
  agentId,
  chainId,
  agentAccount,
  ownerAddress,
  agentName,
  did8004,
}: Props) {
  const { user } = useConnection();
  const { address: walletAddress, isConnected } = useWallet();
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({
    open: false,
    message: "",
    severity: "success",
  });
  const [isOwner, setIsOwner] = useState<boolean | null>(null);
  const [checkingOwner, setCheckingOwner] = useState(false);

  const normalizedWallet = useMemo(() => walletAddress?.toLowerCase() ?? null, [walletAddress]);
  const normalizedOwner = useMemo(() => {
    const owner = ownerAddress?.toLowerCase();
    const acct = agentAccount?.toLowerCase();
    return owner ?? acct ?? null;
  }, [ownerAddress, agentAccount]);

  // Ownership allowance:
  // - Explicit true from server wins
  // - If server says false, block
  // - If unknown (null) use on-chain hint: allow when owner hint absent or matches wallet
  const ownershipAllowed =
    isOwner === true ||
    (isOwner !== false && (!normalizedOwner || normalizedWallet === normalizedOwner));

  const canAdd = Boolean(user?.email && isConnected && normalizedWallet && ownershipAllowed);

  // Server-side ownership check (best-effort)
  React.useEffect(() => {
    let cancelled = false;
    async function checkOwner() {
      if (!isConnected || !walletAddress || !did8004) {
        setIsOwner(null);
        return;
      }
      setCheckingOwner(true);
      try {
        const resp = await fetch(`/api/agents/${encodeURIComponent(did8004)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ walletAddress, action: 'isOwner' }),
        });
        if (resp.ok) {
          const data = await resp.json();
          if (!cancelled && typeof data.isOwner === 'boolean') {
            setIsOwner(data.isOwner);
          }
        } else {
          console.warn('[AddAgentToMyListButton] isOwner check failed:', await resp.text());
          if (!cancelled) setIsOwner(null);
        }
      } catch (err) {
        console.warn('[AddAgentToMyListButton] isOwner check error:', err);
        if (!cancelled) setIsOwner(null);
      } finally {
        if (!cancelled) setCheckingOwner(false);
      }
    }
    checkOwner();
    return () => {
      cancelled = true;
    };
  }, [isConnected, walletAddress, did8004]);

  const handleAdd = useCallback(async () => {
    if (!user?.email || !normalizedWallet) {
      setSnackbar({ open: true, message: "Connect your wallet and sign in to continue.", severity: "error" });
      return;
    }

    setLoading(true);
    try {
      // Ensure the user profile is up to date with wallet addresses (best-effort)
      await saveUserProfile({
        email: user.email,
        eoa_address: walletAddress,
      }).catch(() => {
        /* non-blocking */
      });

      const emailDomain = user.email.includes("@") ? user.email.split("@")[1] : "";
      const safeAgentName = agentName || "";
      const safeAccount = agentAccount || ownerAddress || normalizedWallet || "";
      await associateUserWithAgent(user.email, {
        ens_name: safeAgentName,
        agent_name: safeAgentName,
        email_domain: emailDomain,
        agent_account: safeAccount,
        chain_id: chainId,
        is_primary: true,
        role: "owner",
      });

      // Persist default agent locally to align with useDefaultAgent hook behavior
      try {
        const did = buildDid8004(chainId, agentId);
        const payload = {
          agent: {
            did,
            agentId,
            chainId,
          agentName: safeAgentName,
          agentAccount: safeAccount,
          ensName: safeAgentName,
            a2aEndpoint: null,
            image: null,
          },
          email: user.email,
          timestamp: Date.now(),
        };
        if (typeof window !== "undefined") {
          localStorage.setItem("atp_default_agent", JSON.stringify(payload));
        }
      } catch {
        // best-effort; ignore localStorage errors
      }

      setSnackbar({ open: true, message: "Agent added and set as default.", severity: "success" });
    } catch (err) {
      console.error("[AddAgentToMyListButton] Failed to add agent:", err);
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : "Failed to add agent. Please try again.",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [agentAccount, agentId, agentName, chainId, normalizedWallet, ownerAddress, user?.email, walletAddress]);

  if (!canAdd) {
    return (
      <Tooltip
        title={
          !isConnected
            ? "Connect your wallet to add this agent."
            : isOwner === false
              ? "Ownership check failed: you are not the owner."
              : normalizedOwner && normalizedWallet !== normalizedOwner
                ? "Wallet must match the agent owner."
                : !user?.email
                  ? "Sign in to add this agent."
                  : ""
        }
      >
        <span>
          <Button variant="outlined" disabled fullWidth>
            Add to my agents
          </Button>
        </span>
      </Tooltip>
    );
  }

  return (
    <>
      <Button
        variant="contained"
        onClick={handleAdd}
        fullWidth
        disabled={loading}
        sx={{ borderRadius: 2, fontWeight: 600 }}
      >
        {loading ? "Adding…" : "Add to my agents & set default"}
      </Button>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}

