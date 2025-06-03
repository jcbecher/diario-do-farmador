import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Switch,
  IconButton,
  Tooltip,
  Alert,
  Snackbar,
} from '@mui/material';
import { Block, CheckCircle } from '@mui/icons-material';
import { supabase } from '../config/supabase';
import { useAuth } from '../contexts/AuthContext';
import PageContainer from '../components/PageContainer';
import { User } from '../types/auth';

interface AdminUser extends User {
  last_sign_in_at: string | null;
}

const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    type: 'success' as 'success' | 'error',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      showNotification('Error fetching users', 'error');
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_active: !currentStatus })
        .eq('id', userId);

      if (error) throw error;

      setUsers(users.map(u => 
        u.id === userId ? { ...u, is_active: !currentStatus } : u
      ));

      showNotification(
        `User ${!currentStatus ? 'activated' : 'deactivated'} successfully`,
        'success'
      );
    } catch (error) {
      console.error('Error updating user status:', error);
      showNotification('Error updating user status', 'error');
    }
  };

  const toggleAdminStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_admin: !currentStatus })
        .eq('id', userId);

      if (error) throw error;

      setUsers(users.map(u => 
        u.id === userId ? { ...u, is_admin: !currentStatus } : u
      ));

      showNotification(
        `Admin status ${!currentStatus ? 'granted' : 'revoked'} successfully`,
        'success'
      );
    } catch (error) {
      console.error('Error updating admin status:', error);
      showNotification('Error updating admin status', 'error');
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
    setNotification(prev => ({ ...prev, open: false }));
  };

  if (!user?.is_admin) {
    return (
      <PageContainer title="Access Denied">
        <Alert severity="error">
          You don't have permission to access this page.
        </Alert>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="User Management">
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Email</TableCell>
              <TableCell>Character Name</TableCell>
              <TableCell>Created At</TableCell>
              <TableCell>Last Sign In</TableCell>
              <TableCell align="center">Admin</TableCell>
              <TableCell align="center">Active</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.character_name || '-'}</TableCell>
                <TableCell>
                  {new Date(user.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  {user.last_sign_in_at
                    ? new Date(user.last_sign_in_at).toLocaleDateString()
                    : 'Never'}
                </TableCell>
                <TableCell align="center">
                  <Switch
                    checked={user.is_admin}
                    onChange={() => toggleAdminStatus(user.id, user.is_admin)}
                    color="primary"
                  />
                </TableCell>
                <TableCell align="center">
                  <Switch
                    checked={user.is_active}
                    onChange={() => toggleUserStatus(user.id, user.is_active)}
                    color="primary"
                  />
                </TableCell>
                <TableCell align="center">
                  <Tooltip title={user.is_active ? 'Deactivate User' : 'Activate User'}>
                    <IconButton
                      onClick={() => toggleUserStatus(user.id, user.is_active)}
                      color={user.is_active ? 'error' : 'success'}
                    >
                      {user.is_active ? <Block /> : <CheckCircle />}
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

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

export default AdminPage; 