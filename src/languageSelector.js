import React, { useState } from 'react';
import { Globe } from 'lucide-react';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import {createTheme, ThemeProvider} from "@mui/material";

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#60a5fa',
    },
    text: {
      primary: '#f3f4f6',
    },
  },
});

const LanguageSelector = ({ onLanguageChange }) => {
  const [currentLanguage, setCurrentLanguage] = useState('en');

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'ja', name: '日本語' }
  ];

  const handleLanguageChange = (event) => {
    const selectedLanguage = event.target.value;
    setCurrentLanguage(selectedLanguage);
    onLanguageChange(selectedLanguage);
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <div className="flex items-center">
        <Globe className="w-4 h-4 mr-2 text-gray-500" />
        <FormControl fullWidth>
          <Select
            labelId="demo-simple-select-label"
            id="demo-simple-select"
            value={currentLanguage}
            onChange={handleLanguageChange}
            variant="standard"
            sx={{
              color: 'text.primary',
              '&:before': { borderColor: 'rgba(255, 255, 255, 0.42)' },
              '&:after': { borderColor: 'primary.main' },
              '& .MuiSvgIcon-root': { color: 'text.primary' },
            }}
          >
            {languages.map((lang) => (
              <MenuItem key={lang.code} value={lang.code}>
                {lang.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </div>
    </ThemeProvider>
  );
};

export default LanguageSelector;