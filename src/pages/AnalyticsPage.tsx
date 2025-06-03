import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  useTheme,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Button,
} from '@mui/material';
import Grid from '@mui/material/Grid';
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
  ArcElement,
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { sessionService } from '../services/sessionService';
import { Session } from '../types';
import dayjs from 'dayjs';
import { PictureAsPdf as PdfIcon } from '@mui/icons-material';
import PageContainer from '../components/PageContainer';
import { generateAnalyticsPDF } from '../services/pdfService';

// Registrar componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const AnalyticsPage: React.FC = () => {
  const theme = useTheme();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [timeRange, setTimeRange] = useState<string>('7d');
  const [metricType, setMetricType] = useState<string>('xp');

  useEffect(() => {
    const loadedSessions = sessionService.getAllSessions();
    
    // Filtrar sessões baseado no intervalo de tempo selecionado
    const filteredSessions = filterSessionsByTimeRange(loadedSessions, timeRange);
    setSessions(filteredSessions);
  }, [timeRange]);

  const filterSessionsByTimeRange = (sessions: Session[], range: string): Session[] => {
    const now = dayjs();
    const ranges: { [key: string]: number } = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      'all': 0,
    };

    if (range === 'all') return sessions;

    const daysToSubtract = ranges[range];
    const startDate = now.subtract(daysToSubtract, 'day');

    return sessions.filter(session => 
      dayjs(session.start_datetime).isAfter(startDate)
    );
  };

  const handleTimeRangeChange = (event: SelectChangeEvent) => {
    setTimeRange(event.target.value);
  };

  const handleMetricTypeChange = (event: SelectChangeEvent) => {
    setMetricType(event.target.value);
  };

  // Calcular médias móveis
  const calculateMovingAverage = (data: number[], period: number): number[] => {
    return data.map((_, index) => {
      const start = Math.max(0, index - period + 1);
      const values = data.slice(start, index + 1);
      return values.reduce((sum, val) => sum + val, 0) / values.length;
    });
  };

  // Preparar dados para o gráfico de tendências
  const trendData = {
    labels: sessions.map(session => dayjs(session.start_datetime).format('DD/MM')),
    datasets: [
      {
        label: metricType === 'xp' ? 'XP/h' : 'Lucro/h',
        data: sessions.map(session => 
          metricType === 'xp' 
            ? session.total_xp_per_hour 
            : (session.balance / session.duration_minutes) * 60
        ),
        borderColor: theme.palette.primary.main,
        backgroundColor: theme.palette.primary.main,
        tension: 0.4,
      },
      {
        label: 'Média Móvel (3 sessões)',
        data: calculateMovingAverage(
          sessions.map(session => 
            metricType === 'xp' 
              ? session.total_xp_per_hour 
              : (session.balance / session.duration_minutes) * 60
          ),
          3
        ),
        borderColor: theme.palette.secondary.main,
        backgroundColor: theme.palette.secondary.main,
        borderDash: [5, 5],
        tension: 0.4,
      },
    ],
  };

  // Preparar dados para distribuição de monstros
  const monsterDistributionData = {
    labels: Object.entries(
      sessions.flatMap(s => s.killed_monsters)
        .reduce((acc: { [key: string]: number }, monster) => {
          acc[monster.name] = (acc[monster.name] || 0) + monster.count;
          return acc;
        }, {})
    )
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name]) => name),
    datasets: [{
      data: Object.entries(
        sessions.flatMap(s => s.killed_monsters)
          .reduce((acc: { [key: string]: number }, monster) => {
            acc[monster.name] = (acc[monster.name] || 0) + monster.count;
            return acc;
          }, {})
      )
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([, count]) => count),
      backgroundColor: [
        theme.palette.primary.main,
        theme.palette.secondary.main,
        theme.palette.error.main,
        theme.palette.warning.main,
        theme.palette.info.main,
      ],
    }],
  };

  // Calcular estatísticas de eficiência
  const calculateEfficiencyStats = () => {
    if (sessions.length === 0) return { bestHour: 0, worstHour: 0, averageHour: 0 };

    const hourlyMetrics = sessions.map(session => 
      metricType === 'xp' 
        ? session.total_xp_per_hour 
        : (session.balance / session.duration_minutes) * 60
    );

    return {
      bestHour: Math.max(...hourlyMetrics),
      worstHour: Math.min(...hourlyMetrics),
      averageHour: hourlyMetrics.reduce((a, b) => a + b, 0) / hourlyMetrics.length,
    };
  };

  const efficiencyStats = calculateEfficiencyStats();

  const handleExportPDF = () => {
    generateAnalyticsPDF(sessions);
  };

  return (
    <PageContainer 
      title="Analytics"
      action={
        <Button
          variant="contained"
          startIcon={<PdfIcon />}
          onClick={handleExportPDF}
          color="primary"
        >
          Exportar Relatório
        </Button>
      }
    >
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Analytics
      </Typography>

      {/* Filtros */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Período</InputLabel>
          <Select value={timeRange} label="Período" onChange={handleTimeRangeChange}>
            <MenuItem value="7d">Últimos 7 dias</MenuItem>
            <MenuItem value="30d">Últimos 30 dias</MenuItem>
            <MenuItem value="90d">Últimos 90 dias</MenuItem>
            <MenuItem value="all">Todo período</MenuItem>
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Métrica</InputLabel>
          <Select value={metricType} label="Métrica" onChange={handleMetricTypeChange}>
            <MenuItem value="xp">Experiência</MenuItem>
            <MenuItem value="profit">Lucro</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Grid container spacing={3}>
        {/* Estatísticas de Eficiência */}
        <Grid xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Melhor {metricType === 'xp' ? 'XP/h' : 'Lucro/h'}
              </Typography>
              <Typography variant="h4">
                {efficiencyStats.bestHour.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Média {metricType === 'xp' ? 'XP/h' : 'Lucro/h'}
              </Typography>
              <Typography variant="h4">
                {efficiencyStats.averageHour.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Pior {metricType === 'xp' ? 'XP/h' : 'Lucro/h'}
              </Typography>
              <Typography variant="h4">
                {efficiencyStats.worstHour.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Gráfico de Tendências */}
        <Grid xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Tendências e Média Móvel
              </Typography>
              <Box sx={{ height: 400 }}>
                <Line 
                  data={trendData} 
                  options={{
                    responsive: true,
                    plugins: {
                      legend: { position: 'top' as const },
                      title: { display: false },
                    },
                    scales: {
                      y: { beginAtZero: true },
                    },
                  }} 
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Distribuição de Monstros */}
        <Grid xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Distribuição de Monstros
              </Typography>
              <Box sx={{ height: 300 }}>
                <Pie 
                  data={monsterDistributionData}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: { position: 'right' as const },
                    },
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Distribuição de Horários */}
        <Grid xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Distribuição por Horário
              </Typography>
              <Box sx={{ height: 300 }}>
                <Bar
                  data={{
                    labels: ['00-04h', '04-08h', '08-12h', '12-16h', '16-20h', '20-24h'],
                    datasets: [{
                      label: 'Sessões',
                      data: Array(6).fill(0).map((_, i) => 
                        sessions.filter(s => {
                          const hour = dayjs(s.start_datetime).hour();
                          return hour >= i * 4 && hour < (i + 1) * 4;
                        }).length
                      ),
                      backgroundColor: theme.palette.primary.main,
                    }],
                  }}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: { display: false },
                    },
                    scales: {
                      y: { beginAtZero: true },
                    },
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
    </PageContainer>
  );
};

export default AnalyticsPage; 