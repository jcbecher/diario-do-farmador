import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  IconButton,
  Divider,
  Button,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { ArrowBack } from '@mui/icons-material';
import { sessionService } from '../services/sessionService';
import { Session } from '../types';
import dayjs from 'dayjs';

const SessionDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    if (id) {
      const loadedSession = sessionService.getSessionById(id);
      if (loadedSession) {
        setSession(loadedSession);
      }
    }
  }, [id]);

  if (!session) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Sessão não encontrada</Typography>
      </Box>
    );
  }

  const handleBack = () => {
    navigate('/sessions');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={handleBack} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4">
          Session Details
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* Informações Básicas */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Informações Básicas
              </Typography>
              <Typography>
                <strong>Início:</strong> {dayjs(session.start_datetime).format('DD/MM/YYYY HH:mm')}
              </Typography>
              <Typography>
                <strong>Fim:</strong> {dayjs(session.end_datetime).format('DD/MM/YYYY HH:mm')}
              </Typography>
              <Typography>
                <strong>Duração:</strong> {session.duration_minutes} minutos
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Experiência */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Experiência
              </Typography>
              <Typography>
                <strong>XP Total:</strong> {session.total_xp_gain.toLocaleString()}
              </Typography>
              <Typography>
                <strong>XP/h:</strong> {session.total_xp_per_hour.toLocaleString()}
              </Typography>
              <Typography>
                <strong>XP Raw:</strong> {session.raw_xp_gain.toLocaleString()}
              </Typography>
              <Typography>
                <strong>XP/h Raw:</strong> {session.raw_xp_per_hour.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Loot e Supplies */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Loot e Supplies
              </Typography>
              <Typography>
                <strong>Valor do Loot:</strong> {session.loot_value.toLocaleString()}
              </Typography>
              <Typography>
                <strong>Supplies:</strong> {session.supplies_value.toLocaleString()}
              </Typography>
              <Typography>
                <strong>Balanço:</strong> {session.balance.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Dano e Cura */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Dano e Cura
              </Typography>
              <Typography>
                <strong>Dano Total:</strong> {session.damage_dealt.toLocaleString()}
              </Typography>
              <Typography>
                <strong>Dano/h:</strong> {session.damage_per_hour.toLocaleString()}
              </Typography>
              <Typography>
                <strong>Cura Total:</strong> {session.healing_done.toLocaleString()}
              </Typography>
              <Typography>
                <strong>Cura/h:</strong> {session.healing_per_hour.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Monstros Mortos */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Monstros Mortos
              </Typography>
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
                gap: 3 
              }}>
                {session.killed_monsters.map((monster, index) => (
                  <Typography key={index}>
                    {monster.count}x {monster.name}
                  </Typography>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Items Coletados */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Items Coletados
              </Typography>
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
                gap: 3 
              }}>
                {session.looted_items.map((item, index) => (
                  <Typography key={index}>
                    {item.count}x {item.name}
                  </Typography>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
        <Button
          variant="outlined"
          onClick={handleBack}
        >
          Voltar para Lista
        </Button>
      </Box>
    </Box>
  );
};

export default SessionDetailsPage; 