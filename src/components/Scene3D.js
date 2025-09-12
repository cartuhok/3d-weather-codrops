import React, { Suspense, useMemo, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Sky, Stars, Text } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import UltimateLensFlare from './lensflare/LensFlare';
import ForecastPortals from './ForecastPortals';
import { getWeatherConditionType, shouldShowSun } from '../services/weatherService';
import * as THREE from 'three';
import WeatherVisualization from './WeatherVisualization';

// Component to handle scene background
const SceneBackground = ({ backgroundColor }) => {
  const { scene } = useThree();
  
  useEffect(() => {
    scene.background = new THREE.Color(backgroundColor);
  }, [scene, backgroundColor]);
  
  return null;
};

// Lens flare visibility logic - uses shared weather service utility
const useLensFlareVisibility = (weatherData, isNight) => {
  return React.useMemo(() => {
    if (isNight || !weatherData) return false;
    return shouldShowSun(weatherData);
  }, [isNight, weatherData]);
};

// Post-processing effects with Ultimate Lens Flare - only render when needed
const PostProcessingEffects = ({ showLensFlare, isPortalMode = false }) => {
  // Define main scene lens flare values
  const mainSceneDefaults = {
    positionX: 0,
    positionY: 5,
    positionZ: 0,
    opacity: 1.00,
    glareSize: 1.68,
    starPoints: 2,
    animated: false,
    followMouse: false,
    anamorphic: false,
    colorGain: '#38150b',
    flareSpeed: 0.10,
    flareShape: 0.81,
    flareSize: 1.68,
    secondaryGhosts: true,
    ghostScale: 0.03,
    aditionalStreaks: true,
    starBurst: false,
    haloScale: 3.88,
  };

  // Define portal mode lens flare values
  const portalModeDefaults = {
    positionX: 0,
    positionY: 3,
    positionZ: 0,
    opacity: 1.00,
    glareSize: 1.68,
    starPoints: 2,
    animated: false,
    followMouse: false,
    anamorphic: false,
    colorGain: '#38150b',
    flareSpeed: 0.10,
    flareShape: 0.81,
    flareSize: 1.68,
    secondaryGhosts: true,
    ghostScale: 0.03,
    aditionalStreaks: true,
    starBurst: false,
    haloScale: 3.88,
  };

  // Use appropriate defaults based on portal mode
  const lensFlareSettings = isPortalMode ? portalModeDefaults : mainSceneDefaults;
  
  // Define bloom values for different modes
  const mainSceneBloom = {
    bloomIntensity: 0.3,
    bloomThreshold: 0.9,
  };

  const portalModeBloom = {
    bloomIntensity: 0.97,
    bloomThreshold: 0.85,
  };

  const bloomSettings = isPortalMode ? portalModeBloom : mainSceneBloom;
  
  if (!showLensFlare) return null;
  
  return (
    <EffectComposer>
      <UltimateLensFlare
        position={[lensFlareSettings.positionX, lensFlareSettings.positionY, lensFlareSettings.positionZ]}
        opacity={lensFlareSettings.opacity}
        glareSize={lensFlareSettings.glareSize}
        starPoints={lensFlareSettings.starPoints}
        animated={lensFlareSettings.animated}
        followMouse={lensFlareSettings.followMouse}
        anamorphic={lensFlareSettings.anamorphic}
        colorGain={new THREE.Color(lensFlareSettings.colorGain)}
        flareSpeed={lensFlareSettings.flareSpeed}
        flareShape={lensFlareSettings.flareShape}
        flareSize={lensFlareSettings.flareSize}
        secondaryGhosts={lensFlareSettings.secondaryGhosts}
        ghostScale={lensFlareSettings.ghostScale}
        aditionalStreaks={lensFlareSettings.aditionalStreaks}
        starBurst={lensFlareSettings.starBurst}
        haloScale={lensFlareSettings.haloScale}
        dirtTextureFile="/lensDirtTexture.jpg"
      />
      <Bloom 
        intensity={bloomSettings.bloomIntensity} 
        threshold={bloomSettings.bloomThreshold} 
      />
    </EffectComposer>
  );
};

const Scene3D = ({ weatherData, isLoading, onPortalModeChange, onSetExitPortalFunction, onPortalWeatherDataChange }) => {
  const [portalMode, setPortalMode] = React.useState(false);
  const [portalWeatherData, setPortalWeatherData] = React.useState(null);
  

  const exitPortal = () => {
    setPortalMode(false);
    setPortalWeatherData(null);
    onPortalModeChange?.(false);
    onPortalWeatherDataChange?.(null);
  };

  const handlePortalStateChange = (isPortalActive, dayData) => {
    setPortalMode(isPortalActive);
    onPortalModeChange?.(isPortalActive);
    if (isPortalActive && dayData) {
      // Create weather data for the portal day
      const portalData = {
        current: {
          temp_f: dayData.day.maxtemp_f,
          condition: dayData.day.condition,
          is_day: 1,
          humidity: dayData.day.avghumidity,
          wind_mph: dayData.day.maxwind_mph,
          feelslike_f: dayData.day.maxtemp_f, // Approximate feels like temp
          vis_miles: 10, // Default visibility
        },
        location: {
          name: weatherData?.location?.name || 'Unknown',
          region: weatherData?.location?.region || '',
          localtime: dayData.date + 'T12:00'
        }
      };
      setPortalWeatherData(portalData);
      onPortalWeatherDataChange?.(portalData);
    } else {
      setPortalWeatherData(null);
      onPortalWeatherDataChange?.(null);
    }
  };

  // Provide exit function to parent
  React.useEffect(() => {
    onSetExitPortalFunction?.(() => exitPortal);
  }, [onSetExitPortalFunction]);
  
  const getTimeOfDay = () => {
    if (!weatherData?.location?.localtime) return 'day';
    const localTime = weatherData.location.localtime;
    const currentHour = new Date(localTime).getHours();
    
    if (currentHour >= 19 || currentHour <= 6) return 'night';
    if (currentHour >= 6 && currentHour < 8) return 'dawn';
    if (currentHour >= 17 && currentHour < 19) return 'dusk';
    return 'day';
  };

  const isNightTime = () => {
    if (!weatherData?.location?.localtime) return false;
    const localTime = weatherData.location.localtime;
    const currentHour = new Date(localTime).getHours();
    return currentHour >= 19 || currentHour <= 6;
  };

  // Calculate sun position based on time and location
  const sunPosition = useMemo(() => {
    if (!weatherData?.location) {
      // Default position for day/night - ensure sun is visible during day
      const hour = new Date().getHours();
      if (hour >= 6 && hour <= 18) {
        // Daytime - put sun high in sky
        const dayProgress = (hour - 6) / 12; // 0 to 1 from sunrise to sunset
        const angle = dayProgress * Math.PI; // 0 to π
        return [
          Math.sin(angle) * 50,
          Math.cos(angle) * 50 + 25, // Keep sun above horizon
          30
        ];
      } else {
        // Nighttime - sun below horizon
        return [0, -50, 0];
      }
    }

    const { lat, lon, localtime } = weatherData.location;
    const date = new Date(localtime);
    const hour = date.getHours() + date.getMinutes() / 60;
    
    if (hour >= 6 && hour <= 18) {
      // Daytime positioning
      const dayProgress = (hour - 6) / 12; // 0 at sunrise, 1 at sunset
      const sunAngle = dayProgress * Math.PI; // 0 to π
      
      const distance = 100;
      const elevation = Math.sin(sunAngle) * 0.7 + 0.3;
      
      return [
        Math.sin(sunAngle - Math.PI/2) * distance * 0.8,
        elevation * distance,
        Math.cos(sunAngle - Math.PI/2) * distance * 0.3
      ];
    } else {
      // Nighttime - moon position
      return [0, -30, 50];
    }
  }, [weatherData?.location?.lat, weatherData?.location?.lon, weatherData?.location?.localtime]);

  const isNight = isNightTime();
  const timeOfDay = getTimeOfDay();
  const showLensFlare = useLensFlareVisibility(weatherData, isNight);
  const showPortalLensFlare = useLensFlareVisibility(portalWeatherData, false);
  
  //Sky colors
  const getBackgroundColor = () => {
    if (isNight) return '#0A1428';
    
    // Dawn/dusk specific colors
    if (timeOfDay === 'dawn') return '#2D1B3D';
    if (timeOfDay === 'dusk') return '#3D2914';
    
    if (!weatherData?.current?.condition) return '#0D7FDB';
    const condition = weatherData.current.condition.text.toLowerCase();
    
    if (condition.includes('storm')) return '#263238';
    if (condition.includes('rain') || condition.includes('overcast')) return '#546E7A';
    if (condition.includes('cloudy')) return '#1E88E5';
    return '#0D7FDB';
  };

  // Component to handle mobile responsive text inside Canvas
  const ResponsiveText = ({ isNight, isLoading }) => {
    const { viewport } = useThree();
    const isMobile = viewport.width < 6;
    const textScale = isMobile ? 0.7 : 1;
    const textPosition = isMobile ? [0, -1.6, 0] : [0, -2.1, 0];
    
    if (isLoading) return null;
    
    return (
      <Text
        position={textPosition}
        fontSize={0.2 * textScale}
        color={isNight ? "#FFFFFF" : "#333333"}
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.7}
      >
        THREE DAY FORECAST
      </Text>
    );
  };

  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
      <Canvas
        camera={{ position: [0, 1, 10], fov: 60 }}
        gl={{ alpha: false, antialias: true }}
        style={{ width: '100%', height: '100%' }}
      >
        <Suspense fallback={null}>
          {/* Scene background only for portal mode - Sky handles main scene */}
          {portalMode && <SceneBackground key={`bg-${timeOfDay}-${portalMode}`} backgroundColor={getBackgroundColor()} />}
          
          {/* Sky with dynamic sun position based on time of day */}
          <Sky
            key={`main-sky-${timeOfDay}-${portalMode}`}
            sunPosition={(() => {
              if (timeOfDay === 'dawn') {
                return [100, -5, 100]; // Sun below horizon for darker dawn
              } else if (timeOfDay === 'dusk') {
                return [-100, -5, 100]; // Sun below horizon for darker dusk
              } else if (timeOfDay === 'night') {
                return [0, 0, 0]; // Keep existing night value
              } else { // day
                return [100, 20, 100]; // Keep existing day value
              }
            })()}
            inclination={(() => {
              if (timeOfDay === 'dawn' || timeOfDay === 'dusk') {
                return 0.6; // Medium inclination for dawn/dusk
              } else if (timeOfDay === 'night') {
                return 0.3; // Keep existing night value
              } else { // day
                return 0.9; // Keep existing day value
              }
            })()}
            turbidity={(() => {
              if (timeOfDay === 'dawn' || timeOfDay === 'dusk') {
                return 8; // Higher turbidity for atmospheric scattering
              } else if (timeOfDay === 'night') {
                return 50; // Keep existing night value
              } else { // day
                return 2; // Keep existing day value
              }
            })()}
          />
          
          <ambientLight intensity={(() => {
            if (timeOfDay === 'dawn' || timeOfDay === 'dusk') {
              return 0.25; // Darker ambient light for dawn/dusk
            } else if (timeOfDay === 'night') {
              return 0.2; // Keep existing night value
            } else { // day
              return 0.4; // Keep existing day value
            }
          })()} />
          <directionalLight 
            position={sunPosition} 
            intensity={(() => {
              if (timeOfDay === 'dawn' || timeOfDay === 'dusk') {
                return 0.6; // Dimmer directional light for dawn/dusk
              } else if (timeOfDay === 'night') {
                return 0.5; // Keep existing night value
              } else { // day
                return 1; // Keep existing day value
              }
            })()} 
            color={(() => {
              if (timeOfDay === 'dawn') {
                return "#9B59B6"; // Purple-pink for dawn
              } else if (timeOfDay === 'dusk') {
                return "#E67E22"; // Warm orange for dusk
              } else if (timeOfDay === 'night') {
                return "#4169E1"; // Keep existing night value
              } else { // day
                return "#FFFFFF"; // Keep existing day value
              }
            })()}
          />
          <pointLight position={[-10, -10, -10]} intensity={0.3} />
          
          {!portalMode ? (
            <>
              {/* Main Scene */}
              {/* Stars only visible at night in main scene */}
              {isNight && <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />}
              
              <WeatherVisualization 
                weatherData={weatherData} 
                isLoading={isLoading}
              />
              
              {/* Three Day Forecast 3D Label - responsive for mobile */}
              <ResponsiveText isNight={isNight} isLoading={isLoading} />

              {/* 3D Forecast Portals */}
              <ForecastPortals 
                weatherData={weatherData} 
                isLoading={isLoading}
                onPortalStateChange={handlePortalStateChange}
              />
              
              {/* Post-processing effects including Ultimate Lens Flare */}
              <PostProcessingEffects showLensFlare={showLensFlare} isPortalMode={false} />
            </>
          ) : (
            <>
              {/* Fullscreen Portal Content with Day Sky */}
              <SceneBackground backgroundColor={'#0D7FDB'} />
              <Sky
                sunPosition={[100, 20, 100]}
                inclination={0.9}
                turbidity={2}
              />
              <ambientLight intensity={0.4} />
              <directionalLight 
                position={[10, 10, 5]} 
                intensity={1} 
                color="#FFFFFF"
              />
              <group position={[0, -1, 0]}>
                <WeatherVisualization 
                  weatherData={portalWeatherData} 
                  isLoading={false}
                  portalMode={false}
                />
              </group>
              
              {/* Add lens flare effect for portal mode when sun should be visible */}
              <PostProcessingEffects showLensFlare={showPortalLensFlare} isPortalMode={true} />
            </>
          )}
          
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            target={portalMode ? [0, 2, 0] : [0, 2, 0]}
            maxPolarAngle={Math.PI / 1.8}
            minPolarAngle={Math.PI / 4}
            maxAzimuthAngle={Math.PI * 70 / 180}
            minAzimuthAngle={-Math.PI * 70 / 180}
            minDistance={3}
            maxDistance={20}
          />
          
        </Suspense>
      </Canvas>
    </div>
  );
};

export default Scene3D;