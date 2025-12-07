"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardContent,
  CardActions,
  Container,
  Grid,
  Link as MUILink,
  Typography,
  Chip,
  Stack,
  Divider
} from "@mui/material";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import GroupsIcon from "@mui/icons-material/Groups";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import NetworkCheckIcon from "@mui/icons-material/NetworkCheck";
import { useConnection } from "../components/connection-context";

export default function HomePage() {
  const router = useRouter();
  const { user } = useConnection();

  const paths = [
    {
      title: "Agent Developer",
      icon: <RocketLaunchIcon sx={{ fontSize: 40 }} />,
      description: "Create and launch AI agents before writing a single line of code. Compress your idea-to-validation cycle from 60 days to 60 minutes.",
      features: [
        "One-click agent registration with ERC-8004",
        "Build trust through validation and alliances",
        "Gamified reputation system",
        "Rich vertical ontologies for discovery"
      ],
      cta: "Create Your Agent",
      href: "/onboarding",
      color: "primary"
    },
    {
      title: "Alliance Community Builder",
      icon: <GroupsIcon sx={{ fontSize: 40 }} />,
      description: "Build trust networks by connecting agents. Form strategic alliances, create collaboration opportunities, and drive ecosystem growth.",
      features: [
        "Form strategic agent alliances",
        "Build trust networks",
        "Enable cross-vertical collaboration",
        "Create network effects"
      ],
      cta: "Explore Alliances",
      href: "/agents",
      color: "secondary"
    },
    {
      title: "Vertical Industry Validator",
      icon: <VerifiedUserIcon sx={{ fontSize: 40 }} />,
      description: "Become a specialized validator for your industry. Verify agent capabilities, earn rewards, and build reputation as a trusted validator.",
      features: [
        "Join vertical validator pools",
        "Earn staking rewards",
        "Build validator reputation",
        "Access enterprise opportunities"
      ],
      cta: "Become a Validator",
      href: "/agents",
      color: "success"
    }
  ];

  const benefits = [
    {
      icon: <TrendingUpIcon />,
      title: "First-Mover Advantage",
      description: "ERC-8004 registries are essentially empty. Get in early and establish your position in the agentic web."
    },
    {
      icon: <NetworkCheckIcon />,
      title: "Trust Graphs",
      description: "Visualize agent trust networks with on-chain validation data. Build reputation that matters."
    },
    {
      icon: <AutoAwesomeIcon />,
      title: "Gamification",
      description: "Earn milestones, accomplishments, and reputation. Turn agent building into an engaging journey."
    }
  ];

  return (
    <main>
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Box sx={{ mb: 4 }}>
          <Breadcrumbs aria-label="breadcrumb" sx={{ fontSize: 12, mb: 3 }}>
            <Typography color="text.secondary">Home</Typography>
          </Breadcrumbs>

          {/* Hero Section */}
          <Box sx={{ mb: 6, textAlign: { xs: "left", md: "center" } }}>
            <Chip 
              label="December 2025 - First Mover Advantage" 
              color="primary" 
              sx={{ mb: 2 }}
            />
            <Typography
              variant="h2"
              component="h1"
              sx={{ 
                mb: 2, 
                fontWeight: 700,
                fontSize: { xs: "2rem", md: "3rem" },
                lineHeight: 1.2
              }}
            >
              Build the Agentic Web
            </Typography>
            <Typography
              variant="h5"
              component="p"
              sx={{ 
                mb: 3, 
                color: "text.secondary",
                maxWidth: "800px",
                mx: "auto",
                fontWeight: 400,
                lineHeight: 1.6
              }}
            >
              The premier platform for creating, managing, and discovering AI agents. 
              Transform your agent ideas into trusted, validated agents in minutes, not months.
            </Typography>
            <Typography
              variant="body1"
              sx={{ 
                mb: 4, 
                color: "text.secondary",
                maxWidth: "700px",
                mx: "auto",
                lineHeight: 1.7
              }}
            >
              Join innovators, entrepreneurs, and builders who are shaping the future of the agentic web. 
              Create agents, build alliances, become a validator—all powered by ERC-8004 and trust graphs.
            </Typography>
            <Stack 
              direction={{ xs: "column", sm: "row" }} 
              spacing={2} 
              justifyContent="center"
              sx={{ mb: 4 }}
            >
              <Button
                component={Link}
                href="/onboarding"
                variant="contained"
                color="primary"
                size="large"
                startIcon={<RocketLaunchIcon />}
                sx={{ borderRadius: 2, px: 4, py: 1.5 }}
              >
                Create Your Agent
              </Button>
              <Button
                component={Link}
                href="/agents"
                variant="outlined"
                color="primary"
                size="large"
                sx={{ borderRadius: 2, px: 4, py: 1.5 }}
              >
                Explore Agents
              </Button>
            </Stack>
          </Box>

          {/* Three Paths Section */}
          <Box sx={{ mb: 6 }}>
            <Typography
              variant="h4"
              component="h2"
              sx={{ mb: 1, fontWeight: 600, textAlign: "center" }}
            >
              Choose Your Path
            </Typography>
            <Typography
              variant="body1"
              sx={{ mb: 4, color: "text.secondary", textAlign: "center", maxWidth: "600px", mx: "auto" }}
            >
              Whether you're an innovator, entrepreneur, or industry expert, there's a path for you in the agentic web.
            </Typography>
            <Grid container spacing={3}>
              {paths.map((path, index) => (
                <Grid item xs={12} md={4} key={index}>
                  <Card
                    variant="outlined"
                    sx={{
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      borderLeftWidth: 4,
                      borderLeftColor: `${path.color}.main`,
                      transition: "all 0.3s ease",
                      "&:hover": {
                        boxShadow: 6,
                        transform: "translateY(-4px)"
                      }
                    }}
                  >
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ mb: 2, color: `${path.color}.main` }}>
                        {path.icon}
                      </Box>
                      <Typography
                        variant="h5"
                        component="h3"
                        sx={{ mb: 1.5, fontWeight: 600 }}
                      >
                        {path.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ mb: 2, color: "text.secondary", lineHeight: 1.7 }}
                      >
                        {path.description}
                      </Typography>
                      <Box component="ul" sx={{ pl: 2, mb: 0 }}>
                        {path.features.map((feature, idx) => (
                          <Typography
                            key={idx}
                            component="li"
                            variant="body2"
                            sx={{ mb: 1, color: "text.secondary" }}
                          >
                            {feature}
                          </Typography>
                        ))}
                      </Box>
                    </CardContent>
                    <CardActions sx={{ px: 2, pb: 2 }}>
                      <Button
                        component={Link}
                        href={path.href}
                        variant="contained"
                        color={path.color as any}
                        fullWidth
                        sx={{ borderRadius: 2 }}
                      >
                        {path.cta}
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>

          <Divider sx={{ my: 6 }} />

          {/* Benefits Section */}
          <Box sx={{ mb: 6 }}>
            <Typography
              variant="h4"
              component="h2"
              sx={{ mb: 1, fontWeight: 600, textAlign: "center" }}
            >
              Why ATP Matters Now
            </Typography>
            <Typography
              variant="body1"
              sx={{ mb: 4, color: "text.secondary", textAlign: "center", maxWidth: "600px", mx: "auto" }}
            >
              December 2025 is the perfect time to join the agentic web. Here's why:
            </Typography>
            <Grid container spacing={3}>
              {benefits.map((benefit, index) => (
                <Grid item xs={12} md={4} key={index}>
                  <Card variant="outlined" sx={{ height: "100%", p: 3 }}>
                    <Box sx={{ mb: 2, color: "primary.main" }}>
                      {benefit.icon}
                    </Box>
                    <Typography
                      variant="h6"
                      component="h3"
                      sx={{ mb: 1, fontWeight: 600 }}
                    >
                      {benefit.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: "text.secondary", lineHeight: 1.7 }}
                    >
                      {benefit.description}
                    </Typography>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>

          <Divider sx={{ my: 6 }} />

          {/* Key Features Section */}
          <Box>
            <Typography
              variant="h4"
              component="h2"
              sx={{ mb: 4, fontWeight: 600, textAlign: "center" }}
            >
              Platform Features
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ p: 3, height: "100%" }}>
                  <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                    Trust Graphs
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
                    Visualize agent trust networks with on-chain validators on the left, 
                    client reviewers on the right, and real reputation scores.
                  </Typography>
                  <MUILink
                    component={Link}
                    href="/agents"
                    variant="body2"
                    color="primary"
                    underline="hover"
                  >
                    Explore Trust Graphs →
                  </MUILink>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ p: 3, height: "100%" }}>
                  <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                    Agent Alliances
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
                    Form strategic partnerships with other agents. Build trust networks 
                    that create opportunities and drive ecosystem growth.
                  </Typography>
                  <MUILink
                    component={Link}
                    href="/agents"
                    variant="body2"
                    color="primary"
                    underline="hover"
                  >
                    Learn About Alliances →
                  </MUILink>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ p: 3, height: "100%" }}>
                  <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                    Vertical Validators
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
                    Join specialized validator pools for your industry. Verify agent 
                    capabilities, earn rewards, and build validator reputation.
                  </Typography>
                  <MUILink
                    component={Link}
                    href="/agents"
                    variant="body2"
                    color="primary"
                    underline="hover"
                  >
                    Become a Validator →
                  </MUILink>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ p: 3, height: "100%" }}>
                  <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                    Gamification & Reputation
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
                    Earn milestones, accomplishments, and badges. Build reputation through 
                    validations, alliances, and reviews. Climb leaderboards.
                  </Typography>
                  <MUILink
                    component={Link}
                    href="/dashboard"
                    variant="body2"
                    color="primary"
                    underline="hover"
                  >
                    View Your Reputation →
                  </MUILink>
                </Card>
              </Grid>
            </Grid>
          </Box>

          {/* CTA Section */}
          <Box
            sx={{
              mt: 6,
              p: 4,
              borderRadius: 2,
              bgcolor: "primary.main",
              color: "primary.contrastText",
              textAlign: "center"
            }}
          >
            <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
              Ready to Build the Agentic Web?
            </Typography>
            <Typography variant="body1" sx={{ mb: 3, opacity: 0.9 }}>
              Join innovators, entrepreneurs, and builders who are shaping the future of AI agents.
            </Typography>
            <Button
              component={Link}
              href="/onboarding"
              variant="contained"
              color="inherit"
              size="large"
              startIcon={<RocketLaunchIcon />}
              sx={{ 
                borderRadius: 2, 
                px: 4, 
                py: 1.5,
                bgcolor: "background.paper",
                color: "primary.main",
                "&:hover": {
                  bgcolor: "background.paper",
                  opacity: 0.9
                }
              }}
            >
              Get Started Now
            </Button>
          </Box>
        </Box>
      </Container>
    </main>
  );
}
