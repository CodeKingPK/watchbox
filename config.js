// Configuration file for the Movie Watchlist app
export const CONFIG = {
  // Get your free API key from https://www.themoviedb.org/
  // 1. Go to https://www.themoviedb.org/
  // 2. Create a free account
  // 3. Go to Settings > API > Create > Developer
  // 4. Fill out the form and get your API key
  // 5. Replace YOUR_API_KEY_HERE with your actual key
  TMDB_API_KEY:'apikey', // This is already set with your key!
  
  // TMDB API endpoints
  TMDB_BASE_URL: 'https://api.themoviedb.org/3',
  IMAGE_BASE_URL: 'https://image.tmdb.org/t/p/w500',
  
  // App settings
  APP_NAME: 'WatchBox',
  STORAGE_KEY: 'movieWatchlist',
  
  // App Icon
  APP_ICON: require('./assets/icon.png'),
  
  // Developer Credits
  DEVELOPER: {
    name: 'Pritam Karmakar',
    year: '2025',
    role: 'Developer',
  },
  
  // Professional Theme Colors
  COLORS: {
    primary: '#2e92fcff',         // Modern blue
    secondary: '#5856D6',       // Purple accent
    accent: '#007bff75',          // Red accent for remove buttons
    background: '#0A0A0A',      // Deep black
    surface: '#1C1C1E',         // Dark surface
    surfaceSecondary: '#2C2C2E', // Lighter surface
    card: '#1C1C1E',           // Card background
    text: '#FFFFFF',           // Primary text
    textSecondary: '#8E8E93',  // Secondary text
    textTertiary: '#C7C7CC',   // Tertiary text
    gold: '#FFD60A',          // Gold for ratings
    success: '#30D158',       // Green for success
    warning: '#FF9F0A',       // Orange for warnings
    border: '#38383A',        // Border color
    shadow: '#000000',        // Shadow color
  }
};
