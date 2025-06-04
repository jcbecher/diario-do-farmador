import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  CardActionArea,
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemText,
  Button,
  DialogActions,
  Tooltip,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { LocalizationProvider, DateCalendar } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { ChevronLeft, ChevronRight, Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { Session } from '../types';
import { sessionService } from '../services/sessionService';
import PageContainer from '../components/PageContainer';

const SessionListPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [allSessions, setAllSessions] = useState<Session[]>([]);
  const [selectedDaySessions, setSelectedDaySessions] = useState<Session[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAllSessions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const loadedSessions = await sessionService.getAllSessions();
      setAllSessions(loadedSessions);
    } catch (err) {
      console.error("Failed to load sessions:", err);
      setError("Falha ao carregar as sessões.");
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchAllSessions();
  }, [fetchAllSessions]);

  const fetchSessionsForSelectedDate = useCallback(async () => {
    if (!selectedDate) return;
    try {
      const daySessions = await sessionService.getSessionsByDate(selectedDate.toDate());
      setSelectedDaySessions(daySessions);
    } catch (err) {
      console.error("Failed to load sessions for date:", err);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchSessionsForSelectedDate();
  }, [selectedDate, allSessions, fetchSessionsForSelectedDate]);

  const handleDateChange = (date: Dayjs | null) => {
    if (date) {
      setSelectedDate(date);
      setDialogOpen(true);
    }
  };

  const handleSessionClick = (sessionId: string) => {
    navigate(`/sessions/${sessionId}`);
  };

  const handleDeleteClick = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    setSessionToDelete(sessionId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (sessionToDelete) {
      setIsLoading(true);
      try {
        const success = await sessionService.deleteSession(sessionToDelete);
        if (success) {
          await fetchAllSessions();
        } else {
          setError("Falha ao deletar a sessão.");
        }
      } catch (err) {
        console.error("Error deleting session:", err);
        setError("Erro ao deletar a sessão.");
      }
      setDeleteDialogOpen(false);
      setSessionToDelete(null);
      setIsLoading(false);
    }
  };

  const hasSessionsOnDay = useCallback((date: Dayjs) => {
    return allSessions.some(session => {
      const sessionDate = dayjs(session.start_datetime);
      return sessionDate.isSame(date, 'day');
    });
  }, [allSessions]);

  const getMostKilledMonster = (session: Session) => {
    if (!session.killed_monsters || session.killed_monsters.length === 0) {
      return null;
    }
    return session.killed_monsters.reduce((max, current) => 
      current.count > max.count ? current : max
    );
  };

  return (
    <PageContainer 
      title="Calendário de Sessões"
      action={
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/import')}
          color="primary"
        >
          Import Session
        </Button>
      }
    >
      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <Card elevation={2}>
            <CardContent sx={{ p: 2 }}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DateCalendar
                  value={selectedDate}
                  onChange={handleDateChange}
                  sx={{
                    width: '100%',
                    '& .MuiPickersDay-root': {
                      '&.Mui-selected': {
                        backgroundColor: 'primary.main',
                      },
                    },
                  }}
                  slots={{
                    leftArrowIcon: ChevronLeft,
                    rightArrowIcon: ChevronRight,
                  }}
                  slotProps={{
                    day: (props: any) => ({
                      ...props,
                      sx: {
                        ...(hasSessionsOnDay(props.day) && {
                          backgroundColor: 'action.hover',
                          '&:hover': {
                            backgroundColor: 'action.selected',
                          },
                        }),
                        ...(dayjs(props.day).isSame(selectedDate, 'day') && !hasSessionsOnDay(props.day) && {
                        }),
                      },
                    }),
                  }}
                />
              </LocalizationProvider>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card elevation={2} sx={{ height: '100%' }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 500, color: 'text.primary' }}>
                Resumo Diário
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  Sessões: {selectedDaySessions.length}
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  Total XP: {selectedDaySessions.reduce((sum, session) => sum + session.total_xp_gain, 0).toLocaleString()}
                </Typography>
                <Typography variant="body1">
                  Total Balance: {selectedDaySessions.reduce((sum, session) => sum + session.balance, 0).toLocaleString()}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ pb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            Sessions on {selectedDate.format('MMMM D, YYYY')}
          </Typography>
          <Tooltip title="Import New Session">
            <IconButton
              color="primary"
              onClick={() => {
                setDialogOpen(false);
                navigate('/import');
              }}
            >
              <AddIcon />
            </IconButton>
          </Tooltip>
        </DialogTitle>
        <DialogContent>
          {isLoading && <Typography>Carregando...</Typography>}
          {error && <Typography color="error">{error}</Typography>}
          <List sx={{ pt: 0 }}>
            {selectedDaySessions.length > 0 ? (
              selectedDaySessions.map((session) => (
                <React.Fragment key={session.id}>
                  <ListItem disablePadding>
                    <CardActionArea onClick={() => handleSessionClick(session.id)} sx={{ width: '100%' }}>
                      <Card elevation={1} sx={{ width: '100%', mb: 1 }}>
                        <CardContent sx={{ position: 'relative' }}>
                          {session.killed_monsters && session.killed_monsters.length > 0 && (
                            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                              Most Killed: {getMostKilledMonster(session)?.name} ({getMostKilledMonster(session)?.count}x)
                            </Typography>
                          )}
                          <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 1 }}>
                            {dayjs(session.start_datetime).format('HH:mm')} - {dayjs(session.end_datetime).format('HH:mm')}
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            XP: {session.total_xp_gain.toLocaleString()}
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            Balance: {session.balance.toLocaleString()}
                          </Typography>
                          <Box sx={{ position: 'absolute', right: 8, top: 8 }}>
                            <Tooltip title="Delete Session">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={(e) => handleDeleteClick(e, session.id)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </CardContent>
                      </Card>
                    </CardActionArea>
                  </ListItem>
                </React.Fragment>
              ))
            ) : (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="body1" sx={{ color: 'text.secondary', mb: 2 }}>
                  No sessions on this day
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => {
                    setDialogOpen(false);
                    navigate('/import');
                  }}
                >
                  Import New Session
                </Button>
              </Box>
            )}
          </List>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Session</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this session? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default SessionListPage; 