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

export interface AnalyticsSummary {
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

// Helper functions (deduplicated)
const formatMinutes = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
};

const getMostKilledMonsters = (sessions: Session[]): Array<{ name: string; count: number }> => {
  const monsterCounts = new Map<string, number>();
  sessions.forEach(session => {
    (session.killed_monsters || []).forEach(monster => {
      const current = monsterCounts.get(monster.name) || 0;
      monsterCounts.set(monster.name, current + monster.count);
    });
  });
  return Array.from(monsterCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
};

const getMostValuableItems = (sessions: Session[]): Array<{ name: string; value: number }> => {
  const itemValues = new Map<string, number>();
  sessions.forEach(session => {
    (session.looted_items || []).forEach(item => {
      const current = itemValues.get(item.name) || 0;
      itemValues.set(item.name, current + (item.value || 0));
    });
  });
  return Array.from(itemValues.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
};

export const generateAnalyticsPDF = (sessions: Session[], summary: AnalyticsSummary) => {
  const doc = new jsPDF() as jsPDFWithAutoTable;

  doc.setFontSize(18);
  doc.text('Relatório de Analytics - Últimos 30 Dias', 14, 22);
  doc.setFontSize(11);
  doc.setTextColor(100);

  // General Stats
  const generalData = [
    ['Total de Sessões', summary.totalSessions.toString()],
    ['Total XP Ganhos', summary.totalXP.toLocaleString()],
    ['Balanço Total', summary.totalBalance.toLocaleString()],
    ['Tempo Total de Jogo', summary.totalPlayTime],
    ['Média de XP/Hora', summary.averageXPPerHour.toLocaleString()],
    ['Melhor XP/Hora', summary.bestXPPerHour.toLocaleString()],
    ['Pior XP/Hora', summary.worstXPPerHour.toLocaleString()],
  ];

  autoTable(doc, {
    startY: 30,
    head: [['Estatística', 'Valor']],
    body: generalData,
    theme: 'striped',
    headStyles: { fillColor: [49, 240, 52] }, // Green color
  });

  // Most Killed Monsters
  const monsterData = summary.mostKilledMonsters.length > 0 ?
    summary.mostKilledMonsters.map(monster => [monster.name, monster.count.toString()]) :
    [['Nenhum monstro registrado', '']];

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 10,
    head: [['Monstro Mais Caçado', 'Quantidade']],
    body: monsterData,
    theme: 'striped',
    headStyles: { fillColor: [49, 240, 52] },
  });
  
  // Most Valuable Items
  const itemData = summary.mostValuableItems.length > 0 ?
    summary.mostValuableItems.map(item => [item.name, item.value.toLocaleString()]) :
    [['Nenhum item registrado', '']];

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 10,
    head: [['Item Mais Valioso', 'Valor Total']],
    body: itemData,
    theme: 'striped',
    headStyles: { fillColor: [49, 240, 52] },
  });

  // Save the PDF
  doc.save('analytics-report.pdf');
};

// Export helper functions if they need to be used elsewhere, otherwise keep them unexported
// export { getMostKilledMonsters, getMostValuableItems, formatMinutes };