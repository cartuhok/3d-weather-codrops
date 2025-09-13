import React, { useRef } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { Sphere } from '@react-three/drei';
import * as THREE from 'three';

const Sun = () => {
  const sunRef = useRef();
  
  const sunTexture = useLoader(THREE.TextureLoader, '/textures/sun_2k.jpg');
  
  useFrame((state) => {
    if (sunRef.current) {
      sunRef.current.rotation.y = state.clock.getElapsedTime() * 0.1;
    }
  });

  const sunMaterial = new THREE.MeshBasicMaterial({
    map: sunTexture,
  });

  return (
    <group position={[0, 4.5, 0]}>
      <Sphere ref={sunRef} args={[2, 32, 32]} material={sunMaterial} />
      
      {/* Sun lighting */}
      <pointLight position={[0, 0, 0]} intensity={2.5} color="#FFD700" distance={25} />
    </group>
  );
};

export default Sun;