import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView, 
  TextInput, 
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
  Dimensions,
  Modal,
  ToastAndroid,
  Platform,
  Animated,
  Easing,
} from 'react-native';
import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CONFIG } from './config';

const { width } = Dimensions.get('window');

// Skeleton Loading Component
const SkeletonLoader = ({ width = '100%', height = 200, borderRadius = 8, style = {} }) => {
  const animatedValue = new Animated.Value(0);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          backgroundColor: CONFIG.COLORS.surfaceSecondary,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
};

// Movie Card Skeleton
const MovieCardSkeleton = () => (
  <View style={styles.movieCardCompact}>
    <SkeletonLoader width="100%" height={140} borderRadius={8} />
    <SkeletonLoader width="80%" height={12} borderRadius={4} style={{ marginTop: 6, marginHorizontal: 6 }} />
    <SkeletonLoader width="60%" height={10} borderRadius={4} style={{ marginTop: 3, marginHorizontal: 6, marginBottom: 6 }} />
  </View>
);

// Search Suggestion Skeleton
const SearchSuggestionSkeleton = () => (
  <View style={styles.suggestionItem}>
    <SkeletonLoader width={50} height={75} borderRadius={4} />
    <View style={{ flex: 1, marginLeft: 12 }}>
      <SkeletonLoader width="70%" height={16} borderRadius={4} />
      <SkeletonLoader width="40%" height={12} borderRadius={4} style={{ marginTop: 4 }} />
    </View>
  </View>
);

export default function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchSuggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('home'); // 'home', 'search', or 'watchlist'
  
  // Home page data
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [topRatedMovies, setTopRatedMovies] = useState([]);
  const [popularMovies, setPopularMovies] = useState([]);
  const [upcomingMovies, setUpcomingMovies] = useState([]);
  const [nowPlayingMovies, setNowPlayingMovies] = useState([]);
  const [actionMovies, setActionMovies] = useState([]);
  const [comedyMovies, setComedyMovies] = useState([]);
  const [horrorMovies, setHorrorMovies] = useState([]);
  const [homeLoading, setHomeLoading] = useState(true);

  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState('info'); // 'info', 'confirm', 'error'
  const [modalAction, setModalAction] = useState(null);

  // Movie details state
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [movieDetailsVisible, setMovieDetailsVisible] = useState(false);
  const [movieDetails, setMovieDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Trailer modal state
  const [trailerVisible, setTrailerVisible] = useState(false);
  const [trailerUrl, setTrailerUrl] = useState('');

  // Toast functionality
  const showToast = (message) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      // For iOS, we'll use a simple modal-like toast
      showModal('Success', message, 'info');
    }
  };

  const showModal = (title, message, type = 'info', action = null) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalType(type);
    setModalAction(() => action);
    setModalVisible(true);
  };

  const fetchMovieDetails = async (movieId) => {
    setDetailsLoading(true);
    try {
      const [details, credits, videos, similar, reviews] = await Promise.all([
        fetch(`${CONFIG.TMDB_BASE_URL}/movie/${movieId}?api_key=${CONFIG.TMDB_API_KEY}`).then(res => res.json()),
        fetch(`${CONFIG.TMDB_BASE_URL}/movie/${movieId}/credits?api_key=${CONFIG.TMDB_API_KEY}`).then(res => res.json()),
        fetch(`${CONFIG.TMDB_BASE_URL}/movie/${movieId}/videos?api_key=${CONFIG.TMDB_API_KEY}`).then(res => res.json()),
        fetch(`${CONFIG.TMDB_BASE_URL}/movie/${movieId}/similar?api_key=${CONFIG.TMDB_API_KEY}`).then(res => res.json()),
        fetch(`${CONFIG.TMDB_BASE_URL}/movie/${movieId}/reviews?api_key=${CONFIG.TMDB_API_KEY}`).then(res => res.json())
      ]);
      
      // Find trailer video
      const trailer = videos.results?.find(video => 
        video.type === 'Trailer' && video.site === 'YouTube'
      ) || videos.results?.find(video => video.site === 'YouTube');
      
      setMovieDetails({
        ...details,
        cast: credits.cast?.slice(0, 10) || [],
        crew: credits.crew || [],
        director: credits.crew?.find(person => person.job === 'Director'),
        writers: credits.crew?.filter(person => person.job === 'Writer' || person.job === 'Screenplay').slice(0, 3) || [],
        videos: videos.results || [],
        trailer: trailer,
        similar: similar.results?.slice(0, 6) || [],
        reviews: reviews.results?.slice(0, 3) || [],
        budget: details.budget,
        revenue: details.revenue,
        productionCompanies: details.production_companies?.slice(0, 3) || [],
        spokenLanguages: details.spoken_languages || [],
        countries: details.production_countries || []
      });
    } catch (error) {
      console.error('Error fetching movie details:', error);
      showModal('Error', 'Failed to load movie details', 'error');
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleSearchInputChange = (text) => {
    setSearchQuery(text);
    if (text.length >= 2) {
      const timeoutId = setTimeout(() => {
        fetchSuggestions(text);
      }, 500); // Debounce suggestions
      
      return () => clearTimeout(timeoutId);
    } else {
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (suggestion) => {
    setSearchQuery(suggestion.title);
    setShowSuggestions(false);
    searchMovies(suggestion.title);
  };

  const openMovieDetails = (movie) => {
    setSelectedMovie(movie);
    setMovieDetailsVisible(true);
    fetchMovieDetails(movie.id);
  };

  const playTrailer = (trailerKey) => {
    setTrailerUrl(`https://www.youtube.com/embed/${trailerKey}?autoplay=1&rel=0&modestbranding=1`);
    setTrailerVisible(true);
  };

  // Load watchlist from AsyncStorage on app start
  useEffect(() => {
    loadWatchlist();
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    if (CONFIG.TMDB_API_KEY === 'YOUR_API_KEY_HERE' || !CONFIG.TMDB_API_KEY) {
      setHomeLoading(false);
      return;
    }

    setHomeLoading(true);
    try {
      const [trending, topRated, popular, upcoming, nowPlaying, action, comedy, horror] = await Promise.all([
        fetchMovies('trending/movie/day'),
        fetchMovies('movie/top_rated'),
        fetchMovies('movie/popular'),
        fetchMovies('movie/upcoming'),
        fetchMovies('movie/now_playing'),
        fetchMoviesByGenre(28), // Action
        fetchMoviesByGenre(35), // Comedy
        fetchMoviesByGenre(27), // Horror
      ]);

      setTrendingMovies(trending.results || []);
      setTopRatedMovies(topRated.results || []);
      setPopularMovies(popular.results || []);
      setUpcomingMovies(upcoming.results || []);
      setNowPlayingMovies(nowPlaying.results || []);
      setActionMovies(action.results || []);
      setComedyMovies(comedy.results || []);
      setHorrorMovies(horror.results || []);
    } catch (error) {
      console.error('Error loading home data:', error);
    } finally {
      setHomeLoading(false);
    }
  };

  const fetchMovies = async (endpoint) => {
    const response = await fetch(
      `${CONFIG.TMDB_BASE_URL}/${endpoint}?api_key=${CONFIG.TMDB_API_KEY}`
    );
    return response.json();
  };

  const fetchMoviesByGenre = async (genreId) => {
    const response = await fetch(
      `${CONFIG.TMDB_BASE_URL}/discover/movie?api_key=${CONFIG.TMDB_API_KEY}&with_genres=${genreId}&sort_by=popularity.desc`
    );
    return response.json();
  };

  const loadWatchlist = async () => {
    try {
      const savedWatchlist = await AsyncStorage.getItem(CONFIG.STORAGE_KEY);
      if (savedWatchlist) {
        setWatchlist(JSON.parse(savedWatchlist));
      }
    } catch (error) {
      console.error('Error loading watchlist:', error);
    }
  };

  const saveWatchlist = async (newWatchlist) => {
    try {
      await AsyncStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(newWatchlist));
      setWatchlist(newWatchlist);
    } catch (error) {
      console.error('Error saving watchlist:', error);
      showModal('Error', 'Failed to save to watchlist', 'error');
    }
  };

  const fetchSuggestions = async (query) => {
    if (!query.trim() || query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    if (CONFIG.TMDB_API_KEY === 'YOUR_API_KEY_HERE' || !CONFIG.TMDB_API_KEY) {
      return;
    }

    try {
      const response = await fetch(
        `${CONFIG.TMDB_BASE_URL}/search/movie?api_key=${CONFIG.TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=1`
      );
      const data = await response.json();
      const suggestions = data.results?.slice(0, 5).map(movie => ({
        id: movie.id,
        title: movie.title,
        year: movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A'
      })) || [];
      setSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  const searchMovies = async (query = searchQuery) => {
    if (!query.trim()) return;
    
    if (CONFIG.TMDB_API_KEY === 'YOUR_API_KEY_HERE' || !CONFIG.TMDB_API_KEY) {
      showModal(
        'API Key Required', 
        'Please add your TMDB API key to the config.js file. Get one free at themoviedb.org',
        'error'
      );
      return;
    }

    setLoading(true);
    setShowSuggestions(false);
    try {
      const response = await fetch(
        `${CONFIG.TMDB_BASE_URL}/search/movie?api_key=${CONFIG.TMDB_API_KEY}&query=${encodeURIComponent(query)}`
      );
      const data = await response.json();
      setSearchResults(data.results || []);
    } catch (error) {
      console.error('Error searching movies:', error);
      showModal('Error', 'Failed to search movies. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const addToWatchlist = (movie) => {
    const isAlreadyAdded = watchlist.some(item => item.id === movie.id);
    if (isAlreadyAdded) {
      showToast('Movie already in watchlist');
      return;
    }

    const newWatchlist = [...watchlist, movie];
    saveWatchlist(newWatchlist);
    showToast(`${movie.title} added to watchlist`);
  };

  const removeFromWatchlist = (movieId) => {
    const movie = watchlist.find(m => m.id === movieId);
    showModal(
      'Remove Movie',
      `Are you sure you want to remove "${movie?.title}" from your watchlist?`,
      'confirm',
      () => {
        const newWatchlist = watchlist.filter(movie => movie.id !== movieId);
        saveWatchlist(newWatchlist);
        showToast('Movie removed from watchlist');
      }
    );
  };

  const renderMovieItem = ({ item, isWatchlist = false }) => (
    <TouchableOpacity 
      style={styles.movieItemCompact}
      onPress={() => openMovieDetails(item)}
      activeOpacity={0.7}
    >
      <Image
        source={{
          uri: item.poster_path 
            ? `${CONFIG.IMAGE_BASE_URL}${item.poster_path}`
            : 'https://via.placeholder.com/80x120/333/fff?text=No+Image'
        }}
        style={styles.movieItemPosterCompact}
        resizeMode="cover"
      />
      <View style={styles.movieInfoCompact}>
        <Text style={styles.movieTitleCompact} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.movieYearCompact}>
          {item.release_date ? new Date(item.release_date).getFullYear() : 'N/A'}
        </Text>
        <Text style={styles.movieOverviewCompact} numberOfLines={1}>
          {item.overview || 'No description available'}
        </Text>
        <Text style={styles.movieRatingCompact}>
          ⭐ {item.vote_average ? item.vote_average.toFixed(1) : 'N/A'}
        </Text>
      </View>
      <TouchableOpacity
        style={[styles.actionButtonCompact, isWatchlist ? styles.removeButton : styles.addButton]}
        onPress={(e) => {
          e.stopPropagation();
          isWatchlist ? removeFromWatchlist(item.id) : addToWatchlist(item);
        }}
      >
        <Text style={styles.actionButtonTextCompact}>
          {isWatchlist ? '−' : '+'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderHorizontalMovieCard = ({ item }) => {
    const isInWatchlist = watchlist.some(movie => movie.id === item.id);
    
    return (
      <TouchableOpacity 
        style={styles.movieCardCompact}
        onPress={() => openMovieDetails(item)}
        activeOpacity={0.8}
      >
        <Image
          source={{
            uri: item.poster_path 
              ? `${CONFIG.IMAGE_BASE_URL}${item.poster_path}`
              : 'https://via.placeholder.com/100x150/333/fff?text=No+Image'
          }}
          style={styles.moviePosterCompact}
          resizeMode="cover"
        />
        <View style={styles.movieCardInfoCompact}>
          <Text style={styles.movieCardTitleCompact} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.movieCardRatingCompact}>
            ⭐ {item.vote_average ? item.vote_average.toFixed(1) : 'N/A'}
          </Text>
          <TouchableOpacity
            style={[styles.cardActionButtonCompact, isInWatchlist ? styles.removeButton : styles.addButton]}
            onPress={(e) => {
              e.stopPropagation();
              isInWatchlist ? removeFromWatchlist(item.id) : addToWatchlist(item);
            }}
          >
            <Text style={styles.cardActionButtonTextCompact}>
              {isInWatchlist ? '✓' : '+'}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderMovieSection = (title, data, loading = false) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {loading ? (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
        >
          {[1, 2, 3, 4, 5].map((index) => (
            <MovieCardSkeleton key={index} />
          ))}
        </ScrollView>
      ) : (
        <FlatList
          data={data.slice(0, 10)}
          renderItem={renderHorizontalMovieCard}
          keyExtractor={(item) => `${title}-${item.id}`}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
        />
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Professional Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerTitleContainer}>
            <Image source={CONFIG.APP_ICON} style={styles.headerIcon} />
            <View>
              <Text style={styles.headerTitle}>{CONFIG.APP_NAME}</Text>
              <Text style={styles.headerSubtitle}>Discover & Track Movies</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Main Content Area */}
      <View style={styles.contentContainer}>
        {/* Home Tab */}
        {activeTab === 'home' && (
          <ScrollView style={styles.homeContainer} showsVerticalScrollIndicator={false}>
            {CONFIG.TMDB_API_KEY === 'YOUR_API_KEY_HERE' || !CONFIG.TMDB_API_KEY ? (
              <View style={styles.apiKeyMissingContainer}>
                <Text style={styles.apiKeyMissingTitle}>Welcome to Movie Watchlist!</Text>
                <Text style={styles.apiKeyMissingText}>
                  To see trending movies, top-rated films, and more, please add your free TMDB API key.
                </Text>
                <Text style={styles.apiKeyMissingStep}>1. Go to themoviedb.org</Text>
                <Text style={styles.apiKeyMissingStep}>2. Create a free account</Text>
                <Text style={styles.apiKeyMissingStep}>3. Get your API key</Text>
                <Text style={styles.apiKeyMissingStep}>4. Add it to config.js</Text>
                <View style={styles.apiKeyButtonContainer}>
                  <TouchableOpacity 
                    style={styles.searchButton} 
                    onPress={() => setActiveTab('search')}
                  >
                    <Text style={styles.searchButtonText}>Start Searching Movies</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : homeLoading ? (
              <View style={styles.homeContainer}>
                {/* Hero Section Skeleton */}
                <View style={styles.heroSectionCompact}>
                  <SkeletonLoader width="80%" height={18} borderRadius={4} style={{ alignSelf: 'center', marginBottom: 10 }} />
                  <View style={styles.statsContainerCompact}>
                    <View style={styles.statItemCompact}>
                      <SkeletonLoader width={20} height={16} borderRadius={4} />
                      <SkeletonLoader width={40} height={10} borderRadius={4} style={{ marginTop: 2 }} />
                    </View>
                    <View style={styles.statItemCompact}>
                      <SkeletonLoader width={20} height={16} borderRadius={4} />
                      <SkeletonLoader width={40} height={10} borderRadius={4} style={{ marginTop: 2 }} />
                    </View>
                    <View style={styles.statItemCompact}>
                      <SkeletonLoader width={30} height={16} borderRadius={4} />
                      <SkeletonLoader width={40} height={10} borderRadius={4} style={{ marginTop: 2 }} />
                    </View>
                  </View>
                </View>

                {/* Quick Actions Skeleton */}
                <View style={styles.quickActionsSectionCompact}>
                  <View style={styles.quickActionsContainerCompact}>
                    {[1, 2, 3].map((index) => (
                      <View key={index} style={styles.quickActionButtonCompact}>
                        <SkeletonLoader width={18} height={18} borderRadius={4} style={{ marginBottom: 4 }} />
                        <SkeletonLoader width={40} height={10} borderRadius={4} />
                      </View>
                    ))}
                  </View>
                </View>

                {/* Movie Sections Skeletons */}
                {[1, 2, 3, 4, 5].map((sectionIndex) => (
                  <View key={sectionIndex} style={styles.section}>
                    <SkeletonLoader width="60%" height={16} borderRadius={4} style={{ marginHorizontal: 20, marginBottom: 10 }} />
                    <ScrollView 
                      horizontal 
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.horizontalList}
                    >
                      {[1, 2, 3, 4, 5].map((index) => (
                        <MovieCardSkeleton key={index} />
                      ))}
                    </ScrollView>
                  </View>
                ))}
              </View>
            ) : (
              <>
                {/* Hero Section */}
                <View style={styles.heroSectionCompact}>
                  <Text style={styles.heroTitleCompact}>🎬 Welcome to Movie World</Text>
                  <View style={styles.statsContainerCompact}>
                    <View style={styles.statItemCompact}>
                      <Text style={styles.statNumberCompact}>{watchlist.length}</Text>
                      <Text style={styles.statLabelCompact}>Watchlist</Text>
                    </View>
                    <View style={styles.statItemCompact}>
                      <Text style={styles.statNumberCompact}>{trendingMovies.length}</Text>
                      <Text style={styles.statLabelCompact}>Trending</Text>
                    </View>
                    <View style={styles.statItemCompact}>
                      <Text style={styles.statNumberCompact}>1000+</Text>
                      <Text style={styles.statLabelCompact}>Movies</Text>
                    </View>
                  </View>
                </View>

                {/* Quick Actions */}
                <View style={styles.quickActionsSectionCompact}>
                  <View style={styles.quickActionsContainerCompact}>
                    <TouchableOpacity 
                      style={styles.quickActionButtonCompact}
                      onPress={() => setActiveTab('search')}
                    >
                      <Text style={styles.quickActionIconCompact}>🔍</Text>
                      <Text style={styles.quickActionTextCompact}>Search</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.quickActionButtonCompact}
                      onPress={() => setActiveTab('watchlist')}
                    >
                      <Text style={styles.quickActionIconCompact}>📚</Text>
                      <Text style={styles.quickActionTextCompact}>Watchlist</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.quickActionButtonCompact}
                      onPress={() => loadHomeData()}
                    >
                      <Text style={styles.quickActionIconCompact}>🔄</Text>
                      <Text style={styles.quickActionTextCompact}>Refresh</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {renderMovieSection('Trending Today', trendingMovies, homeLoading)}
                {renderMovieSection('Now Playing in Theaters', nowPlayingMovies, homeLoading)}
                {renderMovieSection('Top Rated Movies', topRatedMovies, homeLoading)}
                {renderMovieSection('Popular Movies', popularMovies, homeLoading)}
                {renderMovieSection('Coming Soon', upcomingMovies, homeLoading)}
                
                {/* Genre Sections */}
                <View style={styles.genreSection}>
                  <Text style={styles.sectionTitle}>Browse by Genre</Text>
                  {renderMovieSection('Action Movies', actionMovies, homeLoading)}
                  {renderMovieSection('Comedy Movies', comedyMovies, homeLoading)}
                  {renderMovieSection('Horror Movies', horrorMovies, homeLoading)}
                </View>

                {/* Movie Facts Section */}
                <View style={styles.factsSection}>
                  <Text style={styles.sectionTitle}>Did You Know?</Text>
                  <View style={styles.factCard}>
                    <Text style={styles.factText}>
                      🎬 The movie industry produces over 11,000 films worldwide every year!
                    </Text>
                  </View>
                  <View style={styles.factCard}>
                    <Text style={styles.factText}>
                      🍿 The average person watches about 78 movies per year.
                    </Text>
                  </View>
                  <View style={styles.factCard}>
                    <Text style={styles.factText}>
                      🎥 The first movie ever made was only 2.11 seconds long (1888).
                    </Text>
                  </View>
                </View>
              </>
            )}
          </ScrollView>
        )}

        {/* Search Tab */}
        {activeTab === 'search' && (
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <View style={styles.searchInputWrapper}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search for movies..."
                  placeholderTextColor={CONFIG.COLORS.textSecondary}
                  value={searchQuery}
                  onChangeText={handleSearchInputChange}
                  onSubmitEditing={() => searchMovies()}
                  onFocus={() => searchQuery.length >= 2 && setShowSuggestions(true)}
                />
                {showSuggestions && searchSuggestions.length > 0 && (
                  <View style={styles.suggestionsContainer}>
                    {searchSuggestions.map((suggestion) => (
                      <TouchableOpacity
                        key={suggestion.id}
                        style={styles.suggestionItem}
                        onPress={() => selectSuggestion(suggestion)}
                      >
                        <Text style={styles.suggestionTitle}>{suggestion.title}</Text>
                        <Text style={styles.suggestionYear}>({suggestion.year})</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
              <TouchableOpacity style={styles.searchButton} onPress={() => searchMovies()}>
                <Text style={styles.searchButtonText}>🔍</Text>
              </TouchableOpacity>
            </View>
            {loading && (
              <View style={styles.searchResultsContainer}>
                <Text style={styles.sectionTitle}>Search Results</Text>
                <View style={styles.gridContainer}>
                  {[1, 2, 3, 4, 5, 6].map((index) => (
                    <MovieCardSkeleton key={index} />
                  ))}
                </View>
              </View>
            )}

            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => renderMovieItem({ item, isWatchlist: false })}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                !loading && searchQuery && (
                  <Text style={styles.emptyText}>No movies found. Try a different search term.</Text>
                )
              }
            />
          </View>
        )}

        {/* Watchlist Tab */}
        {activeTab === 'watchlist' && (
          <View style={styles.watchlistContainer}>
            <FlatList
              data={watchlist}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => renderMovieItem({ item, isWatchlist: true })}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyWatchlistContainer}>
                  <Text style={styles.emptyWatchlistText}>Your watchlist is empty</Text>
                  <Text style={styles.emptyWatchlistSubtext}>
                    Search for movies and add them to your watchlist!
                  </Text>
                </View>
              }
            />
          </View>
        )}
      </View>

      {/* Developer Credit */}
      <View style={styles.developerCredit}>
        <Image source={CONFIG.APP_ICON} style={styles.creditIcon} />
        <Text style={styles.creditText}>
          Developed by {CONFIG.DEVELOPER.name} © {CONFIG.DEVELOPER.year}
        </Text>
      </View>

      {/* Bottom Tab Navigation */}
      <View style={styles.bottomTabContainer}>
        <TouchableOpacity
          style={[styles.bottomTab, activeTab === 'home' && styles.activeBottomTab]}
          onPress={() => setActiveTab('home')}
        >
          <Text style={[styles.bottomTabIcon, activeTab === 'home' && styles.activeBottomTabIcon]}>
            🏠
          </Text>
          <Text style={[styles.bottomTabText, activeTab === 'home' && styles.activeBottomTabText]}>
            Home
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.bottomTab, activeTab === 'search' && styles.activeBottomTab]}
          onPress={() => setActiveTab('search')}
        >
          <Text style={[styles.bottomTabIcon, activeTab === 'search' && styles.activeBottomTabIcon]}>
            🔍
          </Text>
          <Text style={[styles.bottomTabText, activeTab === 'search' && styles.activeBottomTabText]}>
            Search
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.bottomTab, activeTab === 'watchlist' && styles.activeBottomTab]}
          onPress={() => setActiveTab('watchlist')}
        >
          <Text style={[styles.bottomTabIcon, activeTab === 'watchlist' && styles.activeBottomTabIcon]}>
            📚
          </Text>
          <Text style={[styles.bottomTabText, activeTab === 'watchlist' && styles.activeBottomTabText]}>
            Watchlist
          </Text>
          {watchlist.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{watchlist.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Custom Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>{modalTitle}</Text>
            <Text style={styles.modalMessage}>{modalMessage}</Text>
            <View style={styles.modalButtons}>
              {modalType === 'confirm' ? (
                <>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonSecondary]}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonPrimary]}
                    onPress={() => {
                      if (modalAction) modalAction();
                      setModalVisible(false);
                    }}
                  >
                    <Text style={styles.modalButtonTextPrimary}>Confirm</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonPrimary]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.modalButtonTextPrimary}>OK</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* Movie Details Modal */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={movieDetailsVisible}
        onRequestClose={() => setMovieDetailsVisible(false)}
      >
        <SafeAreaView style={styles.detailsContainer}>
          <View style={styles.detailsHeader}>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setMovieDetailsVisible(false)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.detailsHeaderTitle}>Movie Details</Text>
            <View style={styles.placeholder} />
          </View>
          
          {detailsLoading ? (
            <ScrollView style={styles.detailsContent} showsVerticalScrollIndicator={false}>
              {/* Movie Details Skeleton */}
              <View style={styles.detailsHeroCompact}>
                <SkeletonLoader width={120} height={180} borderRadius={8} />
                <View style={styles.detailsInfoCompact}>
                  <SkeletonLoader width="90%" height={20} borderRadius={4} style={{ marginBottom: 8 }} />
                  <SkeletonLoader width="40%" height={14} borderRadius={4} style={{ marginBottom: 6 }} />
                  <SkeletonLoader width="60%" height={14} borderRadius={4} style={{ marginBottom: 6 }} />
                  <SkeletonLoader width="50%" height={14} borderRadius={4} style={{ marginBottom: 8 }} />
                  <View style={{ flexDirection: 'row', marginTop: 8 }}>
                    {[1, 2, 3].map((index) => (
                      <SkeletonLoader key={index} width={60} height={24} borderRadius={12} style={{ marginRight: 8 }} />
                    ))}
                  </View>
                </View>
              </View>
              
              {/* Overview Skeleton */}
              <View style={styles.detailsSectionCompact}>
                <SkeletonLoader width={80} height={16} borderRadius={4} style={{ marginBottom: 10 }} />
                <SkeletonLoader width="100%" height={12} borderRadius={4} style={{ marginBottom: 4 }} />
                <SkeletonLoader width="100%" height={12} borderRadius={4} style={{ marginBottom: 4 }} />
                <SkeletonLoader width="80%" height={12} borderRadius={4} />
              </View>

              {/* Info Grid Skeleton */}
              <View style={styles.detailsSectionCompact}>
                <SkeletonLoader width={120} height={16} borderRadius={4} style={{ marginBottom: 10 }} />
                {[1, 2, 3].map((index) => (
                  <View key={index} style={{ flexDirection: 'row', marginBottom: 10 }}>
                    <View style={{ flex: 1, marginRight: 10 }}>
                      <SkeletonLoader width="60%" height={12} borderRadius={4} style={{ marginBottom: 4 }} />
                      <SkeletonLoader width="80%" height={14} borderRadius={4} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <SkeletonLoader width="60%" height={12} borderRadius={4} style={{ marginBottom: 4 }} />
                      <SkeletonLoader width="80%" height={14} borderRadius={4} />
                    </View>
                  </View>
                ))}
              </View>

              {/* Cast Skeleton */}
              <View style={styles.detailsSectionCompact}>
                <SkeletonLoader width={60} height={16} borderRadius={4} style={{ marginBottom: 10 }} />
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {[1, 2, 3, 4].map((index) => (
                    <View key={index} style={{ width: 80, marginRight: 10 }}>
                      <SkeletonLoader width={80} height={120} borderRadius={8} style={{ marginBottom: 6 }} />
                      <SkeletonLoader width="90%" height={10} borderRadius={4} style={{ marginBottom: 2 }} />
                      <SkeletonLoader width="80%" height={8} borderRadius={4} />
                    </View>
                  ))}
                </ScrollView>
              </View>
            </ScrollView>
          ) : movieDetails ? (
            <ScrollView style={styles.detailsContent} showsVerticalScrollIndicator={false}>
              <View style={styles.detailsHeroCompact}>
                <Image
                  source={{
                    uri: movieDetails.poster_path 
                      ? `${CONFIG.IMAGE_BASE_URL}${movieDetails.poster_path}`
                      : 'https://via.placeholder.com/200x300/333/fff?text=No+Image'
                  }}
                  style={styles.detailsPosterCompact}
                  resizeMode="cover"
                />
                <View style={styles.detailsInfoCompact}>
                  <Text style={styles.detailsTitleCompact}>{movieDetails.title}</Text>
                  <Text style={styles.detailsYearCompact}>
                    {movieDetails.release_date ? new Date(movieDetails.release_date).getFullYear() : 'N/A'}
                  </Text>
                  <Text style={styles.detailsRatingCompact}>
                    ⭐ {movieDetails.vote_average ? movieDetails.vote_average.toFixed(1) : 'N/A'} / 10
                  </Text>
                  <Text style={styles.detailsRuntimeCompact}>
                    🕐 {movieDetails.runtime ? `${movieDetails.runtime} min` : 'N/A'}
                  </Text>
                  {movieDetails.genres && (
                    <View style={styles.genresContainerCompact}>
                      {movieDetails.genres.slice(0, 3).map((genre) => (
                        <View key={genre.id} style={styles.genreTagCompact}>
                          <Text style={styles.genreTextCompact}>{genre.name}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </View>
              
              <View style={styles.detailsSectionCompact}>
                <Text style={styles.detailsSectionTitleCompact}>Overview</Text>
                <Text style={styles.detailsOverviewCompact}>
                  {movieDetails.overview || 'No overview available.'}
                </Text>
              </View>

              {/* Movie Info Grid */}
              <View style={styles.detailsSectionCompact}>
                <Text style={styles.detailsSectionTitleCompact}>Movie Information</Text>
                <View style={styles.infoGridVerticalCompact}>
                  <View style={styles.infoRowCompact}>
                    <View style={styles.infoItemFullCompact}>
                      <Text style={styles.infoLabelCompact}>🎬 Director</Text>
                      <Text style={styles.infoValueCompact}>
                        {movieDetails.director?.name || 'N/A'}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.infoRowCompact}>
                    <View style={styles.infoItemHalfCompact}>
                      <Text style={styles.infoLabelCompact}>📅 Status</Text>
                      <Text style={styles.infoValueCompact}>{movieDetails.status || 'N/A'}</Text>
                    </View>
                    <View style={styles.infoItemHalfCompact}>
                      <Text style={styles.infoLabelCompact}>🌍 Language</Text>
                      <Text style={styles.infoValueCompact}>
                        {movieDetails.spokenLanguages?.[0]?.english_name || 'N/A'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.infoRowCompact}>
                    <View style={styles.infoItemHalfCompact}>
                      <Text style={styles.infoLabelCompact}>💰 Budget</Text>
                      <Text style={styles.infoValueCompact}>
                        {movieDetails.budget ? `$${(movieDetails.budget / 1000000).toFixed(1)}M` : 'N/A'}
                      </Text>
                    </View>
                    <View style={styles.infoItemHalfCompact}>
                      <Text style={styles.infoLabelCompact}>💵 Revenue</Text>
                      <Text style={styles.infoValueCompact}>
                        {movieDetails.revenue ? `$${(movieDetails.revenue / 1000000).toFixed(1)}M` : 'N/A'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.infoRowCompact}>
                    <View style={styles.infoItemFullCompact}>
                      <Text style={styles.infoLabelCompact}>🏭 Production Country</Text>
                      <Text style={styles.infoValueCompact}>
                        {movieDetails.countries?.[0]?.name || 'N/A'}
                      </Text>
                    </View>
                  </View>

                  {movieDetails.productionCompanies && movieDetails.productionCompanies.length > 0 && (
                    <View style={styles.infoRowCompact}>
                      <View style={styles.infoItemFullCompact}>
                        <Text style={styles.infoLabelCompact}>🏢 Production Companies</Text>
                        <Text style={styles.infoValueCompact}>
                          {movieDetails.productionCompanies.map(company => company.name).join(', ')}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              </View>

              {/* Trailer Section */}
              {movieDetails.trailer && (
                <View style={styles.detailsSectionCompact}>
                  <Text style={styles.detailsSectionTitleCompact}>Trailer</Text>
                  <TouchableOpacity 
                    style={styles.trailerButtonCompact}
                    onPress={() => playTrailer(movieDetails.trailer.key)}
                  >
                    <View style={styles.trailerIconContainerCompact}>
                      <Text style={styles.trailerIconCompact}>▶️</Text>
                    </View>
                    <View style={styles.trailerInfoCompact}>
                      <Text style={styles.trailerTitleCompact}>{movieDetails.trailer.name}</Text>
                      <Text style={styles.trailerSubtitleCompact}>Watch in HD • {movieDetails.trailer.type}</Text>
                    </View>
                    <View style={styles.trailerArrowCompact}>
                      <Text style={styles.trailerArrowTextCompact}>▶</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              )}

              {movieDetails.cast && movieDetails.cast.length > 0 && (
                <View style={styles.detailsSectionCompact}>
                  <Text style={styles.detailsSectionTitleCompact}>Cast</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {movieDetails.cast.map((actor) => (
                      <View key={actor.id} style={styles.castCardCompact}>
                        <Image
                          source={{
                            uri: actor.profile_path 
                              ? `${CONFIG.IMAGE_BASE_URL}${actor.profile_path}`
                              : 'https://via.placeholder.com/60x90/333/fff?text=No+Image'
                          }}
                          style={styles.castImageCompact}
                        />
                        <Text style={styles.castNameCompact} numberOfLines={1}>{actor.name}</Text>
                        <Text style={styles.castCharacterCompact} numberOfLines={1}>{actor.character}</Text>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Reviews Section */}
              {movieDetails.reviews && movieDetails.reviews.length > 0 && (
                <View style={styles.detailsSectionCompact}>
                  <Text style={styles.detailsSectionTitleCompact}>Reviews</Text>
                  {movieDetails.reviews.slice(0, 2).map((review) => (
                    <View key={review.id} style={styles.reviewCardCompact}>
                      <View style={styles.reviewHeaderCompact}>
                        <Text style={styles.reviewAuthorCompact}>{review.author}</Text>
                        {review.author_details?.rating && (
                          <Text style={styles.reviewRatingCompact}>⭐ {review.author_details.rating}/10</Text>
                        )}
                      </View>
                      <Text style={styles.reviewContentCompact} numberOfLines={3}>
                        {review.content}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Similar Movies */}
              {movieDetails.similar && movieDetails.similar.length > 0 && (
                <View style={styles.detailsSectionCompact}>
                  <Text style={styles.detailsSectionTitleCompact}>Similar Movies</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {movieDetails.similar.map((movie) => (
                      <TouchableOpacity 
                        key={movie.id} 
                        style={styles.similarMovieCardCompact}
                        onPress={() => {
                          setMovieDetailsVisible(false);
                          setTimeout(() => openMovieDetails(movie), 100);
                        }}
                      >
                        <Image
                          source={{
                            uri: movie.poster_path 
                              ? `${CONFIG.IMAGE_BASE_URL}${movie.poster_path}`
                              : 'https://via.placeholder.com/80x120/333/fff?text=No+Image'
                          }}
                          style={styles.similarMoviePosterCompact}
                        />
                        <Text style={styles.similarMovieTitleCompact} numberOfLines={2}>{movie.title}</Text>
                        <Text style={styles.similarMovieRatingCompact}>⭐ {movie.vote_average.toFixed(1)}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              <View style={styles.detailsActionsCompact}>
                <TouchableOpacity
                  style={[styles.detailsActionButtonCompact, watchlist.some(m => m.id === movieDetails.id) ? styles.removeButton : styles.addButton]}
                  onPress={() => {
                    if (watchlist.some(m => m.id === movieDetails.id)) {
                      removeFromWatchlist(movieDetails.id);
                    } else {
                      addToWatchlist(movieDetails);
                    }
                  }}
                >
                  <Text style={styles.detailsActionButtonTextCompact}>
                    {watchlist.some(m => m.id === movieDetails.id) ? 'Remove from Watchlist' : 'Add to Watchlist'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          ) : null}
        </SafeAreaView>
      </Modal>

      {/* Trailer Modal */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={trailerVisible}
        onRequestClose={() => setTrailerVisible(false)}
      >
        <SafeAreaView style={styles.trailerModalContainer}>
          <View style={styles.trailerModalHeader}>
            <TouchableOpacity 
              style={styles.trailerCloseButton}
              onPress={() => setTrailerVisible(false)}
            >
              <Text style={styles.trailerCloseButtonText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.trailerModalTitle}>Movie Trailer</Text>
            <View style={styles.placeholder} />
          </View>
          
          {trailerUrl ? (
            <WebView
              source={{ uri: trailerUrl }}
              style={styles.trailerWebView}
              allowsFullscreenVideo={true}
              mediaPlaybackRequiresUserAction={false}
              onError={(error) => {
                console.error('WebView error:', error);
                showToast('Failed to load trailer');
                setTrailerVisible(false);
              }}
            />
          ) : (
            <View style={styles.trailerLoadingContainer}>
              <ActivityIndicator size="large" color={CONFIG.COLORS.primary} />
              <Text style={styles.loadingText}>Loading trailer...</Text>
            </View>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CONFIG.COLORS.background,
  },
  header: {
    backgroundColor: CONFIG.COLORS.surface,
    paddingTop: 35,
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: CONFIG.COLORS.border,
    elevation: 4,
    shadowColor: CONFIG.COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  headerContent: {
    flex: 1,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    width: 40,
    height: 40,
    marginRight: 12,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: CONFIG.COLORS.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: CONFIG.COLORS.textSecondary,
    marginTop: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: CONFIG.COLORS.surface,
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: CONFIG.COLORS.primary,
  },
  tabText: {
    color: CONFIG.COLORS.textSecondary,
    fontSize: 16,
    fontWeight: '500',
  },
  activeTabText: {
    color: CONFIG.COLORS.text,
  },
  // Home page styles
  homeContainer: {
    flex: 1,
  },
  homeLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  apiKeyMissingContainer: {
    padding: 30,
    alignItems: 'center',
    marginTop: 50,
  },
  apiKeyMissingTitle: {
    color: CONFIG.COLORS.text,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  apiKeyMissingText: {
    color: CONFIG.COLORS.textTertiary,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  apiKeyMissingStep: {
    color: CONFIG.COLORS.textSecondary,
    fontSize: 14,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  apiKeyButtonContainer: {
    marginTop: 20,
    alignSelf: 'stretch',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    color: CONFIG.COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 20,
    marginBottom: 15,
    marginTop: 10,
  },
  sectionLoading: {
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
  },
  horizontalList: {
    paddingLeft: 20,
    paddingRight: 10,
  },
  movieCard: {
    width: 150,
    marginRight: 15,
    backgroundColor: CONFIG.COLORS.surface,
    borderRadius: 12,
    overflow: 'hidden',
  },
  moviePoster: {
    width: '100%',
    height: 200,
    backgroundColor: CONFIG.COLORS.surface,
  },
  movieCardInfo: {
    padding: 12,
  },
  movieCardTitle: {
    color: CONFIG.COLORS.text,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
    height: 35,
  },
  movieCardRating: {
    color: CONFIG.COLORS.gold,
    fontSize: 12,
    marginBottom: 8,
  },
  cardActionButton: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  cardActionButtonText: {
    color: CONFIG.COLORS.text,
    fontSize: 11,
    fontWeight: 'bold',
  },
  // Search page styles
  searchContainer: {
    flex: 1,
    padding: 20,
  },
  searchInputContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 10,
  },
  searchInputWrapper: {
    flex: 1,
    position: 'relative',
  },
  searchInput: {
    backgroundColor: CONFIG.COLORS.surface,
    color: CONFIG.COLORS.text,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: CONFIG.COLORS.border,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: CONFIG.COLORS.surface,
    borderRadius: 16,
    marginTop: 8,
    elevation: 12,
    shadowColor: CONFIG.COLORS.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    zIndex: 1000,
    maxHeight: 300,
    borderWidth: 1,
    borderColor: CONFIG.COLORS.border,
    overflow: 'hidden',
  },
  suggestionItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: CONFIG.COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CONFIG.COLORS.surface,
    marginHorizontal: 4,
    borderRadius: 8,
    marginVertical: 2,
  },
  suggestionTitle: {
    color: CONFIG.COLORS.text,
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  suggestionYear: {
    color: CONFIG.COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '500',
    backgroundColor: CONFIG.COLORS.surfaceSecondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 50,
    textAlign: 'center',
  },
  searchButton: {
    backgroundColor: CONFIG.COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 60,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    alignItems: 'center',
    marginVertical: 40,
  },
  loadingText: {
    color: CONFIG.COLORS.textSecondary,
    marginTop: 10,
    fontSize: 16,
  },
  movieItem: {
    backgroundColor: CONFIG.COLORS.surface,
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  movieItemPoster: {
    width: 80,
    height: 120,
    borderRadius: 8,
    marginRight: 15,
    backgroundColor: CONFIG.COLORS.surfaceSecondary,
  },
  movieInfo: {
    flex: 1,
    marginRight: 15,
  },
  movieTitle: {
    color: CONFIG.COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  movieYear: {
    color: CONFIG.COLORS.textSecondary,
    fontSize: 14,
    marginBottom: 8,
  },
  movieOverview: {
    color: CONFIG.COLORS.textTertiary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  movieRating: {
    color: CONFIG.COLORS.gold,
    fontSize: 14,
    fontWeight: '500',
  },
  actionButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
  },
  addButton: {
    backgroundColor: CONFIG.COLORS.primary,
  },
  removeButton: {
    backgroundColor: CONFIG.COLORS.accent,
  },
  actionButtonText: {
    color: CONFIG.COLORS.text,
    fontSize: 12,
    fontWeight: 'bold',
  },
  watchlistContainer: {
    flex: 1,
    padding: 20,
  },
  emptyText: {
    color: CONFIG.COLORS.textSecondary,
    textAlign: 'center',
    fontSize: 16,
    marginTop: 40,
  },
  emptyWatchlistContainer: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyWatchlistText: {
    color: CONFIG.COLORS.textSecondary,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  emptyWatchlistSubtext: {
    color: CONFIG.COLORS.textSecondary,
    fontSize: 16,
    textAlign: 'center',
  },

  // API Key Missing Styles
  apiKeyMissingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  apiKeyMissingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: CONFIG.COLORS.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  apiKeyMissingText: {
    fontSize: 16,
    color: CONFIG.COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  apiKeyMissingStep: {
    fontSize: 14,
    color: CONFIG.COLORS.textSecondary,
    marginBottom: 8,
  },
  apiKeyButtonContainer: {
    marginTop: 20,
  },

  // Professional Header Styles
  headerContent: {
    flex: 1,
  },
  headerSubtitle: {
    fontSize: 14,
    color: CONFIG.COLORS.textSecondary,
    marginTop: 2,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: CONFIG.COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButtonText: {
    fontSize: 16,
  },

  // Content Container
  contentContainer: {
    flex: 1,
  },

  // Bottom Tab Navigation Styles
  bottomTabContainer: {
    flexDirection: 'row',
    backgroundColor: CONFIG.COLORS.surface,
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderTopWidth: 1,
    borderTopColor: CONFIG.COLORS.border,
    elevation: 8,
    shadowColor: CONFIG.COLORS.shadow,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  bottomTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    marginHorizontal: 5,
    position: 'relative',
  },
  activeBottomTab: {
    backgroundColor: CONFIG.COLORS.primary + '20',
  },
  bottomTabIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  activeBottomTabIcon: {
    transform: [{ scale: 1.1 }],
  },
  bottomTabText: {
    fontSize: 12,
    color: CONFIG.COLORS.textSecondary,
    fontWeight: '500',
  },
  activeBottomTabText: {
    color: CONFIG.COLORS.primary,
    fontWeight: '600',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 15,
    backgroundColor: CONFIG.COLORS.accent,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },

  // Custom Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: CONFIG.COLORS.surface,
    borderRadius: 15,
    padding: 25,
    width: '100%',
    maxWidth: 350,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.34,
    shadowRadius: 6.27,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: CONFIG.COLORS.text,
    marginBottom: 15,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: CONFIG.COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonPrimary: {
    backgroundColor: CONFIG.COLORS.primary,
  },
  modalButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: CONFIG.COLORS.primary,
  },
  modalButtonTextPrimary: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalButtonTextSecondary: {
    color: CONFIG.COLORS.primary,
    fontWeight: 'bold',
    fontSize: 16,
  },

  // Movie Details Modal Styles
  detailsContainer: {
    flex: 1,
    backgroundColor: CONFIG.COLORS.background,
  },
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: CONFIG.COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: CONFIG.COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  detailsHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: CONFIG.COLORS.text,
  },
  placeholder: {
    width: 40,
  },
  detailsLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsContent: {
    flex: 1,
  },
  detailsHero: {
    flexDirection: 'row',
    padding: 20,
    alignItems: 'flex-start',
  },
  detailsPoster: {
    width: 120,
    height: 180,
    borderRadius: 12,
    marginRight: 20,
  },
  detailsInfo: {
    flex: 1,
  },
  detailsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: CONFIG.COLORS.text,
    marginBottom: 8,
    lineHeight: 30,
  },
  detailsYear: {
    fontSize: 16,
    color: CONFIG.COLORS.textSecondary,
    marginBottom: 6,
  },
  detailsRating: {
    fontSize: 16,
    color: CONFIG.COLORS.accent,
    fontWeight: '600',
    marginBottom: 6,
  },
  detailsRuntime: {
    fontSize: 16,
    color: CONFIG.COLORS.textSecondary,
    marginBottom: 12,
  },
  genresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  genreTag: {
    backgroundColor: CONFIG.COLORS.primary + '30',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  genreText: {
    color: CONFIG.COLORS.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  detailsSection: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  detailsSectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: CONFIG.COLORS.text,
    marginBottom: 12,
  },
  detailsOverview: {
    fontSize: 16,
    color: CONFIG.COLORS.textSecondary,
    lineHeight: 24,
  },
  castCard: {
    marginRight: 15,
    alignItems: 'center',
    width: 80,
  },
  castImage: {
    width: 60,
    height: 90,
    borderRadius: 8,
    marginBottom: 8,
  },
  castName: {
    fontSize: 12,
    fontWeight: '600',
    color: CONFIG.COLORS.text,
    textAlign: 'center',
    marginBottom: 2,
  },
  castCharacter: {
    fontSize: 10,
    color: CONFIG.COLORS.textSecondary,
    textAlign: 'center',
  },
  detailsActions: {
    padding: 20,
    paddingBottom: 40,
  },
  detailsActionButton: {
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  detailsActionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Enhanced Movie Details Styles
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  infoGridVertical: {
    flexDirection: 'column',
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 12,
  },
  infoItem: {
    width: '48%',
    backgroundColor: CONFIG.COLORS.surfaceSecondary,
    padding: 12,
    borderRadius: 8,
  },
  infoItemFull: {
    flex: 1,
    backgroundColor: CONFIG.COLORS.surfaceSecondary,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: CONFIG.COLORS.primary,
  },
  infoItemHalf: {
    flex: 1,
    backgroundColor: CONFIG.COLORS.surfaceSecondary,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: CONFIG.COLORS.secondary,
  },
  infoLabel: {
    fontSize: 14,
    color: CONFIG.COLORS.textSecondary,
    marginBottom: 8,
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 16,
    color: CONFIG.COLORS.text,
    fontWeight: '600',
    lineHeight: 22,
  },
  trailerButton: {
    backgroundColor: CONFIG.COLORS.surfaceSecondary,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: CONFIG.COLORS.primary + '20',
    elevation: 4,
    shadowColor: CONFIG.COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  trailerIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: CONFIG.COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  trailerIcon: {
    fontSize: 20,
    color: '#fff',
  },
  trailerInfo: {
    flex: 1,
  },
  trailerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: CONFIG.COLORS.text,
    marginBottom: 4,
  },
  trailerSubtitle: {
    fontSize: 14,
    color: CONFIG.COLORS.textSecondary,
    fontWeight: '500',
  },
  trailerArrow: {
    marginLeft: 12,
  },
  trailerArrowText: {
    fontSize: 16,
    color: CONFIG.COLORS.primary,
    fontWeight: 'bold',
  },
  writersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  writerName: {
    fontSize: 16,
    color: CONFIG.COLORS.text,
  },
  productionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  productionCompany: {
    alignItems: 'center',
    width: 100,
  },
  companyLogo: {
    width: 60,
    height: 30,
    marginBottom: 8,
  },
  companyName: {
    fontSize: 12,
    color: CONFIG.COLORS.textSecondary,
    textAlign: 'center',
  },
  reviewCard: {
    backgroundColor: CONFIG.COLORS.surfaceSecondary,
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  reviewAuthor: {
    fontSize: 16,
    fontWeight: '600',
    color: CONFIG.COLORS.text,
  },
  reviewRating: {
    fontSize: 14,
    color: CONFIG.COLORS.gold,
    fontWeight: '500',
  },
  reviewContent: {
    fontSize: 14,
    color: CONFIG.COLORS.textSecondary,
    lineHeight: 20,
  },
  similarMovieCard: {
    marginRight: 15,
    width: 100,
  },
  similarMoviePoster: {
    width: 100,
    height: 150,
    borderRadius: 8,
    marginBottom: 8,
  },
  similarMovieTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: CONFIG.COLORS.text,
    marginBottom: 4,
    lineHeight: 16,
  },
  similarMovieRating: {
    fontSize: 11,
    color: CONFIG.COLORS.gold,
  },

  // Trailer Modal Styles
  trailerModalContainer: {
    flex: 1,
    backgroundColor: CONFIG.COLORS.background,
  },
  trailerModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: CONFIG.COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: CONFIG.COLORS.border,
  },
  trailerCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: CONFIG.COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trailerCloseButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  trailerModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: CONFIG.COLORS.text,
  },
  trailerWebView: {
    flex: 1,
    backgroundColor: CONFIG.COLORS.background,
  },
  trailerLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: CONFIG.COLORS.background,
  },

  // Developer Credit Styles
  developerCredit: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: CONFIG.COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: CONFIG.COLORS.border,
  },
  creditIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
    borderRadius: 4,
  },
  creditText: {
    fontSize: 12,
    color: CONFIG.COLORS.textSecondary,
    fontStyle: 'italic',
  },

  // Grid Container for Skeleton Loading
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  searchResultsContainer: {
    marginTop: 20,
  },

  // Header Button Styles
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: CONFIG.COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: CONFIG.COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  headerButtonText: {
    fontSize: 20,
    color: '#fff',
  },

  // Enhanced Home Page Styles
  heroSection: {
    backgroundColor: CONFIG.COLORS.surface,
    margin: 20,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 4,
    shadowColor: CONFIG.COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: CONFIG.COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: CONFIG.COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: CONFIG.COLORS.primary,
  },
  statLabel: {
    fontSize: 12,
    color: CONFIG.COLORS.textSecondary,
    marginTop: 4,
  },
  quickActionsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: CONFIG.COLORS.surface,
    marginHorizontal: 5,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: CONFIG.COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    color: CONFIG.COLORS.text,
    textAlign: 'center',
    fontWeight: '500',
  },
  genreSection: {
    marginTop: 20,
  },
  factsSection: {
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
  },
  factCard: {
    backgroundColor: CONFIG.COLORS.surface,
    padding: 15,
    borderRadius: 10,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: CONFIG.COLORS.primary,
    elevation: 2,
    shadowColor: CONFIG.COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  factText: {
    fontSize: 14,
    color: CONFIG.COLORS.text,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  
  // Compact Styles
  heroSectionCompact: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: CONFIG.COLORS.surface,
    marginHorizontal: 20,
    marginVertical: 10,
    borderRadius: 15,
    borderLeftWidth: 4,
    borderLeftColor: CONFIG.COLORS.primary,
    elevation: 3,
    shadowColor: CONFIG.COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  heroTitleCompact: {
    fontSize: 18,
    fontWeight: 'bold',
    color: CONFIG.COLORS.text,
    textAlign: 'center',
    marginBottom: 10,
  },
  statsContainerCompact: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItemCompact: {
    alignItems: 'center',
  },
  statNumberCompact: {
    fontSize: 16,
    fontWeight: 'bold',
    color: CONFIG.COLORS.primary,
  },
  statLabelCompact: {
    fontSize: 10,
    color: CONFIG.COLORS.textSecondary,
    marginTop: 2,
  },
  quickActionsSectionCompact: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  quickActionsContainerCompact: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickActionButtonCompact: {
    flex: 1,
    backgroundColor: CONFIG.COLORS.surface,
    marginHorizontal: 3,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 1,
    shadowColor: CONFIG.COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 1,
  },
  quickActionIconCompact: {
    fontSize: 18,
    marginBottom: 4,
  },
  quickActionTextCompact: {
    fontSize: 10,
    color: CONFIG.COLORS.text,
    textAlign: 'center',
    fontWeight: '500',
  },
  movieItemCompact: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: CONFIG.COLORS.surface,
    marginVertical: 4,
    marginHorizontal: 20,
    borderRadius: 8,
    elevation: 1,
    shadowColor: CONFIG.COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 1,
  },
  movieItemPosterCompact: {
    width: 60,
    height: 90,
    borderRadius: 6,
  },
  movieInfoCompact: {
    flex: 1,
    marginLeft: 10,
    justifyContent: 'center',
  },
  movieTitleCompact: {
    fontSize: 14,
    fontWeight: 'bold',
    color: CONFIG.COLORS.text,
    marginBottom: 2,
  },
  movieYearCompact: {
    fontSize: 11,
    color: CONFIG.COLORS.textSecondary,
    marginBottom: 2,
  },
  movieOverviewCompact: {
    fontSize: 10,
    color: CONFIG.COLORS.textTertiary,
    marginBottom: 3,
  },
  movieRatingCompact: {
    fontSize: 11,
    color: CONFIG.COLORS.gold,
    fontWeight: '500',
  },
  actionButtonCompact: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'center',
    minWidth: 35,
    alignItems: 'center',
  },
  actionButtonTextCompact: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  movieCardCompact: {
    width: 100,
    marginRight: 10,
    backgroundColor: CONFIG.COLORS.surface,
    borderRadius: 8,
    elevation: 1,
    shadowColor: CONFIG.COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 1,
  },
  moviePosterCompact: {
    width: '100%',
    height: 140,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  movieCardInfoCompact: {
    padding: 6,
  },
  movieCardTitleCompact: {
    fontSize: 11,
    fontWeight: '600',
    color: CONFIG.COLORS.text,
    marginBottom: 3,
    height: 16,
  },
  movieCardRatingCompact: {
    fontSize: 10,
    color: CONFIG.COLORS.gold,
    marginBottom: 5,
  },
  cardActionButtonCompact: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  cardActionButtonTextCompact: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  
  // Movie Details Compact Styles
  detailsHeroCompact: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: CONFIG.COLORS.surface,
    marginBottom: 10,
  },
  detailsPosterCompact: {
    width: 120,
    height: 180,
    borderRadius: 8,
  },
  detailsInfoCompact: {
    flex: 1,
    marginLeft: 15,
    justifyContent: 'center',
  },
  detailsTitleCompact: {
    fontSize: 18,
    fontWeight: 'bold',
    color: CONFIG.COLORS.text,
    marginBottom: 6,
  },
  detailsYearCompact: {
    fontSize: 14,
    color: CONFIG.COLORS.textSecondary,
    marginBottom: 4,
  },
  detailsRatingCompact: {
    fontSize: 14,
    color: CONFIG.COLORS.gold,
    fontWeight: '600',
    marginBottom: 4,
  },
  detailsRuntimeCompact: {
    fontSize: 13,
    color: CONFIG.COLORS.textSecondary,
    marginBottom: 8,
  },
  genresContainerCompact: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  genreTagCompact: {
    backgroundColor: CONFIG.COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginRight: 6,
    marginBottom: 4,
  },
  genreTextCompact: {
    color: CONFIG.COLORS.text,
    fontSize: 10,
    fontWeight: '500',
  },
  detailsSectionCompact: {
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  detailsSectionTitleCompact: {
    fontSize: 16,
    fontWeight: 'bold',
    color: CONFIG.COLORS.text,
    marginBottom: 8,
  },
  detailsOverviewCompact: {
    fontSize: 13,
    color: CONFIG.COLORS.textTertiary,
    lineHeight: 18,
  },
  infoGridVerticalCompact: {
    backgroundColor: CONFIG.COLORS.surfaceSecondary,
    borderRadius: 8,
    padding: 12,
  },
  infoRowCompact: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoItemFullCompact: {
    flex: 1,
  },
  infoItemHalfCompact: {
    flex: 1,
    marginRight: 8,
  },
  infoLabelCompact: {
    fontSize: 11,
    color: CONFIG.COLORS.textSecondary,
    marginBottom: 2,
  },
  infoValueCompact: {
    fontSize: 13,
    color: CONFIG.COLORS.text,
    fontWeight: '500',
  },
  trailerButtonCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CONFIG.COLORS.surface,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: CONFIG.COLORS.border,
  },
  trailerIconContainerCompact: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: CONFIG.COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  trailerIconCompact: {
    fontSize: 16,
  },
  trailerInfoCompact: {
    flex: 1,
  },
  trailerTitleCompact: {
    fontSize: 14,
    fontWeight: '600',
    color: CONFIG.COLORS.text,
    marginBottom: 2,
  },
  trailerSubtitleCompact: {
    fontSize: 11,
    color: CONFIG.COLORS.textSecondary,
  },
  trailerArrowCompact: {
    marginLeft: 8,
  },
  trailerArrowTextCompact: {
    fontSize: 12,
    color: CONFIG.COLORS.textSecondary,
  },
  castCardCompact: {
    width: 70,
    marginRight: 10,
    alignItems: 'center',
  },
  castImageCompact: {
    width: 60,
    height: 90,
    borderRadius: 6,
    marginBottom: 6,
  },
  castNameCompact: {
    fontSize: 10,
    fontWeight: '600',
    color: CONFIG.COLORS.text,
    textAlign: 'center',
    marginBottom: 2,
  },
  castCharacterCompact: {
    fontSize: 9,
    color: CONFIG.COLORS.textSecondary,
    textAlign: 'center',
  },
  reviewCardCompact: {
    backgroundColor: CONFIG.COLORS.surfaceSecondary,
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  reviewHeaderCompact: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  reviewAuthorCompact: {
    fontSize: 12,
    fontWeight: '600',
    color: CONFIG.COLORS.text,
  },
  reviewRatingCompact: {
    fontSize: 11,
    color: CONFIG.COLORS.gold,
  },
  reviewContentCompact: {
    fontSize: 11,
    color: CONFIG.COLORS.textTertiary,
    lineHeight: 16,
  },
  similarMovieCardCompact: {
    width: 80,
    marginRight: 10,
    alignItems: 'center',
  },
  similarMoviePosterCompact: {
    width: 80,
    height: 120,
    borderRadius: 6,
    marginBottom: 6,
  },
  similarMovieTitleCompact: {
    fontSize: 10,
    fontWeight: '600',
    color: CONFIG.COLORS.text,
    textAlign: 'center',
    marginBottom: 2,
  },
  similarMovieRatingCompact: {
    fontSize: 9,
    color: CONFIG.COLORS.gold,
    textAlign: 'center',
  },
  detailsActionsCompact: {
    paddingHorizontal: 15,
    paddingVertical: 15,
  },
  detailsActionButtonCompact: {
    backgroundColor: CONFIG.COLORS.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  detailsActionButtonTextCompact: {
    color: CONFIG.COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
});
