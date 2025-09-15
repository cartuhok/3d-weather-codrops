import React, { useState, useRef, useMemo } from 'react';
import { useFrame, useThree, useLoader, extend } from '@react-three/fiber';
import { MeshPortalMaterial, Text, OrbitControls, Environment } from '@react-three/drei';
import * as THREE from 'three';
import WeatherVisualization from './WeatherVisualization';
import * as geometry from "maath/geometry";

// Extend with rounded plane geometry from maath
extend(geometry);

const ForecastPortal = ({ 
  position, 
  dayData, 
  index, 
  isActive,
  isFullscreen,
  onEnter, 
  onExit 
}) => {
  const portalRef = useRef();
  const materialRef = useRef();
  const [hovered, setHovered] = useState(false);

  useFrame((state, delta) => {
    if (materialRef.current) {
      // Animate portal blend based on active state
      const targetBlend = isFullscreen ? 1 : (isActive ? 0.5 : 0);
      materialRef.current.blend = THREE.MathUtils.lerp(
        materialRef.current.blend || 0,
        targetBlend,
        0.1
      );
    }
  });

  const formatDay = (dateString, index) => {
    // Parse date as local time to avoid timezone shifts
    const [year, month, day] = dateString.split('-');
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
  };

  // Create portal scene with forecast weather
  const portalWeatherData = useMemo(() => ({
    current: {
      temp_f: dayData.day.maxtemp_f,
      condition: dayData.day.condition,
      is_day: 1, // Assume daytime for forecast
      humidity: dayData.day.avghumidity,
      wind_mph: dayData.day.maxwind_mph,
    },
    location: {
      localtime: dayData.date + 'T12:00' // Noon time for forecast
    }
  }), [dayData]);

  // Portal content with proper scene structure
  const PortalScene = () => (
    <>
      <color attach="background" args={['#87CEEB']} />
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <WeatherVisualization 
        weatherData={portalWeatherData} 
        isLoading={false}
        portalMode={true}
      />
      <Environment preset="city" />
    </>
  );

  return (
    <group position={position}>
      {/* Portal Frame */}
      <mesh
        ref={portalRef}
        onClick={onEnter}
      >
        <roundedPlaneGeometry args={[2, 2.5, 0.15]} />
        <MeshPortalMaterial 
          ref={materialRef}
          blur={0}
          resolution={256}
          worldUnits={false}
        >
          <PortalScene />
        </MeshPortalMaterial>
      </mesh>

      {/* Only show UI elements when not in fullscreen */}
      {!isFullscreen && (
        <>
          <Text
            position={[-0.8, 1.0, 0.1]}
            fontSize={0.18}
            color="#FFFFFF"
            anchorX="left"
            anchorY="middle"
          >
            {formatDay(dayData.date, index)}
          </Text>

          <Text
            position={[0.8, 1.0, 0.1]}
            fontSize={0.15}
            color="#FFFFFF"
            anchorX="right"
            anchorY="middle"
          >
            {Math.round(dayData.day.maxtemp_f)}° / {Math.round(dayData.day.mintemp_f)}°
          </Text>

          <Text
            position={[-0.8, -1.0, 0.1]}
            fontSize={0.13}
            color="#FFFFFF"
            anchorX="left"
            anchorY="middle"
            maxWidth={1.6}
            textAlign="left"
          >
            {dayData.day.condition.text}
          </Text>

        </>
      )}
    </group>
  );
};

const ForecastPortals = ({ weatherData, isLoading, onPortalStateChange }) => {
  const [activePortal, setActivePortal] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { camera, gl, viewport } = useThree();
  const cameraTargetRef = useRef({ x: 0, y: 1, z: 8 });

  //Mobile-responsive scaling
  const isMobile = viewport.width < 6;
  const scale = isMobile ? 0.7 : 1;
  const spacing = isMobile ? 2.2 : 3;
  const mobileYPosition = isMobile ? 0.5 : -0.5; // Move portals up on mobile

  // Smooth camera animation when transitioning to portal mode
  useFrame((state, delta) => {
    // Only animate camera during the initial transition to portal mode
    if (activePortal !== null && !isFullscreen) {
      const target = cameraTargetRef.current;
      const distance = Math.abs(camera.position.x - target.x) + 
                      Math.abs(camera.position.y - target.y) + 
                      Math.abs(camera.position.z - target.z);
      
      // Stop animating when close to target, let OrbitControls take over
      if (distance > 0.1) {
        camera.position.x = THREE.MathUtils.lerp(camera.position.x, target.x, 0.05);
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, target.y, 0.05);
        camera.position.z = THREE.MathUtils.lerp(camera.position.z, target.z, 0.05);
      }
    }
  });

  if (isLoading || !weatherData?.forecast?.forecastday) {
    return null;
  }

  const forecastDays = weatherData.forecast.forecastday.slice(0, 3);

  const handleEnterPortal = (index) => {
    if (isFullscreen) return; // Prevent entering when already fullscreen
    
    setActivePortal(index);
    setIsFullscreen(true);
    
    // Notify parent component about portal state
    if (onPortalStateChange) {
      const dayData = forecastDays[index];
      onPortalStateChange(true, dayData);
    }
    
    // Set camera for fullscreen portal view
    cameraTargetRef.current = {
      x: 0, // Center the camera
      y: 0,
      z: 5
    };
  };

  const handleExitPortal = () => {
    setIsFullscreen(false);
    setActivePortal(null);
    
    // Notify parent component about portal state
    if (onPortalStateChange) {
      onPortalStateChange(false, null);
    }
    
    // Set camera target back to default position
    cameraTargetRef.current = { x: 0, y: 1, z: 8 };
  };

  return (
    <>
      <group position={[0, mobileYPosition, 0]} scale={[scale, scale, scale]}>
        {forecastDays.map((day, index) => (
          <ForecastPortal
            key={day.date}
            position={[-spacing + index * spacing, 0, 0]}
            dayData={day}
            index={index}
            isActive={activePortal === index}
            isFullscreen={isFullscreen}
            onEnter={() => handleEnterPortal(index)}
            onExit={handleExitPortal}
          />
        ))}
      </group>
      
    </>
  );
};

export default ForecastPortals;