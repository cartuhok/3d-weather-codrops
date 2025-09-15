import React from 'react';
import { Clouds as DreiClouds, Cloud } from '@react-three/drei';
import * as THREE from 'three';

const Clouds = ({ intensity = 0.7, speed = 0.1, portalMode = false }) => {
  // Determine cloud colors based on weather condition
  const getCloudColors = () => {
      return {
        primary: '#FFFFFF',
        secondary: '#F8F8F8',
        tertiary: '#F0F0F0',
        light: '#FAFAFA',
        intensity: intensity
      };
  };

  const colors = getCloudColors();
  
  // Portal mode: show fewer, centered clouds for performance
  if (portalMode) {
    return (
      <group>
        <DreiClouds material={THREE.MeshLambertMaterial}>
          {/* Only 2 centered clouds for portal preview */}
          <Cloud
            segments={40}
            bounds={[8, 3, 3]}
            volume={8}
            color={colors.primary}
            fade={50}
            speed={speed}
            opacity={colors.intensity}
            position={[0, 4, -2]}
          />
          <Cloud
            segments={35}
            bounds={[6, 2.5, 2.5]}
            volume={6}
            color={colors.secondary}
            fade={60}
            speed={speed * 0.8}
            opacity={colors.intensity * 0.8}
            position={[2, 3, -3]}
          />
        </DreiClouds>
      </group>
    );
  }
  
  // Full cloud system for main scene and fullscreen portals
  return (
    <group>
      <DreiClouds material={THREE.MeshLambertMaterial}>
        {/* Large fluffy cloud cluster */}
        <Cloud
          segments={80}
          bounds={[12, 4, 4]}
          volume={15}
          color={colors.primary}
          fade={50}
          speed={speed}
          opacity={colors.intensity}
          position={[-5, 4, -2]}
        />
        <Cloud
          segments={70}
          bounds={[14, 3, 3]}
          volume={12}
          color={colors.secondary}
          fade={60}
          speed={speed * 0.7}
          opacity={colors.intensity * 0.9}
          position={[6, 3.5, -1]}
        />
        <Cloud
          segments={60}
          bounds={[10, 3, 3]}
          volume={10}
          color={colors.tertiary}
          fade={70}
          speed={speed * 1.1}
          opacity={colors.intensity * 0.8}
          position={[0, 5.5, -3]}
        />
        {/* Additional smaller fluffy clouds */}
        <Cloud
          segments={50}
          bounds={[8, 2.5, 2.5]}
          volume={8}
          color={colors.light}
          fade={80}
          speed={speed * 0.9}
          opacity={colors.intensity * 0.6}
          position={[-8, 3, -4]}
        />
        <Cloud
          segments={45}
          bounds={[6, 2, 2]}
          volume={6}
          color={colors.secondary}
          fade={90}
          speed={speed * 1.3}
          opacity={colors.intensity * 0.5}
          position={[8, 6, -2]}
        />
        <Cloud
          segments={55}
          bounds={[9, 2.5, 2.5]}
          volume={9}
          color={colors.tertiary}
          fade={75}
          speed={speed * 0.6}
          opacity={colors.intensity * 0.7}
          position={[-2, 2.5, -5]}
        />
      </DreiClouds>
    </group>
  );
};

export default Clouds;