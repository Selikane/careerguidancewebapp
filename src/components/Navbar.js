import React, { useState, useContext } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Box,
  Avatar,
  Drawer,
  List,
  ListItem,
  ListItemText,
  useMediaQuery,
  useTheme,
  alpha
} from '@mui/material';
import {
  Menu as MenuIcon,
  School,
  Home,
  Work,
  Class,
} from '@mui/icons-material';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

/**
 * Navbar component: responsive application header with navigation links
 * and user actions (profile, dashboard, logout). Uses Material UI components.
 */
const Navbar = () => {
  const { user, userType, logout } = useContext(AuthContext);
  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Color tokens used for styling the navbar.
  const primaryColor = '#000000';
  const accentColor = '#FF6B35';

  // Open the user menu anchor
  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  // Close any open menus/drawers
  const handleClose = () => {
    setAnchorEl(null);
  };

  // Log out the current user, close menus and navigate home
  const handleLogout = () => {
    logout();
    handleClose();
    navigate('/');
  };

  // Navigate to a path and close mobile menu if open
  const handleNavigation = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
    handleClose();
  };

  // Static navigation items displayed in the navbar
  const menuItems = [
    { text: 'Home', icon: <Home />, path: '/' },
    { text: 'Courses', icon: <Class />, path: '/courses' },
    { text: 'Jobs', icon: <Work />, path: '/jobs' },
  ];

  // Render a dashboard button specific to the authenticated user's type.
  // Uses the new route paths (e.g. /student-dashboard) to match the app routing.
  const renderUserSpecificMenu = () => {
    if (!user) return null;

    const dashboardPath = `/${userType}-dashboard`; // e.g. /student-dashboard

    return (
      <Button
        color="inherit"
        onClick={() => handleNavigation(dashboardPath)}
        sx={{
          mx: 1,
          color: 'white',
          '&:hover': {
            backgroundColor: alpha(accentColor, 0.1),
            color: accentColor,
          },
        }}
      >
        Dashboard
      </Button>
    );
  };

  // Mobile drawer menu
  const renderMobileMenu = () => (
    <Drawer
      anchor="left"
      open={mobileMenuOpen}
      onClose={() => setMobileMenuOpen(false)}
      PaperProps={{
        sx: {
          backgroundColor: primaryColor,
          color: 'white',
        },
      }}
    >
      <Box sx={{ width: 250 }} role="presentation">
        <List>
          {menuItems.map((item) => (
            <ListItem
              button
              key={item.text}
              onClick={() => handleNavigation(item.path)}
              sx={{
                '&:hover': {
                  backgroundColor: alpha(accentColor, 0.1),
                  color: accentColor,
                },
              }}
            >
              <ListItemText primary={item.text} />
            </ListItem>
          ))}

          {user ? (
            <> 
              <ListItem
                button
                onClick={() => handleNavigation(`/${userType}-dashboard`)}
                sx={{
                  '&:hover': {
                    backgroundColor: alpha(accentColor, 0.1),
                    color: accentColor,
                  },
                }}
              >
                <ListItemText primary="My Dashboard" />
              </ListItem>

              <ListItem
                button
                onClick={handleLogout}
                sx={{
                  '&:hover': {
                    backgroundColor: alpha(accentColor, 0.1),
                    color: accentColor,
                  },
                }}
              >
                <ListItemText primary="Logout" />
              </ListItem>
            </>
          ) : (
            <> 
              <ListItem
                button
                onClick={() => handleNavigation('/login')}
                sx={{
                  '&:hover': {
                    backgroundColor: alpha(accentColor, 0.1),
                    color: accentColor,
                  },
                }}
              >
                <ListItemText primary="Login" />
              </ListItem>
              <ListItem
                button
                onClick={() => handleNavigation('/register')}
                sx={{
                  '&:hover': {
                    backgroundColor: alpha(accentColor, 0.1),
                    color: accentColor,
                  },
                }}
              >
                <ListItemText primary="Register" />
              </ListItem>
            </>
          )}
        </List>
      </Box>
    </Drawer>
  );

  return (
    <> 
      <AppBar
        position="static"
        sx={{
          backgroundColor: primaryColor,
          borderBottom: `1px solid ${alpha(accentColor, 0.2)}`,
          boxShadow: 'none',
        }}
      >
        <Toolbar>
          {/* Clickable logo and title */}
          <Box
            sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', flexGrow: 1 }}
            onClick={() => handleNavigation('/')
          >
            <School sx={{ mr: 1, color: accentColor }} />
            <Typography
              variant="h6"
              component="div"
              sx={{
                color: 'white',
                fontWeight: '600',
                fontSize: { xs: '1rem', sm: '1.25rem' },
                '&:hover': { color: accentColor },
                transition: 'color 0.3s ease',
              }}
            >
              Career Guidance Lesotho
            </Typography>
          </Box>

          {isMobile ? (
            <> 
              <IconButton
                color="inherit"
                onClick={() => setMobileMenuOpen(true)}
                sx={{
                  color: 'white',
                  '&:hover': {
                    color: accentColor,
                    backgroundColor: alpha(accentColor, 0.1),
                  },
                }}
              >
                <MenuIcon />
              </IconButton>
              {renderMobileMenu()}
            </>
          ) : (
            <> 
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {menuItems.map((item) => (
                  <Button
                    key={item.text}
                    color="inherit"
                    onClick={() => handleNavigation(item.path)}
                    sx={{
                      mx: 1,
                      color: 'white',
                      '&:hover': {
                        backgroundColor: alpha(accentColor, 0.1),
                        color: accentColor,
                      },
                      transition: 'all 0.3s ease',
                    }}
                  >
                    {item.text}
                  </Button>
                ))}

                {renderUserSpecificMenu()}

                {/* User account actions: profile menu when signed in, or auth buttons when not */}
                {user ? (
                  <div>
                    <IconButton
                      size="large"
                      aria-label="account of current user"
                      aria-controls="menu-appbar"
                      aria-haspopup="true"
                      onClick={handleMenu}
                      color="inherit"
                      sx={{
                        color: 'white',
                        '&:hover': {
                          color: accentColor,
                          backgroundColor: alpha(accentColor, 0.1),
                        },
                      }}
                    >
                      <Avatar
                        sx={{ width: 32, height: 32, backgroundColor: accentColor, color: 'white', fontWeight: 'bold' }}
                      >
                        {user.email ? user.email.charAt(0).toUpperCase() : ''}
                      </Avatar>
                    </IconButton>
                    <Menu
                      id="menu-appbar"
                      anchorEl={anchorEl}
                      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                      keepMounted
                      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                      open={Boolean(anchorEl)}
                      onClose={handleClose}
                      PaperProps={{
                        sx: { backgroundColor: primaryColor, color: 'white', border: `1px solid ${alpha(accentColor, 0.2)}` },
                      }}
                    >
                      <MenuItem onClick={() => handleNavigation(`/${userType}-profile`)} sx={{ '&:hover': { backgroundColor: alpha(accentColor, 0.1), color: accentColor } }}>
                        Profile
                      </MenuItem>
                      <MenuItem onClick={handleLogout} sx={{ '&:hover': { backgroundColor: alpha(accentColor, 0.1), color: accentColor } }}>
                        Logout
                      </MenuItem>
                    </Menu>
                  </div>
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Button
                      color="inherit"
                      onClick={() => handleNavigation('/login')}
                      sx={{ mx: 1, color: 'white', '&:hover': { backgroundColor: alpha(accentColor, 0.1), color: accentColor }, transition: 'all 0.3s ease' }}
                    >
                      Login
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => handleNavigation('/register')}
                      sx={{ mx: 1, borderColor: accentColor, color: accentColor, '&:hover': { backgroundColor: accentColor, color: 'white', borderColor: accentColor }, transition: 'all 0.3s ease' }}
                    >
                      Register
                    </Button>
                  </Box>
                )}
              </Box>
            </>
          )}
        </Toolbar>
      </AppBar>
    </>
  );
};

export default Navbar;