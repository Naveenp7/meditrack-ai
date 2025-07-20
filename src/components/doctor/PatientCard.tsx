import React from 'react';
import { 
  Card, 
  CardContent, 
  CardActionArea,
  Typography, 
  Box, 
  Avatar, 
  Chip,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import { 
  MoreVert as MoreIcon,
  CalendarMonth as CalendarIcon,
  MedicalInformation as MedicalIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { User } from '../../types';

interface PatientCardProps {
  patient: User;
  onViewProfile?: (patientId: string) => void;
  onStartObservation?: (patientId: string) => void;
  onViewRecords?: (patientId: string) => void;
  onRemovePatient?: (patientId: string) => void;
}

const PatientCard: React.FC<PatientCardProps> = ({ 
  patient, 
  onViewProfile,
  onStartObservation,
  onViewRecords,
  onRemovePatient
}) => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = (event?: React.MouseEvent<HTMLElement>) => {
    if (event) {
      event.stopPropagation();
    }
    setAnchorEl(null);
  };
  
  const handleViewProfile = () => {
    handleMenuClose();
    if (onViewProfile) {
      onViewProfile(patient.id);
    } else {
      navigate(`/doctor/patients/${patient.id}`);
    }
  };
  
  const handleStartObservation = (event?: React.MouseEvent<HTMLElement>) => {
    if (event) {
      event.stopPropagation();
    }
    handleMenuClose();
    if (onStartObservation) {
      onStartObservation(patient.id);
    } else {
      navigate(`/doctor/observation/${patient.id}`);
    }
  };
  
  const handleViewRecords = (event?: React.MouseEvent<HTMLElement>) => {
    if (event) {
      event.stopPropagation();
    }
    handleMenuClose();
    if (onViewRecords) {
      onViewRecords(patient.id);
    }
  };
  
  const handleRemovePatient = (event?: React.MouseEvent<HTMLElement>) => {
    if (event) {
      event.stopPropagation();
    }
    handleMenuClose();
    if (onRemovePatient) {
      onRemovePatient(patient.id);
    }
  };
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };
  
  const calculateAge = (dob: Date) => {
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    
    return age;
  };
  
  return (
    <Card 
      component={motion.div}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }}
      sx={{ height: '100%' }}
    >
      <CardActionArea onClick={handleViewProfile}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar 
                src={patient.photoURL || undefined} 
                sx={{ width: 56, height: 56, mr: 2 }}
              >
                {!patient.photoURL && getInitials(patient.displayName)}
              </Avatar>
              
              <Box>
                <Typography variant="h6" component="div">
                  {patient.displayName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {patient.email}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                  <Chip 
                    label={patient.gender} 
                    size="small" 
                    sx={{ mr: 1, height: 20, fontSize: '0.7rem' }} 
                  />
                  <Typography variant="body2" color="text.secondary">
                    {patient.dateOfBirth && `${calculateAge(new Date(patient.dateOfBirth))} years`}
                  </Typography>
                </Box>
              </Box>
            </Box>
            
            <IconButton onClick={handleMenuOpen} size="small">
              <MoreIcon />
            </IconButton>
            
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              onClick={(e) => e.stopPropagation()}
            >
              <MenuItem onClick={handleViewProfile}>
                <ListItemIcon>
                  <PersonIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>View Profile</ListItemText>
              </MenuItem>
              <MenuItem onClick={handleStartObservation}>
                <ListItemIcon>
                  <MedicalIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Start Observation</ListItemText>
              </MenuItem>
              <MenuItem onClick={handleViewRecords}>
                <ListItemIcon>
                  <CalendarIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>View Records</ListItemText>
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleRemovePatient}>
                <ListItemIcon>
                  <DeleteIcon fontSize="small" color="error" />
                </ListItemIcon>
                <ListItemText sx={{ color: 'error.main' }}>Remove Patient</ListItemText>
              </MenuItem>
            </Menu>
          </Box>
          
          <Divider sx={{ my: 2 }} />
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Phone
              </Typography>
              <Typography variant="body2">
                {patient.phoneNumber || 'N/A'}
              </Typography>
            </Box>
            
            <Box>
              <Typography variant="caption" color="text.secondary">
                Last Visit
              </Typography>
              <Typography variant="body2">
                {patient.lastVisit ? new Date(patient.lastVisit).toLocaleDateString() : 'Never'}
              </Typography>
            </Box>
            
            <Box>
              <Typography variant="caption" color="text.secondary">
                Records
              </Typography>
              <Typography variant="body2">
                {patient.recordCount || 0}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default PatientCard;