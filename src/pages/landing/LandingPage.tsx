import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { 
  Box, 
  Button, 
  Container, 
  Typography, 
  Grid, 
  Card, 
  CardContent,
  CardMedia,
  Stack,
  useTheme,
  Link,
  Divider
} from '@mui/material';
import { motion } from 'framer-motion';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SecurityIcon from '@mui/icons-material/Security';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import TranslateIcon from '@mui/icons-material/Translate';

const LandingPage: React.FC = () => {
  const theme = useTheme();

  const features = [
    {
      icon: <MedicalServicesIcon fontSize="large" />,
      title: 'Smart Consultations',
      description: 'Voice-based consultations with real-time transcription and AI-generated summaries.'
    },
    {
      icon: <AccessTimeIcon fontSize="large" />,
      title: 'Efficient Appointments',
      description: 'Book appointments with real-time availability and automatic reminders.'
    },
    {
      icon: <SecurityIcon fontSize="large" />,
      title: 'Secure Records',
      description: 'End-to-end encrypted medical records with role-based access control.'
    },
    {
      icon: <SmartToyIcon fontSize="large" />,
      title: 'AI Health Insights',
      description: 'Get personalized health insights and wellness routines based on your medical data.'
    },
    {
      icon: <TranslateIcon fontSize="large" />,
      title: 'Multilingual Support',
      description: 'Access medical summaries in your preferred language for better understanding.'
    }
  ];

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      bgcolor: theme.palette.background.default
    }}>
      {/* Header */}
      <Box 
        component="header" 
        sx={{ 
          py: 2, 
          px: 3,
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderBottom: `1px solid ${theme.palette.divider}`
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <HealthAndSafetyIcon 
            sx={{ 
              fontSize: 40, 
              color: theme.palette.primary.main, 
              mr: 1 
            }} 
          />
          <Typography variant="h5" component="h1" fontWeight="bold">
            MediTrack AI
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button 
            component={RouterLink} 
            to="/login" 
            variant="outlined"
            color="primary"
          >
            Log In
          </Button>
          <Button 
            component={RouterLink} 
            to="/register" 
            variant="contained"
            color="primary"
          >
            Sign Up
          </Button>
        </Stack>
      </Box>

      {/* Hero Section */}
      <Box 
        sx={{ 
          py: 10, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          textAlign: 'center',
          background: `linear-gradient(to bottom right, ${theme.palette.primary.main}22, ${theme.palette.secondary.main}22)`,
        }}
      >
        <Container maxWidth="md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Typography 
              variant="h2" 
              component="h2" 
              gutterBottom
              fontWeight="bold"
              sx={{ mb: 2 }}
            >
              Your Personal AI-Assisted Health Companion
            </Typography>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <Typography 
              variant="h5" 
              color="text.secondary" 
              paragraph
              sx={{ mb: 4, maxWidth: '800px', mx: 'auto' }}
            >
              Experience a futuristic, intelligent, and user-friendly hospital system where doctors and patients 
              seamlessly interact with AI-powered medical insights, real-time voice transcription, and automatic 
              health record summarization.
            </Typography>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              justifyContent="center"
              sx={{ mb: 5 }}
            >
              <Button 
                component={RouterLink} 
                to="/login?role=doctor" 
                variant="contained" 
                color="primary" 
                size="large"
                sx={{ 
                  px: 4, 
                  py: 1.5,
                  borderRadius: 2,
                  fontSize: '1.1rem'
                }}
              >
                Login as Doctor
              </Button>
              <Button 
                component={RouterLink} 
                to="/login?role=patient" 
                variant="contained" 
                color="secondary" 
                size="large"
                sx={{ 
                  px: 4, 
                  py: 1.5,
                  borderRadius: 2,
                  fontSize: '1.1rem'
                }}
              >
                Login as Patient
              </Button>
            </Stack>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.6 }}
          >
            <Typography 
              variant="h6" 
              color="primary" 
              sx={{ 
                mt: 2, 
                fontWeight: 'medium',
                textTransform: 'uppercase',
                letterSpacing: 1
              }}
            >
              Experience Smart Healthcare
            </Typography>
          </motion.div>
        </Container>
      </Box>

      {/* Features Section */}
      <Container sx={{ py: 8 }} maxWidth="lg">
        <Typography 
          variant="h3" 
          component="h3" 
          align="center" 
          gutterBottom
          fontWeight="bold"
          sx={{ mb: 6 }}
        >
          Core Features
        </Typography>
        
        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item key={index} xs={12} sm={6} md={4}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card 
                  sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    transition: 'transform 0.3s, box-shadow 0.3s',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: theme.shadows[8],
                    },
                  }}
                  elevation={3}
                >
                  <CardContent sx={{ flexGrow: 1, textAlign: 'center', p: 3 }}>
                    <Box 
                      sx={{ 
                        mb: 2, 
                        color: theme.palette.primary.main,
                        display: 'flex',
                        justifyContent: 'center'
                      }}
                    >
                      {feature.icon}
                    </Box>
                    <Typography gutterBottom variant="h5" component="h2" fontWeight="medium">
                      {feature.title}
                    </Typography>
                    <Typography color="text.secondary">
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Call to Action */}
      <Box 
        sx={{ 
          bgcolor: theme.palette.primary.main, 
          color: 'white', 
          py: 8,
          textAlign: 'center'
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h4" component="h3" gutterBottom fontWeight="bold">
            Ready to Experience the Future of Healthcare?
          </Typography>
          <Typography variant="h6" paragraph sx={{ mb: 4, opacity: 0.9 }}>
            Join MediTrack AI today and transform your healthcare experience.
          </Typography>
          <Button 
            component={RouterLink} 
            to="/register" 
            variant="contained" 
            color="secondary" 
            size="large"
            sx={{ 
              px: 5, 
              py: 1.5,
              borderRadius: 2,
              fontSize: '1.1rem'
            }}
          >
            Get Started Now
          </Button>
        </Container>
      </Box>

      {/* Footer */}
      <Box 
        component="footer" 
        sx={{ 
          py: 4, 
          mt: 'auto',
          borderTop: `1px solid ${theme.palette.divider}`,
          bgcolor: theme.palette.background.paper
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} justifyContent="space-between">
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <HealthAndSafetyIcon 
                  sx={{ 
                    fontSize: 24, 
                    color: theme.palette.primary.main, 
                    mr: 1 
                  }} 
                />
                <Typography variant="h6" component="div" fontWeight="bold">
                  MediTrack AI
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Your personal AI-assisted health companion, making healthcare smarter and more efficient.
              </Typography>
            </Grid>
            
            <Grid item xs={6} sm={3} md={2}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Features
              </Typography>
              <Link component={RouterLink} to="#" color="inherit" display="block" sx={{ mb: 1 }}>
                Smart Consultations
              </Link>
              <Link component={RouterLink} to="#" color="inherit" display="block" sx={{ mb: 1 }}>
                AI Summaries
              </Link>
              <Link component={RouterLink} to="#" color="inherit" display="block" sx={{ mb: 1 }}>
                Health Insights
              </Link>
            </Grid>
            
            <Grid item xs={6} sm={3} md={2}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Account
              </Typography>
              <Link component={RouterLink} to="/login" color="inherit" display="block" sx={{ mb: 1 }}>
                Login
              </Link>
              <Link component={RouterLink} to="/register" color="inherit" display="block" sx={{ mb: 1 }}>
                Register
              </Link>
            </Grid>
            
            <Grid item xs={6} sm={3} md={2}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Support
              </Typography>
              <Link component={RouterLink} to="#" color="inherit" display="block" sx={{ mb: 1 }}>
                Help Center
              </Link>
              <Link component={RouterLink} to="#" color="inherit" display="block" sx={{ mb: 1 }}>
                Privacy Policy
              </Link>
              <Link component={RouterLink} to="#" color="inherit" display="block" sx={{ mb: 1 }}>
                Terms of Service
              </Link>
            </Grid>
          </Grid>
          
          <Divider sx={{ my: 3 }} />
          
          <Typography variant="body2" color="text.secondary" align="center">
            © {new Date().getFullYear()} MediTrack AI. All rights reserved.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage;