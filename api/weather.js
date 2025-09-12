// Simple in-memory cache that works locally and on Vercel
const cache = new Map();
const rateLimitMap = new Map();

// Cache duration: 10 minutes
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds
// For testing: temporarily set to 2 requests to test rate limiting quickly
// Change back to 20 for production
const MAX_REQUESTS_PER_HOUR = 20;

// Helper function to get client IP
function getClientIP(req) {
  return req.headers['x-forwarded-for'] || 
         req.headers['x-real-ip'] || 
         req.connection?.remoteAddress || 
         req.socket?.remoteAddress ||
         '127.0.0.1';
}

// Rate limiting function
function isRateLimited(ip) {
  const now = Date.now();
  const userRequests = rateLimitMap.get(ip) || [];
  
  // Remove old requests outside the window
  const validRequests = userRequests.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW);
  
  if (validRequests.length >= MAX_REQUESTS_PER_HOUR) {
    return true;
  }
  
  // Add current request
  validRequests.push(now);
  rateLimitMap.set(ip, validRequests);
  
  return false;
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { location } = req.query;
  
  if (!location) {
    return res.status(400).json({ error: 'Location parameter is required' });
  }
  
  // Rate limiting with fallback data
  const clientIP = getClientIP(req);
  if (isRateLimited(clientIP)) {
    console.log(`Rate limit exceeded for IP: ${clientIP}, serving demo data`);
    
    // Return realistic dummy weather data
    const demoWeatherData = {
      location: {
        name: "Demo City",
        region: "Demo State",
        country: "Demo Country", 
        lat: 40.7128,
        lon: -74.0060,
        tz_id: "America/New_York",
        localtime_epoch: Math.floor(Date.now() / 1000),
        localtime: new Date().toISOString().slice(0, -5) // Remove Z and milliseconds
      },
      current: {
        last_updated_epoch: Math.floor(Date.now() / 1000),
        last_updated: new Date().toISOString().slice(0, -5),
        temp_c: 22,
        temp_f: 72,
        is_day: new Date().getHours() >= 6 && new Date().getHours() <= 18 ? 1 : 0,
        condition: {
          text: "Partly cloudy",
          icon: "//cdn.weatherapi.com/weather/64x64/day/116.png",
          code: 1003
        },
        wind_mph: 8.5,
        wind_kph: 13.7,
        wind_degree: 230,
        wind_dir: "SW",
        pressure_mb: 1013.0,
        pressure_in: 29.91,
        precip_mm: 0.0,
        precip_in: 0.0,
        humidity: 65,
        cloud: 40,
        feelslike_c: 24,
        feelslike_f: 75,
        vis_km: 16.0,
        vis_miles: 10.0,
        uv: 5.0,
        gust_mph: 12.1,
        gust_kph: 19.4
      },
      forecast: {
        forecastday: [
          {
            date: new Date().toISOString().split('T')[0],
            date_epoch: Math.floor(Date.now() / 1000),
            day: {
              maxtemp_c: 26,
              maxtemp_f: 79,
              mintemp_c: 18,
              mintemp_f: 64,
              avgtemp_c: 22,
              avgtemp_f: 72,
              maxwind_mph: 12.1,
              maxwind_kph: 19.4,
              totalprecip_mm: 0.0,
              totalprecip_in: 0.0,
              totalsnow_cm: 0.0,
              avgvis_km: 16.0,
              avgvis_miles: 10.0,
              avghumidity: 65,
              daily_will_it_rain: 0,
              daily_chance_of_rain: 10,
              daily_will_it_snow: 0,
              daily_chance_of_snow: 0,
              condition: {
                text: "Partly cloudy",
                icon: "//cdn.weatherapi.com/weather/64x64/day/116.png",
                code: 1003
              },
              uv: 5.0
            }
          },
          // Tomorrow
          {
            date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            date_epoch: Math.floor(Date.now() / 1000) + 86400,
            day: {
              maxtemp_c: 24,
              maxtemp_f: 75,
              mintemp_c: 16,
              mintemp_f: 61,
              avgtemp_c: 20,
              avgtemp_f: 68,
              maxwind_mph: 10.5,
              maxwind_kph: 16.9,
              totalprecip_mm: 2.1,
              totalprecip_in: 0.08,
              totalsnow_cm: 0.0,
              avgvis_km: 12.0,
              avgvis_miles: 7.0,
              avghumidity: 72,
              daily_will_it_rain: 1,
              daily_chance_of_rain: 80,
              daily_will_it_snow: 0,
              daily_chance_of_snow: 0,
              condition: {
                text: "Light rain",
                icon: "//cdn.weatherapi.com/weather/64x64/day/296.png",
                code: 1183
              },
              uv: 3.0
            }
          },
          // Day after tomorrow
          {
            date: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString().split('T')[0],
            date_epoch: Math.floor(Date.now() / 1000) + 172800,
            day: {
              maxtemp_c: 28,
              maxtemp_f: 82,
              mintemp_c: 20,
              mintemp_f: 68,
              avgtemp_c: 24,
              avgtemp_f: 75,
              maxwind_mph: 15.2,
              maxwind_kph: 24.4,
              totalprecip_mm: 0.0,
              totalprecip_in: 0.0,
              totalsnow_cm: 0.0,
              avgvis_km: 16.0,
              avgvis_miles: 10.0,
              avghumidity: 58,
              daily_will_it_rain: 0,
              daily_chance_of_rain: 5,
              daily_will_it_snow: 0,
              daily_chance_of_snow: 0,
              condition: {
                text: "Sunny",
                icon: "//cdn.weatherapi.com/weather/64x64/day/113.png",
                code: 1000
              },
              uv: 7.0
            }
          }
        ]
      },
      rateLimited: true, // Flag to indicate this is demo data
      cached: false
    };
    
    return res.json(demoWeatherData);
  }
  
  // Check cache first
  const cacheKey = `weather:${location.toLowerCase()}`;
  const cachedData = cache.get(cacheKey);
  
  if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
    console.log(`Cache hit for location: ${location}`);
    return res.json({
      ...cachedData.data,
      cached: true,
      cacheAge: Math.round((Date.now() - cachedData.timestamp) / 1000)
    });
  }
  
  // Make API call to WeatherAPI
  const API_KEY = process.env.REACT_APP_WEATHER_API_KEY || process.env.WEATHER_API_KEY;
  
  if (!API_KEY) {
    console.error('Weather API key not found');
    return res.status(500).json({ error: 'Server configuration error' });
  }
  
  try {
    const weatherResponse = await fetch(
      `https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${encodeURIComponent(location)}&days=3&aqi=no&alerts=no&tz=${Intl.DateTimeFormat().resolvedOptions().timeZone}`
    );
    
    if (!weatherResponse.ok) {
      const errorData = await weatherResponse.json().catch(() => ({}));
      return res.status(weatherResponse.status).json({ 
        error: errorData.error?.message || 'Weather API error',
        code: errorData.error?.code
      });
    }
    
    const weatherData = await weatherResponse.json();
    
    // Cache the response
    cache.set(cacheKey, {
      data: weatherData,
      timestamp: Date.now()
    });
    
    console.log(`API call made for location: ${location}, cached for ${CACHE_DURATION / 1000 / 60} minutes`);
    
    // Clean up old cache entries (simple cleanup)
    if (cache.size > 100) {
      const oldestKey = cache.keys().next().value;
      cache.delete(oldestKey);
    }
    
    res.json({
      ...weatherData,
      cached: false
    });
    
  } catch (error) {
    console.error('Weather API error:', error);
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
}