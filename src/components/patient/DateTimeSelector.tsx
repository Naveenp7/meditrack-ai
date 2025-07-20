import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  Divider,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, isToday, isSameDay, addDays, isAfter, isBefore } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

export interface TimeSlot {
  id: string;
  startTime: string; // ISO string
  endTime: string; // ISO string
  available: boolean;
}

interface DateTimeSelectorProps {
  availableDates?: Date[];
  timeSlots: TimeSlot[];
  selectedDate: Date | null;
  selectedTimeSlot: TimeSlot | null;
  onDateChange: (date: Date | null) => void;
  onTimeSlotChange: (timeSlot: TimeSlot | null) => void;
}

const DateTimeSelector: React.FC<DateTimeSelectorProps> = ({
  availableDates = [],
  timeSlots,
  selectedDate,
  selectedTimeSlot,
  onDateChange,
  onTimeSlotChange
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [calendarDate, setCalendarDate] = useState<Date | null>(selectedDate || new Date());

  // Filter time slots for the selected date
  const filteredTimeSlots = selectedDate
    ? timeSlots.filter(slot => {
        const slotDate = new Date(slot.startTime);
        return isSameDay(slotDate, selectedDate);
      })
    : [];

  // Group time slots by morning, afternoon, evening
  const groupedTimeSlots = filteredTimeSlots.reduce<{
    morning: TimeSlot[];
    afternoon: TimeSlot[];
    evening: TimeSlot[];
  }>(
    (groups, slot) => {
      const hour = new Date(slot.startTime).getHours();
      if (hour < 12) {
        groups.morning.push(slot);
      } else if (hour < 17) {
        groups.afternoon.push(slot);
      } else {
        groups.evening.push(slot);
      }
      return groups;
    },
    { morning: [], afternoon: [], evening: [] }
  );

  const handleDateChange = (date: Date | null) => {
    setCalendarDate(date);
    onDateChange(date);
    onTimeSlotChange(null); // Reset time slot when date changes
  };

  const handleTimeSlotSelect = (timeSlot: TimeSlot) => {
    onTimeSlotChange(timeSlot);
  };

  const formatTimeSlot = (timeSlot: TimeSlot) => {
    const start = new Date(timeSlot.startTime);
    const end = new Date(timeSlot.endTime);
    return `${format(start, 'h:mm a')} - ${format(end, 'h:mm a')}`;
  };

  const isDateDisabled = (date: Date) => {
    // Disable dates in the past
    if (isBefore(date, new Date()) && !isToday(date)) {
      return true;
    }

    // If availableDates is provided, only enable those dates
    if (availableDates.length > 0) {
      return !availableDates.some(availableDate => isSameDay(availableDate, date));
    }

    return false;
  };

  const renderTimeSlotGroup = (title: string, slots: TimeSlot[]) => {
    if (slots.length === 0) return null;

    return (
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
          {title}
        </Typography>
        <Grid container spacing={1}>
          {slots.map((slot) => (
            <Grid item xs={6} sm={4} md={3} key={slot.id}>
              <Button
                variant={selectedTimeSlot?.id === slot.id ? 'contained' : 'outlined'}
                color={selectedTimeSlot?.id === slot.id ? 'primary' : 'inherit'}
                disabled={!slot.available}
                fullWidth
                onClick={() => handleTimeSlotSelect(slot)}
                sx={{
                  borderRadius: 2,
                  py: 1,
                  textTransform: 'none',
                  transition: 'all 0.2s',
                  '&.Mui-disabled': {
                    bgcolor: 'action.disabledBackground',
                    opacity: 0.6,
                    textDecoration: 'line-through'
                  }
                }}
              >
                {formatTimeSlot(slot)}
              </Button>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper
            elevation={1}
            sx={{ p: 2, borderRadius: 2, height: '100%' }}
            component={motion.div}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Typography variant="h6" gutterBottom>
              Select Date
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <DateCalendar
                value={calendarDate}
                onChange={handleDateChange}
                disablePast
                shouldDisableDate={isDateDisabled}
                sx={{
                  width: '100%',
                  '& .MuiPickersDay-root.Mui-selected': {
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    '&:hover': {
                      bgcolor: 'primary.dark'
                    }
                  }
                }}
              />
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper
            elevation={1}
            sx={{ p: 2, borderRadius: 2, height: '100%' }}
            component={motion.div}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Typography variant="h6" gutterBottom>
              Select Time
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <AnimatePresence mode="wait">
              {selectedDate ? (
                <motion.div
                  key="time-slots"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {filteredTimeSlots.length > 0 ? (
                    <>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Available time slots for {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                      </Typography>

                      {renderTimeSlotGroup('Morning', groupedTimeSlots.morning)}
                      {renderTimeSlotGroup('Afternoon', groupedTimeSlots.afternoon)}
                      {renderTimeSlotGroup('Evening', groupedTimeSlots.evening)}
                    </>
                  ) : (
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        py: 4
                      }}
                    >
                      <Typography variant="body2" color="text.secondary" align="center">
                        No available time slots for {format(selectedDate, 'EEEE, MMMM d, yyyy')}.
                      </Typography>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleDateChange(addDays(selectedDate, 1))}
                        sx={{ mt: 2 }}
                      >
                        Check Next Day
                      </Button>
                    </Box>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="no-date"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      py: 6
                    }}
                  >
                    <Typography variant="body1" color="text.secondary" align="center">
                      Please select a date to view available time slots.
                    </Typography>
                  </Box>
                </motion.div>
              )}
            </AnimatePresence>
          </Paper>
        </Grid>
      </Grid>
    </LocalizationProvider>
  );
};

export default DateTimeSelector;