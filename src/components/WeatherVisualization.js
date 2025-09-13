import React from 'react';
import { getWeatherConditionType, shouldShowSun, isPartlyCloudy } from '../services/weatherService';
import Sun from './weather3d/Sun';
import Moon from './weather3d/Moon';
import Clouds from './weather3d/Clouds';
import Rain from './weather3d/Rain';
import Snow from './weather3d/Snow';
import Storm from './weather3d/Storm';
import { Text } from '@react-three/drei';

const WeatherVisualization = ({ weatherData, isLoading, portalMode = false }) => {

  // Check if it's nighttime based on local time
  const isNightTime = () => {
    if (!weatherData?.location?.localtime) return false;
    const localTime = weatherData.location.localtime;
    const currentHour = new Date(localTime).getHours();
    return currentHour >= 19 || currentHour <= 6; // 7 PM to 6 AM is night
  };
  
  const isNight = isNightTime();
  const currentCondition = weatherData?.current?.condition?.text;
  const weatherType = currentCondition ? getWeatherConditionType(currentCondition) : null;


  if (isLoading || !weatherData) {
    return null;
  }

  const renderWeatherEffect = () => {
    const partlyCloudy = isPartlyCloudy(currentCondition);
    
    if (weatherType === 'sunny') {
      if (partlyCloudy) {
        return (
          <>
            {isNight ? <Moon /> : <Sun />}
            <Clouds intensity={0.5} speed={0.1} isPartlyCloudy={true} portalMode={portalMode} />
          </>
        );
      }
      return isNight ? <Moon /> : <Sun />;
    } else if (weatherType === 'cloudy') {
      if (partlyCloudy) {
        return (
          <>
            {isNight ? <Moon /> : <Sun />}
            <Clouds intensity={0.6} speed={0.1} isPartlyCloudy={true} portalMode={portalMode} />
          </>
        );
      }
      return (
        <Clouds intensity={0.8} speed={0.1} isPartlyCloudy={false} portalMode={portalMode} />
      );
    } else if (weatherType === 'rainy') {
      return (
        <>
          <Clouds intensity={0.8} speed={0.15} portalMode={portalMode} />
          <Rain count={portalMode ? 100 : 800} />
        </>
      );
    } else if (weatherType === 'snowy') {
      return (
        <>
          <Clouds intensity={0.6} speed={0.05} portalMode={portalMode} />
          <Snow count={portalMode ? 50 : 400} />
        </>
      );
    } else if (weatherType === 'stormy') {
      return <Storm />;
    } else if (weatherType === 'foggy') {
      return <Clouds intensity={0.9} speed={0.05} portalMode={portalMode} />;
    } else {
      if (partlyCloudy) {
        return (
          <>
            {isNight ? <Moon /> : <Sun />}
            <Clouds intensity={0.5} speed={0.1} isPartlyCloudy={true} portalMode={portalMode} />
          </>
        );
      }
      return isNight ? <Moon /> : <Sun />;
    }
  };

  return (
    <group 
      scale={portalMode ? 0.4 : 1} 
      position={portalMode ? [0, -1.8, 0] : [0, 0, 0]}
    >
      {renderWeatherEffect()}
      
      {!portalMode && (
        <Text
          position={[0, 2, 0]}
          fontSize={0.5}
          color={isNight ? "#FFFFFF" : "#333333"}
          anchorX="center"
          anchorY="middle"
        >
          {currentCondition}
        </Text>
      )}
    </group>
  );
};

export default WeatherVisualization;