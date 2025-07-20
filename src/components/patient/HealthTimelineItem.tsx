import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  useTheme
} from '@mui/material';
import {
  MedicalServices as MedicalServicesIcon,
  Medication as MedicationIcon,
  Science as ScienceIcon,
  Event as EventIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';

export interface HealthTimelineEvent {
  id: string;
  title: string;
  date: string;
  type: 'consultation' | 'prescription' | 'test' | 'appointment';
  description: string;
  doctor?: string;
  status?: 'completed' | 'scheduled' | 'cancelled';
}

interface HealthTimelineItemProps {
  event: HealthTimelineEvent;
  isLast?: boolean;
  onClick?: () => void;
}

const HealthTimelineItem: React.FC<HealthTimelineItemProps> = ({ 
  event, 
  isLast = false,
  onClick 
}) => {
  const theme = useTheme();

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'consultation':
        return <MedicalServicesIcon />;
      case 'prescription':
        return <MedicationIcon />;
      case 'test':
        return <ScienceIcon />;
      case 'appointment':
        return <EventIcon />;
      default:
        return <EventIcon />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'consultation':
        return theme.palette.primary.main;
      case 'prescription':
        return theme.palette.success.main;
      case 'test':
        return theme.palette.info.main;
      case 'appointment':
        return theme.palette.warning.main;
      default:
        return theme.palette.grey[500];
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'scheduled':
        return 'info';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getEventTypeLabel = (type: string) => {
    switch (type) {
      case 'consultation':
        return 'Consultation';
      case 'prescription':
        return 'Prescription';
      case 'test':
        return 'Test Results';
      case 'appointment':
        return 'Appointment';
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  return (
    <Box sx={{ display: 'flex', mb: isLast ? 0 : 3 }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          mr: 2,
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            backgroundColor: getEventColor(event.type),
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            color: '#fff',
            zIndex: 1,
          }}
          component={motion.div}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          {getEventIcon(event.type)}
        </Box>
        {!isLast && (
          <Box
            sx={{
              width: 2,
              flexGrow: 1,
              backgroundColor: theme.palette.divider,
              mt: 1,
            }}
            component={motion.div}
            initial={{ height: 0 }}
            animate={{ height: '100%' }}
            transition={{ duration: 0.5 }}
          />
        )}
      </Box>

      <Paper
        elevation={1}
        sx={{
          p: 2,
          borderRadius: 2,
          flexGrow: 1,
          borderLeft: `4px solid ${getEventColor(event.type)}`,
        }}
        component={motion.div}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Box>
            <Typography variant="h6" component="h3">
              {event.title}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5, flexWrap: 'wrap', gap: 1 }}>
              <Chip
                label={getEventTypeLabel(event.type)}
                size="small"
                color="primary"
                variant="outlined"
              />
              {event.status && (
                <Chip
                  label={event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                  size="small"
                  color={getStatusColor(event.status) as any}
                  variant="outlined"
                />
              )}
              <Typography variant="caption" color="text.secondary">
                {formatDate(event.date)}
              </Typography>
            </Box>
          </Box>
          {onClick && (
            <Tooltip title="View details">
              <IconButton size="small" onClick={onClick}>
                <ArrowForwardIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        <Typography variant="body2" color="text.secondary">
          {event.description}
        </Typography>

        {event.doctor && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic' }}>
            Doctor: {event.doctor}
          </Typography>
        )}
      </Paper>
    </Box>
  );
};

export default HealthTimelineItem;