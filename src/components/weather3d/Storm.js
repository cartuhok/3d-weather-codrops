import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Clouds as DreiClouds, Cloud } from '@react-three/drei';
import * as THREE from 'three';
import Rain from './Rain';

const Storm = () => {
  const cloudsRef = useRef();
  const lightningLightRef = useRef();
  const lightningActive = useRef(false);

  useFrame((state) => {
    // Lightning flash with ambient light
    if (Math.random() < 0.003 && !lightningActive.current) {
      lightningActive.current = true;
      
      if (lightningLightRef.current) {
        // Random X position for each flash
        const randomX = (Math.random() - 0.5) * 10; // Range: -5 to 5
        lightningLightRef.current.position.x = randomX;
        
        // Single bright flash
        lightningLightRef.current.intensity = 90;
        
        setTimeout(() => {
          if (lightningLightRef.current) lightningLightRef.current.intensity = 0;
          lightningActive.current = false;
        }, 400);
      }
    }
  });

  return (
    <group>
      <group ref={cloudsRef}>
        <DreiClouds material={THREE.MeshLambertMaterial}>
          <Cloud
            segments={60}
            bounds={[12, 3, 3]}
            volume={10}
            color="#8A8A8A"
            fade={100}
            speed={0.2}
            opacity={0.8}
            position={[-3, 4, -2]}
          />
          <Cloud
            segments={60}
            bounds={[12, 3, 3]}
            volume={10}
            color="#9A9A9A"
            fade={100}
            speed={0.15}
            opacity={0.7}
            position={[3, 3, -1]}
          />
          <Cloud
            segments={60}
            bounds={[10, 3, 3]}
            volume={10}
            color="#7A7A7A"
            fade={100}
            speed={0.25}
            opacity={0.9}
            position={[0, 5, -3]}
          />
          <Cloud
            segments={60}
            bounds={[8, 2, 2]}
            volume={10}
            color="#8A8A8A"
            fade={80}
            speed={0.18}
            opacity={0.6}
            position={[-4, 3, -4]}
          />
          <Cloud
            segments={60}
            bounds={[9, 2, 2]}
            volume={10}
            color="#9A9A9A"
            fade={80}
            speed={0.22}
            opacity={0.7}
            position={[4, 4, -2]}
          />
          <Cloud
            segments={60}
            bounds={[6, 2, 2]}
            volume={10}
            color="#858585"
            fade={60}
            speed={0.16}
            opacity={0.5}
            position={[2, 6, -5]}
          />
          <Cloud
            segments={60}
            bounds={[10, 3, 3]}
            volume={10}
            color="#777777"
            fade={70}
            speed={0.14}
            opacity={0.6}
            position={[-5, 7, -3]}
          />
          <Cloud
            segments={60}
            bounds={[9, 2.5, 2.5]}
            volume={10}
            color="#888888"
            fade={75}
            speed={0.19}
            opacity={0.7}
            position={[5, 7.5, -4]}
          />
          <Cloud
            segments={60}
            bounds={[8, 2.5, 2.5]}
            volume={10}
            color="#7A7A7A"
            fade={65}
            speed={0.17}
            opacity={0.65}
            position={[0, 7, -3.5]}
          />
        </DreiClouds>
      </group>
      
      <Rain count={1500} />
      
      <pointLight 
        ref={lightningLightRef}
        position={[0, 6, -5.5]}
        intensity={0}
        color="#e6d8b3"
        distance={30}
        decay={0.8}
        castShadow
      />
    </group>
  );
};

export default Storm;