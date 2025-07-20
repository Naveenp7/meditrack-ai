import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Avatar,
  Chip,
  CircularProgress,
  Divider,
  useTheme,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemAvatar,
  IconButton,
  Tab,
  Tabs,
} from '@mui/material';
import { motion } from 'framer-motion';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import DescriptionIcon from '@mui/icons-material/Description';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import MedicationIcon from '@mui/icons-material/Medication';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useAuth } from '../../contexts/AuthContext';
import { getPatientMedicalRecords } from '../../services/medicalRecordService';
import { getPatientAppointments } from '../../services/appointmentService';
import { getPatientHealthInsights, getPatientWellnessRoutines } from '../../services/healthInsightService';
import { formatDate, getInitials, stringToColor } from '../../utils/helpers';
import { MedicalRecord, Appointment, HealthInsight, WellnessRoutine, Consultation } from '../../types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const PatientDashboard: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [healthInsights, setHealthInsights] = useState<HealthInsight[]>([]);
  const [wellnessRoutines, setWellnessRoutines] = useState<WellnessRoutine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    // Redirect if not logged in or not a patient
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    if (currentUser.role !== 'patient') {
      navigate('/');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch medical records
        const records = await getPatientMedicalRecords(currentUser.id);
        setMedicalRecords(records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));

        // Fetch upcoming appointments
        const today = new Date();
        const appointments = await getPatientAppointments(currentUser.id);
        const upcoming = appointments
          .filter(appt => new Date(appt.date) >= today)
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        setUpcomingAppointments(upcoming);

        // Fetch health insights and wellness routines
        const insights = await getPatientHealthInsights(currentUser.id);
        setHealthInsights(insights);

        const routines = await getPatientWellnessRoutines(currentUser.id);
        setWellnessRoutines(routines);
      } catch (err) {
        setError('Failed to load dashboard data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser, navigate]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleViewRecord = (recordId: string) => {
    navigate(`/patient/records/${recordId}`);
  };

  const getRecordIcon = (recordType: string) => {
    switch (recordType) {
      case 'consultation':
        return <LocalHospitalIcon />;
      case 'test':
        return <AssignmentIcon />;
      case 'prescription':
        return <MedicationIcon />;
      default:
        return <DescriptionIcon />;
    }
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
            Patient Dashboard
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" paragraph>
            Welcome back, {currentUser?.firstName} {currentUser?.lastName}
          </Typography>
        </motion.div>

        <Grid container spacing={4}>
          {/* Left column - Health Timeline & Reports */}
          <Grid item xs={12} md={8}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                  <Tabs 
                    value={tabValue} 
                    onChange={handleTabChange} 
                    aria-label="dashboard tabs"
                    sx={{ px: 2, pt: 2 }}
                  >
                    <Tab label="Health Timeline" />
                    <Tab label="Reports & Documents" />
                    <Tab label="Health Insights" />
                  </Tabs>
                </Box>

                <TabPanel value={tabValue} index={0}>
                  <Box sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Your Medical History
                    </Typography>
                    
                    {medicalRecords.length === 0 ? (
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="body1" color="text.secondary">
                          No medical records found
                        </Typography>
                      </Box>
                    ) : (
                      <List>
                        {medicalRecords.map((record) => (
                          <ListItem 
                            key={record.id}
                            alignItems="flex-start"
                            secondaryAction={
                              <IconButton edge="end" aria-label="more options">
                                <MoreVertIcon />
                              </IconButton>
                            }
                            sx={{ 
                              mb: 1, 
                              border: `1px solid ${theme.palette.divider}`,
                              borderRadius: 1,
                              '&:hover': {
                                bgcolor: theme.palette.action.hover,
                              },
                            }}
                            onClick={() => handleViewRecord(record.id)}
                          >
                            <ListItemAvatar>
                              <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                                {getRecordIcon(record.type)}
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Typography variant="subtitle1" fontWeight="medium">
                                  {record.title}
                                </Typography>
                              }
                              secondary={
                                <React.Fragment>
                                  <Typography
                                    component="span"
                                    variant="body2"
                                    color="text.primary"
                                  >
                                    Dr. {record.doctorName}
                                  </Typography>
                                  {' — '}
                                  <Typography
                                    component="span"
                                    variant="body2"
                                    color="text.secondary"
                                  >
                                    {formatDate(record.date)}
                                  </Typography>
                                  <br />
                                  <Typography
                                    component="span"
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ 
                                      display: '-webkit-box',
                                      WebkitLineClamp: 2,
                                      WebkitBoxOrient: 'vertical',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                    }}
                                  >
                                    {record.summary}
                                  </Typography>
                                </React.Fragment>
                              }
                            />
                          </ListItem>
                        ))}
                      </List>
                    )}
                    
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                      <Button 
                        variant="outlined" 
                        color="primary"
                        onClick={() => navigate('/patient/records')}
                      >
                        View All Records
                      </Button>
                    </Box>
                  </Box>
                </TabPanel>

                <TabPanel value={tabValue} index={1}>
                  <Box sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Your Reports & Documents
                    </Typography>
                    
                    <Grid container spacing={2}>
                      {medicalRecords
                        .filter(record => record.attachments && record.attachments.length > 0)
                        .slice(0, 6)
                        .map((record) => (
                          <Grid item xs={12} sm={6} md={4} key={record.id}>
                            <Card 
                              sx={{ 
                                height: '100%',
                                cursor: 'pointer',
                                transition: 'transform 0.2s',
                                '&:hover': {
                                  transform: 'translateY(-4px)',
                                  boxShadow: theme.shadows[4],
                                },
                              }}
                              onClick={() => handleViewRecord(record.id)}
                            >
                              <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                  <Avatar 
                                    sx={{ 
                                      bgcolor: theme.palette.primary.main,
                                      width: 40,
                                      height: 40,
                                      mr: 1,
                                    }}
                                  >
                                    <DescriptionIcon fontSize="small" />
                                  </Avatar>
                                  <Typography variant="subtitle1" noWrap>
                                    {record.title}
                                  </Typography>
                                </Box>
                                <Typography variant="body2" color="text.secondary">
                                  {formatDate(record.date)}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {record.attachments?.length} attachment(s)
                                </Typography>
                              </CardContent>
                            </Card>
                          </Grid>
                        ))}
                    </Grid>
                    
                    {medicalRecords.filter(record => record.attachments && record.attachments.length > 0).length === 0 && (
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="body1" color="text.secondary">
                          No documents or reports found
                        </Typography>
                      </Box>
                    )}
                    
                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                      <Button 
                        variant="outlined" 
                        color="primary"
                        onClick={() => navigate('/patient/documents')}
                      >
                        View All Documents
                      </Button>
                    </Box>
                  </Box>
                </TabPanel>

                <TabPanel value={tabValue} index={2}>
                  <Box sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      AI-Generated Health Insights
                    </Typography>
                    
                    {healthInsights.length === 0 ? (
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="body1" color="text.secondary">
                          No health insights available yet
                        </Typography>
                      </Box>
                    ) : (
                      <Grid container spacing={3}>
                        {healthInsights.slice(0, 3).map((insight, index) => (
                          <Grid item xs={12} key={insight.id || index}>
                            <Card sx={{ borderRadius: 2 }}>
                              <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                                  <Avatar 
                                    sx={{ 
                                      bgcolor: theme.palette.info.main,
                                      mr: 2,
                                    }}
                                  >
                                    <HealthAndSafetyIcon />
                                  </Avatar>
                                  <Box>
                                    <Typography variant="h6" gutterBottom>
                                      {insight.title}
                                    </Typography>
                                    <Typography variant="body2" paragraph>
                                      {insight.description}
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                      {insight.tags?.map((tag, i) => (
                                        <Chip 
                                          key={i} 
                                          label={tag} 
                                          size="small" 
                                          color="primary" 
                                          variant="outlined"
                                        />
                                      ))}
                                    </Box>
                                  </Box>
                                </Box>
                              </CardContent>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    )}
                    
                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                      <Button 
                        variant="outlined" 
                        color="primary"
                        onClick={() => navigate('/patient/insights')}
                      >
                        View All Insights
                      </Button>
                    </Box>
                  </Box>
                </TabPanel>
              </Paper>
            </motion.div>
          </Grid>

          {/* Right column - Appointments & Wellness */}
          <Grid item xs={12} md={4} component="div">
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
                    <Button 
                      variant="contained" 
                      color="primary" 
                      sx={{ mt: 2 }}
                      onClick={() => navigate('/patient/book-appointment')}
                    >
                      Book an Appointment
                    </Button>
                  </Box>
                ) : (
                  <Box>
                    {upcomingAppointments.slice(0, 3).map((appointment) => (
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
                                Dr. {appointment.doctorName}
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
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                      <Button 
                        variant="outlined" 
                        color="primary"
                        onClick={() => navigate('/patient/appointments')}
                      >
                        View All
                      </Button>
                      <Button 
                        variant="contained" 
                        color="primary"
                        onClick={() => navigate('/patient/book-appointment')}
                      >
                        Book New
                      </Button>
                    </Box>
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
                    Wellness Routine
                  </Typography>
                  
                  {wellnessRoutines.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                      <Typography variant="body1" color="text.secondary">
                        No wellness routines available yet
                      </Typography>
                    </Box>
                  ) : (
                    <Box>
                      {wellnessRoutines.slice(0, 1).map((routine, index) => (
                        <Card 
                          key={routine.id || index} 
                          sx={{ 
                            borderRadius: 2,
                            bgcolor: theme.palette.secondary.light,
                            color: theme.palette.secondary.contrastText,
                            mb: 2,
                          }}
                        >
                          <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                              <FitnessCenterIcon sx={{ mr: 1 }} />
                              <Typography variant="h6">
                                {routine.title}
                              </Typography>
                            </Box>
                            
                            <Typography variant="body2" sx={{ mb: 2, opacity: 0.9 }}>
                              {routine.description}
                            </Typography>
                            
                            <List dense>
                              {routine.exercises?.slice(0, 3).map((activity: string, i: number) => (
                                <ListItem key={i} sx={{ px: 0 }}>
                                  <ListItemIcon sx={{ minWidth: 36 }}>
                                    <Avatar 
                                      sx={{ 
                                        width: 24, 
                                        height: 24, 
                                        bgcolor: theme.palette.secondary.main,
                                        fontSize: '0.8rem',
                                      }}
                                    >
                                      {i + 1}
                                    </Avatar>
                                  </ListItemIcon>
                                  <ListItemText 
                                    primary={activity} 
                                    primaryTypographyProps={{ 
                                      variant: 'body2',
                                      fontWeight: 'medium',
                                    }} 
                                  />
                                </ListItem>
                              ))}
                            </List>
                            
                            {routine.exercises && routine.exercises.length > 3 && (

                              <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                                {`${routine.exercises.length - 3} more activities`}
                              </Typography>
                            )
                          </CardContent>
                        </Card>
                      ))}
                      
                      <Button 
                        variant="outlined" 
                        color="secondary" 
                        fullWidth
                        onClick={() => navigate('/patient/wellness')}
                      >
                        View Full Wellness Plan
                      </Button>
                    </Box>
                  )}
                </Paper>
              </motion.div>
            </motion.div>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default PatientDashboard;