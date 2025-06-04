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
  CircularProgress,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { ArrowBack } from '@mui/icons-material';
import { sessionService } from '../services/sessionService';
import { Session } from '../types';
import dayjs from 'dayjs';
import PageContainer from '../components/PageContainer';

const SessionDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSessionDetails = async () => {
      if (id) {
        setIsLoading(true);
        setError(null);
        try {
          const loadedSession = await sessionService.getSessionById(id);
          setSession(loadedSession);
        } catch (err) {
          console.error("[SessionDetailsPage] Error fetching session details:", err);
          setError("Falha ao carregar os detalhes da sessão.");
          setSession(null);
        } finally {
          setIsLoading(false);
        }
      } else {
        setError("ID da sessão não fornecido.");
        setIsLoading(false);
        setSession(null);
      }
    };

    fetchSessionDetails();
  }, [id]);

  const handleBack = () => {
    navigate('/sessions');
  };

  if (isLoading) {
    return (
      <PageContainer title="Detalhes da Sessão">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Carregando detalhes da sessão...</Typography>
        </Box>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer title="Erro">
        <Typography color="error">{error}</Typography>
        <Button onClick={handleBack} sx={{ mt: 2 }}>Voltar</Button>
      </PageContainer>
    );
  }

  if (!session) {
    return (
      <PageContainer title="Sessão Não Encontrada">
        <Typography>Sessão não encontrada.</Typography>
        <Button onClick={handleBack} sx={{ mt: 2 }}>Voltar para Lista</Button>
      </PageContainer>
    );
  }

  return (
    <PageContainer title={`Detalhes da Sessão: ${dayjs(session.start_datetime).format('DD/MM/YY HH:mm')}`}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={handleBack} sx={{ mr: 1 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h5">
          Detalhes da Sessão
        </Typography>
      </Box>

      <Grid container spacing={3}>
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
                gap: 2 
              }}>
                {(session.killed_monsters || []).map((monster, index) => (
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
                gap: 2 
              }}>
                {(session.looted_items || []).map((item, index) => (
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
    </PageContainer>
  );
};

export default SessionDetailsPage; 