import axios from "axios";

const translateText = async (text, targetLanguage) => {
  try {
    const response = await axios.post(
      'https://translation.googleapis.com/language/translate/v2',
      {
        q: text,
        target: targetLanguage,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        params: {
          key: process.env.REACT_APP_GOOGLE_CLOUD_API_KEY,
        },
      }
    );
    return response.data.data.translations[0].translatedText;
  } catch (error) {
    console.error('Error during translation:', error);
    if (error.response) {
      console.error("Error details:", error.response.data);
    }
    throw error;
  }
};

export default translateText;