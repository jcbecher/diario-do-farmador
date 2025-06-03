import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Session } from '../types';
import dayjs from 'dayjs';

// Add proper typing for jsPDF with autoTable
interface jsPDFWithAutoTable extends jsPDF {
  autoTable: typeof autoTable;
  lastAutoTable: {
    finalY: number;
  };
}

interface AnalyticsSummary {
  totalSessions: number;
  totalXP: number;
  totalBalance: number;
  averageXPPerHour: number;
  bestXPPerHour: number;
  worstXPPerHour: number;
  totalPlayTime: string;
  mostKilledMonsters: Array<{ name: string; count: number }>;
  mostValuableItems: Array<{ name: string; value: number }>;
}

export const generateAnalyticsPDF = (sessions: Session[]) => {
  const doc = new jsPDF();
  const today = dayjs();
  const thirtyDaysAgo = today.subtract(30, 'day');

  // Filter sessions from last 30 days
  const recentSessions = sessions.filter(session => 
    dayjs(session.start_datetime).isAfter(thirtyDaysAgo)
  );

  // Calculate statistics
  const summary: AnalyticsSummary = {
    totalSessions: recentSessions.length,
    totalXP: recentSessions.reduce((sum, session) => sum + session.total_xp_gain, 0),
    totalBalance: recentSessions.reduce((sum, session) => sum + session.balance, 0),
    averageXPPerHour: recentSessions.length > 0 
      ? recentSessions.reduce((sum, session) => sum + session.total_xp_per_hour, 0) / recentSessions.length 
      : 0,
    bestXPPerHour: recentSessions.length > 0 
      ? Math.max(...recentSessions.map(s => s.total_xp_per_hour))
      : 0,
    worstXPPerHour: recentSessions.length > 0 
      ? Math.min(...recentSessions.map(s => s.total_xp_per_hour))
      : 0,
    totalPlayTime: formatMinutes(recentSessions.reduce((sum, session) => sum + session.duration_minutes, 0)),
    mostKilledMonsters: getMostKilledMonsters(recentSessions),
    mostValuableItems: getMostValuableItems(recentSessions),
  };

  // Add header
  doc.setFontSize(20);
  doc.text('Relatório de Análise - Últimos 30 Dias', 14, 20);
  doc.setFontSize(12);
  doc.text(`Gerado em: ${today.format('DD/MM/YYYY HH:mm')}`, 14, 30);

  // Add general summary
  doc.setFontSize(16);
  doc.text('Resumo Geral', 14, 45);
  doc.setFontSize(12);

  const summaryData = [
    ['Total de Sessões', summary.totalSessions.toString()],
    ['Tempo Total de Jogo', summary.totalPlayTime],
    ['XP Total', summary.totalXP.toLocaleString()],
    ['Média de XP/h', Math.round(summary.averageXPPerHour).toLocaleString()],
    ['Melhor XP/h', summary.bestXPPerHour.toLocaleString()],
    ['Pior XP/h', summary.worstXPPerHour.toLocaleString()],
    ['Balanço Total', summary.totalBalance.toLocaleString()],
  ];

  autoTable(doc, {
    startY: 50,
    head: [['Métrica', 'Valor']],
    body: summaryData,
    theme: 'striped',
    headStyles: { fillColor: [49, 240, 52] },
  });

  // Add top 5 monsters
  doc.setFontSize(16);
  doc.text('Top 5 Monstros Mais Mortos', 14, (doc as any).lastAutoTable.finalY + 20);

  const monsterData = summary.mostKilledMonsters.map(monster => [
    monster.name,
    monster.count.toString(),
  ]);

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 25,
    head: [['Monstro', 'Quantidade']],
    body: monsterData,
    theme: 'striped',
    headStyles: { fillColor: [49, 240, 52] },
  });

  // Add top 5 items
  doc.setFontSize(16);
  doc.text('Top 5 Items Mais Valiosos', 14, (doc as any).lastAutoTable.finalY + 20);

  const itemData = summary.mostValuableItems.map(item => [
    item.name,
    item.value.toLocaleString(),
  ]);

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 25,
    head: [['Item', 'Valor']],
    body: itemData,
    theme: 'striped',
    headStyles: { fillColor: [49, 240, 52] },
  });

  // Save the PDF
  doc.save('analytics-report.pdf');
};

// Helper functions
const formatMinutes = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
};

const getMostKilledMonsters = (sessions: Session[]) => {
  const monsterCounts = new Map<string, number>();
  
  sessions.forEach(session => {
    session.killed_monsters.forEach(monster => {
      const current = monsterCounts.get(monster.name) || 0;
      monsterCounts.set(monster.name, current + monster.count);
    });
  });

  return Array.from(monsterCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
};

const getMostValuableItems = (sessions: Session[]) => {
  const itemValues = new Map<string, number>();
  
  sessions.forEach(session => {
    session.looted_items.forEach(item => {
      const current = itemValues.get(item.name) || 0;
      itemValues.set(item.name, current + (item.value || 0));
    });
  });

  return Array.from(itemValues.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
}; 