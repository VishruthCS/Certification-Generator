import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Container, TextField, Button, Typography, Box, Paper, Alert, Grid, List, ListItem, ListItemIcon, ListItemText, Divider } from "@mui/material";
import { AutoAwesome, Speed, Security } from "@mui/icons-material";
import { GoogleLogin } from '@react-oauth/google';
import api from "../services/api";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post("/auth/login", {
        email,
        username: email.split("@")[0],
        password,
      });
      localStorage.setItem("token", response.data.access_token);
      navigate("/");
    } catch (err) {
      try {
        await api.post("/auth/register", {
            email,
            username: email.split("@")[0],
            password,
        });
        const loginResponse = await api.post("/auth/login", {
            email,
            username: email.split("@")[0],
            password,
        });
        localStorage.setItem("token", loginResponse.data.access_token);
        navigate("/");
      } catch (regErr) {
          const detail = regErr.response?.data?.detail || "Invalid credentials and auto-register failed.";
          setError(detail);
      }
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const res = await api.post("/auth/google", { token: credentialResponse.credential });
      localStorage.setItem("token", res.data.access_token);
      navigate("/");
    } catch (err) {
      console.error(err);
      setError("Google authentication failed. Please try again.");
    }
  };

  const handleGoogleError = () => {
    setError("Google authentication was cancelled or failed.");
  };

  return (
    <Container maxWidth="lg" sx={{ minHeight: '80vh', display: 'flex', alignItems: 'center' }}>
      <Grid container spacing={8} alignItems="center">
        
        {/* Left Information Section */}
        <Grid size={{ xs: 12, md: 6 }} sx={{ display: { xs: 'none', md: 'block' } }}>
          <Typography variant="h2" sx={{ fontWeight: 900, mb: 2, background: 'linear-gradient(45deg, #64b5f6 30%, #ce93d8 90%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Certify AI
          </Typography>
          <Typography variant="h5" color="text.secondary" sx={{ mb: 6, lineHeight: 1.6, fontWeight: 300 }}>
            The smartest way to configure, generate, and issue professional certificates in seconds.
          </Typography>

          <List sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <ListItem disablePadding>
              <ListItemIcon>
                <AutoAwesome sx={{ color: '#ce93d8', fontSize: 32 }} />
              </ListItemIcon>
              <ListItemText 
                primary={<Typography variant="h6" sx={{ fontWeight: 600 }}>AI Auto-Detection</Typography>} 
                secondary={<Typography variant="body2" color="text.secondary">Automatically plots text fields and extracts fonts from templates.</Typography>} 
              />
            </ListItem>
            <ListItem disablePadding>
              <ListItemIcon>
                <Speed sx={{ color: '#64b5f6', fontSize: 32 }} />
              </ListItemIcon>
              <ListItemText 
                primary={<Typography variant="h6" sx={{ fontWeight: 600 }}>Lightning Fast</Typography>} 
                secondary={<Typography variant="body2" color="text.secondary">Generate thousands of PDF or PNG certificates instantly.</Typography>} 
              />
            </ListItem>
            <ListItem disablePadding>
              <ListItemIcon>
                <Security sx={{ color: '#81c784', fontSize: 32 }} />
              </ListItemIcon>
              <ListItemText 
                primary={<Typography variant="h6" sx={{ fontWeight: 600 }}>Secure Storage</Typography>} 
                secondary={<Typography variant="body2" color="text.secondary">Your templates and generated certificates are safely stored.</Typography>} 
              />
            </ListItem>
          </List>
        </Grid>

        {/* Right Login Section */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={0} sx={{ p: 6, width: "100%", bgcolor: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4, boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)' }}>
            <Typography component="h1" variant="h4" align="center" sx={{ fontWeight: 700, mb: 2 }}>
              Welcome Back
            </Typography>
            <Typography variant="body1" align="center" color="textSecondary" sx={{ mb: 4 }}>
              Sign in or automatically register below.
            </Typography>
            
            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
            
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                theme="filled_black"
                shape="rectangular"
                size="large"
                text="continue_with"
                width="100%"
              />
            </Box>

            <Divider sx={{ mb: 3, '&::before, &::after': { borderColor: 'rgba(255,255,255,0.2)' } }}>
              <Typography variant="body2" color="textSecondary">OR</Typography>
            </Divider>
            
            <Box component="form" onSubmit={handleLogin} sx={{ mt: 1 }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                sx={{ mb: 2 }}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Button type="submit" fullWidth variant="contained" size="large" sx={{ mt: 5, mb: 2, py: 1.8, borderRadius: 2, fontWeight: 700, fontSize: '1.1rem', background: 'linear-gradient(45deg, #1976d2 0%, #9c27b0 100%)', textTransform: 'none' }}>
                Authenticate
              </Button>
            </Box>
          </Paper>
        </Grid>
        
      </Grid>
    </Container>
  );
};

export default Login;
