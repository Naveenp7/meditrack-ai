import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Avatar,
  Chip,
  Rating,
  Button,
  Divider,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  AccessTime as AccessTimeIcon,
  Verified as VerifiedIcon,
  Info as InfoIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';

export interface DoctorInfo {
  id: string;
  name: string;
  specialty: string;
  hospital?: string;
  location?: string;
  experience?: number;
  rating?: number;
  reviewCount?: number;
  availability?: string;
  photoUrl?: string;
  verified?: boolean;
  isFavorite?: boolean;
}

interface DoctorCardProps {
  doctor: DoctorInfo;
  onSelect?: () => void;
  onViewProfile?: () => void;
  onToggleFavorite?: () => void;
  selected?: boolean;
}

const DoctorCard: React.FC<DoctorCardProps> = ({
  doctor,
  onSelect,
  onViewProfile,
  onToggleFavorite,
  selected = false
}) => {
  return (
    <Card
      component={motion.div}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      sx={{
        borderRadius: 2,
        overflow: 'hidden',
        border: selected ? 2 : 0,
        borderColor: 'primary.main',
        boxShadow: selected
          ? (theme) => `0 0 0 2px ${theme.palette.primary.main}`
          : (theme) => theme.palette.mode === 'dark'
            ? '0 4px 20px rgba(0,0,0,0.25)'
            : '0 4px 20px rgba(0,0,0,0.1)',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: (theme) => theme.palette.mode === 'dark'
            ? '0 8px 25px rgba(0,0,0,0.3)'
            : '0 8px 25px rgba(0,0,0,0.15)'
        },
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Box
        sx={{
          position: 'relative',
          bgcolor: (theme) => theme.palette.mode === 'dark' ? 'grey.800' : 'grey.100',
          p: 2,
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <Avatar
          src={doctor.photoUrl}
          alt={doctor.name}
          sx={{
            width: 70,
            height: 70,
            border: '2px solid white',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}
        >
          {!doctor.photoUrl && doctor.name.charAt(0)}
        </Avatar>

        {doctor.verified && (
          <Tooltip title="Verified Doctor">
            <VerifiedIcon
              color="primary"
              sx={{
                position: 'absolute',
                top: 16,
                right: 16,
                bgcolor: 'background.paper',
                borderRadius: '50%',
                p: 0.5,
                boxShadow: 1
              }}
            />
          </Tooltip>
        )}

        {onToggleFavorite && (
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
            sx={{
              position: 'absolute',
              top: doctor.verified ? 56 : 16,
              right: 16,
              bgcolor: 'background.paper',
              boxShadow: 1,
              '&:hover': { bgcolor: 'background.paper' }
            }}
            size="small"
          >
            {doctor.isFavorite ? (
              <FavoriteIcon fontSize="small" color="error" />
            ) : (
              <FavoriteBorderIcon fontSize="small" />
            )}
          </IconButton>
        )}

        <Box sx={{ ml: 2 }}>
          <Typography variant="h6" component="h2">
            {doctor.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {doctor.specialty}
          </Typography>
          {doctor.rating !== undefined && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Rating
                value={doctor.rating}
                precision={0.5}
                size="small"
                readOnly
              />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                ({doctor.reviewCount || 0})
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      <CardContent sx={{ flexGrow: 1, py: 2 }}>
        {doctor.experience !== undefined && (
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>Experience:</strong> {doctor.experience} years
          </Typography>
        )}

        {doctor.hospital && (
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>Hospital:</strong> {doctor.hospital}
          </Typography>
        )}

        {doctor.location && (
          <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
            <LocationIcon fontSize="small" color="action" sx={{ mr: 1, mt: 0.3 }} />
            <Typography variant="body2">{doctor.location}</Typography>
          </Box>
        )}

        {doctor.availability && (
          <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
            <AccessTimeIcon fontSize="small" color="action" sx={{ mr: 1, mt: 0.3 }} />
            <Typography variant="body2">{doctor.availability}</Typography>
          </Box>
        )}
      </CardContent>

      <Divider />

      <CardActions sx={{ p: 2, pt: 1.5, pb: 1.5 }}>
        {onViewProfile && (
          <Button
            startIcon={<InfoIcon />}
            size="small"
            onClick={onViewProfile}
          >
            View Profile
          </Button>
        )}

        {onSelect && (
          <Button
            variant={selected ? "contained" : "outlined"}
            color="primary"
            size="small"
            onClick={onSelect}
            sx={{ ml: 'auto' }}
          >
            {selected ? 'Selected' : 'Select'}
          </Button>
        )}
      </CardActions>
    </Card>
  );
};

export default DoctorCard;