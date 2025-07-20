import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  Typography,
  LinearProgress,
  Paper,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Chip
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  InsertDriveFile as FileIcon,
  Delete as DeleteIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  AudioFile as AudioIcon,
  Description as TextIcon
} from '@mui/icons-material';
import { formatFileSize } from '../../utils/helpers';

export interface FileWithPreview extends File {
  preview?: string;
  id: string;
}

interface FileUploadProps {
  onFilesSelected: (files: FileWithPreview[]) => void;
  onFileRemove?: (fileId: string) => void;
  acceptedFileTypes?: string;
  maxFileSize?: number; // in bytes
  maxFiles?: number;
  multiple?: boolean;
  uploadProgress?: number;
  uploading?: boolean;
  files?: FileWithPreview[];
  label?: string;
  helperText?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFilesSelected,
  onFileRemove,
  acceptedFileTypes = '*',
  maxFileSize = 10 * 1024 * 1024, // 10MB default
  maxFiles = 5,
  multiple = true,
  uploadProgress = 0,
  uploading = false,
  files = [],
  label = 'Upload Files',
  helperText = 'Drag and drop files here or click to browse'
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxFileSize) {
      return `File ${file.name} is too large. Maximum size is ${formatFileSize(maxFileSize)}.`;
    }

    // Check file type if acceptedFileTypes is specified and not '*'
    if (acceptedFileTypes !== '*') {
      const fileType = file.type;
      const acceptedTypes = acceptedFileTypes.split(',').map(type => type.trim());
      
      // Check if the file type matches any of the accepted types
      const isAccepted = acceptedTypes.some(type => {
        // Handle wildcards like 'image/*'
        if (type.endsWith('/*')) {
          const category = type.split('/')[0];
          return fileType.startsWith(`${category}/`);
        }
        return type === fileType;
      });

      if (!isAccepted) {
        return `File ${file.name} is not an accepted file type.`;
      }
    }

    return null;
  };

  const processFiles = (fileList: FileList) => {
    if (files.length + fileList.length > maxFiles) {
      setError(`You can only upload a maximum of ${maxFiles} files.`);
      return;
    }

    const newFiles: FileWithPreview[] = [];
    let hasError = false;

    Array.from(fileList).forEach(file => {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        hasError = true;
        return;
      }

      // Create a unique ID for the file
      const fileWithId = Object.assign(file, {
        id: `${file.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      });

      // Create preview for image files
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          (fileWithId as FileWithPreview).preview = reader.result as string;
        };
        reader.readAsDataURL(file);
      }

      newFiles.push(fileWithId);
    });

    if (!hasError && newFiles.length > 0) {
      setError(null);
      onFilesSelected([...files, ...newFiles]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      // Reset the input value so the same file can be selected again if removed
      e.target.value = '';
    }
  };

  const handleBrowseClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleRemoveFile = (fileId: string) => {
    if (onFileRemove) {
      onFileRemove(fileId);
    }
  };

  const getFileIcon = (file: FileWithPreview) => {
    const fileType = file.type;
    
    if (fileType.startsWith('image/')) {
      return <ImageIcon color="primary" />;
    } else if (fileType === 'application/pdf') {
      return <PdfIcon color="error" />;
    } else if (fileType.startsWith('audio/')) {
      return <AudioIcon color="secondary" />;
    } else if (fileType.startsWith('text/')) {
      return <TextIcon color="info" />;
    } else {
      return <FileIcon color="action" />;
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="subtitle1" gutterBottom>
        {label}
      </Typography>
      
      <Paper
        sx={{
          border: '2px dashed',
          borderColor: isDragging ? 'primary.main' : 'divider',
          borderRadius: 2,
          p: 3,
          backgroundColor: isDragging ? 'action.hover' : 'background.paper',
          transition: 'all 0.2s ease',
          cursor: 'pointer',
          textAlign: 'center',
          mb: 2
        }}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleBrowseClick}
      >
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept={acceptedFileTypes}
          multiple={multiple}
          onChange={handleFileInputChange}
          disabled={uploading}
        />
        
        <UploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
        
        <Typography variant="body1" gutterBottom>
          {helperText}
        </Typography>
        
        <Button
          variant="contained"
          color="primary"
          startIcon={<UploadIcon />}
          sx={{ mt: 1 }}
          disabled={uploading}
        >
          Browse Files
        </Button>
        
        <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
          Max file size: {formatFileSize(maxFileSize)}
          {acceptedFileTypes !== '*' && ` • Accepted types: ${acceptedFileTypes}`}
          {` • Max files: ${maxFiles}`}
        </Typography>
      </Paper>
      
      {error && (
        <Typography variant="body2" color="error" sx={{ mt: 1, mb: 2 }}>
          {error}
        </Typography>
      )}
      
      {uploading && (
        <Box sx={{ width: '100%', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2" sx={{ mr: 1 }}>
              Uploading...
            </Typography>
            <Typography variant="body2" color="primary">
              {uploadProgress}%
            </Typography>
          </Box>
          <LinearProgress variant="determinate" value={uploadProgress} />
        </Box>
      )}
      
      {files.length > 0 && (
        <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
          {files.map((file) => (
            <ListItem key={file.id} sx={{ px: 2, py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
              <ListItemIcon>
                {getFileIcon(file)}
              </ListItemIcon>
              <ListItemText
                primary={file.name}
                secondary={
                  <>
                    {formatFileSize(file.size)}
                    <Chip 
                      label={file.type.split('/')[1].toUpperCase()} 
                      size="small" 
                      sx={{ ml: 1, height: 20, fontSize: '0.7rem' }} 
                    />
                  </>
                }
              />
              {!uploading && onFileRemove && (
                <ListItemSecondaryAction>
                  <IconButton edge="end" onClick={() => handleRemoveFile(file.id)}>
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              )}
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
};

export default FileUpload;