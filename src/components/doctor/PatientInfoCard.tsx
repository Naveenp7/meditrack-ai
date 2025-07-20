import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Avatar,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Tooltip,
  Button
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Cake as CakeIcon,
  Wc as WcIcon,
  MedicalInformation as MedicalInformationIcon,
  Medication as MedicationIcon,
  Warning as WarningIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { Link as RouterLink } from 'react-router-dom';

export interface PatientInfo {
  id: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  bloodType?: string;
  allergies?: string[];
  medications?: string[];
  photoUrl?: string;
}

interface PatientInfoCardProps {
  patient: PatientInfo;
  onViewProfile?: () => void;
}

const PatientInfoCard: React.FC<PatientInfoCardProps> = ({ patient, onViewProfile }) => {
  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();
    
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  return (
    <Card
      component={motion.div}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      sx={{ 
        borderRadius: 2,
        overflow: 'visible',
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <CardContent sx={{ p: 0, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Box 
          sx={{ 
            p: 2, 
            display: 'flex', 
            alignItems: 'center',
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            borderTopLeftRadius: 8,
            borderTopRightRadius: 8
          }}
        >
          <Avatar 
            src={patient.photoUrl} 
            alt={patient.name}
            sx={{ 
              width: 60, 
              height: 60, 
              border: '2px solid white',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
          >
            {!patient.photoUrl && patient.name.charAt(0)}
          </Avatar>
          <Box sx={{ ml: 2, flexGrow: 1 }}>
            <Typography variant="h6" component="h2">
              {patient.name}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, mt: 0.5 }}>
              <Chip 
                icon={<WcIcon fontSize="small" />} 
                label={patient.gender} 
                size="small" 
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'inherit' }} 
              />
              <Chip 
                icon={<CakeIcon fontSize="small" />} 
                label={`${calculateAge(patient.dateOfBirth)} years`} 
                size="small" 
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'inherit' }} 
              />
              {patient.bloodType && (
                <Chip 
                  icon={<MedicalInformationIcon fontSize="small" />} 
                  label={`Blood: ${patient.bloodType}`} 
                  size="small" 
                  sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'inherit' }} 
                />
              )}
            </Box>
          </Box>
          {onViewProfile && (
            <Tooltip title="View full profile">
              <IconButton 
                color="inherit" 
                onClick={onViewProfile}
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}
              >
                <ArrowForwardIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        <Box sx={{ p: 2, flexGrow: 1 }}>
          <List dense disablePadding>
            <ListItem disableGutters>
              <ListItemIcon sx={{ minWidth: 40 }}>
                <EmailIcon color="action" fontSize="small" />
              </ListItemIcon>
              <ListItemText 
                primary="Email" 
                secondary={patient.email} 
                primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                secondaryTypographyProps={{ variant: 'body2' }}
              />
            </ListItem>
            
            <ListItem disableGutters>
              <ListItemIcon sx={{ minWidth: 40 }}>
                <PhoneIcon color="action" fontSize="small" />
              </ListItemIcon>
              <ListItemText 
                primary="Phone" 
                secondary={patient.phone} 
                primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                secondaryTypographyProps={{ variant: 'body2' }}
              />
            </ListItem>
            
            <ListItem disableGutters>
              <ListItemIcon sx={{ minWidth: 40 }}>
                <PersonIcon color="action" fontSize="small" />
              </ListItemIcon>
              <ListItemText 
                primary="Patient ID" 
                secondary={patient.id} 
                primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                secondaryTypographyProps={{ variant: 'body2' }}
              />
            </ListItem>
          </List>

          {(patient.allergies && patient.allergies.length > 0) && (
            <>
              <Divider sx={{ my: 1.5 }} />
              <Box>
                <Typography variant="subtitle2" color="error" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <WarningIcon fontSize="small" sx={{ mr: 0.5 }} />
                  Allergies
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {patient.allergies.map((allergy, index) => (
                    <Chip 
                      key={index} 
                      label={allergy} 
                      size="small" 
                      color="error" 
                      variant="outlined" 
                    />
                  ))}
                </Box>
              </Box>
            </>
          )}

          {(patient.medications && patient.medications.length > 0) && (
            <>
              <Divider sx={{ my: 1.5 }} />
              <Box>
                <Typography variant="subtitle2" color="primary" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <MedicationIcon fontSize="small" sx={{ mr: 0.5 }} />
                  Current Medications
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {patient.medications.map((medication, index) => (
                    <Chip 
                      key={index} 
                      label={medication} 
                      size="small" 
                      color="primary" 
                      variant="outlined" 
                    />
                  ))}
                </Box>
              </Box>
            </>
          )}
        </Box>
      </CardContent>

      <Divider />
      
      <Box sx={{ p: 1.5, display: 'flex', justifyContent: 'flex-end' }}>
        <Button 
          component={RouterLink} 
          to={`/doctor/patients/${patient.id}/records`}
          size="small"
          endIcon={<ArrowForwardIcon />}
        >
          View Medical Records
        </Button>
      </Box>
    </Card>
  );
};

export default PatientInfoCard;