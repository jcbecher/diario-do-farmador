import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  Button,
  TextField,
  IconButton,
  Stack,
  Snackbar,
  Alert,
} from '@mui/material';
import { PhotoCamera, Edit, Save } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useAuth } from '../contexts/AuthContext';

const Input = styled('input')({
  display: 'none',
});

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [avatar, setAvatar] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    type: 'success' | 'error';
  }>({
    open: false,
    message: '',
    type: 'success',
  });

  const [formData, setFormData] = useState({
    character_name: user?.character_name || '',
    email: user?.email || '',
  });

  useEffect(() => {
    // Carregar avatar do localStorage se existir
    const savedAvatar = localStorage.getItem('userAvatar');
    if (savedAvatar) {
      setAvatar(savedAvatar);
    }
  }, []);

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const reader = new FileReader();

      reader.onloadend = () => {
        const base64String = reader.result as string;
        setAvatar(base64String);
        localStorage.setItem('userAvatar', base64String);
        showNotification('Avatar atualizado com sucesso!', 'success');
      };

      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = () => {
    // Aqui você implementaria a lógica para salvar no backend
    setIsEditing(false);
    showNotification('Perfil atualizado com sucesso!', 'success');
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({
      open: true,
      message,
      type,
    });
  };

  const handleCloseNotification = () => {
    setNotification(prev => ({
      ...prev,
      open: false,
    }));
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Perfil
      </Typography>

      <Card sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
            <Avatar
              src={avatar || undefined}
              sx={{
                width: 120,
                height: 120,
                mb: 2,
                border: theme => `2px solid ${theme.palette.primary.main}`,
              }}
            />
            <label htmlFor="avatar-input">
              <Input
                accept="image/*"
                id="avatar-input"
                type="file"
                onChange={handleAvatarChange}
              />
              <Button
                variant="outlined"
                component="span"
                startIcon={<PhotoCamera />}
              >
                Alterar Avatar
              </Button>
            </label>
          </Box>

          <Stack spacing={3}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <Box sx={{ flexGrow: 1 }}>
                <TextField
                  fullWidth
                  label="Nome do Personagem"
                  name="character_name"
                  value={formData.character_name}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  type="email"
                />
              </Box>
              <Box sx={{ ml: 2 }}>
                {!isEditing ? (
                  <IconButton 
                    color="primary" 
                    onClick={() => setIsEditing(true)}
                    sx={{ mt: 1 }}
                  >
                    <Edit />
                  </IconButton>
                ) : (
                  <IconButton 
                    color="primary" 
                    onClick={handleSave}
                    sx={{ mt: 1 }}
                  >
                    <Save />
                  </IconButton>
                )}
              </Box>
            </Box>

            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Membro desde: {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Última atualização: {user?.updated_at ? new Date(user.updated_at).toLocaleDateString() : 'N/A'}
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.type}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProfilePage; 