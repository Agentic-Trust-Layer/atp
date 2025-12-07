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
};

export function AddAgentToMyListButton({
  agentId,
  chainId,
  agentAccount,
  ownerAddress,
  agentName,
}: Props) {
  const { user } = useConnection();
  const { address: walletAddress, isConnected } = useWallet();
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({
    open: false,
    message: "",
    severity: "success",
  });

  const normalizedWallet = useMemo(() => walletAddress?.toLowerCase() ?? null, [walletAddress]);
  const normalizedOwner = useMemo(
    () => ownerAddress?.toLowerCase() ?? agentAccount?.toLowerCase() ?? null,
    [ownerAddress, agentAccount]
  );

  const canAdd = Boolean(
    user?.email &&
    isConnected &&
    normalizedWallet &&
    normalizedOwner &&
    normalizedWallet === normalizedOwner
  );

  const handleAdd = useCallback(async () => {
    if (!user?.email || !normalizedWallet) {
      setSnackbar({ open: true, message: "Connect your wallet and sign in to continue.", severity: "error" });
      return;
    }

    setLoading(true);
    try {
      // Ensure the user profile is up to date with wallet addresses
      await saveUserProfile({
        email: user.email,
        eoa_address: walletAddress,
      });

      const emailDomain = user.email.includes("@") ? user.email.split("@")[1] : "";
      await associateUserWithAgent(user.email, {
        ens_name: agentName || "",
        agent_name: agentName || "",
        email_domain: emailDomain,
        agent_account: agentAccount || ownerAddress || "",
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
            agentName: agentName || "",
            agentAccount: agentAccount || ownerAddress || "",
            ensName: agentName || "",
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
            : normalizedOwner && normalizedWallet !== normalizedOwner
              ? "You must be the agent owner to add it."
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

