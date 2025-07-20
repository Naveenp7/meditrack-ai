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
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemIcon,
  Link,
} from '@mui/material';
import { motion } from 'framer-motion';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DescriptionIcon from '@mui/icons-material/Description';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import MedicationIcon from '@mui/icons-material/Medication';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ImageIcon from '@mui/icons-material/Image';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import PersonIcon from '@mui/icons-material/Person';
import { useAuth } from '../../contexts/AuthContext';
import { getMedicalRecord } from '../../services/medicalRecordService';
import { getUserById } from '../../services/userService';
import { formatDate, formatFileSize } from '../../utils/helpers';
import { MedicalRecord, Patient, Doctor, Attachment } from '../../types';

const MedicalRecordPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { recordId } = useParams<{ recordId: string }>();
  const { currentUser } = useAuth();
  
  const [record, setRecord] = useState<MedicalRecord | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Redirect if not logged in
    if (!currentUser) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      if (!recordId) return;
      
      try {
        setLoading(true);
        // Fetch medical record
        const recordData = await getMedicalRecord(recordId);
        setRecord(recordData);

        // Fetch patient data
        if (recordData.patientId) {
          const patientData = await getUserById(recordData.patientId) as Patient;
          setPatient(patientData);
        }

        // Fetch doctor data
        if (recordData.doctorId) {
          const doctorData = await getUserById(recordData.doctorId) as Doctor;
          setDoctor(doctorData);
        }
      } catch (err) {
        setError('Failed to load medical record');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser, navigate, recordId]);

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

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    if (extension === 'pdf') {
      return <PictureAsPdfIcon color="error" />;
    } else if (['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(extension || '')) {
      return <ImageIcon color="primary" />;
    } else {
      return <InsertDriveFileIcon color="action" />;
    }
  };

  const handleOpenAttachment = (attachment: Attachment) => {
    window.open(attachment.url, '_blank');
  };

  const handleBackToPatient = () => {
    if (patient) {
      navigate(`/doctor/patients/${patient.id}`);
    } else {
      navigate(-1);
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
            onClick={handleBackToPatient} 
            sx={{ mr: 2 }}
            aria-label="back"
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1" fontWeight="bold">
            Medical Record
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {!record ? (
          <Alert severity="warning">
            Medical record not found
          </Alert>
        ) : (
          <Grid container spacing={4}>
            {/* Record Info Card */}
            <Grid item xs={12} md={4}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Paper elevation={2} sx={{ p: 3, borderRadius: 2, mb: 4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Avatar 
                      sx={{ 
                        width: 60, 
                        height: 60,
                        bgcolor: theme.palette.primary.main,
                        mr: 2,
                      }}
                    >
                      {getRecordIcon(record.type)}
                    </Avatar>
                    <Box>
                      <Typography variant="h5" component="h2">
                        {record.title}
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        {formatDate(record.date)}
                      </Typography>
                      <Chip 
                        label={record.type.charAt(0).toUpperCase() + record.type.slice(1)} 
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
                  
                  {patient ? (
                    <Box 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        p: 1,
                        borderRadius: 1,
                        '&:hover': {
                          bgcolor: theme.palette.action.hover,
                          cursor: 'pointer',
                        },
                      }}
                      onClick={() => navigate(`/doctor/patients/${patient.id}`)}
                    >
                      <Avatar 
                        src={patient.photoURL || undefined}
                        sx={{ mr: 2 }}
                      >
                        <PersonIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2">
                          {patient.firstName} {patient.lastName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {patient.email}
                        </Typography>
                      </Box>
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Patient information not available
                    </Typography>
                  )}

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                    Doctor Information
                  </Typography>
                  
                  {doctor ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', p: 1 }}>
                      <Avatar 
                        src={doctor.photoURL || undefined}
                        sx={{ mr: 2 }}
                      >
                        <PersonIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2">
                          Dr. {doctor.firstName} {doctor.lastName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {doctor.specialization}
                        </Typography>
                      </Box>
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Doctor information not available
                    </Typography>
                  )}
                </Paper>

                {/* Attachments Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
                    <Typography variant="h6" gutterBottom fontWeight="medium">
                      Attachments
                    </Typography>
                    
                    {!record.attachments || record.attachments.length === 0 ? (
                      <Box sx={{ textAlign: 'center', py: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          No attachments available
                        </Typography>
                      </Box>
                    ) : (
                      <List>
                        {record.attachments.map((attachment, index) => (
                          <ListItem 
                            key={index}
                            button
                            onClick={() => handleOpenAttachment(attachment)}
                            sx={{ 
                              borderRadius: 1,
                              mb: 1,
                              border: `1px solid ${theme.palette.divider}`,
                            }}
                          >
                            <ListItemIcon>
                              {getFileIcon(attachment.name)}
                            </ListItemIcon>
                            <ListItemText 
                              primary={attachment.name}
                              secondary={formatFileSize(attachment.size || 0)}
                              primaryTypographyProps={{
                                noWrap: true,
                                style: { maxWidth: '200px' }
                              }}
                            />
                          </ListItem>
                        ))}
                      </List>
                    )}
                  </Paper>
                </motion.div>
              </motion.div>
            </Grid>

            {/* Record Content */}
            <Grid item xs={12} md={8}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
                  <Typography variant="h6" gutterBottom fontWeight="medium">
                    {record.type === 'consultation' ? 'Consultation Summary' : 
                     record.type === 'test' ? 'Test Results' : 
                     record.type === 'prescription' ? 'Prescription Details' : 
                     'Record Details'}
                  </Typography>

                  {record.type === 'consultation' && record.consultation ? (
                    <Box>
                      <Card sx={{ mb: 3, bgcolor: theme.palette.background.default }}>
                        <CardContent>
                          <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                            Symptoms
                          </Typography>
                          <Typography variant="body1" paragraph>
                            {record.consultation.symptoms || 'No symptoms recorded'}
                          </Typography>

                          <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                            Diagnosis
                          </Typography>
                          <Typography variant="body1" paragraph>
                            {record.consultation.diagnosis || 'No diagnosis recorded'}
                          </Typography>

                          <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                            Notes
                          </Typography>
                          <Typography variant="body1">
                            {record.consultation.notes || 'No additional notes'}
                          </Typography>
                        </CardContent>
                      </Card>

                      {record.consultation.aiSummary && (
                        <Card sx={{ 
                          mb: 3, 
                          bgcolor: theme.palette.info.light,
                          color: theme.palette.info.contrastText,
                        }}>
                          <CardContent>
                            <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                              AI-Generated Summary
                            </Typography>
                            <Typography variant="body1">
                              {record.consultation.aiSummary.content}
                            </Typography>
                            {record.consultation.aiSummary.tags && (
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 2 }}>
                                {record.consultation.aiSummary.tags.map((tag, i) => (
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
                            )}
                          </CardContent>
                        </Card>
                      )}

                      {record.consultation.transcription && (
                        <Card>
                          <CardContent>
                            <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                              Consultation Transcription
                            </Typography>
                            <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                              {record.consultation.transcription}
                            </Typography>
                          </CardContent>
                        </Card>
                      )}
                    </Box>
                  ) : record.type === 'test' && record.testResult ? (
                    <Box>
                      <Card sx={{ mb: 3, bgcolor: theme.palette.background.default }}>
                        <CardContent>
                          <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                            Test Name
                          </Typography>
                          <Typography variant="body1" paragraph>
                            {record.testResult.testName}
                          </Typography>

                          <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                            Results
                          </Typography>
                          <Typography variant="body1" paragraph>
                            {record.testResult.results}
                          </Typography>

                          <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                            Normal Range
                          </Typography>
                          <Typography variant="body1" paragraph>
                            {record.testResult.normalRange || 'Not specified'}
                          </Typography>

                          <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                            Notes
                          </Typography>
                          <Typography variant="body1">
                            {record.testResult.notes || 'No additional notes'}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Box>
                  ) : record.type === 'prescription' && record.prescription ? (
                    <Box>
                      <Card sx={{ mb: 3, bgcolor: theme.palette.background.default }}>
                        <CardContent>
                          <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                            Medications
                          </Typography>
                          {record.prescription.medications.map((medication, index) => (
                            <Box key={index} sx={{ mb: 2 }}>
                              <Typography variant="body1" fontWeight="medium">
                                {medication.name} - {medication.dosage}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {medication.frequency} - {medication.duration}
                              </Typography>
                              {medication.instructions && (
                                <Typography variant="body2">
                                  Instructions: {medication.instructions}
                                </Typography>
                              )}
                            </Box>
                          ))}

                          <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                            Notes
                          </Typography>
                          <Typography variant="body1">
                            {record.prescription.notes || 'No additional notes'}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Box>
                  ) : (
                    <Typography variant="body1">
                      {record.summary || 'No detailed information available for this record.'}
                    </Typography>
                  )}
                </Paper>
              </motion.div>
            </Grid>
          </Grid>
        )}
      </Container>
    </Box>
  );
};

export default MedicalRecordPage;