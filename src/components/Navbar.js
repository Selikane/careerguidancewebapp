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

const Navbar = () => {
  const { user, userType, logout } = useContext(AuthContext);
  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const theme = useTheme();
  
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Color scheme matching the home page
  const primaryColor = '#000000';
  const accentColor = '#FF6B35';

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
            sx={{ 
              mx: 1,
              color: 'white',
              '&:hover': {
                backgroundColor: alpha(accentColor, 0.1),
                color: accentColor
              }
            }}
          >
            Dashboard
          </Button>
        );
      case 'institution':
        return (
          <Button 
            color="inherit" 
            onClick={() => handleNavigation('/institution/dashboard')}
            sx={{ 
              mx: 1,
              color: 'white',
              '&:hover': {
                backgroundColor: alpha(accentColor, 0.1),
                color: accentColor
              }
            }}
          >
            Dashboard
          </Button>
        );
      case 'company':
        return (
          <Button 
            color="inherit" 
            onClick={() => handleNavigation('/company/dashboard')}
            sx={{ 
              mx: 1,
              color: 'white',
              '&:hover': {
                backgroundColor: alpha(accentColor, 0.1),
                color: accentColor
              }
            }}
          >
            Dashboard
          </Button>
        );
      case 'admin':
        return (
          <Button 
            color="inherit" 
            onClick={() => handleNavigation('/admin/dashboard')}
            sx={{ 
              mx: 1,
              color: 'white',
              '&:hover': {
                backgroundColor: alpha(accentColor, 0.1),
                color: accentColor
              }
            }}
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
      PaperProps={{
        sx: {
          backgroundColor: primaryColor,
          color: 'white'
        }
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
                  color: accentColor
                }
              }}
            >
              <ListItemText primary={item.text} />
            </ListItem>
          ))}
          {user && (
            <ListItem 
              button 
              onClick={() => handleNavigation(`/${userType}/dashboard`)}
              sx={{
                '&:hover': {
                  backgroundColor: alpha(accentColor, 0.1),
                  color: accentColor
                }
              }}
            >
              <ListItemText primary="My Dashboard" />
            </ListItem>
          )}
          {!user && (
            <>
              <ListItem 
                button 
                onClick={() => handleNavigation('/login')}
                sx={{
                  '&:hover': {
                    backgroundColor: alpha(accentColor, 0.1),
                    color: accentColor
                  }
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
                    color: accentColor
                  }
                }}
              >
                <ListItemText primary="Register" />
              </ListItem>
            </>
          )}
          {user && (
            <ListItem 
              button 
              onClick={handleLogout}
              sx={{
                '&:hover': {
                  backgroundColor: alpha(accentColor, 0.1),
                  color: accentColor
                }
              }}
            >
              <ListItemText primary="Logout" />
            </ListItem>
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
          boxShadow: 'none'
        }}
      >
        <Toolbar>
          {/* Logo on Left */}
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              cursor: 'pointer',
              flexGrow: 1
            }}
            onClick={() => handleNavigation('/')}
          >
            <School sx={{ mr: 1, color: accentColor }} />
            <Typography
              variant="h6"
              component="div"
              sx={{ 
                color: 'white',
                fontWeight: '600',
                fontSize: { xs: '1rem', sm: '1.25rem' },
                '&:hover': {
                  color: accentColor
                },
                transition: 'color 0.3s ease'
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
                    backgroundColor: alpha(accentColor, 0.1)
                  }
                }}
              >
                <MenuIcon />
              </IconButton>
              {renderMobileMenu()}
            </>
          ) : (
            <>
              {/* Navigation Links and User Actions on Right */}
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {/* Navigation Links */}
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
                        color: accentColor
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {item.text}
                  </Button>
                ))}

                {renderUserSpecificMenu()}

                {/* User Actions */}
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
                          backgroundColor: alpha(accentColor, 0.1)
                        }
                      }}
                    >
                      <Avatar sx={{ 
                        width: 32, 
                        height: 32, 
                        backgroundColor: accentColor,
                        color: 'white',
                        fontWeight: 'bold'
                      }}>
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
                      PaperProps={{
                        sx: {
                          backgroundColor: primaryColor,
                          color: 'white',
                          border: `1px solid ${alpha(accentColor, 0.2)}`
                        }
                      }}
                    >
                      <MenuItem 
                        onClick={() => handleNavigation(`/${userType}/profile`)}
                        sx={{
                          '&:hover': {
                            backgroundColor: alpha(accentColor, 0.1),
                            color: accentColor
                          }
                        }}
                      >
                        Profile
                      </MenuItem>
                      <MenuItem 
                        onClick={handleLogout}
                        sx={{
                          '&:hover': {
                            backgroundColor: alpha(accentColor, 0.1),
                            color: accentColor
                          }
                        }}
                      >
                        Logout
                      </MenuItem>
                    </Menu>
                  </div>
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Button 
                      color="inherit" 
                      onClick={() => handleNavigation('/login')}
                      sx={{ 
                        mx: 1,
                        color: 'white',
                        '&:hover': {
                          backgroundColor: alpha(accentColor, 0.1),
                          color: accentColor
                        },
                        transition: 'all 0.3s ease'
                      }}
                    >
                      Login
                    </Button>
                    <Button 
                      variant="outlined"
                      onClick={() => handleNavigation('/register')}
                      sx={{ 
                        mx: 1,
                        borderColor: accentColor,
                        color: accentColor,
                        '&:hover': {
                          backgroundColor: accentColor,
                          color: 'white',
                          borderColor: accentColor
                        },
                        transition: 'all 0.3s ease'
                      }}
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