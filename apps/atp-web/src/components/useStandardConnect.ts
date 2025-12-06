"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import * as React from "react";
import { sepolia } from "viem/chains";
import { useWeb3Auth } from "./Web3AuthProvider";
import { useConnection } from "./connection-context";
import { AccountService } from "../app/service/accountService";
import { saveUserProfile, associateUserWithAgent, getUserAgents } from "../app/service/userProfileService";
import { useDefaultOrgAgent, type DefaultOrgAgent } from "./useDefaultOrgAgent";
import { OrgAgentSelector } from "./OrgAgentSelector";

/**
 * Standard connection flow that:
 * 1. Connects via Web3Auth
 * 2. Gets user info and sets connection state
 * 3. Gets wallet address (EOA)
 * 4. Gets individual AA account address
 * 5. Checks if agent exists for the individual AA account
 * 6. Redirects to /dashboard if agent exists, otherwise continues normal flow
 */
export function useStandardConnect() {
  const router = useRouter();
  const { web3auth, connect, getUserInfo } = useWeb3Auth();
  const { setUser, user } = useConnection();
  const { setDefaultOrgAgent } = useDefaultOrgAgent();
  const [showOrgSelector, setShowOrgSelector] = useState(false);
  const [availableOrgs, setAvailableOrgs] = useState<any[]>([]);
  const [pendingAccountAaAddress, setPendingAccountAaAddress] = useState<string | null>(null);

  // Helper function to set agent from agent association
  // This updates the user profile and can optionally set the default agent
  // If skipSetDefaultAgent is true, it won't call setDefaultOrgAgent (useful when already set)
  const setAgentFromOrg = useCallback(async (
    agentItem: any,
    email: string,
    accountAaAddress: string | null,
    account: string,
    skipSetDefaultAgent: boolean = false
  ) => {
    try {
      // Update user profile with addresses
      await saveUserProfile({
        email,
        eoa_address: account,
        aa_address: accountAaAddress || null,
      });

      // Only fetch and set agent if not skipping
      if (!skipSetDefaultAgent) {
        // Fetch full agent information
        const ensName = agentItem.ens_name;
        const didEns = `did:ens:${sepolia.id}:${ensName}`;
        const encodedDidEns = encodeURIComponent(didEns);
        const ensResponse = await fetch(`/api/names/${encodedDidEns}`);
        
        if (ensResponse.ok) {
          const ensResult = await ensResponse.json();
          if (ensResult?.nameInfo) {
            const agentAccount = ensResult.nameInfo?.account;
            if (agentAccount && typeof agentAccount === "string" && agentAccount.startsWith("0x")) {
              const didEthr = `did:ethr:${sepolia.id}:${agentAccount}`;
              const encodedDid = encodeURIComponent(didEthr);
              const agentResponse = await fetch(`/api/agents/by-account/${encodedDid}`);
              
              if (agentResponse.ok) {
                const agentResult = await agentResponse.json();
                if (agentResult?.found === true) {
                  const { found, ...agentData } = agentResult;
                  const defaultAgent: DefaultOrgAgent = {
                    ensName,
                    agentName: agentItem.agent_name,
                    agentAccount,
                    agentId: agentData.agentId,
                    chainId: sepolia.id,
                    name: agentData.name,
                    description: agentData.description,
                    image: agentData.image,
                    agentUrl: agentData.agentUrl,
                    tokenUri: agentData.tokenUri,
                    metadata: agentData.metadata,
                    did: agentData.did,
                    a2aEndpoint: agentData.a2aEndpoint,
                    ...agentData,
                  };

                  setDefaultOrgAgent(defaultAgent, email);
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.warn("Failed to set agent from agent association:", error);
      // Only set basic info if not skipping and full fetch failed
      if (!skipSetDefaultAgent) {
        setDefaultOrgAgent({
          ensName: agentItem.ens_name,
          agentName: agentItem.agent_name,
          agentAccount: agentItem.agent_account || "",
          chainId: agentItem.chain_id || sepolia.id,
        }, email);
      }
    }
  }, [setDefaultOrgAgent]);

  const handleStandardConnect = useCallback(async () => {
    if (!web3auth) {
      throw new Error("Web3Auth not initialized");
    }

    // Step 1: Connect via Web3Auth
    await connect();

    // Step 2: Get user info and set connection state
    const userInfo = await getUserInfo();
    const resolvedName = userInfo?.name ?? "Unknown user";
    const resolvedEmail = userInfo?.email ?? "unknown@example.com";

    setUser({
      name: resolvedName,
      email: resolvedEmail
    });

    // Save user profile to database (async, don't wait)
    try {
      await saveUserProfile({
        email: resolvedEmail,
        social_account_id: userInfo?.verifierId || userInfo?.id || null,
        social_account_type: userInfo?.typeOfLogin || null,
        eoa_address: null, // Will be set after we get the account
        aa_address: null, // Will be set after we get the AA address
      });
    } catch (error) {
      console.warn("Failed to save user profile:", error);
      // Continue even if profile save fails
    }

    // Step 3: Get wallet address
    const provider = (web3auth as any)?.provider as
      | { request: (args: { method: string; params?: any[] }) => Promise<any> }
      | undefined;

    if (!provider) {
      throw new Error("Provider not available after connection");
    }

    const accounts = await provider.request({
      method: "eth_accounts"
    });
    const account = Array.isArray(accounts) && accounts[0];

    if (!account || typeof account !== "string") {
      throw new Error("Could not determine wallet address");
    }

    // Update user profile with EOA address immediately
    try {
      await saveUserProfile({
        email: resolvedEmail,
        eoa_address: account,
      });
    } catch (error) {
      console.warn("Failed to update user profile with EOA address:", error);
    }

    // Step 4: Get individual AA account address
    let accountAaAddress: string | null = null;
    try {
      const accountClient = await AccountService.getCounterfactualAccountClientByAccount(
        account as `0x${string}`,
        { ethereumProvider: provider }
      );
      
      if (accountClient && typeof accountClient.getAddress === "function") {
        const addr = await accountClient.getAddress();
        if (addr && typeof addr === "string") {
          accountAaAddress = addr;
          // Update user profile with AA address immediately
          try {
            await saveUserProfile({
              email: resolvedEmail,
              eoa_address: account,
              aa_address: addr,
            });
          } catch (error) {
            console.warn("Failed to update user profile with AA address:", error);
          }
        }
      }
    } catch (aaError) {
      console.warn("Failed to get individual AA account address:", aaError);
      // Continue with normal flow if AA account creation fails
    }

    // Step 5: Check for all agents associated with this user's email
    // If multiple exist, show selector. If one exists, use it. If none, continue onboarding.
    const email = resolvedEmail;
    if (email && email.includes("@")) {
      try {
        // First, get all agents for this user
        const userAgents = await getUserAgents(email);
        console.info("[useStandardConnect] Found agents for user:", userAgents.length);

        if (userAgents.length > 0) {
          // One or more agents - show selector to let user choose
          console.info("[useStandardConnect] Found", userAgents.length, "agent(s), showing selector");
          setAvailableOrgs(userAgents);
          setPendingAccountAaAddress(accountAaAddress);
          setShowOrgSelector(true);
          return { hasAgent: true, account, accountAaAddress, needsSelection: true };
        }
        // If no orgs found, continue with email domain check below

        // Legacy: Check if agent exists based on email domain ENS name
        // This handles the case where user hasn't been associated with agent yet
        const emailDomain = email.split("@")[1]?.toLowerCase();
        if (emailDomain) {
          // Calculate the ENS name that would be used for this agent
          const domainParts = emailDomain.split(".");
          const domainBase =
            domainParts.length > 1
              ? domainParts.slice(0, -1).join("-")
              : domainParts[0];
          const agentName = `${domainBase}-arn`;
          const ensOrgName = "8004-agent";
          const ensName = `${agentName}.${ensOrgName}.eth`;
          const didEns = `did:ens:${sepolia.id}:${ensName}`;

          // Check ENS availability - if NOT available, agent exists

          console.info(" @@@@@@@@@@@@ src/components  did ens check: ", didEns);
          
          const encodedDidEns = encodeURIComponent(didEns);
          const ensCheckResponse = await fetch(`/api/names/${encodedDidEns}/is-available`);
          console.info(" @@@@@@@@@@@@ ens check response: ", ensCheckResponse);

          if (ensCheckResponse.ok) {
            const ensResult = await ensCheckResponse.json();

            // If ENS is NOT available, it means the agent already exists
            if (ensResult.available === false) {
              console.info(" @@@@@@@@@@@@ ENS not available - agent exists **********");

              console.info(" @@@@@@@@@@@@ ens org already exists **********: ", ensResult);
              // Update user profile with EOA and AA addresses
              try {
                await saveUserProfile({
                  email: resolvedEmail,
                  eoa_address: account,
                  aa_address: accountAaAddress || null,
                });
              } catch (error) {
                console.warn("Failed to update user profile with addresses:", error);
              }

              // Associate user with agent (async, don't wait)
              try {
                await associateUserWithAgent(resolvedEmail, {
                  ens_name: ensName,
                  agent_name: agentName,
                  email_domain: emailDomain,
                  is_primary: true, // This is the primary agent based on email domain
                });
              } catch (error) {
                console.warn("Failed to associate user with agent:", error);
              }

              // Fetch full agent information and set as default org agent
              try {
                // Get agent account from ENS info first
                const didEns = `did:ens:${sepolia.id}:${ensName}`;
                const encodedDidEns = encodeURIComponent(didEns);
                const ensResponse = await fetch(`/api/names/${encodedDidEns}`);
                console.info(" ********** ens response: ", ensResponse);
                
                if (ensResponse.ok) {
                  const ensResult = await ensResponse.json();
                  console.info(" ********** ens result: ", ensResult);
                  if (ensResult?.nameInfo) {
                    const agentAccount = ensResult.nameInfo?.account;
                    console.info(" ********** agent account: ", agentAccount);
                    if (agentAccount && typeof agentAccount === "string" && agentAccount.startsWith("0x")) {
                      // Get full agent details using the agent account
                      const didEthr = `did:ethr:${sepolia.id}:${agentAccount}`;
                      const encodedDid = encodeURIComponent(didEthr);
                      const agentResponse = await fetch(`/api/agents/by-account/${encodedDid}`);
                      console.info(" ********** agent response by account: ", agentResponse);
                      if (agentResponse.ok) {
                        console.info(" ********** agent response ok **********");
                        const agentResult = await agentResponse.json();
                        console.info(" ********** agent result: ", agentResult);
                        if (agentResult?.found === true) {
                          const { found, ...agentData } = agentResult;
                          const defaultAgent: DefaultOrgAgent = {
                            ensName,
                            agentName,
                            agentAccount,
                            agentId: agentData.agentId,
                            chainId: sepolia.id,
                            name: agentData.name,
                            description: agentData.description,
                            image: agentData.image,
                            agentUrl: agentData.agentUrl,
                            tokenUri: agentData.tokenUri,
                            metadata: agentData.metadata,
                            did: agentData.did,
                            a2aEndpoint: agentData.a2aEndpoint,
                            ...agentData,
                          };

                          console.info(" ********** default agent a2a endpoint: ", defaultAgent.a2aEndpoint);


                          // Pass email directly to ensure localStorage is saved even if user context isn't ready
                          console.info("[useStandardConnect] Setting default org agent with email:", resolvedEmail);
                          setDefaultOrgAgent(defaultAgent, resolvedEmail);
                          console.info("[useStandardConnect] Default org agent set, DID:", defaultAgent.did);

                          // Long-term cache of full agent details by DID, so
                          // /dashboard can reuse them without re-fetching.
                          try {
                            if (defaultAgent.did && typeof window !== "undefined") {
                              const did = defaultAgent.did;
                              console.info("[useStandardConnect] Fetching agent details for caching, DID:", did);
                              const resp = await fetch(
                                `/api/agents/token-uri?did=${encodeURIComponent(did)}`
                              );
                              if (resp.ok) {
                                const data = await resp.json();
                                localStorage.setItem(
                                  `arn_agent_details_${did}`,
                                  JSON.stringify(data)
                                );
                                console.info("[useStandardConnect] Agent details cached successfully");
                              } else {
                                console.warn("[useStandardConnect] Failed to fetch agent details for caching, status:", resp.status);
                              }
                            } else {
                              console.warn("[useStandardConnect] Cannot cache agent details: DID is missing or window is undefined");
                            }
                          } catch (cacheError) {
                            console.warn(
                              "[useStandardConnect] Failed to pre-cache agent details:",
                              cacheError
                            );
                          }

                          // Verify localStorage was saved
                          try {
                            const stored = localStorage.getItem("arn_default_org_agent");
                            if (stored) {
                              console.info("[useStandardConnect] Verified: default org agent saved to localStorage");
                            } else {
                              console.error("[useStandardConnect] ERROR: default org agent NOT saved to localStorage!");
                            }
                          } catch (verifyError) {
                            console.warn("[useStandardConnect] Failed to verify localStorage:", verifyError);
                          }

                          // Ensure context + cache are updated before navigating
                          // Use a small delay to ensure React state and localStorage are fully updated
                          await new Promise((resolve) => setTimeout(resolve, 100));
                        }
                      }
                    }
                  }
                }
              } catch (agentFetchError) {
                console.warn("Failed to fetch full agent information:", agentFetchError);
                // Still set basic info even if full fetch fails
                setDefaultOrgAgent({
                  ensName,
                  agentName,
                  agentAccount: "",
                  chainId: sepolia.id,
                }, resolvedEmail);
              }

              // Agent exists - show selector instead of auto-redirecting
              // This allows user to see and select their agent during onboarding
              console.info(" ********** agent exists, showing selector **********");
              
              // Create an agent association object from the ENS check result
              const agentAssociation = {
                ens_name: ensName,
                agent_name: agentName,
                email_domain: emailDomain,
                agent_account: null as string | null,
                chain_id: sepolia.id,
                is_primary: true,
                role: null as string | null,
              };
              
              // Try to get agent account from ENS info
              try {
                const didEns = `did:ens:${sepolia.id}:${ensName}`;
                const encodedDidEns = encodeURIComponent(didEns);
                const ensResponse = await fetch(`/api/names/${encodedDidEns}`);
                if (ensResponse.ok) {
                  const ensResult = await ensResponse.json();
                  if (ensResult?.nameInfo?.account) {
                    agentAssociation.agent_account = ensResult.nameInfo.account;
                  }
                }
              } catch (err) {
                console.warn("Failed to get agent account from ENS:", err);
              }
              
              // Show selector with this agent
              setAvailableOrgs([agentAssociation]);
              setPendingAccountAaAddress(accountAaAddress);
              setShowOrgSelector(true);
              return { hasAgent: true, account, accountAaAddress, needsSelection: true };
            } else {
              console.info(" ********** ENS is available **********");
            }
          } else {
            console.warn(" ********** ENS check response not ok: ", ensCheckResponse.status);
          }
        }
      } catch (ensCheckError) {
        console.warn("Failed to check ENS availability for agent:", ensCheckError);
        // Continue with normal flow if check fails
      }
    }

    console.info(" ********** updating user profile **********");
    try {
      await saveUserProfile({
        email: resolvedEmail,
        eoa_address: account,
        aa_address: accountAaAddress || null,
      });
      console.info(" ********** user profile updated **********");
    } catch (error) {
      console.warn("Failed to update user profile with addresses:", error);
    }

    // No agent found - continue with normal flow
    console.info(" ********** no agent found - returning hasAgent: false **********");
    return { hasAgent: false, account, accountAaAddress };
  }, [web3auth, connect, getUserInfo, setUser, router, setDefaultOrgAgent, setAgentFromOrg]);

  // Handle org selection
  const handleOrgSelect = useCallback(async (agent: DefaultOrgAgent) => {
    setShowOrgSelector(false);
    
    // Find the selected agent from availableOrgs
    const selectedAgent = availableOrgs.find(agentItem => 
      agentItem.ens_name === agent.ensName || agentItem.agent_name === agent.agentName
    );
    
    if (!selectedAgent) {
      console.error("[useStandardConnect] Selected agent not found in availableOrgs");
      return;
    }

    // Get user email from connection context (should be set during connect)
    const email = user?.email || "unknown@example.com";
    
    // Get account address if we have it stored
    let account = "";
    try {
      const provider = (web3auth as any)?.provider as
        | { request: (args: { method: string; params?: any[] }) => Promise<any> }
        | undefined;
      if (provider) {
        const accounts = await provider.request({ method: "eth_accounts" });
        account = Array.isArray(accounts) && accounts[0] ? accounts[0] : "";
      }
    } catch (err) {
      console.warn("[useStandardConnect] Failed to get account:", err);
    }
    
    // Fetch full agent details before setting as default
    // This ensures we have all required fields (agentId, did, etc.)
    let fullAgent: DefaultOrgAgent = agent;
    
    try {
      // First, try to get agent account from ENS if not available in selectedAgent
      let agentAccount = selectedAgent.agent_account;
      
      if (!agentAccount && selectedAgent.ens_name) {
        // Fetch agent account from ENS name
        const didEns = `did:ens:${sepolia.id}:${selectedAgent.ens_name}`;
        const encodedDidEns = encodeURIComponent(didEns);
        const ensResponse = await fetch(`/api/names/${encodedDidEns}`);
        
        if (ensResponse.ok) {
          const ensResult = await ensResponse.json();
          if (ensResult?.nameInfo?.account) {
            agentAccount = ensResult.nameInfo.account;
            console.info("[useStandardConnect] Fetched agent account from ENS:", agentAccount);
          }
        }
      }
      
      // Now fetch full agent details using the agent account
      if (agentAccount && typeof agentAccount === "string" && agentAccount.startsWith("0x")) {
        const didEthr = `did:ethr:${sepolia.id}:${agentAccount}`;
        const encodedDid = encodeURIComponent(didEthr);
        const agentResponse = await fetch(`/api/agents/by-account/${encodedDid}`);
        
        if (agentResponse.ok) {
          const agentResult = await agentResponse.json();
          if (agentResult?.found === true) {
            const { found, ...agentData } = agentResult;
            // Merge the full agent data with the basic agent info
            fullAgent = {
              ...agent,
              agentAccount: agentData.agentAccount || agentAccount || agent.agentAccount || "",
              agentId: agentData.agentId,
              chainId: agentData.chainId || agent.chainId,
              name: agentData.name || agent.name,
              description: agentData.description,
              image: agentData.image,
              agentUrl: agentData.agentUrl,
              tokenUri: agentData.tokenUri,
              metadata: agentData.metadata,
              did: agentData.did,
              a2aEndpoint: agentData.a2aEndpoint,
              ...agentData,
            };
            console.info("[useStandardConnect] Fetched full agent details:", {
              agentName: fullAgent.agentName || fullAgent.ensName,
              agentAccount: fullAgent.agentAccount,
              agentId: fullAgent.agentId,
              did: fullAgent.did,
            });
          } else {
            console.warn("[useStandardConnect] Agent not found by account, using basic info");
          }
        } else {
          console.warn("[useStandardConnect] Failed to fetch agent by account, status:", agentResponse.status);
        }
      } else {
        console.warn("[useStandardConnect] No valid agent account available, using basic info");
      }
    } catch (err) {
      console.warn("[useStandardConnect] Failed to fetch full agent details, using basic info:", err);
    }
    
    // Ensure agentAccount is set - it's required for the dashboard
    if (!fullAgent.agentAccount && fullAgent.ensName) {
      console.warn("[useStandardConnect] agentAccount is missing, attempting to fetch from ENS");
      try {
        const didEns = `did:ens:${sepolia.id}:${fullAgent.ensName}`;
        const encodedDidEns = encodeURIComponent(didEns);
        const ensResponse = await fetch(`/api/names/${encodedDidEns}`);
        
        if (ensResponse.ok) {
          const ensResult = await ensResponse.json();
          if (ensResult?.nameInfo?.account) {
            fullAgent.agentAccount = ensResult.nameInfo.account;
            console.info("[useStandardConnect] Set agentAccount from ENS:", fullAgent.agentAccount);
          }
        }
      } catch (err) {
        console.warn("[useStandardConnect] Failed to fetch agentAccount from ENS:", err);
      }
    }
    
    // Validate that we have at least agentAccount or ensName before setting
    if (!fullAgent.agentAccount && !fullAgent.ensName) {
      console.error("[useStandardConnect] Cannot set default agent: missing both agentAccount and ensName");
      return;
    }
    
    // Set the selected agent as default (with full details if available)
    // Do this BEFORE setAgentFromOrg so the full details are set
    console.info("[useStandardConnect] Setting default agent:", {
      agentName: fullAgent.agentName,
      ensName: fullAgent.ensName,
      agentAccount: fullAgent.agentAccount,
      agentId: fullAgent.agentId,
      did: fullAgent.did,
    });
    setDefaultOrgAgent(fullAgent, email);
    
    // Update user profile (skip setting default agent since we already set it above)
    if (pendingAccountAaAddress) {
      await setAgentFromOrg(selectedAgent, email, pendingAccountAaAddress, account, true);
    }
    
    // Wait a moment to ensure state and localStorage are fully updated before navigating
    // This ensures the dashboard will have the default agent available when it loads
    await new Promise((resolve) => setTimeout(resolve, 100));
    
    // Verify the agent was saved to localStorage before navigating
    try {
      const stored = localStorage.getItem("arn_default_org_agent");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.agent) {
          console.info("[useStandardConnect] Verified default agent saved before navigation:", parsed.agent.agentName || parsed.agent.ensName);
          console.info("[useStandardConnect] Agent has agentAccount:", !!parsed.agent.agentAccount, parsed.agent.agentAccount);
          console.info("[useStandardConnect] Agent has ensName:", !!parsed.agent.ensName, parsed.agent.ensName);
          console.info("[useStandardConnect] Agent has agentId:", !!parsed.agent.agentId, parsed.agent.agentId);
          
          // If agentAccount is still missing, wait and try one more time
          if (!parsed.agent.agentAccount && parsed.agent.ensName) {
            console.warn("[useStandardConnect] agentAccount still missing after save, waiting longer...");
            await new Promise((resolve) => setTimeout(resolve, 300));
          }
        } else {
          console.warn("[useStandardConnect] Agent not found in localStorage after setting, waiting longer...");
          await new Promise((resolve) => setTimeout(resolve, 200));
        }
      } else {
        console.warn("[useStandardConnect] localStorage not updated yet, waiting...");
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    } catch (err) {
      console.warn("[useStandardConnect] Failed to verify localStorage:", err);
    }
    
    // Navigate to dashboard
    router.push("/dashboard");
  }, [pendingAccountAaAddress, availableOrgs, router, setDefaultOrgAgent, setAgentFromOrg, web3auth, user]);

  return { 
    handleStandardConnect,
    showOrgSelector,
    availableOrgs,
    handleOrgSelect,
    onCancelOrgSelect: () => setShowOrgSelector(false),
  };
}

