import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  useTheme,
  Grid,
} from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { sessionService } from '../services/sessionService';
import { Session, SessionStats, KilledMonster, LootedItem } from '../types';
import dayjs from 'dayjs';
import PageContainer from '../components/PageContainer';

// Registrar componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const DashboardPage: React.FC = () => {
  const theme = useTheme();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<SessionStats>({
    total_sessions: 0,
    total_duration_minutes: 0,
    total_xp_gain: 0,
    average_xp_per_hour: 0,
    total_loot_value: 0,
    total_supplies_value: 0,
    total_balance: 0,
    total_monsters_killed: 0,
    most_killed_monsters: [],
  });

  const calculateStatsAndSetData = useCallback((loadedSessions: Session[]) => {
    if (loadedSessions.length > 0) {
      const totalXP = loadedSessions.reduce((sum, session) => sum + session.total_xp_gain, 0);
      const totalMinutes = loadedSessions.reduce((sum, session) => sum + session.duration_minutes, 0);
      const totalLoot = loadedSessions.reduce((sum, session) => sum + session.loot_value, 0);
      const totalSupplies = loadedSessions.reduce((sum, session) => sum + session.supplies_value, 0);

      const monsterCounts = new Map<string, number>();
      loadedSessions.forEach((session, sessionIndex) => {
        if (session.killed_monsters) {
          session.killed_monsters.forEach(monster => {
            const current = monsterCounts.get(monster.name) || 0;
            monsterCounts.set(monster.name, current + monster.count);
          });
        }
      });

      const sortedMonsters = Array.from(monsterCounts.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setStats({
        total_sessions: loadedSessions.length,
        total_duration_minutes: totalMinutes,
        total_xp_gain: totalXP,
        average_xp_per_hour: totalMinutes > 0 ? (totalXP / totalMinutes) * 60 : 0,
        total_loot_value: totalLoot,
        total_supplies_value: totalSupplies,
        total_balance: totalLoot - totalSupplies,
        total_monsters_killed: Array.from(monsterCounts.values()).reduce((a, b) => a + b, 0),
        most_killed_monsters: sortedMonsters,
      });
    } else {
      setStats({
        total_sessions: 0,
        total_duration_minutes: 0,
        total_xp_gain: 0,
        average_xp_per_hour: 0,
        total_loot_value: 0,
        total_supplies_value: 0,
        total_balance: 0,
        total_monsters_killed: 0,
        most_killed_monsters: [],
      });
    }
  }, []);

  useEffect(() => {
    const fetchSessions = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const loadedSessions = await sessionService.getAllSessions();
        setSessions(loadedSessions);
        calculateStatsAndSetData(loadedSessions);
      } catch (err) {
        console.error("[DashboardPage] Error loading sessions:", err);
        setError("Falha ao carregar os dados do dashboard.");
        setSessions([]);
        calculateStatsAndSetData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessions();
  }, [calculateStatsAndSetData]);

  // Preparar dados para o gráfico de XP
  const xpChartData = {
    labels: sessions.map(session => dayjs(session.start_datetime).format('DD/MM')),
    datasets: [
      {
        label: 'XP/h',
        data: sessions.map(session => session.total_xp_per_hour),
        borderColor: theme.palette.primary.main,
        backgroundColor: theme.palette.primary.main,
        tension: 0.4,
      },
    ],
  };

  // Preparar dados para o gráfico de lucro
  const profitChartData = {
    labels: sessions.map(session => dayjs(session.start_datetime).format('DD/MM')),
    datasets: [
      {
        label: 'Lucro',
        data: sessions.map(session => session.balance),
        backgroundColor: theme.palette.success.main,
      },
    ],
  };

  const lineChartOptions: ChartOptions<'line'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  if (isLoading) {
    return <PageContainer title="Dashboard"><Typography>Carregando dados do dashboard...</Typography></PageContainer>;
  }

  if (error) {
    return <PageContainer title="Dashboard"><Typography color="error">{error}</Typography></PageContainer>;
  }

  if (sessions.length === 0) {
    return <PageContainer title="Dashboard"><Typography>Nenhuma sessão encontrada. Importe sua primeira sessão!</Typography></PageContainer>;
  }

  return (
    <PageContainer title="Dashboard">
      <Grid container spacing={2}>
        {/* Cards de Resumo */}
        <Grid item xs={12} sm={6} lg={3}>
          <Card>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="subtitle1" color="textSecondary">
                Sessões Totais
              </Typography>
              <Typography variant="h4">
                {stats.total_sessions}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          <Card>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="subtitle1" color="textSecondary">
                Tempo Total
              </Typography>
              <Typography variant="h4">
                {Math.floor(stats.total_duration_minutes / 60)}h {stats.total_duration_minutes % 60}m
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          <Card>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="subtitle1" color="textSecondary">
                XP Total
              </Typography>
              <Typography variant="h4">
                {stats.total_xp_gain.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          <Card>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="subtitle1" color="textSecondary">
                Lucro Total
              </Typography>
              <Typography variant="h4">
                {stats.total_balance.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Gráficos */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Evolução de XP/h
              </Typography>
              <Box sx={{ height: 300 }}>
                <Line data={xpChartData} options={lineChartOptions} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Evolução do Lucro
              </Typography>
              <Box sx={{ height: 300 }}>
                <Bar data={profitChartData} options={barChartOptions} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Listas */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Criaturas Abatidas
              </Typography>
              {stats.most_killed_monsters.map((monster, index) => (
                <Box key={monster.name} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography>{monster.name}</Typography>
                  <Typography>{monster.count}</Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </PageContainer>
  );
};

export default DashboardPage;