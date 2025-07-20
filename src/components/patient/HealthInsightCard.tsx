import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  IconButton,
  Tooltip,
  Chip,
  Divider,
  LinearProgress,
  CardActions,
  Button,
  Collapse
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Info as InfoIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';

export interface HealthInsight {
  id: string;
  title: string;
  description: string;
  value?: number;
  trend?: 'up' | 'down' | 'flat';
  severity: 'low' | 'medium' | 'high';
  category: string;
  date: string;
  recommendations?: string[];
}

interface HealthInsightCardProps {
  insight: HealthInsight;
  onClick?: () => void;
}

const HealthInsightCard: React.FC<HealthInsightCardProps> = ({ insight, onClick }) => {
  const [expanded, setExpanded] = useState(false);

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'success';
      default:
        return 'info';
    }
  };

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUpIcon fontSize="small" color="success" />;
      case 'down':
        return <TrendingDownIcon fontSize="small" color="error" />;
      case 'flat':
        return <TrendingFlatIcon fontSize="small" color="action" />;
      default:
        return null;
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

  return (
    <Card 
      component={motion.div}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      sx={{ 
        mb: 2,
        borderRadius: 2,
        overflow: 'visible',
        boxShadow: (theme) => theme.palette.mode === 'dark' 
          ? '0 4px 20px rgba(0,0,0,0.25)' 
          : '0 4px 20px rgba(0,0,0,0.1)'
      }}
    >
      <CardContent sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Box>
            <Typography variant="h6" component="h3" sx={{ mb: 0.5 }}>
              {insight.title}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
              <Chip 
                label={insight.category} 
                size="small" 
                color="primary" 
                variant="outlined" 
              />
              <Chip 
                label={insight.severity.charAt(0).toUpperCase() + insight.severity.slice(1)} 
                size="small" 
                color={getSeverityColor(insight.severity) as any}
                variant="outlined" 
              />
              <Typography variant="caption" color="text.secondary">
                {formatDate(insight.date)}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {insight.trend && getTrendIcon(insight.trend)}
            <Tooltip title="AI Generated Insight">
              <IconButton size="small" sx={{ ml: 1 }}>
                <InfoIcon fontSize="small" color="info" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {insight.description}
        </Typography>

        {insight.value !== undefined && (
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2" color="text.secondary">
                Relevance
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {insight.value}%
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={insight.value} 
              color={getSeverityColor(insight.severity) as any}
              sx={{ height: 6, borderRadius: 3 }}
            />
          </Box>
        )}
      </CardContent>

      <Divider />

      <CardActions sx={{ justifyContent: 'space-between', px: 2, py: 1 }}>
        <Button 
          size="small" 
          onClick={onClick}
          startIcon={<InfoIcon />}
        >
          View Details
        </Button>
        {insight.recommendations && insight.recommendations.length > 0 && (
          <Button
            size="small"
            onClick={handleExpandClick}
            endIcon={
              <ExpandMoreIcon 
                sx={{
                  transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.3s'
                }}
              />
            }
          >
            Recommendations
          </Button>
        )}
      </CardActions>

      {insight.recommendations && insight.recommendations.length > 0 && (
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <Divider />
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>
              Recommendations:
            </Typography>
            <Box component="ul" sx={{ pl: 2, mt: 1, mb: 0 }}>
              {insight.recommendations.map((recommendation, index) => (
                <Typography component="li" variant="body2" key={index} sx={{ mb: 1 }}>
                  {recommendation}
                </Typography>
              ))}
            </Box>
          </CardContent>
        </Collapse>
      )}
    </Card>
  );
};

export default HealthInsightCard;