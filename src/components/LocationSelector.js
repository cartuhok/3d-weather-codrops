import React, { useState } from 'react';

const LocationSelector = ({ onLocationChange, currentLocation, isLoading, isNight }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (searchQuery.trim() && !isLoading) {
      setIsSearching(true);
      await onLocationChange(searchQuery.trim());
      setIsSearching(false);
      setSearchQuery('');
    }
  };

  const handleCurrentLocation = async () => {
    if (!isLoading) {
      setIsSearching(true);
      try {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 600000
          });
        });
        
        const { latitude, longitude } = position.coords;
        await onLocationChange(`${latitude},${longitude}`);
      } catch (error) {
        console.error('Error getting current location:', error);
        alert('Unable to get your current location. Please enter a city name manually.');
      }
      setIsSearching(false);
    }
  };

  return (
    <div className="flex flex-col items-end space-y-2">
      <form onSubmit={handleSearch}>
        <div className="flex items-center space-x-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className={`bg-transparent px-3 py-1 ${isNight ? 'text-white placeholder-white/40' : 'text-black placeholder-black/40'} text-sm md:text-base font-light focus:outline-none w-32 md:w-48 tracking-wide`}
            disabled={isLoading || isSearching}
          />
          <button 
            type="submit" 
            className={`p-1 ${isNight ? 'text-white/60 hover:text-white' : 'text-black/60 hover:text-black'} transition-colors disabled:opacity-40`}
            disabled={!searchQuery.trim() || isLoading || isSearching}
          >
            {isSearching && !isLoading ? (
              <div className={`w-3 h-3 border ${isNight ? 'border-white/30 border-t-white' : 'border-black/30 border-t-black'} rounded-full animate-spin`}></div>
            ) : (
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            )}
          </button>
        </div>
      </form>
      
      <button 
        onClick={handleCurrentLocation}
        className={`px-2 py-1 ${isNight ? 'text-white/60 hover:text-white' : 'text-black/60 hover:text-black'} text-xs md:text-sm transition-colors disabled:opacity-40 flex items-center space-x-1`}
        disabled={isLoading || isSearching}
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span>Location</span>
      </button>
    </div>
  );
};

export default LocationSelector;