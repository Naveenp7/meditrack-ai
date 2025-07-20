import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Divider,
  useTheme,
  Avatar,
  IconButton,
  Card,
  CardContent,
  Grid,
  Alert,
  Chip,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
} from '@mui/material';
import { motion } from 'framer-motion';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MicIcon from '@mui/icons-material/Mic';
import DescriptionIcon from '@mui/icons-material/Description';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import MedicationIcon from '@mui/icons-material/Medication';
import AssignmentIcon from '@mui/icons-material/Assignment';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PersonIcon from '@mui/icons-material/Person';
import { useAuth } from '../../contexts/AuthContext';
import { getUserById } from '../../services/userService';
import { getPatientMedicalRecords } from '../../services/medicalRecordService';
import { getPatientHealthInsights } from '../../services/healthInsightService';
import { formatDate, getInitials, stringToColor } from '../../utils/helpers';
import { Patient, MedicalRecord, HealthInsight } from '../../types';

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

const PatientProfilePage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { patientId } = useParams<{ patientId: string }>();
  const { currentUser } = useAuth();
  
  const [patient, setPatient] = useState<Patient | null>(null);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [healthInsights, setHealthInsights] = useState<HealthInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);

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
      if (!patientId) return;
      
      try {
        setLoading(true);
        // Fetch patient data
        const patientData = await getUserById(patientId) as Patient;
        setPatient(patientData);

        // Fetch medical records
        const records = await getPatientMedicalRecords(patientId);
        setMedicalRecords(records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));

        // Fetch health insights
        const insights = await getPatientHealthInsights(patientId);
        setHealthInsights(insights);
      } catch (err) {
        setError('Failed to load patient data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser, navigate, patientId]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleViewRecord = (recordId: string) => {
    navigate(`/doctor/records/${recordId}`);
  };

  const handleStartObservation = () => {
    navigate(`/doctor/observation/${patientId}`);
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
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <IconButton 
            onClick={() => navigate(-1)} 
            sx={{ mr: 2 }}
            aria-label="back"
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1" fontWeight="bold">
            Patient Profile
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={4}>
          {/* Patient Info Card */}
          <Grid item xs={12} md={4}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Paper elevation={2} sx={{ p: 3, borderRadius: 2, mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Avatar 
                    src={patient?.photoURL || undefined}
                    sx={{ 
                      width: 80, 
                      height: 80,
                      bgcolor: patient ? stringToColor(patient.firstName + patient.lastName) : theme.palette.primary.main,
                      mr: 2,
                    }}
                  >
                    {patient ? getInitials(patient.firstName, patient.lastName) : <PersonIcon />}
                  </Avatar>
                  <Box>
                    <Typography variant="h5" component="h2">
                      {patient?.firstName} {patient?.lastName}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      {patient?.dateOfBirth ? `${new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()} years` : 'Age not provided'}
                    </Typography>
                    <Chip 
                      label="Patient" 
                      size="small" 
                      color="primary" 
                      sx={{ mt: 1 }} 
                    />
                  </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                  Patient Information
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary">
                      Gender
                    </Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <Typography variant="body2">
                      {patient?.gender ? patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1) : 'Not provided'}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary">
                      Date of Birth
                    </Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <Typography variant="body2">
                      {patient?.dateOfBirth ? formatDate(patient.dateOfBirth) : 'Not provided'}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary">
                      Phone
                    </Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <Typography variant="body2">
                      {patient?.phoneNumber || 'Not provided'}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary">
                      Email
                    </Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <Typography variant="body2">
                      {patient?.email || 'Not provided'}
                    </Typography>
                  </Grid>
                </Grid>

                <Button 
                  variant="contained" 
                  color="primary" 
                  fullWidth 
                  sx={{ mt: 3 }}
                  startIcon={<MicIcon />}
                  onClick={handleStartObservation}
                >
                  Begin Observation
                </Button>
              </Paper>

              {/* Health Insights Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
                  <Typography variant="h6" gutterBottom fontWeight="medium">
                    AI Health Insights
                  </Typography>
                  
                  {healthInsights.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        No health insights available yet
                      </Typography>
                    </Box>
                  ) : (
                    <Box>
                      {healthInsights.slice(0, 1).map((insight, index) => (
                        <Card 
                          key={insight.id || index} 
                          sx={{ 
                            borderRadius: 2,
                            mb: 2,
                            bgcolor: theme.palette.info.light,
                            color: theme.palette.info.contrastText,
                          }}
                        >
                          <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <HealthAndSafetyIcon sx={{ mr: 1 }} />
                              <Typography variant="subtitle1" fontWeight="medium">
                                {insight.title}
                              </Typography>
                            </Box>
                            <Typography variant="body2" sx={{ mb: 2 }}>
                              {insight.description}
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {insight.tags?.map((tag, i) => (
                                <Chip 
                                  key={i} 
                                  label={tag} 
                                  size="small" 
                                  sx={{ 
                                    bgcolor: 'rgba(255,255,255,0.2)',
                                    color: 'inherit',
                                  }} 
                                />
                              ))}
                            </Box>
                          </CardContent>
                        </Card>
                      ))}
                      
                      {healthInsights.length > 1 && (
                        <Button 
                          variant="text" 
                          color="primary" 
                          fullWidth
                          onClick={() => setTabValue(2)}
                        >
                          View All Health Insights
                        </Button>
                      )}
                    </Box>
                  )}
                </Paper>
              </motion.div>
            </motion.div>
          </Grid>

          {/* Medical Records Tabs */}
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
                    aria-label="patient records tabs"
                    sx={{ px: 2, pt: 2 }}
                  >
                    <Tab label="Medical History" />
                    <Tab label="Documents & Reports" />
                    <Tab label="Health Insights" />
                  </Tabs>
                </Box>

                <TabPanel value={tabValue} index={0}>
                  <Box sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                      <Typography variant="h6" gutterBottom>
                        Medical History Timeline
                      </Typography>
                    </Box>
                    
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
                            button
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
                                    {formatDate(record.date)}
                                  </Typography>
                                  {' — '}
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
                  </Box>
                </TabPanel>

                <TabPanel value={tabValue} index={1}>
                  <Box sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Documents & Reports
                    </Typography>
                    
                    <Grid container spacing={2}>
                      {medicalRecords
                        .filter(record => record.attachments && record.attachments.length > 0)
                        .map((record) => (
                          <Grid item xs={12} sm={6} key={record.id}>
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
                                <Box sx={{ display: 'flex', mt: 1 }}>
                                  {record.attachments?.slice(0, 3).map((attachment, index) => (
                                    <Chip 
                                      key={index} 
                                      label={attachment.name.split('.').pop()?.toUpperCase()} 
                                      size="small" 
                                      sx={{ mr: 0.5 }} 
                                    />
                                  ))}
                                  {record.attachments && record.attachments.length > 3 && (
                                    <Chip 
                                      label={`+${record.attachments.length - 3}`} 
                                      size="small" 
                                      variant="outlined" 
                                    />
                                  )}
                                </Box>
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
                        {healthInsights.map((insight, index) => (
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
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                                      Generated on {formatDate(insight.date)}
                                    </Typography>
                                  </Box>
                                </Box>
                              </CardContent>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    )}
                  </Box>
                </TabPanel>
              </Paper>
            </motion.div>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default PatientProfilePage;