import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Divider,
  useTheme,
  Avatar,
  Grid,
  Alert,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Card,
  CardContent,
  Chip,
} from '@mui/material';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { motion } from 'framer-motion';
import CloseIcon from '@mui/icons-material/Close';
import EventIcon from '@mui/icons-material/Event';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonIcon from '@mui/icons-material/Person';
import SearchIcon from '@mui/icons-material/Search';
import { useAuth } from '../../contexts/AuthContext';
import { getAllDoctors } from '../../services/userService';
import {
  createAppointment,
  getPatientAppointments,
  getAvailableTimeSlots,
  checkTimeSlotAvailability,
  cancelAppointment
} from '../../services/appointmentService';
import { formatDate, formatTime } from '../../utils/helpers';
import { Doctor, Appointment } from '../../types';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const AppointmentPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [selectedSpecialization, setSelectedSpecialization] = useState<string>('all');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Booking state
  const [bookingStep, setBookingStep] = useState(0);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [reason, setReason] = useState('');
  const [bookingInProgress, setBookingInProgress] = useState(false);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);

  // Cancellation state
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState<Appointment | null>(null);
  const [cancelInProgress, setCancelInProgress] = useState(false);

  useEffect(() => {
    // Redirect if not logged in or not a patient
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    if (currentUser.role !== 'patient') {
      navigate('/');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch all doctors
        const doctorsData = await getAllDoctors();
        setDoctors(doctorsData);
        setFilteredDoctors(doctorsData);

        // Extract unique specializations
        const uniqueSpecializations = Array.from(
          new Set(doctorsData.map(doctor => doctor.specialization))
        ).filter(Boolean) as string[];
        setSpecializations(uniqueSpecializations);

        // Fetch patient's appointments
        const appointmentsData = await getPatientAppointments(currentUser.uid);
        setAppointments(appointmentsData.sort((a, b) => {
          const dateA = new Date(`${a.date} ${a.timeSlot}`);
          const dateB = new Date(`${b.date} ${b.timeSlot}`);
          return dateA.getTime() - dateB.getTime();
        }));
      } catch (err) {
        setError('Failed to load data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser, navigate]);

  useEffect(() => {
    // Filter doctors based on search term and specialization
    let filtered = doctors;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(doctor => 
        doctor.firstName.toLowerCase().includes(term) || 
        doctor.lastName.toLowerCase().includes(term) ||
        (doctor.specialization && doctor.specialization.toLowerCase().includes(term))
      );
    }
    
    if (selectedSpecialization !== 'all') {
      filtered = filtered.filter(doctor => 
        doctor.specialization === selectedSpecialization
      );
    }
    
    setFilteredDoctors(filtered);
  }, [doctors, searchTerm, selectedSpecialization]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleSpecializationChange = (event: SelectChangeEvent<string>) => {
    setSelectedSpecialization(event.target.value as string);
  };

  const handleBookAppointment = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setSelectedDate(null);
    setSelectedTimeSlot('');
    setReason('');
    setBookingStep(0);
    setBookingDialogOpen(true);
  };

  const handleDateChange = async (date: Date | null) => {
    setSelectedDate(date);
    if (date && selectedDoctor) {
      try {
        const slots = await getAvailableTimeSlots(selectedDoctor.id, date.toISOString().split('T')[0]);
        setAvailableTimeSlots(slots);
        setSelectedTimeSlot('');
      } catch (err) {
        console.error('Failed to get available time slots:', err);
        setAvailableTimeSlots([]);
      }
    }
  };

  const handleTimeSlotSelect = (timeSlot: string) => {
    setSelectedTimeSlot(timeSlot);
  };

  const handleNextStep = () => {
    setBookingStep(prevStep => prevStep + 1);
  };

  const handlePrevStep = () => {
    setBookingStep(prevStep => prevStep - 1);
  };

  const handleCloseBookingDialog = () => {
    setBookingDialogOpen(false);
  };

  const handleSubmitBooking = async () => {
    if (!currentUser || !selectedDoctor || !selectedDate || !selectedTimeSlot) {
      return;
    }

    try {
      setBookingInProgress(true);
      
      // Check if the time slot is still available
      const isAvailable = await checkTimeSlotAvailability(
        selectedDoctor.id, 
        selectedDate.toISOString().split('T')[0], 
        selectedTimeSlot
      );
      
      if (!isAvailable) {
        toast.error('This time slot is no longer available. Please select another time.');
        // Refresh available time slots
        const slots = await getAvailableTimeSlots(
          selectedDoctor.id, 
          selectedDate.toISOString().split('T')[0]
        );
        setAvailableTimeSlots(slots);
        setSelectedTimeSlot('');
        setBookingStep(1); // Go back to time selection
        setBookingInProgress(false);
        return;
      }
      
      // Create the appointment
      const appointmentData = {
        patientId: currentUser.uid,
        doctorId: selectedDoctor.id,
        date: selectedDate.toISOString().split('T')[0],
        timeSlot: selectedTimeSlot,
        reason: reason,
        status: 'scheduled',
      };
      
      const newAppointment = await createAppointment(appointmentData);
      
      // Add the new appointment to the list
      setAppointments(prev => [...prev, newAppointment].sort((a, b) => {
        const dateA = new Date(`${a.date} ${a.timeSlot}`);
        const dateB = new Date(`${b.date} ${b.timeSlot}`);
        return dateA.getTime() - dateB.getTime();
      }));
      
      toast.success('Appointment booked successfully!');
      setBookingDialogOpen(false);
    } catch (err) {
      console.error('Failed to book appointment:', err);
      toast.error('Failed to book appointment. Please try again.');
    } finally {
      setBookingInProgress(false);
    }
  };

  const handleCancelAppointment = (appointment: Appointment) => {
    setAppointmentToCancel(appointment);
    setCancelDialogOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!appointmentToCancel) return;
    
    try {
      setCancelInProgress(true);
      await cancelAppointment(appointmentToCancel.id);
      
      // Remove the cancelled appointment from the list
      setAppointments(prev => 
        prev.filter(app => app.id !== appointmentToCancel.id)
      );
      
      toast.success('Appointment cancelled successfully!');
      setCancelDialogOpen(false);
    } catch (err) {
      console.error('Failed to cancel appointment:', err);
      toast.error('Failed to cancel appointment. Please try again.');
    } finally {
      setCancelInProgress(false);
    }
  };

  const handleCloseCancelDialog = () => {
    setCancelDialogOpen(false);
  };

  const isAppointmentUpcoming = (appointment: Appointment) => {
    const appointmentDate = new Date(`${appointment.date} ${appointment.timeSlot}`);
    return appointmentDate > new Date();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, py: 4 }}>
      <Container maxWidth="lg">
        <ToastContainer position="top-right" autoClose={5000} />
        
        <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
          Appointments
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Upcoming Appointments */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Paper elevation={2} sx={{ p: 3, borderRadius: 2, mb: 4 }}>
            <Typography variant="h6" gutterBottom fontWeight="medium">
              Your Upcoming Appointments
            </Typography>
            
            {appointments.filter(isAppointmentUpcoming).length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="body1" color="text.secondary">
                  You don't have any upcoming appointments
                </Typography>
                <Button 
                  variant="contained" 
                  color="primary" 
                  sx={{ mt: 2 }}
                  onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
                >
                  Book an Appointment
                </Button>
              </Box>
            ) : (
              <Grid container spacing={3}>
                {appointments
                  .filter(isAppointmentUpcoming)
                  .map((appointment) => {
                    const doctor = doctors.find(d => d.id === appointment.doctorId);
                    return (
                      <Grid item xs={12} sm={6} md={4} key={appointment.id}>
                        <Card 
                          sx={{ 
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            borderRadius: 2,
                            boxShadow: theme.shadows[2],
                            '&:hover': {
                              boxShadow: theme.shadows[4],
                            }, 
                      }}
                    >
                      <CardContent sx={{ flexGrow: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                              <Avatar 
                                src={doctor?.photoURL || undefined}
                                sx={{ 
                                  width: 50, 
                                  height: 50,
                                  mr: 2,
                                }}
                              >
                                {doctor ? `${doctor.firstName[0]}${doctor.lastName[0]}` : <PersonIcon />}
                              </Avatar>
                              <Box>
                                <Typography variant="subtitle1" fontWeight="medium">
                                  Dr. {doctor?.firstName} {doctor?.lastName}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {doctor?.specialization}
                                </Typography>
                              </Box>
                            </Box>
                            
                            <Divider sx={{ my: 1.5 }} />
                            
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <EventIcon sx={{ color: theme.palette.primary.main, mr: 1, fontSize: 20 }} />
                              <Typography variant="body2">
                                {formatDate(appointment.date)}
                              </Typography>
                            </Box>
                            
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <AccessTimeIcon sx={{ color: theme.palette.primary.main, mr: 1, fontSize: 20 }} />
                              <Typography variant="body2">
                                {formatTime(appointment.timeSlot)}
                              </Typography>
                            </Box>
                            
                            {appointment.reason && (
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                Reason: {appointment.reason}
                              </Typography>
                            )}
                            
                            <Box sx={{ mt: 2 }}>
                              <Chip 
                                label={appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)} 
                                color="primary" 
                                size="small" 
                                sx={{ mr: 1 }} 
                              />
                            </Box>
                          </CardContent>
                          
                          <Box sx={{ p: 2, pt: 0 }}>
                            <Button 
                              variant="outlined" 
                              color="error" 
                              size="small" 
                              fullWidth
                              onClick={() => handleCancelAppointment(appointment)}
                            >
                              Cancel
                            </Button>
                          </Box>
                        </Card>
                      </Box>
                    </Grid>
                    );
                  </Grid>
                  })}
              </Grid>
            )}
          </Paper>
        </motion.div>

        {/* Past Appointments */}
        {appointments.filter(app => !isAppointmentUpcoming(app)).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Paper elevation={2} sx={{ p: 3, borderRadius: 2, mb: 4 }}>
              <Typography variant="h6" gutterBottom fontWeight="medium">
                Past Appointments
              </Typography>
              
              <Grid container spacing={3}>
                {appointments
                  .filter(app => !isAppointmentUpcoming(app))
                  .map((appointment) => {
                    const doctor = doctors.find(d => d.id === appointment.doctorId);
                    return (
                      <Grid item xs={12} sm={6} md={4} key={appointment.id}>
                        <Card 
                          sx={{ 
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            borderRadius: 2,
                            opacity: 0.8,
                          }}
                        >
                          <CardContent sx={{ flexGrow: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                              <Avatar 
                                src={doctor?.photoURL || undefined}
                                sx={{ 
                                  width: 50, 
                                  height: 50,
                                  mr: 2,
                                }}
                              >
                                {doctor ? `${doctor.firstName[0]}${doctor.lastName[0]}` : <PersonIcon />}
                              </Avatar>
                              <Box>
                                <Typography variant="subtitle1" fontWeight="medium">
                                  Dr. {doctor?.firstName} {doctor?.lastName}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {doctor?.specialization}
                                </Typography>
                              </Box>
                            </Box>
                            
                            <Divider sx={{ my: 1.5 }} />
                            
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <EventIcon sx={{ color: theme.palette.text.secondary, mr: 1, fontSize: 20 }} />
                              <Typography variant="body2" color="text.secondary">
                                {formatDate(appointment.date)}
                              </Typography>
                            </Box>
                            
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <AccessTimeIcon sx={{ color: theme.palette.text.secondary, mr: 1, fontSize: 20 }} />
                              <Typography variant="body2" color="text.secondary">
                                {formatTime(appointment.timeSlot)}
                              </Typography>
                            </Box>
                            
                            {appointment.reason && (
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                Reason: {appointment.reason}
                              </Typography>
                            )}
                            
                            <Box sx={{ mt: 2 }}>
                              <Chip 
                                label={appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)} 
                                color={appointment.status === 'completed' ? 'success' : 'default'}
                                size="small" 
                                sx={{ mr: 1 }} 
                              />
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    );
                  })}
              </Grid>
            </Paper>
          </motion.div>
        )}

        {/* Book New Appointment */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom fontWeight="medium">
              Book a New Appointment
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6} md={4} component="div">
                  <TextField
                    fullWidth
                    label="Search doctors"
                    variant="outlined"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    InputProps={{
                      startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4} component="div">
                  <FormControl fullWidth variant="outlined">
                    <InputLabel id="specialization-label">Specialization</InputLabel>
                    <Select
                      labelId="specialization-label"
                      value={selectedSpecialization}
                      onChange={handleSpecializationChange}
                      label="Specialization"
                    >
                      <MenuItem value="all">All Specializations</MenuItem>
                      {specializations.map((spec) => (
                        <MenuItem key={spec} value={spec}>
                          {spec}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>
            
            {filteredDoctors.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="body1" color="text.secondary">
                  No doctors found matching your criteria
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={3}>
                {filteredDoctors.map((doctor) => (
                  <Grid item xs={12} sm={6} md={4} key={doctor.id as string} component="div">
                    <Box>
                      <Card 
                      sx={{ 
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        borderRadius: 2,
                        boxShadow: theme.shadows[2],
                        '&:hover': {
                          boxShadow: theme.shadows[4],
                          transform: 'translateY(-4px)',
                          transition: 'transform 0.3s ease-in-out',
                        },
                      }}
                    >
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Avatar 
                            src={doctor.photoURL || undefined}
                            sx={{ 
                              width: 60, 
                              height: 60,
                              mr: 2,
                            }}
                          >
                            {`${doctor.displayName.split(' ')[0][0]}${doctor.displayName.split(' ').length > 1 ? doctor.displayName.split(' ')[1][0] : ''}`}
                          </Avatar>
                          <Box>
                            <Typography variant="h6">
                              Dr. {doctor.displayName}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {doctor.specialization}
                            </Typography>
                          </Box>
                        </Box>
                        
                        <Divider sx={{ my: 1.5 }} />
                        
                        {doctor.specialization && (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {doctor.specialization}
                          </Typography>
                        )}
                        
                        {doctor.education && (
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Education:</strong> {doctor.education}
                          </Typography>
                        )}
                        
                        {doctor.experience && (
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Experience:</strong> {doctor.experience} years
                          </Typography>
                        )}
                      </CardContent>
                      
                      <Box sx={{ p: 2, pt: 0 }}>
                        <Button 
                          variant="contained" 
                          color="primary" 
                          fullWidth
                          onClick={() => handleBookAppointment(doctor)}
                        >
                          Book Appointment
                        </Button>
                      </Box>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Paper>
        </motion.div>

        {/* Booking Dialog */}
        <Dialog 
          open={bookingDialogOpen} 
          onClose={handleCloseBookingDialog}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="h6">
                {bookingStep === 0 ? 'Select Date' : 
                 bookingStep === 1 ? 'Select Time' : 
                 'Confirm Appointment'}
              </Typography>
              <IconButton edge="end" color="inherit" onClick={handleCloseBookingDialog} aria-label="close">
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent dividers>
            {selectedDoctor && (
              <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                <Avatar 
                  src={selectedDoctor.photoURL || undefined}
                  sx={{ 
                    width: 50, 
                    height: 50,
                    mr: 2,
                  }}
                >
                  {`${selectedDoctor.firstName[0]}${selectedDoctor.lastName[0]}`}
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" fontWeight="medium">
                    Dr. {selectedDoctor.firstName} {selectedDoctor.lastName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedDoctor.specialization}
                  </Typography>
                </Box>
              </Box>
            )}

            {bookingStep === 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DateCalendar
                    value={selectedDate}
                    onChange={handleDateChange}
                    disablePast
                    sx={{ width: '100%' }}
                  />
                </LocalizationProvider>
              </Box>
            )}

            {bookingStep === 1 && (
              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  Available time slots for {selectedDate ? formatDate(selectedDate.toISOString()) : ''}:
                </Typography>
                
                {availableTimeSlots.length === 0 ? (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    No available time slots for this date. Please select another date.
                  </Alert>
                ) : (
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    {availableTimeSlots.map((timeSlot) => (
                      <Grid item xs={6} sm={4} key={timeSlot}>
                        <Button
                          variant={selectedTimeSlot === timeSlot ? "contained" : "outlined"}
                          color="primary"
                          fullWidth
                          onClick={() => handleTimeSlotSelect(timeSlot)}
                        >
                          {formatTime(timeSlot)}
                        </Button>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </Box>
            )}

            {bookingStep === 2 && (
              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  Appointment Details
                </Typography>
                
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={6} component="div">
                    <Typography variant="body2" color="text.secondary">
                      Date
                    </Typography>
                    <Typography variant="body1">
                      {selectedDate ? formatDate(selectedDate.toISOString()) : ''}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} component="div">
                    <Typography variant="body2" color="text.secondary">
                      Time
                    </Typography>
                    <Typography variant="body1">
                      {formatTime(selectedTimeSlot)}
                    </Typography>
                  </Grid>
                </Grid>
                
                <TextField
                  fullWidth
                  label="Reason for visit (optional)"
                  variant="outlined"
                  multiline
                  rows={4}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  sx={{ mb: 2 }}
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            {bookingStep > 0 && (
              <Button onClick={handlePrevStep} disabled={bookingInProgress}>
                Back
              </Button>
            )}
            {bookingStep < 2 ? (
              <Button 
                onClick={handleNextStep} 
                variant="contained" 
                color="primary"
                disabled={bookingStep === 0 ? !selectedDate : !selectedTimeSlot}
              >
                Next
              </Button>
            ) : (
              <Button 
                onClick={handleSubmitBooking} 
                variant="contained" 
                color="primary"
                disabled={bookingInProgress}
              >
                {bookingInProgress ? <CircularProgress size={24} /> : 'Confirm Booking'}
              </Button>
            )}
          </DialogActions>
        </Dialog>

        {/* Cancel Appointment Dialog */}
        <Dialog
          open={cancelDialogOpen}
          onClose={handleCloseCancelDialog}
        >
          <DialogTitle>Cancel Appointment</DialogTitle>
          <DialogContent>
            <Typography variant="body1">
              Are you sure you want to cancel this appointment?
            </Typography>
            {appointmentToCancel && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>Date:</strong> {formatDate(appointmentToCancel.date)}
                </Typography>
                <Typography variant="body2">
                  <strong>Time:</strong> {formatTime(appointmentToCancel.timeSlot)}
                </Typography>
                {appointmentToCancel.doctorId && (
                  <Typography variant="body2">
                    <strong>Doctor:</strong> Dr. {
                      doctors.find(d => d.id === appointmentToCancel.doctorId)?.firstName
                    } {
                      doctors.find(d => d.id === appointmentToCancel.doctorId)?.lastName
                    }
                  </Typography>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseCancelDialog} disabled={cancelInProgress}>
              No, Keep It
            </Button>
            <Button 
              onClick={handleConfirmCancel} 
              color="error" 
              variant="contained"
              disabled={cancelInProgress}
            >
              {cancelInProgress ? <CircularProgress size={24} /> : 'Yes, Cancel'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default AppointmentPage;