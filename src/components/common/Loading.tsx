import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { motion } from 'framer-motion';

interface LoadingProps {
  message?: string;
  fullScreen?: boolean;
}

const Loading: React.FC<LoadingProps> = ({ 
  message = 'Loading...', 
  fullScreen = false 
}) => {
  const container = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 3,
    ...(fullScreen && {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      zIndex: 9999,
    }),
  };

  return (
    <Box sx={container} component={motion.div} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <CircularProgress size={60} thickness={4} />
      <Typography variant="h6" sx={{ mt: 2 }}>
        {message}
      </Typography>
    </Box>
  );
};

export default Loading;