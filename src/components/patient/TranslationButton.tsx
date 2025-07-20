import React, { useState } from 'react';
import {
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Tooltip
} from '@mui/material';
import {
  Translate as TranslateIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  Check as CheckIcon
} from '@mui/icons-material';

export interface TranslationLanguage {
  code: string;
  name: string;
  flag?: string;
}

interface TranslationButtonProps {
  onTranslate: (languageCode: string) => Promise<void>;
  currentLanguage?: string;
  disabled?: boolean;
  availableLanguages?: TranslationLanguage[];
}

const defaultLanguages: TranslationLanguage[] = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺' }
];

const TranslationButton: React.FC<TranslationButtonProps> = ({
  onTranslate,
  currentLanguage = 'en',
  disabled = false,
  availableLanguages = defaultLanguages
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [activeLanguage, setActiveLanguage] = useState(currentLanguage);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageSelect = async (languageCode: string) => {
    if (languageCode === activeLanguage) {
      handleClose();
      return;
    }

    setIsTranslating(true);
    handleClose();

    try {
      await onTranslate(languageCode);
      setActiveLanguage(languageCode);
    } catch (error) {
      console.error('Translation failed:', error);
    } finally {
      setIsTranslating(false);
    }
  };

  const getCurrentLanguageName = () => {
    const language = availableLanguages.find(lang => lang.code === activeLanguage);
    return language ? language.name : 'Unknown';
  };

  return (
    <>
      <Tooltip title="Translate content">
        <span>
          <Button
            variant="outlined"
            startIcon={isTranslating ? <CircularProgress size={20} /> : <TranslateIcon />}
            endIcon={<KeyboardArrowDownIcon />}
            onClick={handleClick}
            disabled={disabled || isTranslating}
            size="small"
            sx={{
              textTransform: 'none',
              minWidth: 140,
              justifyContent: 'space-between',
              '& .MuiButton-endIcon': {
                ml: 'auto'
              }
            }}
          >
            {isTranslating ? 'Translating...' : getCurrentLanguageName()}
          </Button>
        </span>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          elevation: 3,
          sx: { width: 200, maxHeight: 300 }
        }}
      >
        {availableLanguages.map((language) => (
          <MenuItem
            key={language.code}
            onClick={() => handleLanguageSelect(language.code)}
            selected={language.code === activeLanguage}
            sx={{
              py: 1,
              '&.Mui-selected': {
                bgcolor: 'action.selected',
                '&:hover': {
                  bgcolor: 'action.hover',
                }
              }
            }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              {language.flag}
            </ListItemIcon>
            <ListItemText primary={language.name} />
            {language.code === activeLanguage && (
              <CheckIcon fontSize="small" color="primary" />
            )}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default TranslationButton;