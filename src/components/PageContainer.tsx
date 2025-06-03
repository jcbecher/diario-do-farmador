import React from 'react';
import { Box, Typography, Container } from '@mui/material';
import { useTheme } from '@mui/material/styles';

interface PageContainerProps {
  children: React.ReactNode;
  title: string;
  action?: React.ReactNode;
}

const PageContainer: React.FC<PageContainerProps> = ({ children, title, action }) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        p: { xs: 2, sm: 3 },
        width: '100%',
        height: '100%',
        minHeight: 'calc(100vh - 64px)', // Altura total menos a altura do AppBar
        backgroundColor: theme.palette.background.default,
      }}
    >
      <Container maxWidth="xl" sx={{ mx: 'auto' }}>
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            mb: 4 
          }}
        >
          <Typography variant="h4" sx={{ fontWeight: 500, color: theme.palette.text.primary }}>
            {title}
          </Typography>
          {action && (
            <Box>
              {action}
            </Box>
          )}
        </Box>
        {children}
      </Container>
    </Box>
  );
};

export default PageContainer; 