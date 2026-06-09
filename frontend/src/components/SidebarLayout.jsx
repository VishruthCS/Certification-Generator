import React from 'react';
import { Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Typography, Divider } from '@mui/material';
import { Home as HomeIcon, CloudUpload as CloudUploadIcon, Logout as LogoutIcon } from '@mui/icons-material';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';

const drawerWidth = 260;

const SidebarLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { text: 'Gallery', icon: <HomeIcon />, path: '/' },
    { text: 'Upload Template', icon: <CloudUploadIcon />, path: '/upload' },
  ];

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            background: 'rgba(255, 255, 255, 0.04)',
            borderRight: '1px solid rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(10px)',
            color: 'white',
          },
        }}
      >
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: '1px' }}>
            Certify AI
          </Typography>
        </Box>
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
        <List sx={{ mt: 2 }}>
          {menuItems.map((item) => {
            const isSelected = location.pathname === item.path;
            return (
              <ListItem disablePadding key={item.text} sx={{ mb: 1, px: 2 }}>
                <ListItemButton 
                  onClick={() => navigate(item.path)}
                  sx={{
                    borderRadius: 2,
                    bgcolor: isSelected ? 'rgba(144, 202, 249, 0.15)' : 'transparent',
                    color: isSelected ? '#90caf9' : 'white',
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.1)',
                    }
                  }}
                >
                  <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.text} 
                    slotProps={{ typography: { fontWeight: isSelected ? 600 : 400 } }} 
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
        <Box sx={{ flexGrow: 1 }} />
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
        <List sx={{ mb: 2 }}>
          <ListItem disablePadding sx={{ px: 2 }}>
            <ListItemButton 
              onClick={() => {
                localStorage.removeItem("token");
                navigate("/login");
              }}
              sx={{
                borderRadius: 2,
                color: '#ef5350',
                '&:hover': {
                  bgcolor: 'rgba(239, 83, 80, 0.1)',
                }
              }}
            >
              <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItemButton>
          </ListItem>
        </List>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Outlet />
      </Box>
    </Box>
  );
};

export default SidebarLayout;
