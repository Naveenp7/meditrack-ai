import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  IconButton, 
  Drawer, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  Divider, 
  Box, 
  Avatar, 
  Menu, 
  MenuItem, 
  useMediaQuery, 
  useTheme as useMuiTheme
} from '@mui/material';
import { 
  Menu as MenuIcon, 
  Dashboard, 
  CalendarMonth, 
  MedicalInformation, 
  Person, 
  Logout, 
  Brightness4, 
  Brightness7 
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

interface NavigationProps {
  title?: string;
}

const Navigation: React.FC<NavigationProps> = ({ title = 'MediTrack AI' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, signOut } = useAuth();
  const { toggleTheme, mode } = useTheme();
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));
  
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  
  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };
  
  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handleSignOut = async () => {
    handleProfileMenuClose();
    await signOut();
    navigate('/');
  };
  
  const handleNavigate = (path: string) => {
    navigate(path);
    if (isMobile) {
      setDrawerOpen(false);
    }
  };
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };
  
  const doctorMenuItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/doctor/dashboard' },
    { text: 'Patients', icon: <Person />, path: '/doctor/dashboard' }
  ];
  
  const patientMenuItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/patient/dashboard' },
    { text: 'Appointments', icon: <CalendarMonth />, path: '/patient/appointments' },
    { text: 'Medical Records', icon: <MedicalInformation />, path: '/patient/dashboard' }
  ];
  
  const menuItems = currentUser?.role === 'doctor' ? doctorMenuItems : patientMenuItems;
  
  const drawer = (
    <Box sx={{ width: 250 }}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="h6" component="div">
          MediTrack AI
        </Typography>
      </Box>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem 
            button 
            key={item.text} 
            onClick={() => handleNavigate(item.path)}
            selected={location.pathname === item.path}
            sx={{
              '&.Mui-selected': {
                backgroundColor: 'primary.light',
                '&:hover': {
                  backgroundColor: 'primary.light',
                },
              },
            }}
          >
            <ListItemIcon>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
    </Box>
  );
  
  return (
    <>
      <AppBar position="static" component={motion.div} initial={{ y: -100 }} animate={{ y: 0 }}>
        <Toolbar>
          {currentUser && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {title}
          </Typography>
          
          <IconButton color="inherit" onClick={toggleTheme} sx={{ mr: 1 }}>
            {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
          </IconButton>
          
          {currentUser ? (
            <>
              <IconButton 
                onClick={handleProfileMenuOpen}
                sx={{ p: 0, ml: 1 }}
                aria-controls="profile-menu"
                aria-haspopup="true"
              >
                <Avatar sx={{ bgcolor: 'secondary.main' }}>
                  {getInitials(currentUser.displayName || 'User')}
                </Avatar>
              </IconButton>
              <Menu
                id="profile-menu"
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleProfileMenuClose}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
              >
                <MenuItem onClick={() => {
                  handleProfileMenuClose();
                  navigate(currentUser.role === 'doctor' ? '/doctor/dashboard' : '/patient/dashboard');
                }}>
                  <ListItemIcon>
                    <Person fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Profile</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleSignOut}>
                  <ListItemIcon>
                    <Logout fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Logout</ListItemText>
                </MenuItem>
              </Menu>
            </>
          ) : (
            <Box>
              <Button color="inherit" onClick={() => navigate('/login')}>Login</Button>
              <Button color="inherit" onClick={() => navigate('/register')}>Register</Button>
            </Box>
          )}
        </Toolbar>
      </AppBar>
      
      <Drawer
        variant={isMobile ? 'temporary' : 'persistent'}
        open={drawerOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
      >
        {drawer}
      </Drawer>
    </>
  );
};

export default Navigation;