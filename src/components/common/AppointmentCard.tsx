import React from 'react';
import { 
  Card, 
  CardContent, 
  CardActionArea,
  Typography, 
  Box, 
  Avatar, 
  Chip,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import { 
  MoreVert as MoreIcon,
  Event as EventIcon,
  AccessTime as TimeIcon,
  Cancel as CancelIcon,
  Edit as EditIcon,
  CheckCircle as ConfirmIcon,
  MedicalInformation as MedicalIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { Appointment } from '../../types';

interface AppointmentCardProps {
  appointment: Appointment;
  userRole: 'doctor' | 'patient';
  onViewDetails?: (appointmentId: string) => void;
  onCancel?: (appointmentId: string) => void;
  onReschedule?: (appointmentId: string) => void;
  onConfirm?: (appointmentId: string) => void;
  onStartConsultation?: (appointmentId: string) => void;
}

const AppointmentCard: React.FC<AppointmentCardProps> = ({ 
  appointment, 
  userRole,
  onViewDetails,
  onCancel,
  onReschedule,
  onConfirm,
  onStartConsultation
}) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = (event?: React.MouseEvent<HTMLElement> | {}, reason?: "backdropClick" | "escapeKeyDown") => {
    if (event) {
      if ('stopPropagation' in event) {
        event.stopPropagation();
      }
    }
    setAnchorEl(null);
  };
  
  const handleViewDetails = () => {
    handleMenuClose();
    if (onViewDetails) {
      onViewDetails(appointment.id);
    }
  };
  
  const handleCancel = (event?: React.MouseEvent<HTMLElement>) => {
    if (event) {
      event.stopPropagation();
    }
    handleMenuClose();
    if (onCancel) {
      onCancel(appointment.id);
    }
  };
  
  const handleReschedule = (event?: React.MouseEvent<HTMLElement>) => {
    if (event) {
      event.stopPropagation();
    }
    handleMenuClose();
    if (onReschedule) {
      onReschedule(appointment.id);
    }
  };
  
  const handleConfirm = (event?: React.MouseEvent<HTMLElement>) => {
    if (event) {
      event.stopPropagation();
    }
    handleMenuClose();
    if (onConfirm) {
      onConfirm(appointment.id);
    }
  };
  
  const handleStartConsultation = (event?: React.MouseEvent<HTMLElement>) => {
    if (event) {
      event.stopPropagation();
    }
    handleMenuClose();
    if (onStartConsultation) {
      onStartConsultation(appointment.id);
    }
  };
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };
  
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const getStatusColor = () => {
    switch (appointment.status) {
      case 'confirmed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'error';
      case 'completed':
        return 'info';
      default:
        return 'default';
    }
  };
  
  const getStatusLabel = () => {
    return appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1);
  };
  
  const personDetails = userRole === 'doctor' ? appointment.patient : appointment.doctor;
  
  return (
    <Card 
      component={motion.div}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }}
      sx={{ 
        height: '100%',
        borderLeft: 3,
        borderColor: `${getStatusColor()}.main`
      }}
    >
      <CardActionArea onClick={handleViewDetails}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar 
                src={personDetails.photoURL || undefined} 
                sx={{ width: 50, height: 50, mr: 2 }}
              >
                {!personDetails.photoURL && getInitials(personDetails.displayName)}
              </Avatar>
              
              <Box>
                <Typography variant="h6" component="div">
                  {personDetails.displayName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {userRole === 'doctor' ? 'Patient' : 'Doctor'}
                  {userRole === 'doctor' && appointment.reason && ` • ${appointment.reason}`}
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip 
                    label={getStatusLabel()} 
                    color={getStatusColor() as any} 
                    size="small" 
                    sx={{ height: 20, fontSize: '0.7rem' }} 
                  />
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
              <MenuItem onClick={handleViewDetails}>
                <ListItemIcon>
                  <EventIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>View Details</ListItemText>
              </MenuItem>
              
              {appointment.status === 'pending' && (
                <MenuItem onClick={handleConfirm}>
                  <ListItemIcon>
                    <ConfirmIcon fontSize="small" color="success" />
                  </ListItemIcon>
                  <ListItemText>Confirm Appointment</ListItemText>
                </MenuItem>
              )}
              
              {(appointment.status === 'confirmed' && userRole === 'doctor') && (
                <MenuItem onClick={handleStartConsultation}>
                  <ListItemIcon>
                    <MedicalIcon fontSize="small" color="primary" />
                  </ListItemIcon>
                  <ListItemText>Start Consultation</ListItemText>
                </MenuItem>
              )}
              
              {(appointment.status === 'pending' || appointment.status === 'confirmed') && (
                <>
                  <MenuItem onClick={handleReschedule}>
                    <ListItemIcon>
                      <EditIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Reschedule</ListItemText>
                  </MenuItem>
                  
                  <Divider />
                  
                  <MenuItem onClick={handleCancel}>
                    <ListItemIcon>
                      <CancelIcon fontSize="small" color="error" />
                    </ListItemIcon>
                    <ListItemText sx={{ color: 'error.main' }}>Cancel Appointment</ListItemText>
                  </MenuItem>
                </>
              )}
            </Menu>
          </Box>
          
          <Divider sx={{ my: 2 }} />
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <EventIcon fontSize="small" color="action" sx={{ mr: 1 }} />
              <Typography variant="body2">
                {formatDate(new Date(appointment.date))}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <TimeIcon fontSize="small" color="action" sx={{ mr: 1 }} />
              <Typography variant="body2">
                {formatTime(new Date(appointment.date))} - {formatTime(new Date(appointment.date))}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default AppointmentCard;