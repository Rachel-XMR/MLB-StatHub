import axios from 'axios';

const fetchProtectedData = async (endpoint, options = {}) => {
  const token = localStorage.getItem("authToken");

  if (!token) {
    throw new Error("No token found, please log in.");
  }

  try {
    const response = await axios({
      ...options,
      url: endpoint,
      headers: {
        ...options.headers,
        "Authorization": `Bearer ${token}`,
      },
      data: options.body ? JSON.parse(options.body) : undefined,
    });
    return response.data;
  } catch (err) {
    console.error("Error fetching protected data:", err);
    throw err;
  }
};

export { fetchProtectedData };
