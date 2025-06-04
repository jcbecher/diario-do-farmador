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
import { textParserService } from '../services/textParserService'; // Importar o serviço de parser

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

  // Estas funções não são mais necessárias, pois estão no serviço de parser
  // Você pode removê-las ou mantê-las como fallback

  const validateData = async (data: string) => {
    try {
      // Tentar usar o parser específico primeiro
      let sessionData = textParserService.parseSessionData(data);
      
      // Se nenhum parser específico funcionar, tentar extrair qualquer dado disponível
      if (!sessionData) {
        sessionData = textParserService.extractAnyAvailableData(data);
      }
      
      // Verificar se temos dados suficientes para criar uma sessão válida
      if (!sessionData.start_datetime || !sessionData.end_datetime) {
        throw new Error('Não foi possível identificar as datas de início e fim da sessão.');
      }
      
      // Calcular campos ausentes quando possível
      if (sessionData.start_datetime && sessionData.end_datetime && !sessionData.duration_minutes) {
        const diffMs = sessionData.end_datetime.getTime() - sessionData.start_datetime.getTime();
        sessionData.duration_minutes = Math.round(diffMs / (1000 * 60));
      }
      
      // Criar o preview com os dados disponíveis
      const preview: ImportPreview = {
        start_datetime: sessionData.start_datetime.toISOString(),
        end_datetime: sessionData.end_datetime.toISOString(),
        duration_minutes: sessionData.duration_minutes || 0,
        raw_xp_gain: sessionData.raw_xp_gain || 0,
        total_xp_gain: sessionData.total_xp_gain || 0,
        raw_xp_per_hour: sessionData.raw_xp_per_hour || 0,
        total_xp_per_hour: sessionData.total_xp_per_hour || 0,
        loot_value: sessionData.loot_value || 0,
        supplies_value: sessionData.supplies_value || 0,
        balance: sessionData.balance || 0,
        damage_dealt: sessionData.damage_dealt || 0,
        damage_per_hour: sessionData.damage_per_hour || 0,
        healing_done: sessionData.healing_done || 0,
        healing_per_hour: sessionData.healing_per_hour || 0,
        killed_monsters: sessionData.killed_monsters || [],
        looted_items: sessionData.looted_items || []
      };
      
      setPreview(preview);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Formato de dados inválido');
      setPreview(null);
    }
  };

  const handleImport = async () => {
    // O resto do código permanece o mesmo
    if (!preview) {
      setError('Por favor, insira dados válidos da sessão');
      return;
    }

    setLoading(true);
    setError(''); // Limpar erros anteriores
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

      const newSession = await sessionService.addSession(sessionData);
      if (newSession) {
        navigate('/sessions'); // Navegar somente se a sessão for adicionada com sucesso
      } else {
        // Isso pode acontecer se o addSession retornar null (embora no nosso caso ele lance um erro ou retorne a sessão)
        setError('Falha ao adicionar a sessão. Nenhum dado retornado.');
      }
    } catch (err) {
      console.error('[ImportPage] Error importing session:', err);
      if (err instanceof Error) {
        setError(`Erro ao importar os dados da sessão: ${err.message}`);
      } else {
        setError('Erro desconhecido ao importar os dados da sessão');
      }
    } finally {
      setLoading(false);
    }
  };

  // O resto do componente permanece o mesmo
  return (
    <PageContainer title="Import">
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