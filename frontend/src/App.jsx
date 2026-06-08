import { Routes, Route } from "react-router-dom";
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";
import Login from "./pages/Login";
import Gallery from "./pages/Gallery";
import Upload from "./pages/Upload";
import Configure from "./pages/Configure";
import Generate from "./pages/Generate";
import SidebarLayout from "./components/SidebarLayout";

const darkGlassTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9',
    },
    secondary: {
      main: '#f48fb1',
    },
    background: {
      default: 'transparent',
      paper: 'transparent',
    },
  },
  typography: {
    fontFamily: '"Poppins", sans-serif',
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(10px)',
          borderRadius: '8px',
          color: '#ffffff',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            background: 'rgba(255, 255, 255, 0.05)',
            '& fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.2)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.4)',
            },
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: '8px',
          padding: '10px 20px',
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={darkGlassTheme}>
      <CssBaseline />
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Protected layout with Sidebar */}
        <Route element={<SidebarLayout />}>
          <Route path="/" element={<Gallery />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/configure/:id" element={<Configure />} />
          <Route path="/generate/:id" element={<Generate />} />
        </Route>
      </Routes>
    </ThemeProvider>
  );
}

export default App;
