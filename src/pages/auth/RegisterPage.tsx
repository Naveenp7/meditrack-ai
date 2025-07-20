import React, { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
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
  Grid,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import { motion } from 'framer-motion';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';
import { registerUser } from '../../services/authService';

const RegisterPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { currentUser, setCurrentUser } = useAuth();

  // Form state
  const [activeStep, setActiveStep] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState<UserRole>('patient');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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

  const steps = ['Account Type', 'Basic Information', 'Additional Details'];

  const handleNext = () => {
    if (activeStep === 0) {
      setActiveStep(1);
    } else if (activeStep === 1) {
      // Validate basic information
      if (!email || !password || !confirmPassword || !firstName || !lastName) {
        setError('Please fill in all required fields');
        return;
      }
      
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      
      if (password.length < 6) {
        setError('Password must be at least 6 characters long');
        return;
      }
      
      setError('');
      setActiveStep(2);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Create user data object based on role
      const userData = {
        email,
        firstName,
        lastName,
        role,
        phoneNumber,
        dateOfBirth,
        gender,
        ...(role === 'doctor' && {
          specialization,
          licenseNumber,
        }),
      };

      const user = await registerUser(email, password, userData);
      setCurrentUser(user);
      
      // Redirect based on role
      if (user.role === 'doctor') {
        navigate('/doctor/dashboard');
      } else if (user.role === 'patient') {
        navigate('/patient/dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <FormControl fullWidth margin="normal">
            <InputLabel id="role-select-label">I am a</InputLabel>
            <Select
              labelId="role-select-label"
              id="role-select"
              value={role}
              label="I am a"
              onChange={(e) => setRole(e.target.value as UserRole)}
            >
              <MenuItem value="patient">Patient</MenuItem>
              <MenuItem value="doctor">Doctor</MenuItem>
            </Select>
          </FormControl>
        );
      case 1:
        return (
          <>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  id="firstName"
                  label="First Name"
                  name="firstName"
                  autoComplete="given-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  id="lastName"
                  label="Last Name"
                  name="lastName"
                  autoComplete="family-name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </Grid>
            </Grid>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
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
              autoComplete="new-password"
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
            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Confirm Password"
              type={showPassword ? 'text' : 'password'}
              id="confirmPassword"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </>
        );
      case 2:
        return (
          <>
            <TextField
              margin="normal"
              fullWidth
              id="phoneNumber"
              label="Phone Number"
              name="phoneNumber"
              autoComplete="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
            <TextField
              margin="normal"
              fullWidth
              id="dateOfBirth"
              label="Date of Birth"
              name="dateOfBirth"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel id="gender-select-label">Gender</InputLabel>
              <Select
                labelId="gender-select-label"
                id="gender-select"
                value={gender}
                label="Gender"
                onChange={(e) => setGender(e.target.value)}
              >
                <MenuItem value="male">Male</MenuItem>
                <MenuItem value="female">Female</MenuItem>
                <MenuItem value="other">Other</MenuItem>
                <MenuItem value="prefer-not-to-say">Prefer not to say</MenuItem>
              </Select>
            </FormControl>
            {role === 'doctor' && (
              <>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="specialization"
                  label="Medical Specialization"
                  name="specialization"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="licenseNumber"
                  label="Medical License Number"
                  name="licenseNumber"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                />
              </>
            )}
          </>
        );
      default:
        return null;
    }
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
              Create Account
            </Typography>

            <Stepper activeStep={activeStep} sx={{ width: '100%', mb: 4, mt: 2 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {error && (
              <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%', mt: 1 }}>
              {renderStepContent(activeStep)}

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                <Button
                  onClick={handleBack}
                  disabled={activeStep === 0 || loading}
                  sx={{ mr: 1 }}
                >
                  Back
                </Button>
                <Box sx={{ flex: '1 1 auto' }} />
                {activeStep === steps.length - 1 ? (
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={loading}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Register'}
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleNext}
                    disabled={loading}
                  >
                    Next
                  </Button>
                )}
              </Box>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Typography variant="body2">
                Already have an account?{' '}
                <Link component={RouterLink} to="/login" variant="body2">
                  Log In
                </Link>
              </Typography>
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

export default RegisterPage;