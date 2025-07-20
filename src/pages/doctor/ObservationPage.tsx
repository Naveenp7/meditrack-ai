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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import { motion } from 'framer-motion';
import MicIcon from '@mui/icons-material/Mic';
import StopIcon from '@mui/icons-material/Stop';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import PersonIcon from '@mui/icons-material/Person';
import { useAuth } from '../../contexts/AuthContext';
import { getUserById } from '../../services/userService';
import { createConsultation } from '../../services/medicalRecordService';
import { startRecording, stopRecording, processAudio, isRecordingInProgress } from '../../services/audioService';
import { formatDate, getInitials, stringToColor } from '../../utils/helpers';
import { Patient, AISummary } from '../../types';

const ObservationPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { patientId } = useParams<{ patientId: string }>();
  const { currentUser } = useAuth();
  
  const [patient, setPatient] = useState<Patient | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcription, setTranscription] = useState<string>('');
  const [summary, setSummary] = useState<AISummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingAudio, setProcessingAudio] = useState(false);
  const [error, setError] = useState('');
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [consultationTitle, setConsultationTitle] = useState('');

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

    const fetchPatient = async () => {
      if (!patientId) return;
      
      try {
        setLoading(true);
        const patientData = await getUserById(patientId) as Patient;
        setPatient(patientData);
        setConsultationTitle(`Consultation with ${patientData.firstName} ${patientData.lastName}`);
      } catch (err) {
        setError('Failed to load patient data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPatient();

    // Clean up recording if component unmounts while recording
    return () => {
      if (isRecordingInProgress()) {
        stopRecording();
      }
    };
  }, [currentUser, navigate, patientId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else if (!isRecording && recordingTime !== 0) {
      clearInterval(interval);
    }
    
    return () => clearInterval(interval);
  }, [isRecording, recordingTime]);

  const handleStartRecording = async () => {
    try {
      await startRecording();
      setIsRecording(true);
      setRecordingTime(0);
      setTranscription('');
      setSummary(null);
      setError('');
    } catch (err) {
      setError('Failed to start recording. Please check your microphone permissions.');
      console.error(err);
    }
  };

  const handleStopRecording = async () => {
    if (!isRecording) return;
    
    try {
      setIsRecording(false);
      setProcessingAudio(true);
      
      // Stop recording and get the audio blob
      await stopRecording();
      
      // Process the audio (transcribe and summarize)
      const result = await processAudio();
      
      if (result) {
        setTranscription(result.transcription);
        setSummary(result.summary);
      }
    } catch (err) {
      setError('Failed to process recording');
      console.error(err);
    } finally {
      setProcessingAudio(false);
    }
  };

  const handleSaveConsultation = async () => {
    if (!summary || !patient || !currentUser) return;
    
    try {
      setLoading(true);
      
      // Create consultation record
      await createConsultation({
        patientId: patient.id,
        doctorId: currentUser.id,
        title: consultationTitle,
        date: new Date().toISOString(),
        transcription,
        summary: summary.text,
        symptoms: summary.symptoms,
        diagnosis: summary.diagnosis,
        treatment: summary.treatment,
        followUp: summary.followUp,
      });
      
      // Navigate back to patient profile
      navigate(`/doctor/patient/${patient.id}`);
    } catch (err) {
      setError('Failed to save consultation');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading && !patient) {
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
            Observation Mode
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
              <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar 
                    src={patient?.photoURL || undefined}
                    sx={{ 
                      width: 64, 
                      height: 64,
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
                  </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                  Patient Information
                </Typography>
                
                <Grid container spacing={1}>
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
                  variant="outlined" 
                  color="primary" 
                  fullWidth 
                  sx={{ mt: 3 }}
                  onClick={() => navigate(`/doctor/patient/${patient?.id}`)}
                >
                  View Full Profile
                </Button>
              </Paper>
            </motion.div>
          </Grid>

          {/* Recording and Transcription */}
          <Grid item xs={12} md={8}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Paper elevation={2} sx={{ p: 3, borderRadius: 2, mb: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h5" component="h2" fontWeight="medium">
                    Voice Consultation
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {isRecording && (
                      <Typography variant="body1" sx={{ mr: 2, fontFamily: 'monospace' }}>
                        {formatTime(recordingTime)}
                      </Typography>
                    )}
                    {isRecording ? (
                      <Button 
                        variant="contained" 
                        color="error" 
                        startIcon={<StopIcon />}
                        onClick={handleStopRecording}
                        disabled={processingAudio}
                      >
                        Stop Recording
                      </Button>
                    ) : (
                      <Button 
                        variant="contained" 
                        color="primary" 
                        startIcon={<MicIcon />}
                        onClick={handleStartRecording}
                        disabled={processingAudio}
                      >
                        Start Recording
                      </Button>
                    )}
                  </Box>
                </Box>

                {processingAudio ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
                    <CircularProgress size={40} sx={{ mb: 2 }} />
                    <Typography variant="body1">
                      Processing audio...
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Transcribing and generating AI summary
                    </Typography>
                  </Box>
                ) : (
                  <Box>
                    <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                      Transcription
                    </Typography>
                    <Paper 
                      variant="outlined" 
                      sx={{ 
                        p: 2, 
                        minHeight: 150, 
                        maxHeight: 300, 
                        overflowY: 'auto',
                        bgcolor: theme.palette.background.default,
                        mb: 3,
                      }}
                    >
                      {transcription ? (
                        <Typography variant="body1">
                          {transcription}
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                          {isRecording ? 'Recording in progress...' : 'Start recording to see transcription here'}
                        </Typography>
                      )}
                    </Paper>

                    {summary && (
                      <Box>
                        <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                          AI-Generated Summary
                        </Typography>
                        <Card sx={{ mb: 3, bgcolor: theme.palette.primary.light, color: theme.palette.primary.contrastText }}>
                          <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                              <HealthAndSafetyIcon sx={{ mr: 1 }} />
                              <Typography variant="h6">
                                Consultation Summary
                              </Typography>
                            </Box>
                            <Typography variant="body1" paragraph>
                              {summary.text}
                            </Typography>
                            
                            <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.2)' }} />
                            
                            <Grid container spacing={2}>
                              <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                                  Symptoms
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                  {summary.symptoms.map((symptom, index) => (
                                    <Chip 
                                      key={index} 
                                      label={symptom} 
                                      size="small" 
                                      sx={{ 
                                        bgcolor: 'rgba(255,255,255,0.2)',
                                        color: 'inherit',
                                      }} 
                                    />
                                  ))}
                                </Box>
                              </Grid>
                              <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                                  Diagnosis
                                </Typography>
                                <Typography variant="body2">
                                  {summary.diagnosis}
                                </Typography>
                              </Grid>
                              <Grid item xs={12}>
                                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                                  Treatment Plan
                                </Typography>
                                <Typography variant="body2">
                                  {summary.treatment}
                                </Typography>
                              </Grid>
                              <Grid item xs={12}>
                                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                                  Follow-up
                                </Typography>
                                <Typography variant="body2">
                                  {summary.followUp}
                                </Typography>
                              </Grid>
                            </Grid>
                          </CardContent>
                        </Card>

                        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <Button 
                            variant="contained" 
                            color="success" 
                            startIcon={<SaveIcon />}
                            onClick={() => setSaveDialogOpen(true)}
                          >
                            Save Consultation
                          </Button>
                        </Box>
                      </Box>
                    )}
                  </Box>
                )}
              </Paper>
            </motion.div>
          </Grid>
        </Grid>

        {/* Save Dialog */}
        <Dialog open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)}>
          <DialogTitle>Save Consultation</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              id="title"
              label="Consultation Title"
              type="text"
              fullWidth
              variant="outlined"
              value={consultationTitle}
              onChange={(e) => setConsultationTitle(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveConsultation} variant="contained" color="primary">
              Save
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default ObservationPage;