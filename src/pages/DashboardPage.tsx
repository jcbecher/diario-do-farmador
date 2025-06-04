import React, { useEffect, useState } from 'react';
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
  // No estado inicial
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

  useEffect(() => {
    const loadedSessions = sessionService.getAllSessions();
    console.log('[DashboardPage] Loaded sessions:', JSON.parse(JSON.stringify(loadedSessions)));
    setSessions(loadedSessions);

    // Calcular estatísticas
    if (loadedSessions.length > 0) {
      const totalXP = loadedSessions.reduce((sum, session) => sum + session.total_xp_gain, 0);
      const totalMinutes = loadedSessions.reduce((sum, session) => sum + session.duration_minutes, 0);
      const totalLoot = loadedSessions.reduce((sum, session) => sum + session.loot_value, 0);
      const totalSupplies = loadedSessions.reduce((sum, session) => sum + session.supplies_value, 0);

      // Contagem de monstros
      const monsterCounts = new Map<string, number>();
      loadedSessions.forEach((session, sessionIndex) => {
        console.log(`[DashboardPage] Session ${sessionIndex} killed_monsters:`, JSON.parse(JSON.stringify(session.killed_monsters)));
        session.killed_monsters.forEach(monster => {
          const current = monsterCounts.get(monster.name) || 0;
          monsterCounts.set(monster.name, current + monster.count);
        });
      });
      console.log('[DashboardPage] Monster counts map:', Object.fromEntries(monsterCounts));

      // Ordenar monstros por quantidade
      const sortedMonsters = Array.from(monsterCounts.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      console.log('[DashboardPage] Sorted monsters (top 5):', sortedMonsters);

      // Contagem de items
      const itemCounts = new Map<string, { count: number; value: number }>();
      loadedSessions.forEach(session => {
        session.looted_items.forEach(item => {
          const current = itemCounts.get(item.name) || { count: 0, value: 0 };
          itemCounts.set(item.name, {
            count: current.count + item.count,
            value: current.value + (item.value || 0),
          });
        });
      });

      // Ordenar items por valor
      const sortedItems = Array.from(itemCounts.entries())
        .map(([name, data]) => ({ name, count: data.count, value: data.value }))
        .sort((a, b) => b.value - a.value)
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
    }
  }, []);

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

        {/* Remova todo este bloco Grid abaixo */}
        {/* 
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Top 5 Items Mais Valiosos
              </Typography>
              {stats.most_valuable_items.map((item, index) => (
                <Box key={item.name} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography>{item.name}</Typography>
                  <Typography>{item.value?.toLocaleString()}</Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid> 
        */}
      </Grid>
    </PageContainer>
  );
};

export default DashboardPage;