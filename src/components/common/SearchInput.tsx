import React, { useState, useEffect, useRef } from 'react';
import {
  TextField,
  InputAdornment,
  IconButton,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Typography,
  Box,
  CircularProgress,
  Popper,
  ClickAwayListener,
  Grow
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { debounce } from '../../utils/helpers';

export interface SearchResult {
  id: string;
  primaryText: string;
  secondaryText?: string;
  avatarText?: string;
  avatarSrc?: string;
  avatarIcon?: React.ReactNode;
  data?: any;
}

interface SearchInputProps {
  placeholder?: string;
  onSearch: (query: string) => Promise<SearchResult[]>;
  onResultSelect?: (result: SearchResult) => void;
  debounceMs?: number;
  minQueryLength?: number;
  fullWidth?: boolean;
  variant?: 'outlined' | 'filled' | 'standard';
  size?: 'small' | 'medium';
  label?: string;
}

const SearchInput: React.FC<SearchInputProps> = ({
  placeholder = 'Search...',
  onSearch,
  onResultSelect,
  debounceMs = 300,
  minQueryLength = 2,
  fullWidth = true,
  variant = 'outlined',
  size = 'medium',
  label
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);

  // Debounced search function
  const debouncedSearch = useRef(
    debounce(async (searchQuery: string) => {
      if (searchQuery.length >= minQueryLength) {
        setLoading(true);
        try {
          const searchResults = await onSearch(searchQuery);
          setResults(searchResults);
          setOpen(searchResults.length > 0);
        } catch (error) {
          console.error('Search error:', error);
          setResults([]);
        } finally {
          setLoading(false);
        }
      } else {
        setResults([]);
        setOpen(false);
      }
    }, debounceMs)
  ).current;

  useEffect(() => {
    if (query) {
      debouncedSearch(query);
    } else {
      setResults([]);
      setOpen(false);
    }
  }, [query, debouncedSearch]);

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setOpen(false);
  };

  const handleResultClick = (result: SearchResult) => {
    if (onResultSelect) {
      onResultSelect(result);
    }
    setOpen(false);
  };

  const handleClickAway = () => {
    setOpen(false);
  };

  const getInitials = (text: string) => {
    return text
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  return (
    <ClickAwayListener onClickAway={handleClickAway}>
      <Box ref={anchorRef} sx={{ position: 'relative', width: fullWidth ? '100%' : 'auto' }}>
        <TextField
          fullWidth={fullWidth}
          variant={variant}
          size={size}
          label={label}
          placeholder={placeholder}
          value={query}
          onChange={handleQueryChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                {loading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : query ? (
                  <IconButton
                    aria-label="clear search"
                    onClick={handleClear}
                    edge="end"
                    size="small"
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                ) : null}
              </InputAdornment>
            ),
          }}
        />
        
        <Popper
          open={open}
          anchorEl={anchorRef.current}
          placement="bottom-start"
          transition
          style={{ width: anchorRef.current?.clientWidth, zIndex: 1300 }}
        >
          {({ TransitionProps }) => (
            <Grow {...TransitionProps} style={{ transformOrigin: 'top left' }}>
              <Paper elevation={3} sx={{ mt: 1, maxHeight: 350, overflow: 'auto' }}>
                {results.length > 0 ? (
                  <List sx={{ p: 0 }}>
                    {results.map((result) => (
                      <ListItem
                        button
                        key={result.id}
                        onClick={() => handleResultClick(result)}
                        sx={{ '&:hover': { backgroundColor: 'action.hover' } }}
                      >
                        {(result.avatarSrc || result.avatarText || result.avatarIcon) && (
                          <ListItemAvatar>
                            <Avatar src={result.avatarSrc}>
                              {result.avatarIcon || (result.avatarText ? getInitials(result.avatarText) : null)}
                            </Avatar>
                          </ListItemAvatar>
                        )}
                        <ListItemText
                          primary={result.primaryText}
                          secondary={result.secondaryText}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  query.length >= minQueryLength && !loading && (
                    <Box sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        No results found
                      </Typography>
                    </Box>
                  )
                )}
              </Paper>
            </Grow>
          )}
        </Popper>
      </Box>
    </ClickAwayListener>
  );
};

export default SearchInput;