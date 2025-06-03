import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  CircularProgress,
  Card,
  CardContent,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { sessionService } from '../services/sessionService';
import { Session, KilledMonster, LootedItem } from '../types';
import PageContainer from '../components/PageContainer';

interface ImportPreview {
  start_datetime: string;
  end_datetime: string;
  duration_minutes: number;
  raw_xp_gain: number;
  total_xp_gain: number;
  raw_xp_per_hour: number;
  total_xp_per_hour: number;
  loot_value: number;
  supplies_value: number;
  balance: number;
  damage_dealt: number;
  damage_per_hour: number;
  healing_done: number;
  healing_per_hour: number;
  killed_monsters: KilledMonster[];
  looted_items: LootedItem[];
}

const ImportPage: React.FC = () => {
  const navigate = useNavigate();
  const [sessionLog, setSessionLog] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [preview, setPreview] = useState<ImportPreview | null>(null);

  const parseNumber = (str: string): number => {
    return parseInt(str.replace(/,/g, ''));
  };

  const parseDuration = (duration: string): number => {
    const [hours, minutes] = duration.replace('h', '').split(':').map(Number);
    return hours * 60 + minutes;
  };

  const parseKilledMonsters = (text: string): Array<{ name: string; count: number }> => {
    const monsters = text.split(' ');
    const result = [];
    
    for (let i = 0; i < monsters.length; i += 2) {
      if (monsters[i] && monsters[i + 1]) {
        const count = parseInt(monsters[i]);
        const name = monsters[i + 1];
        if (!isNaN(count)) {
          result.push({ count, name });
        }
      }
    }
    
    return result;
  };

  const parseLootedItems = (text: string): Array<{ name: string; count: number }> => {
    const items = text.split(',').map(item => item.trim());
    return items.map(item => {
      const [countStr, ...nameParts] = item.split('x ');
      const count = parseInt(countStr);
      const name = nameParts.join('x ').trim();
      return { count, name };
    }).filter(item => !isNaN(item.count) && item.name);
  };

  const validateData = async (data: string) => {
    try {
      if (!data.startsWith('Session data:')) {
        throw new Error('Formato inválido. Por favor, cole o log completo da sessão do Tibia.');
      }

      // Extrair informações usando regex
      const dateMatch = data.match(/From (.*?) to (.*?) Session:/);
      const durationMatch = data.match(/Session: ([\d:]+h)/);
      const xpMatch = data.match(/Raw XP Gain: ([\d,]+) XP Gain: ([\d,]+)/);
      const xpHourMatch = data.match(/Raw XP\/h: ([\d,]+) XP\/h: ([\d,]+)/);
      const lootMatch = data.match(/Loot: ([\d,]+) Supplies: ([\d,]+) Balance: ([\d,]+)/);
      const damageMatch = data.match(/Damage: ([\d,]+) Damage\/h: ([\d,]+)/);
      const healingMatch = data.match(/Healing: ([\d,]+) Healing\/h: ([\d,]+)/);
      
      const killedMonstersMatch = data.match(/Killed Monsters: (.*?) Looted Items:/);
      const lootedItemsMatch = data.match(/Looted Items: (.*?)$/);

      if (!dateMatch || !durationMatch || !xpMatch || !xpHourMatch || !lootMatch || 
          !damageMatch || !healingMatch || !killedMonstersMatch || !lootedItemsMatch) {
        throw new Error('Dados incompletos ou formato inválido. Certifique-se de colar o log completo.');
      }

      const preview: ImportPreview = {
        start_datetime: new Date(dateMatch[1]).toISOString(),
        end_datetime: new Date(dateMatch[2]).toISOString(),
        duration_minutes: parseDuration(durationMatch[1]),
        raw_xp_gain: parseNumber(xpMatch[1]),
        total_xp_gain: parseNumber(xpMatch[2]),
        raw_xp_per_hour: parseNumber(xpHourMatch[1]),
        total_xp_per_hour: parseNumber(xpHourMatch[2]),
        loot_value: parseNumber(lootMatch[1]),
        supplies_value: parseNumber(lootMatch[2]),
        balance: parseNumber(lootMatch[3]),
        damage_dealt: parseNumber(damageMatch[1]),
        damage_per_hour: parseNumber(damageMatch[2]),
        healing_done: parseNumber(healingMatch[1]),
        healing_per_hour: parseNumber(healingMatch[2]),
        killed_monsters: parseKilledMonsters(killedMonstersMatch[1]),
        looted_items: parseLootedItems(lootedItemsMatch[1])
      };

      setPreview(preview);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Formato de dados inválido');
      setPreview(null);
    }
  };

  const handleImport = async () => {
    if (!preview) {
      setError('Por favor, insira dados válidos da sessão');
      return;
    }

    setLoading(true);
    try {
      const sessionData: Omit<Session, 'id' | 'user_id' | 'created_at'> = {
        start_datetime: new Date(preview.start_datetime),
        end_datetime: new Date(preview.end_datetime),
        duration_minutes: preview.duration_minutes,
        raw_xp_gain: preview.raw_xp_gain,
        total_xp_gain: preview.total_xp_gain,
        raw_xp_per_hour: preview.raw_xp_per_hour,
        total_xp_per_hour: preview.total_xp_per_hour,
        loot_value: preview.loot_value,
        supplies_value: preview.supplies_value,
        balance: preview.balance,
        damage_dealt: preview.damage_dealt,
        damage_per_hour: preview.damage_per_hour,
        healing_done: preview.healing_done,
        healing_per_hour: preview.healing_per_hour,
        killed_monsters: preview.killed_monsters,
        looted_items: preview.looted_items
      };

      const newSession = sessionService.addSession(sessionData);
      navigate('/sessions');
    } catch (err) {
      setError('Erro ao importar os dados da sessão');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer title="Import Session">
      <Box sx={{ maxWidth: 'lg', mx: 'auto' }}>
      <Typography variant="subtitle1" gutterBottom>
        Cole os dados da sua sessão do Tibia abaixo
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

        <Box sx={{ mt: 2 }}>
        <TextField
            fullWidth
          multiline
          rows={10}
          placeholder="Cole aqui o log da sua sessão..."
            value={sessionLog}
            onChange={(e) => {
              setSessionLog(e.target.value);
              if (e.target.value.trim()) {
                validateData(e.target.value);
              } else {
                setPreview(null);
              }
            }}
          variant="outlined"
          disabled={loading}
        />
        </Box>

      {preview && (
        <>
            <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>
            Preview
          </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
              <Card>
                  <CardContent sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                      Session Details
                  </Typography>
                  <Typography>
                      Start: {new Date(preview.start_datetime).toLocaleString()}
                  </Typography>
                  <Typography>
                      End: {new Date(preview.end_datetime).toLocaleString()}
                  </Typography>
                  <Typography>
                      Duration: {preview.duration_minutes} minutes
                  </Typography>
                  <Typography>
                      XP Gain: {preview.total_xp_gain.toLocaleString()}
                  </Typography>
                  <Typography>
                    XP/h: {preview.total_xp_per_hour.toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
              <Grid item xs={12} md={6}>
              <Card>
                  <CardContent sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                      Loot Summary
                  </Typography>
                  <Typography>
                      Loot Value: {preview.loot_value.toLocaleString()}
                  </Typography>
                  <Typography>
                    Supplies: {preview.supplies_value.toLocaleString()}
                  </Typography>
                  <Typography>
                      Balance: {preview.balance.toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
              {preview.killed_monsters.length > 0 && (
                <Grid item xs={12}>
              <Card>
                    <CardContent sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                        Killed Monsters
                  </Typography>
                      <Box sx={{ columnCount: { xs: 1, sm: 2, md: 3 }, columnGap: 2 }}>
                    {preview.killed_monsters.map((monster, index) => (
                          <Typography key={index} sx={{ mb: 1 }}>
                        {monster.count}x {monster.name}
                          </Typography>
                        ))}
                      </Box>
                </CardContent>
              </Card>
            </Grid>
              )}
              {preview.looted_items.length > 0 && (
                <Grid item xs={12}>
              <Card>
                    <CardContent sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                        Looted Items
                  </Typography>
                      <Box sx={{ columnCount: { xs: 1, sm: 2, md: 3 }, columnGap: 2 }}>
                    {preview.looted_items.map((item, index) => (
                          <Typography key={index} sx={{ mb: 1 }}>
                        {item.count}x {item.name}
                          </Typography>
                        ))}
                      </Box>
                </CardContent>
              </Card>
                </Grid>
              )}
            </Grid>
          </>
        )}

        <Box sx={{ mt: 3 }}>
            <Button
              variant="contained"
            color="primary"
              onClick={handleImport}
            disabled={loading || !preview}
            >
            {loading ? <CircularProgress size={24} /> : 'IMPORTAR'}
            </Button>
          </Box>
    </Box>
    </PageContainer>
  );
};

export default ImportPage; 