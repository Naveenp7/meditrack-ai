import React from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
  IconButton,
  Typography,
  Box
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmButtonColor?: 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
  onConfirm: () => void;
  onCancel: () => void;
  icon?: React.ReactNode;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmButtonColor = 'primary',
  onConfirm,
  onCancel,
  icon
}) => {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
      PaperProps={{
        sx: {
          borderRadius: 2,
          minWidth: { xs: '90%', sm: 400 }
        }
      }}
    >
      <DialogTitle id="confirm-dialog-title" sx={{ pr: 6 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {icon && icon}
          <Typography variant="h6" component="span">
            {title}
          </Typography>
        </Box>
        <IconButton
          aria-label="close"
          onClick={onCancel}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500]
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="confirm-dialog-description">
          {message}
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onCancel} color="inherit" variant="outlined">
          {cancelText}
        </Button>
        <Button onClick={onConfirm} color={confirmButtonColor} variant="contained" autoFocus>
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>

  );
};

export default ConfirmDialog;