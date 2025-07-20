import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  Avatar,
  Chip,
  CircularProgress,
  TextField,
  InputAdornment,
  Divider,
  useTheme,
  Paper,
} from '@mui/material';
import { motion } from 'framer-motion';
import SearchIcon from '@mui/icons-material/Search';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PersonIcon from '@mui/icons-material/Person';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { useAuth } from '../../contexts/AuthContext';
import { getUsersByRole, getUsersByDoctor } from '../../services/userService';
import { getAppointmentsByDoctor } from '../../services/appointmentService';
import { formatDate, getInitials, stringToColor } from '../../utils/helpers';
import { User, Patient, Appointment } from '../../types';

const DoctorDashboard: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [patients, setPatients] = useState<Patient[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Redirect if not logged in or not a doctor
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    if (currentUser.role !== 'doctor') {
      navigate('/');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch patients assigned to this doctor
        const patientsData = await getUsersByDoctor(currentUser.uid);
        setPatients(patientsData as Patient[]);

        // Fetch upcoming appointments
        const today = new Date();
        const appointments = await getAppointmentsByDoctor(currentUser.uid);
        const upcoming = appointments
          .filter(appt => new Date(appt.date) >= today)
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
          .slice(0, 5); // Get only the next 5 appointments
        
        setUpcomingAppointments(upcoming);
      } catch (err) {
        setError('Failed to load dashboard data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser, navigate]);

  const filteredPatients = patients.filter(patient => {
    const fullName = `${patient.firstName} ${patient.lastName}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase());
  });

  const handlePatientClick = (patientId: string) => {
    navigate(`/doctor/patient/${patientId}`);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, py: 4 }}>
      <Container maxWidth="xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
            Doctor Dashboard
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" paragraph>
            Welcome back, Dr. {currentUser?.firstName} {currentUser?.lastName}
          </Typography>
        </motion.div>

        <Grid container spacing={4}>
          {/* Left column - Patient Overview */}
          <Grid item xs={12} md={8}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h5" component="h2" fontWeight="medium">
                    Patient Overview
                  </Typography>
                  <TextField
                    size="small"
                    placeholder="Search patients..."
                    variant="outlined"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ width: 250 }}
                  />
                </Box>

                {filteredPatients.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      {searchQuery ? 'No patients match your search' : 'No patients assigned yet'}
                    </Typography>
                  </Box>
                ) : (
                  <Grid container spacing={3}>
                    {filteredPatients.map((patient) => (
                      <Grid item key={patient.id} xs={12} sm={6} md={4}>
                        <Card 
                          sx={{ 
                            height: '100%',
                            cursor: 'pointer',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                            '&:hover': {
                              transform: 'translateY(-4px)',
                              boxShadow: theme.shadows[6],
                            },
                          }}
                          onClick={() => handlePatientClick(patient.id)}
                        >
                          <CardContent sx={{ p: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                              <Avatar 
                                src={patient.photoURL || undefined}
                                sx={{ 
                                  width: 56, 
                                  height: 56,
                                  bgcolor: stringToColor(patient.firstName + patient.lastName),
                                  mr: 2,
                                }}
                              >
                                {getInitials(patient.displayName.split(' ')[0], patient.displayName.split(' ').slice(1).join(' '))}
                              </Avatar>
                              <Box>
                                <Typography variant="h6" component="div" noWrap>
                                  {patient.firstName} {patient.lastName}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {patient.dateOfBirth ? `${new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()} years` : 'Age not provided'}
                                </Typography>
                              </Box>
                            </Box>
                            
                            <Divider sx={{ my: 1.5 }} />
                            
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <CalendarTodayIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
                                <Typography variant="body2" color="text.secondary">
                                  Last Visit: {patient.lastVisitDate ? formatDate(patient.lastVisitDate) : 'None'}
                                </Typography>
                              </Box>
                            </Box>
                            
                            <Box sx={{ mt: 2 }}>
                              <Button 
                                variant="outlined" 
                                size="small" 
                                fullWidth
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/doctor/observation/${patient.id}`);
                                }}
                              >
                                Begin Observation
                              </Button>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </Paper>
            </motion.div>
          </Grid>

          {/* Right column - Upcoming Appointments & Stats */}
          <Grid item xs={12} md={4}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
                <Typography variant="h5" component="h2" fontWeight="medium" gutterBottom>
                  Upcoming Appointments
                </Typography>
                
                {upcomingAppointments.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 3 }}>
                    <Typography variant="body1" color="text.secondary">
                      No upcoming appointments
                    </Typography>
                  </Box>
                ) : (
                  <Box>
                    {upcomingAppointments.map((appointment) => (
                      <Card key={appointment.id} sx={{ mb: 2, borderRadius: 2 }}>
                        <CardContent sx={{ p: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar 
                              sx={{ 
                                bgcolor: theme.palette.primary.main,
                                width: 40,
                                height: 40,
                                mr: 2,
                              }}
                            >
                              <CalendarTodayIcon fontSize="small" />
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle1">
                                {appointment.patientName}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <AccessTimeIcon fontSize="small" sx={{ color: 'text.secondary', mr: 0.5 }} />
                                <Typography variant="body2" color="text.secondary">
                                  {formatDate(appointment.date)} at {appointment.timeSlot}
                                </Typography>
                              </Box>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    ))}
                    
                    <Button 
                      variant="text" 
                      color="primary" 
                      fullWidth 
                      sx={{ mt: 1 }}
                      onClick={() => navigate('/doctor/appointments')}
                    >
                      View All Appointments
                    </Button>
                  </Box>
                )}
              </Paper>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
                  <Typography variant="h5" component="h2" fontWeight="medium" gutterBottom>
                    Quick Stats
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Card sx={{ bgcolor: theme.palette.primary.light, color: theme.palette.primary.contrastText }}>
                        <CardContent sx={{ p: 2, textAlign: 'center' }}>
                          <PersonIcon sx={{ fontSize: 40, mb: 1 }} />
                          <Typography variant="h4" fontWeight="bold">
                            {patients.length}
                          </Typography>
                          <Typography variant="body2">
                            Total Patients
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={6}>
                      <Card sx={{ bgcolor: theme.palette.secondary.light, color: theme.palette.secondary.contrastText }}>
                        <CardContent sx={{ p: 2, textAlign: 'center' }}>
                          <MedicalServicesIcon sx={{ fontSize: 40, mb: 1 }} />
                          <Typography variant="h4" fontWeight="bold">
                            {upcomingAppointments.length}
                          </Typography>
                          <Typography variant="body2">
                            Upcoming Appts
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                  
                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                    <Button 
                      variant="outlined" 
                      color="primary"
                      onClick={() => navigate('/doctor/patients')}
                      sx={{ flex: 1, mr: 1 }}
                    >
                      All Patients
                    </Button>
                    <Button 
                      variant="contained" 
                      color="primary"
                      onClick={() => navigate('/doctor/observation')}
                      sx={{ flex: 1, ml: 1 }}
                    >
                      New Observation
                    </Button>
                  </Box>
                </Paper>
              </motion.div>
            </motion.div>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default DoctorDashboard;