import React from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  IconButton, 
  Chip,
  CardActionArea
} from '@mui/material';
import { 
  Close as CloseIcon,
  Notifications as NotificationIcon,
  CalendarMonth as CalendarIcon,
  MedicalInformation as MedicalIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';

export type NotificationType = 'appointment' | 'medical' | 'system' | 'user';

export interface NotificationData {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  data?: Record<string, any>;
}

interface NotificationCardProps {
  notification: NotificationData;
  onClose?: (id: string) => void;
  onClick?: (notification: NotificationData) => void;
}

const NotificationCard: React.FC<NotificationCardProps> = ({ 
  notification, 
  onClose,
  onClick
}) => {
  const { id, type, title, message, timestamp, read } = notification;
  
  const getTypeIcon = () => {
    switch (type) {
      case 'appointment':
        return <CalendarIcon color="primary" />;
      case 'medical':
        return <MedicalIcon color="error" />;
      case 'user':
        return <PersonIcon color="info" />;
      case 'system':
      default:
        return <NotificationIcon color="warning" />;
    }
  };
  
  const getTypeColor = () => {
    switch (type) {
      case 'appointment':
        return 'primary';
      case 'medical':
        return 'error';
      case 'user':
        return 'info';
      case 'system':
      default:
        return 'warning';
    }
  };
  
  const getTypeLabel = () => {
    switch (type) {
      case 'appointment':
        return 'Appointment';
      case 'medical':
        return 'Medical';
      case 'user':
        return 'User';
      case 'system':
      default:
        return 'System';
    }
  };
  
  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInSecs = Math.floor(diffInMs / 1000);
    const diffInMins = Math.floor(diffInSecs / 60);
    const diffInHours = Math.floor(diffInMins / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    
    if (diffInSecs < 60) {
      return 'Just now';
    } else if (diffInMins < 60) {
      return `${diffInMins} ${diffInMins === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };
  
  const handleClick = () => {
    if (onClick) {
      onClick(notification);
    }
  };
  
  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClose) {
      onClose(id);
    }
  };
  
  const cardContent = (
    <>
      <CardContent sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            {getTypeIcon()}
            <Chip 
              label={getTypeLabel()} 
              color={getTypeColor() as any} 
              size="small" 
              variant="outlined" 
            />
            {!read && (
              <Box 
                sx={{ 
                  width: 8, 
                  height: 8, 
                  borderRadius: '50%', 
                  bgcolor: 'primary.main',
                  ml: 1
                }} 
              />
            )}
          </Box>
          {onClose && (
            <IconButton size="small" onClick={handleClose}>
              <CloseIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
        
        <Typography variant="subtitle1" component="div" sx={{ fontWeight: !read ? 'bold' : 'normal' }}>
          {title}
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {message}
        </Typography>
        
        <Typography variant="caption" color="text.secondary">
          {formatTimestamp(timestamp)}
        </Typography>
      </CardContent>
    </>
  );
  
  return (
    <Card 
      component={motion.div}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      whileHover={{ scale: 1.02 }}
      sx={{ 
        mb: 2, 
        borderLeft: 3, 
        borderColor: `${getTypeColor()}.main`,
        bgcolor: !read ? 'action.hover' : 'background.paper'
      }}
    >
      {onClick ? (
        <CardActionArea onClick={handleClick}>
          {cardContent}
        </CardActionArea>
      ) : (
        cardContent
      )}
    </Card>
  );
};

export default NotificationCard;