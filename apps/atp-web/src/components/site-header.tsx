"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import Image from "next/image";
import {
  AppBar,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Container,
  Divider,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Stack,
  Toolbar,
  Tooltip,
  Typography
} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import LogoutIcon from "@mui/icons-material/Logout";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import MessageOutlinedIcon from "@mui/icons-material/MessageOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import WorkOutlineIcon from "@mui/icons-material/WorkOutline";
import { useConnection } from "./connection-context";
import { useWeb3Auth } from "./Web3AuthProvider";
import { useStandardConnect } from "./useStandardConnect";
import { useDefaultOrgAgent } from "./useDefaultOrgAgent";
import { OrgAgentSelector } from "./OrgAgentSelector";
import { sepolia } from "viem/chains";
import { AccountService } from "../app/service/accountService";

export function SiteHeader() {
  const router = useRouter();
  const { user, setUser } = useConnection();
  const { logout, web3auth } = useWeb3Auth();
  const { 
    handleStandardConnect, 
    showOrgSelector, 
    availableOrgs, 
    handleOrgSelect, 
    onCancelOrgSelect 
  } = useStandardConnect();
  const { setDefaultOrgAgent, defaultOrgAgent } = useDefaultOrgAgent();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [isConnecting, setIsConnecting] = React.useState(false);
  const [walletAddress, setWalletAddress] = React.useState<string | null>(null);
  const [aaAddress, setAaAddress] = React.useState<string | null>(null);
  const [isSelectingAgent, setIsSelectingAgent] = React.useState(false);
  const accountDisplayName = React.useMemo(
    () => user?.name || user?.email || walletAddress || "Account",
    [user?.name, user?.email, walletAddress]
  );
  const accountInitial = accountDisplayName ? accountDisplayName[0]?.toUpperCase() ?? "A" : "A";
  const menuItems = React.useMemo(
    () => [
      { label: "Dashboard", icon: <DashboardOutlinedIcon fontSize="small" />, path: "/dashboard" },
      { label: "Messages", icon: <MessageOutlinedIcon fontSize="small" />, path: "/messages" },
      { label: "Smart Agents", icon: <GroupOutlinedIcon fontSize="small" />, path: "/agents" },
      { label: "My Initiatives", icon: <WorkOutlineIcon fontSize="small" />, path: "/app" },
      { label: "Profile", icon: <SettingsOutlinedIcon fontSize="small" />, path: "/profile" }
    ],
    []
  );

  const handleDisconnect = React.useCallback(async () => {
    try {
      await logout();
    } catch (e) {
      console.error(e);
    } finally {
      // Clear connection-related caches on explicit disconnect
      try {
        if (typeof window !== "undefined") {
          // Default org agent cache
          localStorage.removeItem("arn_default_org_agent");
          // Cached agent details per DID
          Object.keys(localStorage)
            .filter((key) => key.startsWith("arn_agent_details_"))
            .forEach((key) => localStorage.removeItem(key));
        }
      } catch (cacheError) {
        console.warn("[site-header] Failed to clear cached agent data on disconnect:", cacheError);
      }

      // Clear default org agent state
      setDefaultOrgAgent(null);
      setUser(null);
      setAnchorEl(null);
      router.push("/");
    }
  }, [logout, router, setUser, setDefaultOrgAgent]);

  const handleNavigate = React.useCallback(
    (path: string) => {
      setAnchorEl(null);
      router.push(path);
    },
    [router]
  );

  // Fetch wallet address and AA address when user is connected
  React.useEffect(() => {
    if (!user || !web3auth?.provider) {
      setWalletAddress(null);
      setAaAddress(null);
      return;
    }

    async function fetchAddresses() {
      try {
        const provider = (web3auth as any).provider as
          | { request: (args: { method: string; params?: any[] }) => Promise<any> }
          | undefined;

        if (!provider) return;

        // Get EOA address
        const accounts = await provider.request({ method: "eth_accounts" });
        const account = Array.isArray(accounts) && accounts[0];
        if (account && typeof account === "string") {
          setWalletAddress(account);

          // Get AA address
          try {
            const accountClient = await AccountService.getCounterfactualAccountClientByAccount(
              account as `0x${string}`,
              { ethereumProvider: provider }
            );
            if (accountClient && typeof accountClient.getAddress === "function") {
              const addr = await accountClient.getAddress();
              if (addr && typeof addr === "string") {
                setAaAddress(addr);
              }
            }
          } catch (aaError) {
            console.warn("Failed to get AA address in header:", aaError);
          }
        }
      } catch (error) {
        console.warn("Failed to fetch addresses in header:", error);
      }
    }

    void fetchAddresses();
  }, [user, web3auth]);

  // When the org selector closes (after selection or cancel), clear the "selecting" spinner
  React.useEffect(() => {
    if (!showOrgSelector) {
      setIsSelectingAgent(false);
    }
  }, [showOrgSelector]);

  return (
    <>
      {showOrgSelector && availableOrgs.length > 0 && (
        <OrgAgentSelector
          organizations={availableOrgs}
          onSelect={handleOrgSelect}
          onCancel={onCancelOrgSelect}
        />
      )}
      <AppBar
      position="sticky"
      elevation={0}
      sx={(theme) => ({
        backgroundColor: theme.palette.background.paper,
        borderBottom: `1px solid ${theme.palette.divider}`,
        color: theme.palette.text.primary,
        boxShadow: theme.shadows[1]
      })}
    >
      <Toolbar sx={{ px: { xs: 2, sm: 3 } }}>
        <Container
          maxWidth="lg"
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 0
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative"
              }}
            >
              <Image
                src="/atplogo.png"
                alt="ATP Logo"
                width={32}
                height={32}
                style={{ objectFit: "contain" }}
              />
            </Box>
            <Box>
              <Typography
                variant="h6"
                component="div"
                sx={(theme) => ({
                  fontSize: 18,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: theme.palette.text.primary,
                  fontWeight: 600
                })}
              >
              Agentic Trust Protocol
              </Typography>
              <Typography
                variant="caption"
                sx={(theme) => ({ 
                  color: theme.palette.text.secondary,
                  display: "block" 
                })}
              >
                Build the Agentic Web - Create, Validate, Discover Agents
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {/* Default agent indicator + quick switcher */}
            {user && defaultOrgAgent && (
              <Tooltip title="Switch default agent">
                <span>
                  <Button
                    color="primary"
                    size="small"
                    variant="outlined"
                    onClick={() => {
                      if (isSelectingAgent) return;
                      setIsSelectingAgent(true);
                      void handleStandardConnect().catch((err) => {
                        console.error("[site-header] Failed to open org selector from default agent button:", err);
                        setIsSelectingAgent(false);
                      });
                    }}
                    startIcon={
                      <Avatar
                        sx={(theme) => ({
                          width: 28,
                          height: 28,
                          fontSize: 13,
                          bgcolor: theme.palette.primary.main,
                          color: theme.palette.primary.contrastText,
                        })}
                      >
                        {(defaultOrgAgent.name || defaultOrgAgent.agentName || "A").slice(0, 2).toUpperCase()}
                      </Avatar>
                    }
                    endIcon={
                      isSelectingAgent ? (
                        <CircularProgress size={14} />
                      ) : (
                        <KeyboardArrowDownIcon sx={{ fontSize: 18 }} />
                      )
                    }
                    sx={(theme) => ({
                      textTransform: "none",
                      fontWeight: 500,
                      px: 2,
                      borderColor: theme.palette.divider,
                      color: theme.palette.text.primary,
                      "&:hover": {
                        borderColor: theme.palette.primary.main,
                        backgroundColor: theme.palette.action.hover,
                      },
                      opacity: isSelectingAgent ? 0.6 : 1,
                    })}
                    disabled={isSelectingAgent}
                  >
                    <Stack spacing={0} alignItems="flex-start">
                      <Typography 
                        variant="caption" 
                        sx={(theme) => ({ 
                          color: theme.palette.text.secondary,
                          fontSize: "0.7rem" 
                        })}
                      >
                        Default ATP Agent
                      </Typography>
                      <Typography
                        variant="body2"
                        noWrap
                        sx={(theme) => ({ 
                          maxWidth: 200, 
                          fontWeight: 600,
                          color: theme.palette.text.primary
                        })}
                      >
                        {defaultOrgAgent.name ||
                          defaultOrgAgent.agentName ||
                          defaultOrgAgent.ensName}
                      </Typography>
                    </Stack>
                  </Button>
                </span>
              </Tooltip>
            )}

          {!user ? (
              <Button
                color="primary"
                variant="contained"
                size="medium"
              onClick={async () => {
                if (!web3auth) return;
                setIsConnecting(true);
                try {
                  const result = await handleStandardConnect();
                  
                  // If agent exists and needs selection, the selector will be shown via showOrgSelector state
                  if (result?.hasAgent && result?.needsSelection) {
                    // Selector is shown via showOrgSelector state - don't do anything else
                    setIsConnecting(false);
                    return;
                  }
                  
                  // If agent exists but no selection needed, wait a moment for default agent to be set
                  if (result?.hasAgent && !result?.needsSelection) {
                    // Wait a moment for default agent to be set from localStorage
                    await new Promise((resolve) => setTimeout(resolve, 300));
                    
                    // Check if default agent is set (might be in localStorage but not yet in state)
                    const stored = typeof window !== "undefined" 
                      ? localStorage.getItem("arn_default_org_agent") 
                      : null;
                    
                    if (!defaultOrgAgent && !stored) {
                      // Agent exists but no default set - redirect to onboarding to set it up
                      router.push("/onboarding");
                    }
                    setIsConnecting(false);
                    return;
                  }
                  
                  // No agent found - redirect to onboarding
                  if (!result?.hasAgent) {
                    router.push("/onboarding");
                  }
                } catch (e) {
                  console.error(e);
                } finally {
                  setIsConnecting(false);
                }
              }}
              disabled={!web3auth || isConnecting}
                sx={(theme) => ({
                  px: 3,
                  py: 1,
                  boxShadow: theme.shadows[2],
                  "&:hover": {
                    boxShadow: theme.shadows[4],
                  },
                  "&:disabled": {
                    opacity: 0.6
                  }
                })}
              >
                {isConnecting ? "Connecting…" : "Connect"}
              </Button>
            ) : (
              <>
                <Button
                  color="inherit"
                  variant="outlined"
                  size="medium"
                  onClick={(event) => setAnchorEl(event.currentTarget)}
                  startIcon={
                    <Avatar
                      sx={(theme) => ({
                        width: 32,
                        height: 32,
                        bgcolor: theme.palette.primary.main,
                        color: theme.palette.primary.contrastText,
                        fontSize: 14,
                        fontWeight: 600,
                      })}
                    >
                      {accountInitial}
                    </Avatar>
                  }
                  endIcon={<KeyboardArrowDownIcon sx={{ fontSize: 18 }} />}
                  sx={(theme) => ({
                    borderRadius: 2,
                    px: 2,
                    py: 1,
                    borderColor: theme.palette.divider,
                    color: theme.palette.text.primary,
                    backgroundColor: theme.palette.background.paper,
                    boxShadow: theme.shadows[1],
                    "&:hover": { 
                      backgroundColor: theme.palette.action.hover,
                      borderColor: theme.palette.primary.main,
                      boxShadow: theme.shadows[2],
                    },
                    maxWidth: 260,
                    justifyContent: "space-between",
                    textTransform: "none",
                  })}
                >
                  <Typography
                    variant="body2"
                    sx={(theme) => ({
                      maxWidth: 170,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      textAlign: "left",
                      fontWeight: 600,
                      color: theme.palette.text.primary,
                    })}
                  >
                    {accountDisplayName}
                  </Typography>
                </Button>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={() => setAnchorEl(null)}
                  anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "right"
                  }}
                  transformOrigin={{
                    vertical: "top",
                    horizontal: "right"
                  }}
                  PaperProps={{
                    sx: (theme) => ({
                      mt: 1.5,
                      minWidth: 280,
                      boxShadow: theme.shadows[8],
                      borderRadius: 2,
                      border: `1px solid ${theme.palette.divider}`
                    })
                  }}
                >
                  {walletAddress && (
                    <Box
                      sx={{
                        px: 2,
                        py: 1.5,
                        borderBottom: "1px solid",
                        borderColor: "divider",
                      }}
                    >
                      <Typography 
                        variant="caption" 
                        sx={(theme) => ({ 
                          color: theme.palette.text.secondary,
                          mb: 0.5 
                        })}
                      >
                        Wallet
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={(theme) => ({
                          fontFamily:
                            "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace",
                          fontSize: "0.75rem",
                          color: theme.palette.text.primary,
                        })}
                      >
                        {walletAddress}
                      </Typography>
                      {aaAddress && (
                        <>
                          <Typography 
                            variant="caption" 
                            sx={(theme) => ({ 
                              color: theme.palette.text.secondary,
                              mt: 1, 
                              mb: 0.5 
                            })}
                          >
                            Smart account
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={(theme) => ({
                              fontFamily:
                                "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace",
                              fontSize: "0.75rem",
                              color: theme.palette.text.primary,
                            })}
                          >
                            {aaAddress}
                          </Typography>
                        </>
                      )}
                    </Box>
                  )}
                  {menuItems.map((item) => (
                    <MenuItem
                      key={item.path}
                      onClick={() => handleNavigate(item.path)}
                      sx={(theme) => ({ 
                        py: 1.5,
                        "&:hover": {
                          backgroundColor: theme.palette.action.hover,
                        }
                      })}
                    >
                      <ListItemIcon sx={{ minWidth: 40, color: "inherit" }}>
                        {item.icon}
                      </ListItemIcon>
                      <Typography variant="body2" sx={(theme) => ({ color: theme.palette.text.primary })}>
                        {item.label}
                      </Typography>
                    </MenuItem>
                  ))}
                  <Divider />
                  <MenuItem
                    onClick={handleDisconnect}
                    sx={{ color: (theme) => theme.palette.error.main, py: 1 }}
                  >
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <LogoutIcon fontSize="small" color="error" />
                    </ListItemIcon>
                    Disconnect
                  </MenuItem>
                </Menu>
              </>
              )}
          </Box>
        </Container>
      </Toolbar>
    </AppBar>
    </>
  );
}


