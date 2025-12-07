"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { useConnection } from "../../components/connection-context";
import { useWeb3Auth } from "../../components/Web3AuthProvider";
import { useStandardConnect } from "../../components/useStandardConnect";

import {
  createAgentWithWallet,
  getCounterfactualAAAddressByAgentName
} from "@agentic-trust/core/client";
import { keccak256, stringToHex } from "viem";
import { sepolia } from "viem/chains";
import { AccountService } from "../service/accountService";
import {
  AttestationService,
  type TrustRelationshipAttestation
} from "../service/attestationService";
import { saveUserProfile, associateUserWithAgent } from "../service/userProfileService";
import { useDefaultOrgAgent, type DefaultOrgAgent } from "../../components/useDefaultOrgAgent";
import { OrgAgentSelector } from "../../components/OrgAgentSelector";

// OrgDetails interface removed - no longer collecting name, address, or type

type Step = 1 | 2 | 3 | 4 | 5;

export default function OnboardingPage() {
  const router = useRouter();
  const { user, setUser } = useConnection();
  const {
    web3auth,
    isInitializing,
    error: authError,
    connect,
    logout,
    getUserInfo
  } = useWeb3Auth();

  const [step, setStep] = React.useState<Step>(1);
  const [isConnecting, setIsConnecting] = React.useState(false);
  const [isCheckingAvailability, setIsCheckingAvailability] =
    React.useState(false);
  // Removed org state - no longer collecting name, address, or type
  const [arn, setArn] = React.useState<string | null>(null);
  const [walletAddress, setWalletAddress] = React.useState<string | null>(null);
  const [aaAddress, setAaAddress] = React.useState<string | null>(null);
  const [firstName, setFirstName] = React.useState<string>("");
  const [lastName, setLastName] = React.useState<string>("");
  const [isCreatingArn, setIsCreatingArn] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [agentExists, setAgentExists] = React.useState(false);
  const [existingAgentName, setExistingAgentName] = React.useState<string | null>(null);
  const [isCheckingAgent, setIsCheckingAgent] = React.useState(false);
  const [ensAvailability, setEnsAvailability] = React.useState<{
    checking: boolean;
    available: boolean | null;
    ensName: string | null;
  }>({ checking: false, available: null, ensName: null });
  const [useFullDomain, setUseFullDomain] = React.useState<boolean>(false);
  const [customAgentName, setCustomAgentName] = React.useState<string>("");

  const emailDomain = React.useMemo(() => {
    if (!user?.email) return null;
    const parts = user.email.split("@");
    if (parts.length !== 2) return null;
    return parts[1].toLowerCase();
  }, [user?.email]);

  /**
   * Derive agent name from email domain
   * @param domain - The email domain (e.g., "example.co.uk" or "example.com")
   * @param useFull - If true, replace all dots with dashes. If false, use only first part.
   * @returns Agent name (e.g., "example-co-uk-arn" or "example-arn")
   */
  const deriveAgentNameFromDomain = React.useCallback((domain: string | null, useFull: boolean): string => {
    if (!domain) return "";
    const domainParts = domain.split(".");
    if (useFull) {
      // Replace all dots with dashes: "example.co.uk" -> "example-co-uk-arn"
      const domainBase = domainParts.slice(0, -1).join("-");
      return `${domainBase}-arn`;
    } else {
      // Use only first part: "example.co.uk" -> "example-arn"
      return `${domainParts[0]}-arn`;
    }
  }, []);

  // Surface any underlying Web3Auth initialization errors into the local error UI.
  React.useEffect(() => {
    if (authError) {
      setError(authError);
    }
  }, [authError]);

  /**
   * Check if an agent already exists for the individual's AA account
   */
  const checkIfAgentExists = React.useCallback(async (eoaAccount: string) => {
    console.info("check if agent exists for individual AA account...");
    if (!eoaAccount || typeof eoaAccount !== "string" || !eoaAccount.startsWith("0x")) {
      return false;
    }

    if (!web3auth?.provider) {
      console.warn("Web3Auth provider not available for AA account check");
      return false;
    }

    setIsCheckingAgent(true);
    try {
      // Get the individual AA account address
      const provider = (web3auth as any).provider as
        | { request: (args: { method: string; params?: any[] }) => Promise<any> }
        | undefined;

      if (!provider) {
        return false;
      }

      const accountClient = await AccountService.getCounterfactualAccountClientByAccount(
        eoaAccount as `0x${string}`,
        { ethereumProvider: provider }
      );

      if (!accountClient || typeof accountClient.getAddress !== "function") {
        console.warn("Failed to get individual AA account client");
        return false;
      }

      const accountAaAddress = await accountClient.getAddress();
      if (!accountAaAddress || typeof accountAaAddress !== "string") {
        console.warn("Failed to get account AA address");
        return false;
      }

      // Check if agent exists for the account AA
      const didEthr = `did:ethr:${sepolia.id}:${accountAaAddress}`;
      const encodedDid = encodeURIComponent(didEthr);

      console.info("......... checking AA account: ", encodedDid);
      const checkResponse = await fetch(
        `/api/agents/by-account/${encodedDid}`
      );

      console.info("......... checkResponse: ", checkResponse);
      if (checkResponse.ok) {
        const result = await checkResponse.json();
        // Check if agent was found (endpoint returns found: true/false)
        if (result?.found === true && result?.name) {
          setAgentExists(true);
          setExistingAgentName(result.name);
          return true;
        }
      }
      // If found: false or other error, no agent exists
      setAgentExists(false);
      setExistingAgentName(null);
      return false;
    } catch (checkError) {
      console.warn("Failed to check for existing agent:", checkError);
      setAgentExists(false);
      setExistingAgentName(null);
      return false;
    } finally {
      setIsCheckingAgent(false);
    }
  }, [web3auth]);

  // Removed automatic redirect - users should complete onboarding flow manually

  // If user is already connected when page loads, skip to step 2
  React.useEffect(() => {
    if (user && web3auth && step === 1) {
      // User is already connected, move to step 2
      // Try to get wallet address if not already set
      if (!walletAddress) {
        const provider = (web3auth as any)?.provider as
          | { request: (args: { method: string; params?: any[] }) => Promise<any> }
          | undefined;
        if (provider) {
          provider
            .request({ method: "eth_accounts" })
            .then(async (accounts) => {
              const account = Array.isArray(accounts) && accounts[0];
              if (account && typeof account === "string") {
                setWalletAddress(account);
                // Update user profile with EOA address immediately
                if (user?.email) {
                  try {
                    await saveUserProfile({
                      email: user.email,
                      eoa_address: account,
                    });
                  } catch (error) {
                    console.warn("Failed to update user profile with EOA address:", error);
                  }
                }
              }
            })
            .catch((e) => {
              console.warn("Failed to get wallet address:", e);
            });
        }
      }
      setStep(2);
    }
  }, [user, web3auth, step, walletAddress]);

  // Pre-populate firstName and lastName from Web3Auth when on step 2
  React.useEffect(() => {
    if (step === 2 && user && web3auth && (!firstName || !lastName)) {
      async function populateUserDetails() {
        try {
          const userInfo = await getUserInfo();
          if (userInfo?.name && typeof userInfo.name === "string") {
            const name = userInfo.name.trim();
            
            // Check if the name is actually an email address
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (emailRegex.test(name)) {
              // If name is an email, don't populate firstName/lastName
              return;
            }
            
            const nameParts = name.split(/\s+/);
            if (nameParts.length > 0 && !firstName) {
              setFirstName(nameParts[0]);
            }
            if (nameParts.length > 1 && !lastName) {
              setLastName(nameParts.slice(1).join(" "));
            } else if (nameParts.length === 1 && !lastName) {
              // If only one name part, leave lastName empty or use first name
              // You could also set lastName to empty string or the same as firstName
            }
          }
        } catch (error) {
          console.warn("Failed to get user info for pre-population:", error);
        }
      }
      void populateUserDetails();
    }
  }, [step, user, web3auth, firstName, lastName, getUserInfo]);

  // Save first and last name to database when they change on step 2
  React.useEffect(() => {
    if (step === 2 && user?.email && (firstName || lastName)) {
      // Debounce: only save after user stops typing for 500ms
      const timeoutId = setTimeout(async () => {
        try {
          await saveUserProfile({
            email: user.email,
            first_name: firstName || null,
            last_name: lastName || null,
            eoa_address: walletAddress || null,
            aa_address: aaAddress || null,
          });
        } catch (error) {
          console.warn("Failed to save user profile (first/last name):", error);
        }
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [step, user?.email, firstName, lastName, walletAddress, aaAddress]);

  // Fetch AA address if missing when on step 2 and save to database
  React.useEffect(() => {
    if (step === 2 && walletAddress && !aaAddress && web3auth?.provider) {
      async function fetchAaAddress() {
        try {
          const provider = (web3auth as any).provider as
            | { request: (args: { method: string; params?: any[] }) => Promise<any> }
            | undefined;
          if (provider) {
            const accountClient = await AccountService.getCounterfactualAccountClientByAccount(
              walletAddress as `0x${string}`,
              { ethereumProvider: provider }
            );
            if (accountClient && typeof accountClient.getAddress === "function") {
              const addr = await accountClient.getAddress();
              if (addr && typeof addr === "string") {
                setAaAddress(addr);
                // Save AA address to database immediately
                if (user?.email) {
                  try {
                    await saveUserProfile({
                      email: user.email,
                      first_name: firstName || null,
                      last_name: lastName || null,
                      eoa_address: walletAddress,
                      aa_address: addr,
                    });
                  } catch (error) {
                    console.warn("Failed to save user profile (AA address):", error);
                  }
                }
              }
            }
          }
        } catch (error) {
          console.warn("Failed to fetch AA address:", error);
        }
      }
      void fetchAaAddress();
    }
  }, [step, walletAddress, aaAddress, web3auth, user?.email, firstName, lastName]);

  // Check for existing agent when wallet address is available and we're on step 4
  React.useEffect(() => {
    if (walletAddress && step === 4) {
      void checkIfAgentExists(walletAddress);
    }
  }, [walletAddress, step, checkIfAgentExists]);

  // Check ENS availability when on step 3 and emailDomain is available
  React.useEffect(() => {
    if (step === 3 && emailDomain) {
      async function checkENSAvailability() {
        if (!emailDomain) return;
        try {
          // Calculate the ENS name that will be used
          const agentName = customAgentName || deriveAgentNameFromDomain(emailDomain, useFullDomain);
          const ensOrgName = "8004-agent";
          const ensName = `${agentName}.${ensOrgName}.eth`;
          const didEns = `did:ens:${sepolia.id}:${ensName}`;

          setEnsAvailability({ checking: true, available: null, ensName });

          // Check ENS availability
          console.info(" @@@@@@@@@@@@ src/app/onboarding 2 did ens check: ", didEns);
          
          const encodedDidEns = encodeURIComponent(didEns);
          const response = await fetch(`/api/names/${encodedDidEns}/is-available`);

          if (response.ok) {
            const result = await response.json();
            setEnsAvailability({
              checking: false,
              available: result.available === true,
              ensName
            });
          } else {
            setEnsAvailability({
              checking: false,
              available: null,
              ensName
            });
          }
        } catch (error) {
          console.warn("Failed to check ENS availability:", error);
          setEnsAvailability(prev => ({ ...prev, checking: false }));
        }
      }

      void checkENSAvailability();
    } else {
      setEnsAvailability({ checking: false, available: null, ensName: null });
    }
  }, [step, emailDomain, useFullDomain, customAgentName, deriveAgentNameFromDomain]);

  const { 
    handleStandardConnect, 
    showOrgSelector, 
    availableOrgs, 
    handleOrgSelect, 
    onCancelOrgSelect 
  } = useStandardConnect();
  const { setDefaultOrgAgent } = useDefaultOrgAgent();

  const handleConnectSocial = React.useCallback(async () => {
    if (!web3auth) return;
    setIsConnecting(true);
    setError(null);

    try {
      // Use standard connect flow - this will show org selector if agent exists
      const result = await handleStandardConnect();

      // If agent exists and needs selection, the selector will be shown
      // Don't redirect automatically - let user choose their org agent
      if (result?.hasAgent && result?.needsSelection) {
        // Selector is shown via showOrgSelector state
        setIsConnecting(false);
        return;
      }
      
      // If agent exists but no selection needed, continue with onboarding
      if (result?.hasAgent && !result?.needsSelection) {
        setIsConnecting(false);
        return;
      }

      // No agent found - continue with onboarding flow
      const account = result?.account;
      if (!account) {
        throw new Error("Could not determine wallet address");
      }

      setWalletAddress(account);

      // Best-effort split of the display name into first/last.
      const userInfo = await getUserInfo();
      const resolvedName = userInfo?.name ?? "Unknown user";
      if (resolvedName && typeof resolvedName === "string") {
        const parts = resolvedName.split(" ").filter(Boolean);
        setFirstName(parts[0] ?? "");
        setLastName(parts.length > 1 ? parts.slice(1).join(" ") : "");
      }

      // Before moving to the individual details step, build a counterfactual
      // AA account client for the person (using a fixed salt) and store its address.
      const provider = (web3auth as any)?.provider as
        | { request: (args: { method: string; params?: any[] }) => Promise<any> }
        | undefined;
      if (provider) {
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
            } catch (e) {
              console.error(
                "Failed to build counterfactual account client for person:",
                e
              );
        }
      }

      setStep(2);
    } catch (e) {
      console.error(e);
      setError("Unable to complete social login. Please try again.");
    } finally {
      setIsConnecting(false);
    }
  }, [web3auth, handleStandardConnect, getUserInfo]);

  const handleOrgNext = React.useCallback(async () => {
    if (!emailDomain) {
      setError(
        "We could not determine your email domain. Please disconnect and reconnect, then try again."
      );
      return;
    }

    // Use custom agent name if provided, otherwise derive from domain
    const candidateName = customAgentName || deriveAgentNameFromDomain(emailDomain, useFullDomain);
    const ensOrgName = "8004-agent";
    const selectedChainId = sepolia.id;

    setIsCheckingAvailability(true);

    try {
      // Build DID ENS string: did:ens:chainId:agentName.orgName.eth
      const encodedEnsDid = encodeURIComponent(
        `did:ens:${selectedChainId}:${candidateName}.${ensOrgName}.eth`
      );

      const response = await fetch(`/api/names/${encodedEnsDid}/is-available`, {
        method: "GET",
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        console.warn("ENS availability check failed:", err);
        setError(
          err?.error ??
            "Unable to check ARN domain availability. Please try again."
        );
        return;
      }

      const data = await response.json();
      const available = data?.available === true;

      if (!available) {
        setError(
          `An agent already exists with the name "${candidateName}". Please disconnect and sign in with an account whose email domain matches the agent you are registering.`
        );
        return;
      }

      setError(null);
      setStep(4);
    } catch (e) {
      console.error(e);
      setError(
        "Unable to check ARN domain availability. Please try again in a moment."
      );
    } finally {
      setIsCheckingAvailability(false);
    }
  }, [emailDomain, useFullDomain, customAgentName, deriveAgentNameFromDomain]);

  const handleDisconnectAndReset = React.useCallback(async () => {
    setError(null);
    try {
      await logout();
    } catch (e) {
      console.error(e);
    } finally {
      // Clear default org agent cache
      try {
        if (typeof window !== "undefined") {
          localStorage.removeItem("arn_default_org_agent");
          Object.keys(localStorage)
            .filter((key) => key.startsWith("arn_agent_details_"))
            .forEach((key) => localStorage.removeItem(key));
        }
      } catch (cacheError) {
        console.warn("[onboarding] Failed to clear cached agent data on disconnect:", cacheError);
      }
      
      // Clear default org agent state
      setDefaultOrgAgent(null);
      setUser(null);
      setArn(null);
      setWalletAddress(null);
      setAaAddress(null);
      setFirstName("");
      setLastName("");
      setStep(1);
      router.push("/");
    }
  }, [logout, setUser, router, setDefaultOrgAgent]);

  const handleCreateArn = React.useCallback(async () => {
    // Prevent creation if agent already exists
    if (agentExists) {
      setError(
        `An ARN Identity already exists for your individual account. Agent name: ${existingAgentName || "Unknown"}.`
      );
      return;
    }

    if (!emailDomain) {
      setError(
        "We could not determine your email domain. Please disconnect and reconnect, then try again."
      );
      return;
    }

    if (!web3auth || !(web3auth as any).provider) {
      setError(
        "Wallet provider is not available. Please complete the social login step first."
      );
      return;
    }

    setIsCreatingArn(true);
    setError(null);

    try {
      // Resolve an EIP-1193 provider (Web3Auth first, then window.ethereum as fallback).
      const eip1193Provider =
        (web3auth as any).provider ??
        (typeof window !== "undefined" ? (window as any).ethereum : null);

      if (!eip1193Provider) {
        setError(
          "No EIP-1193 provider available. Please ensure your wallet is connected."
        );
        return;
      }

      const provider = eip1193Provider as {
        request: (args: { method: string; params?: any[] }) => Promise<any>;
      };

      // Resolve connected account (EOA) from provider
      const accounts = await provider.request({
        method: "eth_accounts"
      });
      const account = Array.isArray(accounts) && accounts[0];

      if (!account || typeof account !== "string") {
        setError(
          "We could not determine your wallet address. Please disconnect and reconnect, then try again."
        );
        return;
      }

      // Use custom agent name if provided, otherwise derive from domain
      const agentName = customAgentName || deriveAgentNameFromDomain(emailDomain, useFullDomain);
      // Compute the counterfactual AA address for the agent using the client helper.
      const agentAccountAddress = await getCounterfactualAAAddressByAgentName(
        agentName,
        account as `0x${string}`,
        {
          ethereumProvider: provider as any,
          chain: sepolia
        }
      );

      if (
        !agentAccountAddress ||
        typeof agentAccountAddress !== "string" ||
        !agentAccountAddress.startsWith("0x")
      ) {
        setError(
          "Failed to compute account abstraction address for this agent. Please retry."
        );
        return;
      }

      console.info("......... computedAa (agent AA) ......... ", agentAccountAddress);

      const ensOrgName = "8004-agent";

      console.info("......... eip1193Provider: ", eip1193Provider);

      // Double-check agent name availability before attempting creation
      try {
        const ensName = `${agentName}.${ensOrgName}.eth`;
        const didEns = `did:ens:${sepolia.id}:${ensName}`;
        const encodedEnsDid = encodeURIComponent(didEns);
        const availabilityCheck = await fetch(`/api/names/${encodedEnsDid}/is-available`, {
          method: "GET",
        });

        if (availabilityCheck.ok) {
          const availabilityData = await availabilityCheck.json();
          if (availabilityData.available === false) {
            setError(
              `An agent with the name "${agentName}" already exists. Please disconnect and sign in with an account whose email domain matches the agent you are registering.`
            );
            return;
          }
        }
      } catch (availabilityError) {
        console.warn("Failed to verify agent name availability before creation:", availabilityError);
        // Continue with creation attempt even if availability check fails
      }

      let result;
      let agentCreationSuccessful = false;
      try {
        const agentUrl = `https://${agentName}.8004-agent.io`;
        result = await createAgentWithWallet({
          agentData: {
            agentName,
            agentAccount: agentAccountAddress as `0x${string}`,
            description: 'arn account',
            image: '/atplogo.png',
            agentUrl: agentUrl,
          },
          account: account as `0x${string}`,
          ethereumProvider: eip1193Provider as any,
          ensOptions: {
            enabled: true,
            orgName: ensOrgName
          },
          useAA: true,
          chainId: sepolia.id
        });

        console.info("......... result ......... ", result);
        
        // Verify that the result indicates successful creation
        // Check for agentId or other success indicators
        if (result && (result as any)?.agentId !== undefined) {
          agentCreationSuccessful = true;
        } else {
          // If result doesn't have expected success indicators, treat as failure
          console.warn("[onboarding] Agent creation result missing success indicators:", result);
          throw new Error("Agent creation did not return expected success indicators");
        }
      } catch (createError: any) {
        console.error("Failed to create agent:", createError);
        agentCreationSuccessful = false;
        
        // Provide more specific error messages
        const errorMessage = createError?.message || String(createError);
        
        if (errorMessage.includes('Internal JSON-RPC error') || errorMessage.includes('InternalRpcError')) {
          setError(
            "The blockchain network is experiencing issues. Please try again in a few moments. If the problem persists, check your network connection and try again."
          );
        } else if (errorMessage.includes('insufficient funds') || errorMessage.includes('gas')) {
          setError(
            "Insufficient funds or gas estimation failed. Please ensure your wallet has enough ETH to cover transaction fees."
          );
        } else if (errorMessage.includes('user rejected') || errorMessage.includes('User denied')) {
          setError(
            "Transaction was cancelled. Please try again when ready."
          );
        } else if (errorMessage.includes('already exists') || errorMessage.includes('already registered')) {
          setError(
            `An agent with the name "${agentName}" already exists. Please disconnect and sign in with an account whose email domain matches the agent you are registering.`
          );
        } else {
          setError(
            `Failed to create agent: ${errorMessage}. Please try again or contact support if the issue persists.`
          );
        }
        throw createError; // Re-throw to be caught by outer catch
      }

      const accountClient: any =
        await AccountService.getCounterfactualAccountClientByAccount(
          account as `0x${string}`,
          { ethereumProvider: eip1193Provider as any }
        );
      console.info("......... accountClient ......... ", accountClient?.address);

      /*
      // After successfully creating the agent AA, create a trust relationship
      // attestation between the individual's AA and the agent AA.
      try {

        const personAccountClient: any =
        await IndivService.getCounterfactualAccountClientByIndividual(
          "person",
          account as `0x${string}`,
          { ethereumProvider: provider }
        );

        // subject (from) ==> object (to)
        const subjectDid = `did:pkh:eip155:${sepolia.id}:${agentAccountAddress}`;
        const objectDid = `did:pkh:eip155:${sepolia.id}:${personAccountClient.address}`;

        const trustAttestation: TrustRelationshipAttestation = {
          entityId: "trust-relationship",
          displayName: "Trust relationship",
          description:
            "Trust relationship between individual AA and agent AA for ARN onboarding",
          subjectDid,
          objectDid,
          relationshipType: "ally"
        };



        await AttestationService.addTrustRelationshipAttestation({
          chain: sepolia,
          attestation: trustAttestation,
          agentAccountClient: personAccountClient
        });
      } catch (e) {
        console.error(
          "Failed to create trust relationship attestation for agent:",
          e
        );
      }
      */








      // Associate user with the newly created agent ONLY if agent creation was successful
      // (Profile is already saved incrementally throughout the onboarding process)
      if (user?.email && agentCreationSuccessful) {
        try {
          const ensName = `${agentName}.${ensOrgName}.eth`;
          
          // First, get the actual agent account address from the result or fetch it
          let actualAgentAccount = agentAccountAddress;
          
          // Try to get agent ID from result if available
          let agentId: string | bigint | undefined = (result as any)?.agentId;
          
          // If we have an agent ID, fetch full agent details
          // Otherwise, try to fetch by account address
          let fullAgentDetails: any = null;
          
          try {
            // Wait a moment for the agent to be indexed
            await new Promise((resolve) => setTimeout(resolve, 1000));
            
            // Try to fetch by account address first
            const didEthr = `did:ethr:${sepolia.id}:${agentAccountAddress}`;
            const encodedDid = encodeURIComponent(didEthr);
            const agentResponse = await fetch(`/api/agents/by-account/${encodedDid}`);
            
            if (agentResponse.ok) {
              const agentResult = await agentResponse.json();
              if (agentResult?.found === true) {
                fullAgentDetails = agentResult;
                actualAgentAccount = agentResult.agentAccount || agentAccountAddress;
                agentId = agentResult.agentId;
                console.info("[onboarding] Fetched full agent details after creation:", agentResult.agentId);
              } else {
                // Agent was not found on-chain - this means creation failed
                console.error("[onboarding] Agent creation verification failed: agent not found on-chain");
                throw new Error("Agent was not found on-chain after creation. The transaction may have failed.");
              }
            } else {
              // Failed to verify agent existence
              console.error("[onboarding] Failed to verify agent creation on-chain");
              throw new Error("Failed to verify agent creation on-chain");
            }
          } catch (fetchError) {
            console.error("[onboarding] Failed to verify agent creation, aborting database association:", fetchError);
            // Re-throw to prevent database record creation
            throw fetchError;
          }
          
          // Only create database record if agent was successfully verified on-chain
          await associateUserWithAgent(user.email, {
            ens_name: ensName,
            agent_name: agentName,
            email_domain: emailDomain,
            agent_account: actualAgentAccount,
            chain_id: sepolia.id,
            is_primary: true, // This is the primary agent based on email domain
          });

          // Set as default org agent with full details
          const defaultAgent: DefaultOrgAgent = {
            ensName,
            agentName,
            agentAccount: actualAgentAccount,
            agentId: agentId || fullAgentDetails?.agentId,
            chainId: sepolia.id,
            name: fullAgentDetails?.name || agentName,
            description: fullAgentDetails?.description || (result as any)?.description || 'arn account',
            image: fullAgentDetails?.image || (result as any)?.image || 'https://www.google.com',
            agentUrl: fullAgentDetails?.agentUrl || (result as any)?.agentUrl || '/atplogo.png',
            tokenUri: fullAgentDetails?.tokenUri || (result as any)?.tokenUri,
            metadata: fullAgentDetails?.metadata || (result as any)?.metadata,
            did: fullAgentDetails?.did,
            a2aEndpoint: fullAgentDetails?.a2aEndpoint || (result as any)?.a2aEndpoint,
            ...(fullAgentDetails || result as any),
          };
          
          console.info("[onboarding] Setting default agent with full details:", {
            agentName: defaultAgent.agentName,
            agentAccount: defaultAgent.agentAccount,
            agentId: defaultAgent.agentId,
            did: defaultAgent.did,
          });
          
          // Pass email directly to ensure localStorage is saved
          setDefaultOrgAgent(defaultAgent, user.email);
          
          // Wait a moment to ensure state is saved before any navigation
          await new Promise((resolve) => setTimeout(resolve, 200));
        } catch (error) {
          console.warn("Failed to associate user with agent:", error);
        }
      }

      // For the ARN onboarding UI, treat a successful client-side flow as success
      // and use the human-readable agent name as the ARN identifier.
      setArn(agentName);
      setStep(5);
    } catch (e) {
      // Error handling is done in the inner try-catch above
      // This outer catch is just for any unexpected errors that weren't caught by inner catch
      console.error("Unexpected error during agent creation:", e);
      // The inner catch should have already set the error message
      // Only set a generic error if somehow we got here without an error message
      const errorMessage = e instanceof Error ? e.message : String(e);
      if (!errorMessage.includes('Internal JSON-RPC') && 
          !errorMessage.includes('insufficient funds') &&
          !errorMessage.includes('already exists') &&
          !errorMessage.includes('user rejected')) {
        // This is an unexpected error type, set generic message
        setError(
          "An unexpected error occurred while creating your smart agent identity with the Agentic Trust Protocol. Please try again."
        );
      }
    } finally {
      setIsCreatingArn(false);
    }
  }, [emailDomain, web3auth, agentExists, existingAgentName, user?.email, setDefaultOrgAgent, useFullDomain, customAgentName, deriveAgentNameFromDomain]);

  const goToAppEnvironment = () => {
    router.push("/app");
  };

  return (
    <>
      {showOrgSelector && availableOrgs.length > 0 && (
        <OrgAgentSelector
          organizations={availableOrgs}
          onSelect={handleOrgSelect}
          onCancel={onCancelOrgSelect}
        />
      )}
    <main
      style={{
        padding: "3rem 2rem",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        maxWidth: "48rem",
        margin: "0 auto"
      }}
    >
      <header style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
          Create Your Agent - Build the Agentic Web
        </h1>
        <p style={{ maxWidth: "40rem", lineHeight: 1.6 }}>
          Transform your agent idea into a trusted, validated agent in minutes. Create your agent identity, build trust through validation, and join the agentic web ecosystem.
          Agentic Trust Protocol, and start managing your smart agent accounts, identities, and applications.
        </p>
      </header>

      <section
        style={{
          marginBottom: "1.5rem",
          fontSize: "0.9rem",
          color: "#4b5563"
        }}
      >
        <strong>Step {step} of 5</strong>
      </section>

      {error && (
        <div
          style={{
            marginBottom: "1.5rem",
            padding: "0.75rem 1rem",
            borderRadius: "0.5rem",
            backgroundColor: "#fef2f2",
            color: "#991b1b",
            border: "1px solid #fecaca"
          }}
        >
          {error}
        </div>
      )}

      {step === 1 && (
        <section
          style={{
            padding: "1.75rem 1.5rem",
            borderRadius: "0.75rem",
            border: "1px solid rgba(148, 163, 184, 0.6)",
            backgroundColor: "white"
          }}
        >
          <h2 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>
            1. Connect using your social login
          </h2>
          <p style={{ marginBottom: "1.25rem", lineHeight: 1.5 }}>
            We use Web3Auth to let you sign in with familiar social providers,
            while also preparing a wallet that can be used for ARN operations.
          </p>

          {isInitializing && (
            <p>Initializing Web3Auth widget, please wait…</p>
          )}

          {!isInitializing && !error && (
            <button
              type="button"
              onClick={handleConnectSocial}
              disabled={!web3auth || isConnecting}
              style={{
                padding: "0.75rem 1.5rem",
                borderRadius: "9999px",
                border: "none",
                backgroundColor: "#2563eb",
                color: "white",
                fontWeight: 600,
                cursor: !web3auth || isConnecting ? "not-allowed" : "pointer",
                opacity: !web3auth || isConnecting ? 0.7 : 1
              }}
            >
              {isConnecting ? "Connecting…" : "Connect with social login"}
            </button>
          )}
        </section>
      )}

      {step === 2 && (
        <section
          style={{
            padding: "1.75rem 1.5rem",
            borderRadius: "0.75rem",
            border: "1px solid rgba(148, 163, 184, 0.6)",
            backgroundColor: "white"
          }}
        >
          <h2 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>
            2. Your details
          </h2>

          {user && (
            <div style={{ marginBottom: "1.25rem", lineHeight: 1.5 }}>
              <p>
                Email: <strong>{user.email}</strong>
              </p>
              {walletAddress && (
                <div
                  style={{
                    marginTop: "0.5rem",
                    fontSize: "0.85rem",
                    color: "#6b7280",
                    fontFamily:
                      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace"
                  }}
                >
                  <p style={{ marginBottom: "0.25rem" }}>
                  EOA: <span>{walletAddress}</span>
                </p>
                  <p style={{ marginTop: "0.15rem", fontSize: "0.8rem", color: "#9ca3af" }}>
                    EOA DID:ethr: <span>did:ethr:{sepolia.id}:{walletAddress}</span>
                  </p>
                </div>
              )}
              {aaAddress && (
                <div
                  style={{
                    marginTop: "0.5rem",
                    fontSize: "0.85rem",
                    color: "#6b7280",
                    fontFamily:
                      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace"
                  }}
                >
                  <p style={{ marginBottom: "0.25rem" }}>
                  AA account: <span>{aaAddress}</span>
                </p>
                  <p style={{ marginTop: "0.15rem", fontSize: "0.8rem", color: "#9ca3af" }}>
                    AA DID:ethr: <span>did:ethr:{sepolia.id}:{aaAddress}</span>
                  </p>
                </div>
              )}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span>First name</span>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                style={{
                  padding: "0.5rem 0.75rem",
                  borderRadius: "0.5rem",
                  border: "1px solid #cbd5f5"
                }}
              />
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span>Last name</span>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                style={{
                  padding: "0.5rem 0.75rem",
                  borderRadius: "0.5rem",
                  border: "1px solid #cbd5f5"
                }}
              />
            </label>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: "1.5rem"
            }}
          >
            <button
              type="button"
              onClick={() => setStep(1)}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "9999px",
                border: "1px solid #cbd5f5",
                backgroundColor: "white",
                cursor: "pointer"
              }}
            >
              Back
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                // Profile is already saved incrementally via useEffect
                setStep(3);
              }}
              style={{
                padding: "0.5rem 1.25rem",
                borderRadius: "9999px",
                border: "none",
                backgroundColor: "#2563eb",
                color: "white",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              Continue
            </button>
          </div>
        </section>
      )}

      {step === 3 && (
        <section
          style={{
            padding: "1.75rem 1.5rem",
            borderRadius: "0.75rem",
            border: "1px solid rgba(148, 163, 184, 0.6)",
            backgroundColor: "white"
          }}
        >
          <h2 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>
            3. Smart Agent details
          </h2>

          {user && (
            <div style={{ marginBottom: "1rem", lineHeight: 1.5 }}>
              <p>
                Signed in as{" "}
                <strong>
                  {user.name} ({user.email})
                </strong>
                .
              </p>
              {ensAvailability.ensName && (
                <div style={{ marginTop: "0.75rem" }}>
                  <strong style={{ color: "#1e40af" }}>ENS Domain:</strong>{" "}
                  <span
                  style={{
                    fontFamily:
                        "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace",
                      color: "#1e3a8a",
                      fontSize: "0.9rem"
                  }}
                >
                    {ensAvailability.ensName}
                  </span>
                  {ensAvailability.checking ? (
                    <div style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "0.25rem" }}>
                      Checking availability...
                    </div>
                  ) : ensAvailability.available !== null ? (
                    <div
                      style={{
                        fontSize: "0.85rem",
                        color: ensAvailability.available ? "#16a34a" : "#dc2626",
                        fontWeight: 500,
                        marginTop: "0.25rem"
                      }}
                    >
                      {ensAvailability.available
                        ? "✓ Available - This ENS name is available for registration"
                        : "✗ Not Available - This ENS name is already taken"}
                    </div>
                  ) : (
                    <div style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "0.25rem" }}>
                      Unable to check availability
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {emailDomain && (
            <div
              style={{
                padding: "1rem",
                marginBottom: "1rem",
                borderRadius: "0.5rem",
                backgroundColor: "#f8fafc",
                border: "1px solid #e2e8f0"
              }}
            >
              <div style={{ marginBottom: "0.75rem", fontWeight: 600, fontSize: "0.9rem" }}>
                Agent Name Selection
              </div>
              <div style={{ marginBottom: "0.5rem", fontSize: "0.85rem", color: "#64748b" }}>
                Choose how to derive the agent name from your email domain: <strong>{emailDomain}</strong>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                  <input
                    type="radio"
                    name="domainOption"
                    checked={!useFullDomain}
                    onChange={() => setUseFullDomain(false)}
                    style={{ cursor: "pointer" }}
                  />
                  <div>
                    <div style={{ fontWeight: 500 }}>
                      Use first part only: <code style={{ backgroundColor: "#e2e8f0", padding: "0.1rem 0.3rem", borderRadius: "0.25rem" }}>{deriveAgentNameFromDomain(emailDomain, false)}</code>
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.25rem" }}>
                      Example: {emailDomain} → {emailDomain.split(".")[0]}-arn
                    </div>
                  </div>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                  <input
                    type="radio"
                    name="domainOption"
                    checked={useFullDomain}
                    onChange={() => setUseFullDomain(true)}
                    style={{ cursor: "pointer" }}
                  />
                  <div>
                    <div style={{ fontWeight: 500 }}>
                      Use full domain (dots → dashes): <code style={{ backgroundColor: "#e2e8f0", padding: "0.1rem 0.3rem", borderRadius: "0.25rem" }}>{deriveAgentNameFromDomain(emailDomain, true)}</code>
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.25rem" }}>
                      Example: {emailDomain} → {emailDomain.split(".").slice(0, -1).join("-")}-arn
                    </div>
                  </div>
                </label>
              </div>
            </div>
          )}

          {emailDomain && (
            <div
              style={{
                padding: "1rem",
                marginBottom: "1rem",
                borderRadius: "0.5rem",
                backgroundColor: "#f8fafc",
                border: "1px solid #e2e8f0"
              }}
            >
              <div style={{ marginBottom: "0.75rem", fontWeight: 600, fontSize: "0.9rem" }}>
                Custom Agent Name (Optional)
              </div>
              <div style={{ marginBottom: "0.5rem", fontSize: "0.85rem", color: "#64748b" }}>
                You can customize the agent name, or leave blank to use the suggested name above.
              </div>
              <input
                type="text"
                value={customAgentName}
                onChange={(e) => {
                  const value = e.target.value.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
                  setCustomAgentName(value);
                }}
                placeholder={deriveAgentNameFromDomain(emailDomain, useFullDomain)}
                style={{
                  width: "100%",
                  padding: "0.5rem 0.75rem",
                  borderRadius: "0.5rem",
                  border: "1px solid #cbd5f5",
                  fontSize: "0.9rem"
                }}
              />
              {customAgentName && (
                <div style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: "#64748b" }}>
                  Agent name will be: <code style={{ backgroundColor: "#e2e8f0", padding: "0.1rem 0.3rem", borderRadius: "0.25rem" }}>{customAgentName}</code>
                </div>
              )}
            </div>
          )}

          {emailDomain && (
            <div style={{ marginBottom: "1rem", padding: "0.75rem", backgroundColor: "#f0f9ff", borderRadius: "0.5rem", border: "1px solid #3b82f6" }}>
              <span style={{ fontSize: "0.9rem", color: "#1e40af" }}>
                Email domain from your login: <strong>{emailDomain}</strong>. This domain will be associated with this smart agent.
              </span>
            </div>
          )}

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: "1.5rem"
            }}
          >
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setStep(2);
              }}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "9999px",
                border: "1px solid #cbd5f5",
                backgroundColor: "white",
                cursor: "pointer"
              }}
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleOrgNext}
              disabled={isCheckingAvailability}
              style={{
                padding: "0.5rem 1.25rem",
                borderRadius: "9999px",
                border: "none",
                backgroundColor: "#2563eb",
                color: "white",
                fontWeight: 600,
                cursor: isCheckingAvailability ? "not-allowed" : "pointer",
                opacity: isCheckingAvailability ? 0.7 : 1
              }}
            >
              {isCheckingAvailability ? "Checking availability…" : "Continue"}
            </button>
          </div>
        </section>
      )}

      {step === 4 && (
        <section
          style={{
            padding: "1.75rem 1.5rem",
            borderRadius: "0.75rem",
            border: "1px solid rgba(148, 163, 184, 0.6)",
            backgroundColor: "white"
          }}
        >
          <h2 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>
            4. Smart Agent summary
          </h2>
          
          {(() => {
            // Calculate the ENS name that will be used
            const agentName = customAgentName || deriveAgentNameFromDomain(emailDomain, useFullDomain);
            const ensOrgName = "8004-agent";
            const ensName = `${agentName}.${ensOrgName}.eth`;
            
            return (
              <div
                style={{
                  padding: "1rem",
                  marginBottom: "1.5rem",
                  borderRadius: "0.5rem",
                  backgroundColor: "#f0f9ff",
                  border: "2px solid #3b82f6",
                  lineHeight: 1.6
                }}
              >
                <div style={{ marginBottom: "0.5rem" }}>
                  <strong style={{ color: "#1e40af" }}>ENS Name:</strong>{" "}
                  <span
                    style={{
                      fontFamily:
                        "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace",
                      color: "#1e3a8a",
                      fontSize: "0.95rem"
                    }}
                  >
                    {ensName}
                  </span>
                </div>
                {emailDomain && (
                  <div style={{ marginTop: "0.5rem", fontSize: "0.9rem", color: "#64748b" }}>
                    <strong>Email Domain:</strong> {emailDomain}
                  </div>
                )}
              </div>
            );
          })()}

          <p style={{ marginBottom: "1.5rem" }}>
            Is it OK to create an Agent Identity?
          </p>

          {isCheckingAgent && (
            <div
              style={{
                marginBottom: "1rem",
                padding: "0.75rem 1rem",
                borderRadius: "0.5rem",
                backgroundColor: "#f3f4f6",
                color: "#4b5563",
                fontSize: "0.9rem"
              }}
            >
              Checking for existing agent...
            </div>
          )}

          {agentExists && existingAgentName && (
            <div
              style={{
                marginBottom: "1rem",
                padding: "0.75rem 1rem",
                borderRadius: "0.5rem",
                backgroundColor: "#fef3c7",
                border: "1px solid #fbbf24",
                color: "#92400e"
              }}
            >
              <strong>Agent already exists:</strong> An ARN Identity already exists for your individual account. 
              The agent name is <strong>{existingAgentName}</strong>. You cannot create a second agent.
            </div>
          )}

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setStep(3);
              }}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "9999px",
                border: "1px solid #cbd5f5",
                backgroundColor: "white",
                cursor: "pointer"
              }}
            >
              Go back
            </button>
            <button
              type="button"
              onClick={handleCreateArn}
              disabled={isCreatingArn || agentExists || isCheckingAgent}
              style={{
                padding: "0.5rem 1.25rem",
                borderRadius: "9999px",
                border: "none",
                backgroundColor: agentExists || isCheckingAgent ? "#9ca3af" : "#16a34a",
                color: "white",
                fontWeight: 600,
                cursor: agentExists || isCreatingArn || isCheckingAgent ? "not-allowed" : "pointer",
                opacity: agentExists || isCreatingArn || isCheckingAgent ? 0.7 : 1
              }}
            >
              {isCreatingArn 
                ? "Creating Agent Identity…" 
                : isCheckingAgent 
                  ? "Checking for existing agent…" 
                  : "Yes, create Agent Identity"}
            </button>
          </div>

          {emailDomain && (
            <p
              style={{
                marginTop: "1rem",
                fontSize: "0.85rem",
                color: "#4b5563"
              }}
            >
              If this email domain is not associated with the agent,
              you can{" "}
              <button
                type="button"
                onClick={handleDisconnectAndReset}
                style={{
                  padding: 0,
                  border: "none",
                  background: "none",
                  color: "#2563eb",
                  cursor: "pointer",
                  textDecoration: "underline",
                  fontSize: "0.85rem"
                }}
              >
                disconnect and sign in with a different account
              </button>{" "}
              before creating the Agent Identity.
            </p>
          )}
        </section>
      )}

      {step === 5 && arn && (
        <section
          style={{
            padding: "1.75rem 1.5rem",
            borderRadius: "0.75rem",
            border: "1px solid rgba(34, 197, 94, 0.7)",
            background:
              "linear-gradient(to bottom right, rgba(22,163,74,0.08), rgba(22,163,74,0.02))"
          }}
        >
          <h2 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>
            5. Your Smart Agent Identity
          </h2>

          <p style={{ marginBottom: "1rem", lineHeight: 1.5 }}>
            The smart agent identity for{" "}
            <strong>your smart agent</strong> has been
            created with the Agentic Trust Protocol.
          </p>

          <div
            style={{
              padding: "0.85rem 1rem",
              borderRadius: "0.5rem",
              backgroundColor: "white",
              border: "1px dashed rgba(34, 197, 94, 0.7)",
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, monospace"
            }}
          >
            {arn}
          </div>

          <p style={{ marginTop: "1.25rem", marginBottom: "1.25rem" }}>
            Next, you&apos;ll be able to manage your smart agent accounts, identities,
            and applications using the Agentic Trust Protocol.
          </p>

          <button
            type="button"
            onClick={goToAppEnvironment}
            style={{
              padding: "0.6rem 1.35rem",
              borderRadius: "9999px",
              border: "none",
              backgroundColor: "#2563eb",
              color: "white",
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            Go to application environment
          </button>
        </section>
      )}
    </main>
    </>
  );
}


