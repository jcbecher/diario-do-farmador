import '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Theme {
    status: {
      danger: string;
    };
  }

  interface ThemeOptions {
    status?: {
      danger?: string;
    };
  }

  interface Components {
    MuiGrid: {
      defaultProps?: {
        item?: boolean;
      };
    };
  }
}

declare module '@mui/material/Grid' {
  interface GridProps {
    item?: boolean;
  }
} 