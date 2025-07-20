import React, { useState } from 'react';
import {
  Paper,
  Typography,
  Box,
  IconButton,
  Tooltip,
  Divider,
  CircularProgress,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button
} from '@mui/material';
import {
  ContentCopy as CopyIcon,
  Check as CheckIcon,
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';

interface SummarySection {
  title: string;
  content: string;
}

interface AISummaryProps {
  sections: SummarySection[];
  isLoading?: boolean;
  onRefresh?: () => void;
  onSave?: () => void;
  canSave?: boolean;
}

const AISummary: React.FC<AISummaryProps> = ({
  sections,
  isLoading = false,
  onRefresh,
  onSave,
  canSave = false
}) => {
  const [copiedSection, setCopiedSection] = useState<number | null>(null);

  const handleCopyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(index);
    setTimeout(() => setCopiedSection(null), 2000);
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
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="h6" component="h2">
            AI Summary
          </Typography>
          <Chip 
            label="AI Generated" 
            size="small" 
            color="primary" 
            variant="outlined" 
            sx={{ ml: 1, height: 24 }} 
          />
        </Box>
        
        <Box>
          {onRefresh && (
            <Tooltip title="Regenerate summary">
              <IconButton 
                size="small" 
                onClick={onRefresh}
                disabled={isLoading}
                sx={{ ml: 1 }}
              >
                <RefreshIcon fontSize="small" />
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
            Generating AI summary...
          </Typography>
        </Box>
      ) : sections.length > 0 ? (
        <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
          {sections.map((section, index) => (
            <Accordion 
              key={index} 
              defaultExpanded={index === 0}
              sx={{ 
                mb: 1,
                '&:before': { display: 'none' },
                boxShadow: 'none',
                border: 1,
                borderColor: 'divider',
                borderRadius: '4px !important',
                overflow: 'hidden'
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{ 
                  bgcolor: 'background.default',
                  borderBottom: sections.length > 0 ? 1 : 0,
                  borderColor: 'divider'
                }}
              >
                <Typography variant="subtitle1">{section.title}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ position: 'relative' }}>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', pr: 4 }}>
                    {section.content}
                  </Typography>
                  <Tooltip title={copiedSection === index ? 'Copied!' : 'Copy to clipboard'}>
                    <IconButton 
                      size="small" 
                      onClick={() => handleCopyToClipboard(section.content, index)}
                      color={copiedSection === index ? 'success' : 'default'}
                      sx={{ position: 'absolute', top: 0, right: 0 }}
                    >
                      {copiedSection === index ? <CheckIcon fontSize="small" /> : <CopyIcon fontSize="small" />}
                    </IconButton>
                  </Tooltip>
                </Box>
              </AccordionDetails>
            </Accordion>
          ))}
          
          {canSave && onSave && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
                onClick={onSave}
              >
                Save to Medical Record
              </Button>
            </Box>
          )}
        </Box>
      ) : (
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
          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            No AI summary available. Record and transcribe audio to generate a summary.
          </Typography>
          {onRefresh && (
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={onRefresh}
              sx={{ mt: 2 }}
              disabled={isLoading}
            >
              Generate Summary
            </Button>
          )}
        </Box>
      )}
    </Paper>
  );
};

export default AISummary;