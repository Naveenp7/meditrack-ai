import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  TextField,
  Typography,
  Container,
  Paper,
  Link,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  useTheme,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { motion } from 'framer-motion';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useAuth } from '../../contexts/AuthContext';
import { loginUser, UserRole } from '../../services/authService';

const LoginPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, setCurrentUser } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('patient');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Parse role from URL query parameter if present
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const roleParam = params.get('role');
    if (roleParam === 'doctor' || roleParam === 'patient') {
      setRole(roleParam);
    }
  }, [location]);

  // Redirect if already logged in
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'doctor') {
        navigate('/doctor/dashboard');
      } else if (currentUser.role === 'patient') {
        navigate('/patient/dashboard');
      }
    }
  }, [currentUser, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await loginUser(email, password, role);
      setCurrentUser(user);
      
      // Redirect based on role
      if (user.role === 'doctor') {
        navigate('/doctor/dashboard');
      } else if (user.role === 'patient') {
        navigate('/patient/dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to log in');
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: theme.palette.background.default,
        py: 8,
      }}
    >
      <Container maxWidth="sm">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Paper
            elevation={4}
            sx={{
              p: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              borderRadius: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <HealthAndSafetyIcon
                sx={{
                  fontSize: 40,
                  color: theme.palette.primary.main,
                  mr: 1,
                }}
              />
              <Typography variant="h4" component="h1" fontWeight="bold">
                MediTrack AI
              </Typography>
            </Box>

            <Typography variant="h5" component="h2" gutterBottom>
              Log In
            </Typography>

            {error && (
              <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%', mt: 1 }}>
              <FormControl fullWidth margin="normal">
                <InputLabel id="role-select-label">Role</InputLabel>
                <Select
                  labelId="role-select-label"
                  id="role-select"
                  value={role}
                  label="Role"
                  onChange={(e) => setRole(e.target.value as UserRole)}
                >
                  <MenuItem value="patient">Patient</MenuItem>
                  <MenuItem value="doctor">Doctor</MenuItem>
                </Select>
              </FormControl>

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
              />

              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={togglePasswordVisibility}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                sx={{ mt: 3, mb: 2, py: 1.5, fontSize: '1rem' }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Log In'}
              </Button>

              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <Typography variant="body2">
                  Don't have an account?{' '}
                  <Link component={RouterLink} to="/register" variant="body2">
                    Sign Up
                  </Link>
                </Typography>
              </Box>
            </Box>
          </Paper>
        </motion.div>

        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            <Link component={RouterLink} to="/" color="inherit">
              Return to Home
            </Link>
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default LoginPage;