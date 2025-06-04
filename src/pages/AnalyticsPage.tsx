import React, { useEffect, useState, useCallback } from 'react';
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
import { generateAnalyticsPDF, AnalyticsSummary } from '../services/pdfService';

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
  const [allRawSessions, setAllRawSessions] = useState<Session[]>([]);
  const [displaySessions, setDisplaySessions] = useState<Session[]>([]);
  const [timeRange, setTimeRange] = useState<string>('30d');
  const [metricType, setMetricType] = useState<string>('xp');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAllData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const loadedSessions = await sessionService.getAllSessions();
        setAllRawSessions(loadedSessions);
      } catch (err) {
        console.error("[AnalyticsPage] Error loading sessions:", err);
        setError("Falha ao carregar os dados de análise.");
        setAllRawSessions([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllData();
  }, []);

  const filterSessionsByTimeRange = useCallback((sessionsToFilter: Session[], range: string): Session[] => {
    const now = dayjs();
    const ranges: { [key: string]: number } = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      'all': Infinity,
    };

    if (range === 'all') return sessionsToFilter;

    const daysToSubtract = ranges[range];
    if (daysToSubtract === undefined) return sessionsToFilter;
    
    const startDate = now.subtract(daysToSubtract, 'day').startOf('day');

    return sessionsToFilter.filter(session => 
      dayjs(session.start_datetime).isAfter(startDate)
    );
  }, []);

  useEffect(() => {
    const filtered = filterSessionsByTimeRange(allRawSessions, timeRange);
    setDisplaySessions(filtered);
  }, [allRawSessions, timeRange, filterSessionsByTimeRange]);

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
    labels: displaySessions.map(session => dayjs(session.start_datetime).format('DD/MM')),
    datasets: [
      {
        label: metricType === 'xp' ? 'XP/h' : 'Lucro/h',
        data: displaySessions.map(session => 
          metricType === 'xp' 
            ? session.total_xp_per_hour 
            : (session.balance / (session.duration_minutes > 0 ? session.duration_minutes : 1)) * 60
        ).filter(value => isFinite(value)),
        borderColor: theme.palette.primary.main,
        backgroundColor: theme.palette.primary.main,
        tension: 0.4,
      },
      {
        label: 'Média Móvel (3 sessões)',
        data: calculateMovingAverage(
          displaySessions.map(session => 
            metricType === 'xp' 
              ? session.total_xp_per_hour 
              : (session.balance / (session.duration_minutes > 0 ? session.duration_minutes : 1)) * 60
          ).filter(value => isFinite(value)),
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
      displaySessions.flatMap(s => s.killed_monsters || [])
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
        displaySessions.flatMap(s => s.killed_monsters || [])
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
    if (displaySessions.length === 0) return { bestHour: 0, worstHour: 0 };

    const hourlyMetrics = displaySessions.map(session => 
      metricType === 'xp' 
        ? session.total_xp_per_hour 
        : (session.balance / (session.duration_minutes > 0 ? session.duration_minutes : 1)) * 60
    ).filter(value => isFinite(value));

    if (hourlyMetrics.length === 0) return { bestHour: 0, worstHour: 0 };

    return {
      bestHour: Math.max(...hourlyMetrics),
      worstHour: Math.min(...hourlyMetrics),
    };
  };

  const efficiencyStats = calculateEfficiencyStats();

  // Helper function to format minutes into hh:mm string
  const formatMinutesToHMS = (minutes: number): string => {
    const h = Math.floor(minutes / 60);
    const m = Math.floor(minutes % 60);
    return `${h}h ${m}m`;
  };

  const prepareAnalyticsSummary = (): AnalyticsSummary => {
    if (displaySessions.length === 0) {
      return {
        totalSessions: 0,
        totalXP: 0,
        totalBalance: 0,
        averageXPPerHour: 0,
        bestXPPerHour: 0,
        worstXPPerHour: 0,
        totalPlayTime: '0h 0m',
        mostKilledMonsters: [],
        mostValuableItems: [],
      };
    }

    const totalXP = displaySessions.reduce((sum, s) => sum + s.total_xp_gain, 0);
    const totalBalance = displaySessions.reduce((sum, s) => sum + s.balance, 0);
    const totalDurationMinutes = displaySessions.reduce((sum, s) => sum + s.duration_minutes, 0);

    const xpPerHourValues = displaySessions.map(s => s.total_xp_per_hour).filter(value => isFinite(value));
    const averageXPPerHour = xpPerHourValues.length > 0 ? xpPerHourValues.reduce((sum, val) => sum + val, 0) / xpPerHourValues.length : 0;
    const bestXPPerHour = xpPerHourValues.length > 0 ? Math.max(...xpPerHourValues) : 0;
    const worstXPPerHour = xpPerHourValues.length > 0 ? Math.min(...xpPerHourValues) : 0;

    // Most Killed Monsters
    const monsterCounts = new Map<string, number>();
    displaySessions.forEach(session => {
      (session.killed_monsters || []).forEach(monster => {
        const current = monsterCounts.get(monster.name) || 0;
        monsterCounts.set(monster.name, current + monster.count);
      });
    });
    const mostKilledMonsters = Array.from(monsterCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Most Valuable Items
    const itemValues = new Map<string, number>();
    displaySessions.forEach(session => {
      (session.looted_items || []).forEach(item => {
        const current = itemValues.get(item.name) || 0;
        const value = typeof item.value === 'number' ? item.value : 0;
        itemValues.set(item.name, current + value);
      });
    });
    const mostValuableItems = Array.from(itemValues.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
    
    return {
      totalSessions: displaySessions.length,
      totalXP,
      totalBalance,
      averageXPPerHour: isFinite(averageXPPerHour) ? averageXPPerHour : 0,
      bestXPPerHour: isFinite(bestXPPerHour) ? bestXPPerHour : 0,
      worstXPPerHour: isFinite(worstXPPerHour) ? worstXPPerHour : 0,
      totalPlayTime: formatMinutesToHMS(totalDurationMinutes),
      mostKilledMonsters,
      mostValuableItems,
    };
  };

  const handleExportPDF = () => {
    const last30DaysSessions = filterSessionsByTimeRange(allRawSessions, '30d');
    if (last30DaysSessions.length === 0) {
      alert("Nenhuma sessão encontrada nos últimos 30 dias para gerar o PDF.");
      return;
    }
    const summary = prepareAnalyticsSummaryForPDF(last30DaysSessions);
    generateAnalyticsPDF(last30DaysSessions, summary);
  };

  const prepareAnalyticsSummaryForPDF = (sessionsForPDF: Session[]): AnalyticsSummary => {
    if (sessionsForPDF.length === 0) {
      return {
        totalSessions: 0,
        totalXP: 0,
        totalBalance: 0,
        averageXPPerHour: 0,
        bestXPPerHour: 0,
        worstXPPerHour: 0,
        totalPlayTime: '0h 0m',
        mostKilledMonsters: [],
        mostValuableItems: [],
      };
    }
    const totalXP = sessionsForPDF.reduce((sum, s) => sum + s.total_xp_gain, 0);
    const totalBalance = sessionsForPDF.reduce((sum, s) => sum + s.balance, 0);
    const totalDurationMinutes = sessionsForPDF.reduce((sum, s) => sum + s.duration_minutes, 0);

    const xpPerHourValues = sessionsForPDF.map(s => s.total_xp_per_hour).filter(value => isFinite(value));
    const averageXPPerHour = xpPerHourValues.length > 0 ? xpPerHourValues.reduce((sum, val) => sum + val, 0) / xpPerHourValues.length : 0;
    const bestXPPerHour = xpPerHourValues.length > 0 ? Math.max(...xpPerHourValues) : 0;
    const worstXPPerHour = xpPerHourValues.length > 0 ? Math.min(...xpPerHourValues) : 0;

    const monsterCounts = new Map<string, number>();
    sessionsForPDF.forEach(session => {
      (session.killed_monsters || []).forEach(monster => {
        const current = monsterCounts.get(monster.name) || 0;
        monsterCounts.set(monster.name, current + monster.count);
      });
    });
    const mostKilledMonsters = Array.from(monsterCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const itemValues = new Map<string, number>();
    sessionsForPDF.forEach(session => {
      (session.looted_items || []).forEach(item => {
        const current = itemValues.get(item.name) || 0;
        const value = typeof item.value === 'number' ? item.value : 0;
        itemValues.set(item.name, current + value);
      });
    });
    const mostValuableItems = Array.from(itemValues.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    return {
      totalSessions: sessionsForPDF.length,
      totalXP,
      totalBalance,
      averageXPPerHour: isFinite(averageXPPerHour) ? averageXPPerHour : 0,
      bestXPPerHour: isFinite(bestXPPerHour) ? bestXPPerHour : 0,
      worstXPPerHour: isFinite(worstXPPerHour) ? worstXPPerHour : 0,
      totalPlayTime: formatMinutesToHMS(totalDurationMinutes),
      mostKilledMonsters,
      mostValuableItems,
    };
  };

  if (isLoading) {
    return <PageContainer title="Análises"><Typography>Carregando análises...</Typography></PageContainer>;
  }

  if (error) {
    return <PageContainer title="Análises"><Typography color="error">{error}</Typography></PageContainer>;
  }

  if (allRawSessions.length === 0 && !isLoading) {
    return <PageContainer title="Análises"><Typography>Nenhuma sessão encontrada. Importe algumas sessões para ver as análises.</Typography></PageContainer>;
  }

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

      <Grid container spacing={4}>
        {/* Estatísticas de Eficiência */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Maior {metricType === 'xp' ? 'XP/h' : 'Lucro/h'}
              </Typography>
              <Typography variant="h4">
                {efficiencyStats.bestHour.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Menor {metricType === 'xp' ? 'XP/h' : 'Lucro/h'}
              </Typography>
              <Typography variant="h4">
                {efficiencyStats.worstHour.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Gráfico de Tendências */}
        <Grid item xs={12}>
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
        <Grid item xs={12} md={6}>
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
        <Grid item xs={12} md={6}>
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
                        displaySessions.filter(s => {
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