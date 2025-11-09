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

const Navbar = () => {
  const { user, userType, logout } = useContext(AuthContext);
  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const theme = useTheme();
  
  // FIX: Use 'sm' instead of 'md' for better mobile experience
  const isMobile = useMediaQuery(theme.breakpoints.down('sm')); // Changed from 'md' to 'sm'

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleClose();
    navigate('/');
  };

  const handleNavigation = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
    handleClose();
  };

  const menuItems = [
    { text: 'Home', icon: <Home />, path: '/' },
    { text: 'Courses', icon: <Class />, path: '/courses' },
    { text: 'Jobs', icon: <Work />, path: '/jobs' },
  ];

  const renderUserSpecificMenu = () => {
    if (!user) return null;

    switch (userType) {
      case 'student':
        return (
          <Button 
            color="inherit" 
            onClick={() => handleNavigation('/student/dashboard')}
            sx={{ mx: 1 }}
          >
            Dashboard
          </Button>
        );
      case 'institution':
        return (
          <Button 
            color="inherit" 
            onClick={() => handleNavigation('/institution/dashboard')}
            sx={{ mx: 1 }}
          >
            Dashboard
          </Button>
        );
      case 'company':
        return (
          <Button 
            color="inherit" 
            onClick={() => handleNavigation('/company/dashboard')}
            sx={{ mx: 1 }}
          >
            Dashboard
          </Button>
        );
      case 'admin':
        return (
          <Button 
            color="inherit" 
            onClick={() => handleNavigation('/admin/dashboard')}
            sx={{ mx: 1 }}
          >
            Dashboard
          </Button>
        );
      default:
        return null;
    }
  };

  const renderMobileMenu = () => (
    <Drawer
      anchor="left"
      open={mobileMenuOpen}
      onClose={() => setMobileMenuOpen(false)}
    >
      <Box sx={{ width: 250 }} role="presentation">
        <List>
          {menuItems.map((item) => (
            <ListItem
              button
              key={item.text}
              onClick={() => handleNavigation(item.path)}
            >
              <ListItemText primary={item.text} />
            </ListItem>
          ))}
          {user && (
            <ListItem button onClick={() => handleNavigation(`/${userType}/dashboard`)}>
              <ListItemText primary="My Dashboard" />
            </ListItem>
          )}
          {!user && (
            <>
              <ListItem button onClick={() => handleNavigation('/login')}>
                <ListItemText primary="Login" />
              </ListItem>
              <ListItem button onClick={() => handleNavigation('/register')}>
                <ListItemText primary="Register" />
              </ListItem>
            </>
          )}
          {user && (
            <ListItem button onClick={handleLogout}>
              <ListItemText primary="Logout" />
            </ListItem>
          )}
        </List>
      </Box>
    </Drawer>
  );

  return (
    <>
      <AppBar position="static" sx={{ backgroundColor: '#1a237e' }}>
        <Toolbar>
          <School sx={{ mr: 2 }} />
          <Typography
            variant="h6"
            component="div"
            sx={{ 
              flexGrow: 1, 
              cursor: 'pointer',
              fontSize: { xs: '1rem', sm: '1.25rem' } // Better responsive font size
            }}
            onClick={() => handleNavigation('/')}
          >
            Career Guidance Lesotho
          </Typography>

          {isMobile ? (
            <>
              <IconButton
                color="inherit"
                onClick={() => setMobileMenuOpen(true)}
              >
                <MenuIcon />
              </IconButton>
              {renderMobileMenu()}
            </>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {menuItems.map((item) => (
                <Button
                  key={item.text}
                  color="inherit"
                  startIcon={item.icon}
                  onClick={() => handleNavigation(item.path)}
                  sx={{ mx: 1 }}
                >
                  {item.text}
                </Button>
              ))}

              {renderUserSpecificMenu()}

              {user ? (
                <div>
                  <IconButton
                    size="large"
                    aria-label="account of current user"
                    aria-controls="menu-appbar"
                    aria-haspopup="true"
                    onClick={handleMenu}
                    color="inherit"
                  >
                    <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                      {user.email.charAt(0).toUpperCase()}
                    </Avatar>
                  </IconButton>
                  <Menu
                    id="menu-appbar"
                    anchorEl={anchorEl}
                    anchorOrigin={{
                      vertical: 'top',
                      horizontal: 'right',
                    }}
                    keepMounted
                    transformOrigin={{
                      vertical: 'top',
                      horizontal: 'right',
                    }}
                    open={Boolean(anchorEl)}
                    onClose={handleClose}
                  >
                    <MenuItem onClick={() => handleNavigation(`/${userType}/profile`)}>
                      Profile
                    </MenuItem>
                    <MenuItem onClick={handleLogout}>Logout</MenuItem>
                  </Menu>
                </div>
              ) : (
                <Box>
                  <Button 
                    color="inherit" 
                    onClick={() => handleNavigation('/login')}
                    sx={{ mx: 1 }}
                  >
                    Login
                  </Button>
                  <Button 
                    color="inherit" 
                    onClick={() => handleNavigation('/register')}
                    sx={{ mx: 1 }}
                  >
                    Register
                  </Button>
                </Box>
              )}
            </Box>
          )}
        </Toolbar>
      </AppBar>
    </>
  );
};

export default Navbar;