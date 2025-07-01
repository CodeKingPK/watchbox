# 🎬 WatchBox App

A professional React Native movie discovery and watchlist management app built with Expo and The Movie Database (TMDB) API.

![React Native](https://img.shields.io/badge/React%20Native-0.72-blue.svg)
![Expo](https://img.shields.io/badge/Expo-SDK%2049-lightgrey.svg)
![TMDB](https://img.shields.io/badge/TMDB-API%20v3-green.svg)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)

## ✨ Features

### 🏠 **Home Page**
- **Trending Today**: Current trending movies
- **Top Rated**: Highest-rated movies of all time
- **Popular Movies**: Currently popular films
- **Coming Soon**: Upcoming movie releases
- **Horizontal scrolling** with movie posters
- **One-tap add to watchlist** from any category

### 🔍 **Search & Discovery**
- **Real-time movie search** using TMDB API
- **Detailed movie information** (title, year, rating, description)
- **Smart search results** with comprehensive movie data

### 📚 **Watchlist Management**
- **Add/Remove movies** with confirmation dialogs
- **Persistent local storage** using AsyncStorage
- **Visual feedback** for already-added movies
- **Watchlist counter** in navigation

### 🎨 **Professional Design**
- **Netflix-inspired dark theme**
- **Smooth animations and transitions**
- **Responsive design** for all screen sizes
- **Movie poster integration**
- **Clean, modern interface**

## 📱 Screenshots & Demo

The app features a three-tab navigation:
1. **Home** - Discover trending and popular movies
2. **Search** - Find specific movies
3. **Watchlist** - Manage your saved movies

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Get TMDB API Key (Free!)
1. Visit [The Movie Database](https://www.themoviedb.org/)
2. Create a free account
3. Go to Settings → API → Create → Developer
4. Fill out the form and get your API key
5. Add it to `config.js`:

```javascript
export const CONFIG = {
  TMDB_API_KEY: 'your_actual_api_key_here', // Replace this
  // ... rest of config
};
```

### 3. Run the App
```bash
npm start
```

Then scan the QR code with Expo Go app on your phone!

## 📁 Project Structure

```
movie-watchlist/
├── App.js              # Main app component with all features
├── config.js           # Configuration (API keys, colors, settings)
├── utils.js            # Utility functions
├── package.json        # Dependencies and scripts
├── app.json           # Expo configuration
├── assets/            # App icons and images
├── README.md          # This file
├── API_SETUP.md       # Detailed API setup guide
└── IMPLEMENTATION.md  # Technical documentation
```

## 🔧 Technical Features

### **State Management**
- React Hooks (useState, useEffect)
- Local state for UI and data
- AsyncStorage for persistence

### **API Integration**
- TMDB API v3 integration
- Multiple endpoints (trending, popular, search, etc.)
- Error handling and loading states
- Image URL generation for posters

### **UI Components**
- FlatList for efficient scrolling
- Horizontal scrolling movie cards
- Touch feedback and animations
- Responsive layout system

### **Data Persistence**
- AsyncStorage for local watchlist
- JSON serialization/deserialization
- Error handling for storage operations

## 🎯 User Experience

### **Intuitive Navigation**
- Three clear tabs: Home, Search, Watchlist
- Visual indicators for active tabs
- Smooth tab switching

### **Smart Interactions**
- One-tap add/remove from watchlist
- Confirmation dialogs for destructive actions
- Visual feedback for user actions
- Loading states during API calls

### **Error Handling**
- Graceful API error handling
- User-friendly error messages
- Fallback states for missing data

## 🌟 What Makes This Professional

### **Code Quality**
- Clean, maintainable code structure
- Separation of concerns
- Reusable components
- Consistent styling system

### **User Interface**
- Modern, sleek design
- Consistent spacing and typography
- Professional color scheme
- Smooth animations

### **Functionality**
- Complete CRUD operations
- Real-time data fetching
- Efficient list rendering
- Proper error boundaries

## 🔮 Future Enhancements

### **Phase 1: Enhanced Features**
- [ ] Movie detail pages with cast & crew
- [ ] Movie trailers integration
- [ ] Search filters (genre, year, rating)
- [ ] Sort options for watchlist

### **Phase 2: Social Features**
- [ ] User authentication
- [ ] Cloud sync (Firebase/Supabase)
- [ ] Share watchlists with friends
- [ ] Movie recommendations

### **Phase 3: Advanced Features**
- [ ] Offline support
- [ ] Push notifications for new releases
- [ ] Advanced search with filters
- [ ] Personal movie ratings and reviews

## 📊 API Usage

**TMDB API Endpoints Used:**
- `GET /trending/movie/day` - Trending movies
- `GET /movie/top_rated` - Top-rated movies
- `GET /movie/popular` - Popular movies
- `GET /movie/upcoming` - Upcoming releases
- `GET /search/movie` - Movie search

**Rate Limits:** 40 requests per 10 seconds (more than enough for this app)

## 🛠️ Development

### **Available Scripts**
```bash
npm start          # Start Expo development server
npm run android    # Run on Android device/emulator
npm run ios        # Run on iOS device/simulator
npm run web        # Run in web browser
```

### **Dependencies**
- **expo**: React Native development platform
- **@react-native-async-storage/async-storage**: Local storage
- **react-native-vector-icons**: Icon components

## 📄 License

This project is licensed under the 0BSD License - feel free to use it for any purpose!

## 🙏 Acknowledgments

- **The Movie Database (TMDB)** for the amazing free API
- **Expo** for the excellent development platform
- **React Native** community for the tools and libraries

---

**Built with ❤️ using React Native + Expo**
