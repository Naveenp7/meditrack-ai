import React, { useState, useEffect } from 'react';
import { 
  Box, 
  IconButton, 
  Typography, 
  CircularProgress, 
  Tooltip,
  Paper
} from '@mui/material';
import { 
  Mic as MicIcon,
  Stop as StopIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { startRecording, stopRecording, isRecordingInProgress } from '../../services/audioService';

interface RecordingButtonProps {
  onRecordingComplete: (blob: Blob) => void;
  onRecordingStart?: () => void;
  onRecordingCancel?: () => void;
  disabled?: boolean;
  showTimer?: boolean;
  size?: 'small' | 'medium' | 'large';
  variant?: 'fab' | 'standard';
}

const RecordingButton: React.FC<RecordingButtonProps> = ({
  onRecordingComplete,
  onRecordingStart,
  onRecordingCancel,
  disabled = false,
  showTimer = true,
  size = 'medium',
  variant = 'fab'
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    // Check if recording is already in progress when component mounts
    setIsRecording(isRecordingInProgress());
    
    return () => {
      // Clear timer when component unmounts
      if (timer) {
        clearInterval(timer);
      }
    };
  }, []);
  
  const handleStartRecording = async () => {
    if (disabled) return;
    
    try {
      await startRecording();
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      const intervalId = setInterval(() => {
        setRecordingTime(prevTime => prevTime + 1);
      }, 1000);
      
      setTimer(intervalId);
      
      if (onRecordingStart) {
        onRecordingStart();
      }
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };
  
  const handleStopRecording = async () => {
    if (!isRecording) return;
    
    try {
      const audioBlob = await stopRecording();
      setIsRecording(false);
      
      // Clear timer
      if (timer) {
        clearInterval(timer);
        setTimer(null);
      }
      
      if (audioBlob) {
        onRecordingComplete(audioBlob);
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  };
  
  const handleCancelRecording = async () => {
    if (!isRecording) return;
    
    try {
      await stopRecording();
      setIsRecording(false);
      
      // Clear timer
      if (timer) {
        clearInterval(timer);
        setTimer(null);
      }
      
      if (onRecordingCancel) {
        onRecordingCancel();
      }
    } catch (error) {
      console.error('Failed to cancel recording:', error);
    }
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const getButtonSize = () => {
    switch (size) {
      case 'small':
        return { buttonSize: 40, iconSize: 'small' };
      case 'large':
        return { buttonSize: 80, iconSize: 'large' };
      case 'medium':
      default:
        return { buttonSize: 56, iconSize: 'medium' };
    }
  };
  
  const { buttonSize, iconSize } = getButtonSize();
  
  if (variant === 'fab') {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Box sx={{ position: 'relative', mb: showTimer ? 1 : 0 }}>
          <IconButton
            color={isRecording ? 'error' : 'primary'}
            disabled={disabled}
            onClick={isRecording ? handleStopRecording : handleStartRecording}
            sx={{
              width: buttonSize,
              height: buttonSize,
              bgcolor: isRecording ? 'error.light' : 'primary.light',
              '&:hover': {
                bgcolor: isRecording ? 'error.main' : 'primary.main',
              },
              transition: 'all 0.3s ease',
            }}
            component={motion.button}
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.1 }}
          >
            {isRecording ? (
              <StopIcon fontSize={iconSize as any} />
            ) : (
              <MicIcon fontSize={iconSize as any} />
            )}
          </IconButton>
          
          {isRecording && (
            <Box
              component={motion.div}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              sx={{ position: 'absolute', top: -10, right: -10 }}
            >
              <IconButton
                size="small"
                color="default"
                onClick={handleCancelRecording}
                sx={{ bgcolor: 'background.paper', boxShadow: 1 }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          )}
        </Box>
        
        {showTimer && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 24 }}>
            {isRecording ? (
              <Box
                component={motion.div}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                sx={{ display: 'flex', alignItems: 'center' }}
              >
                <Box
                  component={motion.div}
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  sx={{ 
                    width: 8, 
                    height: 8, 
                    borderRadius: '50%', 
                    bgcolor: 'error.main',
                    mr: 1
                  }}
                />
                <Typography variant="body2" color="error">
                  {formatTime(recordingTime)}
                </Typography>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                {disabled ? 'Recording disabled' : 'Ready to record'}
              </Typography>
            )}
          </Box>
        )}
      </Box>
    );
  }
  
  // Standard variant
  return (
    <Paper 
      elevation={1} 
      sx={{ 
        p: 1, 
        display: 'flex', 
        alignItems: 'center',
        borderRadius: 2,
        bgcolor: isRecording ? 'error.light' : 'background.paper'
      }}
    >
      <IconButton
        color={isRecording ? 'error' : 'primary'}
        disabled={disabled}
        onClick={isRecording ? handleStopRecording : handleStartRecording}
        size={size}
      >
        {isRecording ? <StopIcon /> : <MicIcon />}
      </IconButton>
      
      <Typography 
        variant="body2" 
        color={isRecording ? 'error' : 'text.secondary'}
        sx={{ mx: 1, flexGrow: 1 }}
      >
        {isRecording 
          ? `Recording... ${showTimer ? formatTime(recordingTime) : ''}` 
          : (disabled ? 'Recording disabled' : 'Click to start recording')}
      </Typography>
      
      {isRecording && (
        <Tooltip title="Cancel recording">
          <IconButton size="small" onClick={handleCancelRecording}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </Paper>
  );
};

export default RecordingButton;