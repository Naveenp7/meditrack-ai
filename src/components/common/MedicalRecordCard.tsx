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
  Divider,
  Badge
} from '@mui/material';
import { 
  MoreVert as MoreIcon,
  Description as DescriptionIcon,
  MedicalInformation as MedicalIcon,
  Science as ScienceIcon,
  Medication as MedicationIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AttachFile as AttachmentIcon,
  Translate as TranslateIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { MedicalRecord } from '../../types';

interface MedicalRecordCardProps {
  record: MedicalRecord;
  userRole: 'doctor' | 'patient';
  onViewDetails?: (recordId: string) => void;
  onEdit?: (recordId: string) => void;
  onDelete?: (recordId: string) => void;
  onTranslate?: (recordId: string) => void;
}

const MedicalRecordCard: React.FC<MedicalRecordCardProps> = ({ 
  record, 
  userRole,
  onViewDetails,
  onEdit,
  onDelete,
  onTranslate
}) => {
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
  
  const handleViewDetails = () => {
    handleMenuClose();
    if (onViewDetails) {
      onViewDetails(record.id);
    }
  };
  
  const handleEdit = (event?: React.MouseEvent<HTMLElement>) => {
    if (event) {
      event.stopPropagation();
    }
    handleMenuClose();
    if (onEdit) {
      onEdit(record.id);
    }
  };
  
  const handleDelete = (event?: React.MouseEvent<HTMLElement>) => {
    if (event) {
      event.stopPropagation();
    }
    handleMenuClose();
    if (onDelete) {
      onDelete(record.id);
    }
  };
  
  const handleTranslate = (event?: React.MouseEvent<HTMLElement>) => {
    if (event) {
      event.stopPropagation();
    }
    handleMenuClose();
    if (onTranslate) {
      onTranslate(record.id);
    }
  };
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };
  
  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  const getRecordTypeIcon = () => {
    switch (record.type) {
      case 'consultation':
        return <MedicalIcon color="primary" />;
      case 'test':
        return <ScienceIcon color="info" />;
      case 'prescription':
        return <MedicationIcon color="success" />;
      default:
        return <DescriptionIcon color="action" />;
    }
  };
  
  const getRecordTypeLabel = () => {
    return record.type.charAt(0).toUpperCase() + record.type.slice(1);
  };
  
  const getRecordTypeColor = () => {
    switch (record.type) {
      case 'consultation':
        return 'primary';
      case 'test':
        return 'info';
      case 'prescription':
        return 'success';
      default:
        return 'default';
    }
  };
  
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };
  
  const personDetails = userRole === 'doctor' ? record.patientDetails : record.doctorDetails;
  
  return (
    <Card 
      component={motion.div}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }}
      sx={{ 
        height: '100%',
        borderLeft: 3,
        borderColor: `${getRecordTypeColor()}.main`
      }}
    >
      <CardActionArea onClick={handleViewDetails}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar 
                sx={{ 
                  width: 50, 
                  height: 50, 
                  mr: 2, 
                  bgcolor: `${getRecordTypeColor()}.light`,
                  color: `${getRecordTypeColor()}.dark`
                }}
              >
                {getRecordTypeIcon()}
              </Avatar>
              
              <Box>
                <Typography variant="h6" component="div">
                  {record.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {personDetails.displayName} • {userRole === 'doctor' ? 'Patient' : 'Doctor'}
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip 
                    label={getRecordTypeLabel()} 
                    color={getRecordTypeColor() as any} 
                    size="small" 
                    sx={{ height: 20, fontSize: '0.7rem' }} 
                  />
                </Box>
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {record.attachments && record.attachments.length > 0 && (
                <Badge badgeContent={record.attachments.length} color="secondary" sx={{ mr: 1 }}>
                  <AttachmentIcon color="action" fontSize="small" />
                </Badge>
              )}
              
              <IconButton onClick={handleMenuOpen} size="small">
                <MoreIcon />
              </IconButton>
            </Box>
            
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={(_, reason) => {
                if (reason === "backdropClick" || reason === "escapeKeyDown") {
                  handleMenuClose();
                }
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <MenuItem onClick={handleViewDetails}>
                <ListItemIcon>
                  <DescriptionIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>View Details</ListItemText>
              </MenuItem>
              
              {userRole === 'patient' && (
                <MenuItem onClick={handleTranslate}>
                  <ListItemIcon>
                    <TranslateIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Translate Content</ListItemText>
                </MenuItem>
              )}
              
              {userRole === 'doctor' && (
                <>
                  <MenuItem onClick={handleEdit}>
                    <ListItemIcon>
                      <EditIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Edit Record</ListItemText>
                  </MenuItem>
                  
                  <Divider />
                  
                  <MenuItem onClick={handleDelete}>
                    <ListItemIcon>
                      <DeleteIcon fontSize="small" color="error" />
                    </ListItemIcon>
                    <ListItemText sx={{ color: 'error.main' }}>Delete Record</ListItemText>
                  </MenuItem>
                </>
              )}
            </Menu>
          </Box>
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="body2" color="text.secondary" paragraph>
            {record.description ? truncateText(record.description, 100) : 'No description provided.'}
          </Typography>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Created: {formatDate(record.createdAt)}
            </Typography>
            
            {record.updatedAt && new Date(record.updatedAt).getTime() !== new Date(record.createdAt).getTime() && (
              <Typography variant="caption" color="text.secondary">
                Updated: {formatDate(record.updatedAt)}
              </Typography>
            )}
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default MedicalRecordCard;