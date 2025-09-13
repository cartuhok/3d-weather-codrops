import React, { useRef } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { Sphere } from '@react-three/drei';
import * as THREE from 'three';

const Moon = () => {
  const moonRef = useRef();
  
  const moonTexture = useLoader(THREE.TextureLoader, '/textures/moon_2k.jpg');

  useFrame((state) => {
    if (moonRef.current) {
      moonRef.current.rotation.y = state.clock.getElapsedTime() * 0.1;
    }
  });

  const moonMaterial = new THREE.MeshLambertMaterial({
    map: moonTexture,
    emissive: '#111111',
    emissiveIntensity: 0.5,
  });


  return (
    <group position={[0, 4.5, 0]}>
      <Sphere ref={moonRef} args={[2, 32, 32]} material={moonMaterial} />
      
      
      {/* Soft moonlight */}
      <pointLight position={[0, 0, 5]} intensity={2} color="#E6E6FA" />
    </group>
  );
};

export default Moon;