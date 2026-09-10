// The /admin screen: login gate, page list, page editor.
//
// This route is deliberately kept out of the public app's chunk graph (it is
// lazy-loaded from App.jsx) and out of the crawl: it is listed in prerender.mjs's
// EXCLUDE set and disallowed in robots.txt, the same way /uk/addblog is.
//
// It is a tool, not a page — no Navbar, no Footer, no SEO tags. useFullSEO is
// never called here, so it cannot accidentally emit an indexable <title>.
import React, { useEffect, useState } from "react";
import {
  Box, Container, Stack, TextField, Button, Typography, Alert, Paper, AppBar,
  Toolbar, CircularProgress, Tabs, Tab,
} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import PageList from "./PageList";
import PageEditor from "./PageEditor";
import ContentDashboard from "./content/ContentDashboard";
import StateDataSection from "./content/StateDataSection";
import VerificationSection from "./content/VerificationSection";
import { login, getToken, clearToken, AuthError } from "./api";

function LoginScreen({ onSignedIn }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(password);
      onSignedIn();
    } catch (err) {
      setError(err.message);
      setPassword("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Container maxWidth="xs" sx={{ py: 10 }}>
      <Paper variant="outlined" sx={{ p: 4 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>Milta CMS</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Sign in to edit page content.
        </Typography>

        <form onSubmit={submit}>
          <Stack spacing={2}>
            <TextField
              type="password"
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              autoFocus
              fullWidth
              size="small"
            />
            {error && <Alert severity="error">{error}</Alert>}
            <Button type="submit" variant="contained" disabled={busy || !password}>
              {busy ? "Signing in…" : "Sign in"}
            </Button>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}

export default function AdminApp() {
  const [signedIn, setSignedIn] = useState(() => !!getToken());
  const [openId, setOpenId] = useState(null);
  const [tab, setTab] = useState("content");
  const [checking, setChecking] = useState(true);

  useEffect(() => { setChecking(false); }, []);

  // A token can expire while the tab sits open. Catching it here means the user
  // gets the login screen rather than a wall of failed requests.
  useEffect(() => {
    const onUnauthorised = (e) => {
      if (e.reason instanceof AuthError) {
        setSignedIn(false);
        setOpenId(null);
      }
    };
    window.addEventListener("unhandledrejection", onUnauthorised);
    return () => window.removeEventListener("unhandledrejection", onUnauthorised);
  }, []);

  const signOut = () => {
    clearToken();
    setOpenId(null);
    setSignedIn(false);
  };

  if (checking) {
    return <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}><CircularProgress /></Box>;
  }

  if (!signedIn) return <LoginScreen onSignedIn={() => setSignedIn(true)} />;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar position="static" color="default" elevation={0} sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Toolbar>
          <Typography sx={{ fontWeight: 800, flex: 1 }}>Milta CMS</Typography>
          <Button size="small" startIcon={<LogoutIcon />} onClick={signOut}>Sign out</Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth={false} sx={{ maxWidth: 1500, py: 3 }}>
        {/* Content Update is the primary workflow: pick a page, upload a
            document, the page updates itself. "All pages" is the older browse
            view, kept because it is the only way to reach a page that has no
            state set (the Salem rows) and to edit fields one at a time. */}
        <Tabs
          value={tab}
          onChange={(_, v) => { setTab(v); setOpenId(null); }}
          sx={{ mb: 3, borderBottom: 1, borderColor: "divider" }}
        >
          {/* The workflow, left to right: add or import a state, give it its
              data, update the page, then verify what landed. They are separate
              panels over the same rows on purpose — updating and checking are
              different jobs, and doing both in one screen tends to mean doing
              neither. */}
          <Tab label="State data" value="states" />
          <Tab label="Content update" value="content" />
          <Tab label="Content verification" value="verify" />
          <Tab label="All pages" value="browse" />
        </Tabs>

        {tab === "states" && <StateDataSection />}
        {tab === "content" && <ContentDashboard />}
        {tab === "verify" && <VerificationSection />}

        {tab === "browse" && (openId
          ? <PageEditor id={openId} onBack={() => setOpenId(null)} />
          : <PageList onOpen={setOpenId} />)}
      </Container>
    </Box>
  );
}
