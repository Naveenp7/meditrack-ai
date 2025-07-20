import React from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  IconButton, 
  Tooltip,
  LinearProgress,
  CircularProgress
} from '@mui/material';
import { Info as InfoIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  color?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
  trend?: {
    value: number;
    label: string;
    isPositive: boolean;
  };
  progress?: {
    value: number;
    total?: number;
    type?: 'linear' | 'circular';
  };
  onClick?: () => void;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon,
  description,
  color = 'primary',
  trend,
  progress,
  onClick
}) => {
  const cardVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    hover: { y: -5, boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }
  };

  const getProgressColor = () => {
    if (!progress) return color;
    
    const percentage = progress.total ? (progress.value / progress.total) * 100 : progress.value;
    
    if (percentage < 30) return 'error';
    if (percentage < 70) return 'warning';
    return 'success';
  };

  const renderProgress = () => {
    if (!progress) return null;
    
    const progressColor = getProgressColor();
    const percentage = progress.total ? (progress.value / progress.total) * 100 : progress.value;
    
    if (progress.type === 'circular') {
      return (
        <Box sx={{ position: 'relative', display: 'inline-flex', mt: 1 }}>
          <CircularProgress 
            variant="determinate" 
            value={percentage} 
            color={progressColor as any}
            size={40}
          />
          <Box
            sx={{
              top: 0,
              left: 0,
              bottom: 0,
              right: 0,
              position: 'absolute',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="caption" component="div" color="text.secondary">
              {`${Math.round(percentage)}%`}
            </Typography>
          </Box>
        </Box>
      );
    }
    
    return (
      <Box sx={{ width: '100%', mt: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="caption" color="text.secondary">
            {progress.value}{progress.total ? ` / ${progress.total}` : ''}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {`${Math.round(percentage)}%`}
          </Typography>
        </Box>
        <LinearProgress 
          variant="determinate" 
          value={percentage} 
          color={progressColor as any}
        />
      </Box>
    );
  };

  return (
    <Card 
      component={motion.div}
      variants={cardVariants}
      initial="initial"
      animate="animate"
      whileHover={onClick ? "hover" : undefined}
      sx={{ 
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        borderTop: 4,
        borderColor: `${color}.main`
      }}
      onClick={onClick}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            {title}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                p: 1,
                borderRadius: '50%',
                bgcolor: `${color}.light`,
                color: `${color}.main`
              }}
            >
              {icon}
            </Box>
            {description && (
              <Tooltip title={description} arrow placement="top">
                <IconButton size="small" sx={{ ml: 0.5 }}>
                  <InfoIcon fontSize="small" color="action" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>
        
        <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
          {value}
        </Typography>
        
        {trend && (
          <Box 
            sx={{ 
              display: 'inline-flex', 
              alignItems: 'center',
              px: 1,
              py: 0.5,
              borderRadius: 1,
              bgcolor: trend.isPositive ? 'success.light' : 'error.light',
              color: trend.isPositive ? 'success.dark' : 'error.dark',
              mb: 1
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
              {trend.isPositive ? '+' : ''}{trend.value}%
            </Typography>
            <Typography variant="caption" sx={{ ml: 0.5 }}>
              {trend.label}
            </Typography>
          </Box>
        )}
        
        {renderProgress()}
      </CardContent>
    </Card>
  );
};

export default StatsCard;