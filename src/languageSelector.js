import React, { useState } from 'react';
import { Globe } from 'lucide-react';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';

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
    <div className="flex items-center">
      <Globe className="w-4 h-4 mr-2 text-gray-500" />
      <FormControl fullWidth>
        <Select
          labelId="demo-simple-select-label"
          id="demo-simple-select"
          value={currentLanguage}
          onChange={handleLanguageChange}
          variant="standard"
        >
          {languages.map((lang) => {
            return (
              <MenuItem key={lang.code} value={lang.code}>
                {lang.name}
              </MenuItem>
            );
          })}
        </Select>
      </FormControl>
    </div>
  );
};

export default LanguageSelector;