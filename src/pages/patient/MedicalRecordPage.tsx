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
import TranslateIcon from '@mui/icons-material/Translate';
import { useAuth } from '../../contexts/AuthContext';
import { getMedicalRecord } from '../../services/medicalRecordService';
import { getUserById } from '../../services/userService';
import { translateText } from '../../utils/aiUtils';
import { formatDate, formatFileSize } from '../../utils/helpers';
import { MedicalRecord, Patient, Doctor, Attachment } from '../../types';

const MedicalRecordPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { recordId } = useParams<{ recordId: string }>();
  const { currentUser } = useAuth();
  
  const [record, setRecord] = useState<MedicalRecord | null>(null);
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [translating, setTranslating] = useState(false);
  const [translatedContent, setTranslatedContent] = useState<{[key: string]: string}>({});
  const [selectedLanguage, setSelectedLanguage] = useState('en');

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
        
        // Check if the current user is the patient this record belongs to
        if (currentUser.role === 'patient' && recordData.patientId !== currentUser.uid) {
          setError('You do not have permission to view this record');
          setLoading(false);
          return;
        }
        
        setRecord(recordData);

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

  const handleTranslate = async (language: string, textKey: string, text: string) => {
    if (!text) return;
    
    try {
      setTranslating(true);
      setSelectedLanguage(language);
      
      // Check if we already have a translation for this text in this language
      if (translatedContent[`${textKey}_${language}`]) {
        setTranslating(false);
        return;
      }
      
      const translated = await translateText(text, language);
      
      setTranslatedContent(prev => ({
        ...prev,
        [`${textKey}_${language}`]: translated
      }));
    } catch (err) {
      console.error('Translation error:', err);
    } finally {
      setTranslating(false);
    }
  };

  const getContent = (textKey: string, originalText: string) => {
    return translatedContent[`${textKey}_${selectedLanguage}`] || originalText;
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

                  <Divider sx={{ my: 2 }} />

                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle1" fontWeight="medium">
                      Translation
                    </Typography>
                    <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
                      <Chip 
                        label="English" 
                        size="small" 
                        color={selectedLanguage === 'en' ? 'primary' : 'default'}
                        onClick={() => setSelectedLanguage('en')}
                        clickable
                      />
                      <Chip 
                        label="Hindi" 
                        size="small" 
                        color={selectedLanguage === 'hi' ? 'primary' : 'default'}
                        onClick={() => {
                          if (record.type === 'consultation') {
                            const consultationRecord = record as Consultation;
                            handleTranslate('hi', 'symptoms', consultationRecord.symptoms.join(', ') || '');
                            handleTranslate('hi', 'diagnosis', consultationRecord.diagnosis || '');
                            handleTranslate('hi', 'notes', consultationRecord.notes || '');
                            if (record.consultation.aiSummary) {
                              handleTranslate('hi', 'aiSummary', record.consultation.aiSummary.content);
                            }
                          } else if (record.type === 'prescription' && record.prescription) {
                            handleTranslate('hi', 'notes', record.prescription.notes || '');
                          }
                        }}
                        clickable
                      />
                      <Chip 
                        label="Malayalam" 
                        size="small" 
                        color={selectedLanguage === 'ml' ? 'primary' : 'default'}
                        onClick={() => {
                          if (record.type === 'consultation' && record.consultation) {
                            handleTranslate('ml', 'symptoms', record.consultation.symptoms || '');
                            handleTranslate('ml', 'diagnosis', record.consultation.diagnosis || '');
                            handleTranslate('ml', 'notes', record.consultation.notes || '');
                            if (record.consultation.aiSummary) {
                              handleTranslate('ml', 'aiSummary', record.consultation.aiSummary.content);
                            }
                          } else if (record.type === 'prescription' && record.prescription) {
                            handleTranslate('ml', 'notes', record.prescription.notes || '');
                          }
                        }}
                        clickable
                      />
                    </Box>
                  </Box>
                  {translating && (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 1 }}>
                      <CircularProgress size={20} sx={{ mr: 1 }} />
                      <Typography variant="body2">Translating...</Typography>
                    </Box>
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
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" fontWeight="medium">
                      {record.type === 'consultation' ? 'Consultation Summary' : 
                      record.type === 'test' ? 'Test Results' : 
                      record.type === 'prescription' ? 'Prescription Details' : 
                      'Record Details'}
                    </Typography>
                    {selectedLanguage !== 'en' && (
                      <Chip 
                        icon={<TranslateIcon fontSize="small" />}
                        label={selectedLanguage === 'hi' ? 'Hindi' : selectedLanguage === 'ml' ? 'Malayalam' : 'Translated'} 
                        size="small" 
                        color="secondary" 
                        sx={{ ml: 2 }} 
                      />
                    )}
                  </Box>

                  {record.type === 'consultation' && record.consultation ? (
                    <Box>
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
                              {getContent('aiSummary', record.consultation.aiSummary.content)}
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

                      <Card sx={{ mb: 3, bgcolor: theme.palette.background.default }}>
                        <CardContent>
                          <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                            Symptoms
                          </Typography>
                          <Typography variant="body1" paragraph>
                            {getContent('symptoms', record.consultation.symptoms || 'No symptoms recorded')}
                          </Typography>

                          <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                            Diagnosis
                          </Typography>
                          <Typography variant="body1" paragraph>
                            {getContent('diagnosis', record.consultation.diagnosis || 'No diagnosis recorded')}
                          </Typography>

                          <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                            Notes
                          </Typography>
                          <Typography variant="body1">
                            {getContent('notes', record.consultation.notes || 'No additional notes')}
                          </Typography>
                        </CardContent>
                      </Card>

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
                            {getContent('notes', record.prescription.notes || 'No additional notes')}
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