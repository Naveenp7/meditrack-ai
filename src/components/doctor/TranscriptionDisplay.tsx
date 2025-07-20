import React, { useState } from 'react';
import {
  Paper,
  Typography,
  Box,
  IconButton,
  Tooltip,
  Divider,
  TextField,
  Button,
  CircularProgress
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  ContentCopy as CopyIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

interface TranscriptionDisplayProps {
  transcription: string;
  isLoading?: boolean;
  onSave?: (editedText: string) => void;
  editable?: boolean;
  title?: string;
}

const TranscriptionDisplay: React.FC<TranscriptionDisplayProps> = ({
  transcription,
  isLoading = false,
  onSave,
  editable = true,
  title = 'Transcription'
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(transcription);
  const [isCopied, setIsCopied] = useState(false);

  // Update editedText when transcription changes
  React.useEffect(() => {
    setEditedText(transcription);
  }, [transcription]);

  const handleEditClick = () => {
    setIsEditing(true);
    setEditedText(transcription);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedText(transcription);
  };

  const handleSaveEdit = () => {
    setIsEditing(false);
    if (onSave) {
      onSave(editedText);
    }
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(transcription);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <Paper 
      elevation={2} 
      sx={{ 
        p: 3, 
        borderRadius: 2,
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
      component={motion.div}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" component="h2">
          {title}
        </Typography>
        
        <Box>
          <Tooltip title={isCopied ? 'Copied!' : 'Copy to clipboard'}>
            <IconButton 
              size="small" 
              onClick={handleCopyToClipboard}
              color={isCopied ? 'success' : 'default'}
            >
              {isCopied ? <CheckIcon fontSize="small" /> : <CopyIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
          
          {editable && !isEditing && (
            <Tooltip title="Edit transcription">
              <IconButton size="small" onClick={handleEditClick} sx={{ ml: 1 }}>
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>
      
      <Divider sx={{ mb: 2 }} />
      
      {isLoading ? (
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            flexGrow: 1,
            py: 4
          }}
        >
          <CircularProgress size={40} thickness={4} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Processing transcription...
          </Typography>
        </Box>
      ) : (
        <AnimatePresence mode="wait">
          {isEditing ? (
            <motion.div
              key="editing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}
            >
              <TextField
                multiline
                fullWidth
                minRows={5}
                maxRows={15}
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                variant="outlined"
                placeholder="Enter transcription text"
                sx={{ flexGrow: 1 }}
              />
              
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={handleCancelEdit}
                  sx={{ mr: 1 }}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveEdit}
                >
                  Save
                </Button>
              </Box>
            </motion.div>
          ) : (
            <motion.div
              key="display"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ flexGrow: 1 }}
            >
              <Box 
                sx={{ 
                  bgcolor: 'background.default', 
                  p: 2, 
                  borderRadius: 1,
                  minHeight: '150px',
                  maxHeight: '400px',
                  overflowY: 'auto'
                }}
              >
                {transcription ? (
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {transcription}
                  </Typography>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    No transcription available. Record audio to generate transcription.
                  </Typography>
                )}
              </Box>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </Paper>
  );
};

export default TranscriptionDisplay;