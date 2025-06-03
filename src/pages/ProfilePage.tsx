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
  Grid,
} from '@mui/material';
import { PhotoCamera, Edit, Save } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useAuth } from '../contexts/AuthContext';
import PageContainer from '../components/PageContainer';

const Input = styled('input')({
  display: 'none',
});

interface Notification {
  open: boolean;
  message: string;
  type: 'success' | 'error';
}

const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [avatar, setAvatar] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [notification, setNotification] = useState<Notification>({
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateUser({ character_name: formData.character_name });
      setNotification({
        open: true,
        message: 'Profile updated successfully',
        type: 'success',
      });
    } catch (error) {
      setNotification({
        open: true,
        message: 'Error updating profile',
        type: 'error',
      });
    }
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

  if (!user) {
    return null;
  }

  return (
    <PageContainer title="Profile">
      <Grid container spacing={3} justifyContent="center">
        <Grid item xs={12} md={8} lg={6}>
          <Card>
            <CardContent>
              <Box component="form" onSubmit={handleSubmit}>
                <Typography variant="h6" gutterBottom>
                  Account Information
                </Typography>
                <TextField
                  fullWidth
                  label="Email"
                  value={user.email}
                  disabled
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label="Character Name"
                  value={formData.character_name}
                  onChange={(e) => setFormData({ ...formData, character_name: e.target.value })}
                  margin="normal"
                  required
                />
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  sx={{ mt: 2 }}
                >
                  Save Changes
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

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
    </PageContainer>
  );
};

export default ProfilePage; 