import React, { useState, useEffect } from 'react';
import './App.css';
import Scene3D from './components/Scene3D';
import LocationSelector from './components/LocationSelector';
import { weatherService } from './services/weatherService';

function App() {
  const [weatherData, setWeatherData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentLocationName, setCurrentLocationName] = useState('');
  const [isPortalMode, setIsPortalMode] = useState(false);
  const [exitPortalFunction, setExitPortalFunction] = useState(null);
  const [portalWeatherData, setPortalWeatherData] = useState(null);
  const [errorSearchQuery, setErrorSearchQuery] = useState('');

  useEffect(() => {
    loadCurrentLocationWeather();
  }, []);

  const loadCurrentLocationWeather = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const location = await weatherService.getCurrentLocation();
      const data = await weatherService.getCurrentWeather(location);
      setWeatherData(data);
      setCurrentLocationName(`${data.location.name}, ${data.location.region}`);
    } catch (error) {
      console.error('Error loading weather:', error);
      setError('Unable to load weather data. Please try entering a city manually.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLocationChange = async (location) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await weatherService.getCurrentWeather(location);
      setWeatherData(data);
      setCurrentLocationName(`${data.location.name}, ${data.location.region}`);
    } catch (error) {
      console.error('Error loading weather for location:', error);
      setError('Unable to load weather data for this location. Please try a different city.');
    } finally {
      setIsLoading(false);
    }
  };

  const isNightTime = () => {
    if (!weatherData?.location?.localtime) return false;
    const localTime = weatherData.location.localtime;
    const currentHour = new Date(localTime).getHours();
    return currentHour >= 19 || currentHour <= 6;
  };

  const handlePortalWeatherDataChange = (data) => {
    setPortalWeatherData(data);
  };

  const handleErrorSearch = async (e) => {
    e.preventDefault();
    if (errorSearchQuery.trim()) {
      await handleLocationChange(errorSearchQuery.trim());
      setErrorSearchQuery('');
    }
  };

  // Use portal weather data when in portal mode, otherwise use main weather data
  const displayWeatherData = isPortalMode && portalWeatherData ? portalWeatherData : weatherData;

  const isNight = isNightTime();
  const textColor = (isPortalMode || !isNight) ? 'text-black' : 'text-white';

  return (
    <div className="w-screen h-screen min-h-dvh relative overflow-hidden">
      {/* 3D Scene fills entire viewport - base layer */}
      <div className="absolute inset-0 z-0">
        <Scene3D 
          weatherData={weatherData} 
          isLoading={isLoading}
          onPortalModeChange={setIsPortalMode}
          onSetExitPortalFunction={setExitPortalFunction}
          onPortalWeatherDataChange={handlePortalWeatherDataChange}
        />
      </div>
      
      {/* All UI elements overlay on top of the canvas */}
      {weatherData && !isLoading && (
        <>
          {/* Header - changes layout based on portal mode */}
          {isPortalMode ? (
            <>
              {/* Portal Mode Header */}
              <div className={`absolute top-6 left-6 z-20 ${textColor}`}>
                <button 
                  onClick={() => exitPortalFunction?.()}
                  className={`flex items-center space-x-2 px-4 py-2 ${textColor} opacity-80 hover:opacity-100 transition-opacity`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span className="text-sm font-light">Back</span>
                </button>
              </div>
              <div className={`absolute top-6 right-6 z-20 ${textColor} text-right`}>
                <div className="text-lg font-light tracking-wide opacity-95">
                  {displayWeatherData.location.name}
                  {displayWeatherData.rateLimited && (
                    <span className="ml-2 text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full">
                      DEMO
                    </span>
                  )}
                </div>
                <div className="text-sm opacity-60 tracking-wide">
                  {displayWeatherData.location.region}
                </div>
              </div>
            </>
          ) : (
            /* Normal Mode Header */
            <div className={`absolute top-6 left-6 right-6 z-20 flex items-start justify-between ${textColor}`}>
              <div>
                <div className="text-lg font-light tracking-wide opacity-95">
                  {displayWeatherData.location.name}
                  {displayWeatherData.rateLimited && (
                    <span className="ml-2 text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full">
                      DEMO
                    </span>
                  )}
                </div>
                <div className="text-sm opacity-60 tracking-wide">
                  {displayWeatherData.location.region}
                </div>
              </div>
              <LocationSelector 
                onLocationChange={handleLocationChange}
                currentLocation={currentLocationName}
                isLoading={isLoading}
                isNight={isNight}
              />
            </div>
          )}


          {/* Main Temperature Card - Bottom Left */}
          <div className={`absolute bottom-20 md:bottom-6 left-6 z-20 ${textColor}`} style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
            <div className="flex items-end space-x-4">
              <div className="flex items-baseline">
                <span className="text-6xl font-thin leading-none">
                  {Math.round(displayWeatherData.current.temp_f)}
                </span>
                <span className="text-2xl font-thin opacity-75">°</span>
              </div>
              <div className="pb-2">
                <div className="text-sm font-light opacity-80 capitalize mb-1">
                  {displayWeatherData.current.condition.text}
                </div>
                <div className="text-xs opacity-60 space-y-0.5">
                  <div>H: {Math.round(displayWeatherData.current.temp_f + 5)}° L: {Math.round(displayWeatherData.current.temp_f - 10)}°</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Compact Stats Bar - Bottom Right */}
          <div className={`absolute bottom-20 md:bottom-6 right-6 z-20 ${textColor}`} style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
            <div className="flex flex-col space-y-3 text-right text-sm">
              <div className="flex items-center justify-end space-x-2">
                <span className="opacity-60">HUMIDITY</span>
                <span className="font-light">{displayWeatherData.current.humidity}%</span>
              </div>
              <div className="flex items-center justify-end space-x-2">
                <span className="opacity-60">WIND</span>
                <span className="font-light">{Math.round(displayWeatherData.current.wind_mph)} mph</span>
              </div>
              <div className="flex items-center justify-end space-x-2">
                <span className="opacity-60">FEELS</span>
                <span className="font-light">{Math.round(displayWeatherData.current.feelslike_f)}°</span>
              </div>
              <div className="flex items-center justify-end space-x-2">
                <span className="opacity-60">VISIBILITY</span>
                <span className="font-light">{Math.round(displayWeatherData.current.vis_miles)} mi</span>
              </div>
            </div>
          </div>
        </>
      )}
      
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-50">
          <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mb-4"></div>
          <p className="text-lg font-light">Loading weather data...</p>
        </div>
      )}
      
      {error && (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-lg z-50">
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 max-w-sm mx-4 text-center border border-white/20">
            <p className="text-white text-lg font-light mb-6 leading-relaxed">{error}</p>
            
            {/* Search form for manual city entry */}
            <form onSubmit={handleErrorSearch} className="mb-6">
              <div className="flex items-center space-x-2 bg-white/10 rounded-2xl p-3 border border-white/20">
                <input
                  type="text"
                  value={errorSearchQuery}
                  onChange={(e) => setErrorSearchQuery(e.target.value)}
                  placeholder="Enter city name..."
                  className="flex-1 bg-transparent text-white placeholder-white/60 focus:outline-none text-sm font-light"
                  disabled={isLoading}
                />
                <button 
                  type="submit" 
                  className="text-white/80 hover:text-white transition-colors disabled:opacity-40"
                  disabled={!errorSearchQuery.trim() || isLoading}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </form>

            {/* Buttons */}
            <div className="flex space-x-3">
              <button 
                onClick={loadCurrentLocationWeather} 
                className="flex-1 bg-white/20 hover:bg-white/30 px-4 py-3 rounded-2xl text-white font-light transition-all duration-300 border border-white/30 hover:scale-105 text-sm"
                disabled={isLoading}
              >
                Try Location Again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
