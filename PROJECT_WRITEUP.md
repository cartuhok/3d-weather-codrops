# Creating an Immersive 3D Weather Visualization with React Three Fiber

*Building a real-time 3D weather with particle systems, clouds, and lightning*

**Tags:** 3D, React Three Fiber, Three.js, WebGL, Particle Systems, Weather API

---

I've always been interested in data visualization using three.js / R3F and I thought a weather webapp would be the perfect place to start. One of my favorite open-source library's, @react-three/drei, already has a bunch of great tools like clouds, sky, and stars that fit perfectly into visualizing the weather in 3D. This tutorial explores how to transform API data into a 3D experience, where we add a little flare and fun to weather visulization.

## The Technology Stack

Our weather world is built on a foundation of some of my favorite technologies:

- **React Three Fiber** - The React renderer for Three.js
- **@react-three/drei** - Essential helpers like the ones I mentioned above
- **R3F-Ultimate-Lens-Flare** - A lens flare system by one of my favorite devs Anderson Mancini
- **WeatherAPI.com** - Real-time meteorological data

## Weather Components

The heart of our visualization lies in conditionally showing a realistic sun, moon, and/or clouds based on the weather results from your city or a city you search for, particles that simulate rain or snow, day/night logic, and some fun lighting effects during a thunderstorm. We'll start by building these weather components and then move to displaying them based on the result of the WeatherAPI call. 

## Sun + Moon Implimentation 

Lets start simple, we'll display create a sun and moon component that's just a sphere with a realistic texture wrapped around it. We'll give it a little rotation and some lighting. 

```javascript
// Sun.js and Moon.js Component, a texture wrapped sphere
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
```
I grabbed the CC0 texture from https://www.solarsystemscope.com/textures/ The moon component is essentially the same, I used https://commons.wikimedia.org/wiki/File:Moon_texture.jpg the texture here. The pointlight intensity is low because the majority of our lighting will come from our sky.

### Rain: Instanced Cylinders

Next, lets create a rain paticle effect. To keep things performant, we're going to use instancedMesh instead of creating a separate mesh component for each rain particle.  We'll render a single geometry (<cylinderGeometry>) multiple times with different transformations (position, rotation, scale).  Also, instead of creating a new THREE.Object3D for each particle in every frame, we'll reuse a single dummy object. This saves memory and prevents the overhead of creating and garbage collecting a large number of temporary objects within the animation loop. We'll also use the useMemo hook to create and initialize the particles array only once when the component mounts.

```javascript
// Rain.js - instanced rendering
const Rain = ({ count = 1000 }) => {
  const meshRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      temp.push({
        x: (Math.random() - 0.5) * 20,
        y: Math.random() * 20 + 10,
        z: (Math.random() - 0.5) * 20,
        speed: Math.random() * 0.1 + 0.05,
      });
    }
    return temp;
  }, [count]);

  useFrame(() => {
    particles.forEach((particle, i) => {
      particle.y -= particle.speed;
      if (particle.y < -1) {
        particle.y = 20; // Reset to top
      }

      dummy.position.set(particle.x, particle.y, particle.z);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, count]}>
      <cylinderGeometry args={[0.01, 0.01, 0.5, 8]} />
      <meshBasicMaterial color="#87CEEB" transparent opacity={0.6} />
    </instancedMesh>
  );
};
```

When a particle reaches the ground level, it's immediately recycled to the top of the scene with a new random horizontal position, creating the illusion of continuous rainfall without constantly creating new objects.

### Snow: Physics-Based Tumbling

We'll use the same basic template for the snow effect but instead of the particles falling straight down we'll give it some drift. 

```javascript
// Snow.js - Realistic drift and tumbling with time-based rotation
useFrame((state) => {
  particles.forEach((particle, i) => {
    particle.y -= particle.speed;
    particle.x += Math.sin(state.clock.elapsedTime + i) * particle.drift;
    
    if (particle.y < -1) {
      particle.y = 20;
      particle.x = (Math.random() - 0.5) * 20;
    }

    dummy.position.set(particle.x, particle.y, particle.z);
    // Time-based tumbling rotation for natural snowflake movement
    dummy.rotation.x = state.clock.elapsedTime * 2;
    dummy.rotation.y = state.clock.elapsedTime * 3;
    dummy.updateMatrix();
    meshRef.current.setMatrixAt(i, dummy.matrix);
  });
  meshRef.current.instanceMatrix.needsUpdate = true;
});
```

The horizontal drift uses `Math.sin(state.clock.elapsedTime + i)` where `state.clock.elapsedTime` provides a continuously increasing time value and `i` offsets each particle's timing. This creates a natural swaying motion where each snowflake follows its own path. The rotation updates apply small increments to both X and Y axes, creating the tumbling effect.

### Storm System: Multi-Component Weather Events

When a storm rolls in, I wanted to simulate dark brooding clouds and flashes of lightning.  This effect require combining multiple weather effects simultaneously.  We'll import our rain component, add some clouds and impliment a lightning effect with a pointLight that will simulate flashes of lighting coming from inside the clouds. 

```javascript
// Storm.js
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
        {/* Additional cloud configurations... */}
      </DreiClouds>
      
      {/* Heavy rain - 1500 particles */}
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
```

The lightning system uses a simple ref-based cooldown mechanism to prevent constant flashing. When lightning triggers, it creates a single bright flash with random positioning. The system uses `setTimeout` to reset the light intensity after 400ms, creating a realistic lightning effect without complex multi-stage sequences.

### Clouds: Drei Cloud

For weather types like cloudy, partly cloudy, overcast, foggy, rainy, snowy and mist we'll pull in our clouds coponent. I wanted the stormy component to have it's own clouds because they should retrun darker clouds than the other conditions above. The clouds component will simply display Drei cloulds and we'll pull it all together with the sun or moon component in the next section. 

```javascript
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
        {/* Additional clouds... */}
      </DreiClouds>
    </group>
  );
};
```

## API-Driven Logic, Putting It All Together

Now that we've built our weather components, we need a system to decide which ones to display based on real weather data. The WeatherAPI.com service provides detailed current conditions that we'll transform into our 3D scene parameters. The API gives us condition text like "Partly cloudy", "Thunderstorm", or "Light snow", but we need to convert these into our component types.

```javascript
// weatherService.js - Fetching real weather data
const response = await axios.get(
  `${WEATHER_API_BASE}/forecast.json?key=${API_KEY}&q=${location}&days=3&aqi=no&alerts=no&tz=${Intl.DateTimeFormat().resolvedOptions().timeZone}`,
  { timeout: 10000 }
);
```

The API request includes timezone information so we can accurately determine day/night for our Sun/Moon system. The `days=3` parameter grabs forecast data for our portal feature, while `aqi=no&alerts=no` keeps the payload lean by excluding data we don't need.

### Converting API Conditions to Component Types

The heart of our system is a simple parsing function that maps hundreds of possible weather descriptions to our manageable set of visual components:

```javascript
// weatherService.js - Converting weather text to renderable types
export const getWeatherConditionType = (condition) => {
  const conditionLower = condition.toLowerCase();

  if (conditionLower.includes('sunny') || conditionLower.includes('clear')) {
    return 'sunny';
  }
  if (conditionLower.includes('thunder') || conditionLower.includes('storm')) {
    return 'stormy';
  }
  if (conditionLower.includes('cloud') || conditionLower.includes('overcast')) {
    return 'cloudy';
  }
  if (conditionLower.includes('rain') || conditionLower.includes('drizzle')) {
    return 'rainy';
  }
  if (conditionLower.includes('snow') || conditionLower.includes('blizzard')) {
    return 'snowy';
  }
  // ... additional fog and mist conditions
  return 'cloudy';
};
```

This string matching approach handles edge cases gracefully - whether the API returns "Light rain", "Heavy rain", or "Patchy light drizzle", they all map to our `rainy` type and trigger the appropriate 3D effects.

### Conditional Component Rendering

The magic happens in our `WeatherVisualization` component, where the parsed weather type determines exactly which 3D components to render:

```javascript
// WeatherVisualization.js - Bringing weather data to life
const renderWeatherEffect = () => {
  if (weatherType === 'sunny') {
    if (partlyCloudy) {
      return (
        <>
          {isNight ? <Moon /> : <Sun />}
          <Clouds intensity={0.5} speed={0.1} />
        </>
      );
    }
    return isNight ? <Moon /> : <Sun />;
  } else if (weatherType === 'rainy') {
    return (
      <>
        <Clouds intensity={0.8} speed={0.15} />
        <Rain count={800} />
      </>
    );
  } else if (weatherType === 'stormy') {
    return <Storm />; // Includes its own clouds, rain, and lightning
  }
  // ... additional weather types
};
```

This conditional system ensures we only load the particle systems we actually need. A sunny day renders just our Sun component, while a storm loads our complete Storm system with heavy rain, dark clouds, and lightning effects. Each weather type gets its own combination of the components we built earlier, creating distinct visual experiences that match the real weather conditions.


## Dynamic Time-of-Day System

Weather isn't just about conditions - it's also about timing. Our weather components need to know whether to show the sun or moon, and we need to configure Drei's Sky component to render the appropriate atmospheric colors for the current time of day. Fortunately, our WeatherAPI response already includes the local time for any location, so we can extract that to drive our day/night logic.

### Extracting Time from Weather Data

The API provides local time in a simple format that we can parse to determine the current period:

```javascript
// Scene3D.js - Parsing time from weather API data
const getTimeOfDay = () => {
  if (!weatherData?.location?.localtime) return 'day';
  const localTime = weatherData.location.localtime;
  const currentHour = new Date(localTime).getHours();

  if (currentHour >= 19 || currentHour <= 6) return 'night';
  if (currentHour >= 6 && currentHour < 8) return 'dawn';
  if (currentHour >= 17 && currentHour < 19) return 'dusk';
  return 'day';
};
```

This gives us four distinct time periods, each requiring different lighting and sky configurations. Now we can use these periods to configure Drei's Sky component, which handles atmospheric scattering and generates realistic sky colors automatically.

### Dynamic Sky Configuration

Drei's Sky component is fantastic because it simulates actual atmospheric physics - we just need to position the sun correctly and adjust atmospheric parameters for each time period:

```javascript
// Scene3D.js - Time-responsive Sky configuration
{timeOfDay !== 'night' && (
  <Sky
    sunPosition={(() => {
      if (timeOfDay === 'dawn') {
        return [100, -5, 100]; // Sun below horizon for darker dawn colors
      } else if (timeOfDay === 'dusk') {
        return [-100, -5, 100]; // Sun below horizon for sunset colors
      } else { // day
        return [100, 20, 100]; // High sun position for bright daylight
      }
    })()}
    inclination={(() => {
      if (timeOfDay === 'dawn' || timeOfDay === 'dusk') {
        return 0.6; // Medium inclination for transitional periods
      } else { // day
        return 0.9; // High inclination for clear daytime sky
      }
    })()}
    turbidity={(() => {
      if (timeOfDay === 'dawn' || timeOfDay === 'dusk') {
        return 8; // Higher turbidity creates warm sunrise/sunset colors
      } else { // day
        return 2; // Lower turbidity for clear blue sky
      }
    })()}
  />
)}
```

The magic happens in the positioning - during dawn and dusk, we place the sun just below the horizon (`-5` Y position) so Drei's Sky component generates those warm orange and pink colors we associate with sunrise and sunset. The turbidity parameter controls atmospheric scattering, with higher values creating more dramatic color effects during transitional periods.

### Nighttime: Simple Black Background + Stars

For nighttime, I made a deliberate choice to skip Drei's Sky component entirely and use a simple black background instead. The Sky component is computationally expensive, and for nighttime scenes, a pure black backdrop actually looks better and performs significantly faster. We complement this with Drei's Stars component for that authentic nighttime atmosphere:

```javascript
// Scene3D.js - Efficient nighttime rendering
{!portalMode && isNight && <SceneBackground backgroundColor={'#000000'} />}

{/* Stars create the nighttime atmosphere */}
{isNight && (
  <Stars
    radius={100}
    depth={50}
    count={5000}
    factor={4}
    saturation={0}
    fade
    speed={1}
  />
)}
```

Drei's Stars component creates 5,000 individual stars scattered across a 100-unit sphere with realistic depth variation. The `saturation={0}` keeps them properly desaturated for authentic nighttime visibility, while the gentle `speed={1}` creates subtle movement that simulates the natural motion of celestial bodies. Stars only appear during nighttime hours (7 PM to 6 AM) and automatically disappear at dawn, creating a smooth transition back to Drei's daytime Sky component.

This approach gives us four distinct atmospheric moods - bright daylight, warm dawn colors, golden dusk tones, and star-filled nights - all driven automatically by the real local time from our weather data.

## Forecast Portals: Windows Into Tomorrow's Weather

Like any good weather app, we don't want to just show current conditions but also what's coming next. Our API returns a three-day forecast that we transform into three interactive portals hovering in the 3D scene, each one showing a preview of that day's weather conditions. Click on a portal and you're transported into that day's atmospheric environment.

### Building Portals with MeshPortalMaterial

The portals use Drei's `MeshPortalMaterial`, which renders a complete 3D scene to a texture that gets mapped onto a plane. Each portal becomes a window into its own weather world:

```javascript
// ForecastPortals.js - Creating interactive weather portals
const ForecastPortal = ({ position, dayData, index, onEnter }) => {
  const materialRef = useRef();

  // Transform forecast API data into our weather component format
  const portalWeatherData = useMemo(() => ({
    current: {
      temp_f: dayData.day.maxtemp_f,
      condition: dayData.day.condition,
      is_day: 1, // Force daytime for consistent portal lighting
      humidity: dayData.day.avghumidity,
      wind_mph: dayData.day.maxwind_mph,
    },
    location: {
      localtime: dayData.date + 'T12:00' // Set to noon for optimal lighting
    }
  }), [dayData]);

  return (
    <group position={position}>
      <mesh onClick={onEnter}>
        <roundedPlaneGeometry args={[2, 2.5, 0.15]} />
        <MeshPortalMaterial
          ref={materialRef}
          blur={0}
          resolution={256}
          worldUnits={false}
        >
          {/* Each portal renders a complete weather scene */}
          <color attach="background" args={['#87CEEB']} />
          <ambientLight intensity={0.4} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <WeatherVisualization
            weatherData={portalWeatherData}
            isLoading={false}
            portalMode={true}
          />
        </MeshPortalMaterial>
      </mesh>

      {/* Weather info overlay */}
      <Text position={[-0.8, 1.0, 0.1]} fontSize={0.18} color="#FFFFFF">
        {formatDay(dayData.date, index)}
      </Text>
      <Text position={[0.8, 1.0, 0.1]} fontSize={0.15} color="#FFFFFF">
        {Math.round(dayData.day.maxtemp_f)}° / {Math.round(dayData.day.mintemp_f)}°
      </Text>
      <Text position={[-0.8, -1.0, 0.1]} fontSize={0.13} color="#FFFFFF">
        {dayData.day.condition.text}
      </Text>
    </group>
  );
};
```

The `roundedPlaneGeometry` from the maath library gives our portals those smooth, organic edges instead of sharp rectangles. The `[2, 2.5, 0.15]` parameters create a 2×2.5 unit portal with 0.15 radius corners - just enough rounding to feel modern without looking like a button.

### Interactive States and Animations

Portals aren't just static windows - they respond to user interaction with smooth state transitions. The system tracks three states: inactive, active (hovered), and fullscreen (clicked):

```javascript
// ForecastPortals.js - State management and blend animations
const ForecastPortal = ({ position, dayData, isActive, isFullscreen, onEnter }) => {
  const materialRef = useRef();

  useFrame(() => {
    if (materialRef.current) {
      // Smooth blend animation based on interaction state
      const targetBlend = isFullscreen ? 1 : (isActive ? 0.5 : 0);
      materialRef.current.blend = THREE.MathUtils.lerp(
        materialRef.current.blend || 0,
        targetBlend,
        0.1
      );
    }
  });

  // Portal content and UI elements hidden in fullscreen mode
  return (
    <group position={position}>
      {/* Portal mesh */}

      {!isFullscreen && (
        <>
          {/* Temperature and condition text only show in preview mode */}
          <Text position={[-0.8, 1.0, 0.1]} fontSize={0.18} color="#FFFFFF">
            {formatDay(dayData.date, index)}
          </Text>
        </>
      )}
    </group>
  );
};
```

The `blend` property controls how much the portal takes over your view. At 0 (inactive), you see the portal as a window. At 0.5 (hovered), it starts to immerse you. At 1 (fullscreen), you're completely inside that day's weather environment. The `THREE.MathUtils.lerp` creates buttery smooth transitions between these states.

### Fullscreen Portal Experience

When you click a portal, the magic really happens. The system hides all UI text overlays and gradually blends the portal's weather scene to fill your entire view. Instead of looking at tomorrow's weather through a window, you're standing inside it:

```javascript
// Scene3D.js - Fullscreen portal handling
const handlePortalStateChange = (isPortalActive, dayData) => {
  setPortalMode(isPortalActive);
  if (isPortalActive && dayData) {
    // Create immersive weather environment for the selected day
    const portalData = {
      current: {
        temp_f: dayData.day.maxtemp_f,
        condition: dayData.day.condition,
        is_day: 1,
        humidity: dayData.day.avghumidity,
      },
      location: { localtime: dayData.date + 'T12:00' }
    };
    setPortalWeatherData(portalData);
  }
};
```

In fullscreen mode, the portal weather data drives the entire scene - the Sky component, lighting, and all weather effects now represent that forecasted day. You can orbit around inside tomorrow's storm or bask in the gentle sunlight of the day after. When you exit (click outside the portal), the system smoothly transitions back to the current weather conditions.

The key insight is that each portal runs our same `WeatherVisualization` component but with forecast data instead of current conditions. The `portalMode={true}` prop optimizes the components for smaller render targets - fewer particles, simpler clouds, but the same conditional logic we built earlier.

Now that we've introduced portals, we need to update our weather components to support this optimization. Going back to our conditional rendering examples, we add the `portalMode` prop:

```javascript
// WeatherVisualization.js - Updated with portal support
if (weatherType === 'rainy') {
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
}
```

And our Clouds component gets updated to render fewer, simpler clouds in portal mode:

```javascript
// Clouds.js - Portal optimization
const Clouds = ({ intensity = 0.7, speed = 0.1, portalMode = false }) => {
  if (portalMode) {
    return (
      <DreiClouds material={THREE.MeshLambertMaterial}>
        {/* Only 2 centered clouds for portal preview */}
        <Cloud segments={40} bounds={[8, 3, 3]} volume={8} position={[0, 4, -2]} />
        <Cloud segments={35} bounds={[6, 2.5, 2.5]} volume={6} position={[2, 3, -3]} />
      </DreiClouds>
    );
  }
  // Full cloud system for main scene (6+ detailed clouds)
  return <group>{/* ... full cloud configuration ... */}</group>;
};
```

This dramatically reduces both particle counts (87.5% fewer rain particles) and cloud complexity (67% reduction from 6 detailed clouds to 2 centered clouds), ensuring smooth performance when multiple portals show weather effects simultaneously.

### Integration with Scene3D

The portals are positioned and managed in our main `Scene3D` component, where they complement the current weather visualization:

```javascript
// Scene3D.js - Portal integration
<>
  {/* Current weather in the main scene */}
  <WeatherVisualization
    weatherData={weatherData}
    isLoading={isLoading}
  />

  {/* Three-day forecast portals */}
  <ForecastPortals
    weatherData={weatherData}
    isLoading={isLoading}
    onPortalStateChange={handlePortalStateChange}
  />
</>
```

When you click a portal, the entire scene transitions to fullscreen mode showing that day's weather in complete detail. The portal system tracks active states and handles smooth transitions between preview and immersive modes, creating a seamless way to explore future weather conditions alongside the current atmospheric environment.

The portals transform static forecast numbers into explorable 3D environments - instead of reading "Tomorrow: 75°, Partly Cloudy", you see and feel the gentle drift of cumulus clouds with warm sunlight filtering through.






## Adding Cinematic Lens Flares

Our Sun component looks great, but to really make it feel cinematic, I wanted to implement a subtle lens flare effect. For this, I'm using the R3F-Ultimate-Lens-Flare library (https://git hub.com/ektogamat/R3F-Ultimate-Lens-Flare), which I installed manually following the repository's instructions. While lens flares typically work best with distant sun objects rather than our close-up approach, I think it adds a nice cinematic touch to the scene.

### Implementing Weather-Responsive Lens Flares

The lens flare system needs to be smart about when to appear. Just like our weather components, it should only show when it makes meteorological sense:

```javascript
// Scene3D.js - Conditional lens flare rendering
const PostProcessingEffects = ({ showLensFlare }) => {
  if (!showLensFlare) return null;

  return (
    <EffectComposer>
      <UltimateLensFlare
        position={[0, 5, 0]} // Positioned near our Sun component at [0, 4.5, 0]
        opacity={1.00}
        glareSize={1.68}
        starPoints={2}
        animated={false}
        flareShape={0.81}
        flareSize={1.68}
        secondaryGhosts={true}
        ghostScale={0.03}
        aditionalStreaks={true}
        haloScale={3.88}
      />
      <Bloom intensity={0.3} threshold={0.9} />
    </EffectComposer>
  );
};
```

The key parameters create a realistic lens flare effect: `glareSize` and `flareSize` both at 1.68 give prominent but not overwhelming flares, while `ghostScale={0.03}` adds subtle lens reflection artifacts. The `haloScale={3.88}` creates that large atmospheric glow around the sun.

### Smart Visibility Logic

The lens flare connects to our weather system through a visibility function that determines when the sun should be visible:

```javascript
// weatherService.js - When should we show lens flares?
export const shouldShowSun = (weatherData) => {
  if (!weatherData?.current?.condition) return true;
  const condition = weatherData.current.condition.text.toLowerCase();

  // Hide lens flare when weather obscures the sun
  if (condition.includes('overcast') ||
      condition.includes('rain') ||
      condition.includes('storm') ||
      condition.includes('snow')) {
    return false;
  }

  return true; // Show for clear, sunny, partly cloudy conditions
};

// Scene3D.js - Combining weather and time conditions
const showLensFlare = useMemo(() => {
  if (isNight || !weatherData) return false;
  return shouldShowSun(weatherData);
}, [isNight, weatherData]);
```

This creates realistic behavior where lens flares only appear during daytime clear weather. During storms or overcast conditions, the sun (and its lens flare) gets hidden by clouds, just like in real life.

### Portal Integration

The lens flare system also adapts to our portal system. When portals are active, we use different positioning to ensure the effect looks good in both the main scene and within portal previews:

```javascript
// Scene3D.js - Portal-aware lens flare positioning
<PostProcessingEffects
  showLensFlare={portalMode ? showPortalLensFlare : showLensFlare}
  isPortalMode={portalMode}
/>
```

The lens flare becomes another layer of our weather-responsive system, automatically appearing and disappearing based on real weather conditions and time of day, making the sun feel like a proper light source rather than just a textured sphere.



## Performance Optimizations

With all our 3D weather components working together, performance becomes crucial - especially on mobile devices. We're rendering thousands of particles, multiple cloud systems, and interactive portals simultaneously. The optimization strategy uses several techniques we've mentioned throughout this article.

### Core Rendering Optimizations

As mentioned above, all our particle systems use **instanced rendering** to draw thousands of raindrops or snowflakes in single GPU calls. **Conditional rendering** ensures we only load the weather effects we actually need - no rain particles during sunny weather, no lens flares during storms. And **memoization** prevents expensive calculations from running on every frame:

```javascript
// Sun.js & Moon.js - Frame-rate independent animation
useFrame((state) => {
  if (sunRef.current) {
    sunRef.current.rotation.y = state.clock.getElapsedTime() * 0.1;
  }
});
```

Using absolute time values instead of frame deltas ensures smooth celestial movement regardless of device performance.

### Portal Performance Tuning

The most significant optimization comes from our portal system's adaptive rendering. When multiple forecast portals show precipitation simultaneously, we dramatically reduce particle counts:

```javascript
// WeatherVisualization.js - Smart particle scaling
{weatherType === 'rainy' && <Rain count={portalMode ? 100 : 800} />}
{weatherType === 'snowy' && <Snow count={portalMode ? 50 : 400} />}
```

This prevents the nightmare scenario of rendering 4 × 800 = 3,200 rain particles when all portals show rain. Instead, we get 800 + (3 × 100) = 1,100 total particles while maintaining the visual effect.

## API Reliability and Caching

Beyond 3D performance, we need the app to work reliably even when the weather API is slow, down, or rate-limited. The system implements smart caching and graceful degradation to keep the experience smooth.

### Intelligent Caching

Rather than hitting the API for every request, we cache weather responses for 10 minutes:

```javascript
// api/weather.js - Simple but effective caching
const cache = new Map();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

const cacheKey = `weather:${location.toLowerCase()}`;
const cachedData = cache.get(cacheKey);

if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
  return res.json({ ...cachedData.data, cached: true });
}
```

This gives users instant responses for recently searched locations and keeps the app responsive during API slowdowns.

### Rate Limiting and Fallback

When users exceed our 20 requests per hour limit, the system smoothly switches to demo data instead of showing errors:

```javascript
// weatherService.js - Graceful degradation
if (error.response?.status === 429) {
  console.log('Too many requests');
  return getDemoWeatherData(location);
}
```

The demo data includes time-aware day/night detection, so even the fallback experience shows proper lighting and sky colors based on the user's local time.

## Conclusion

This weather visualization demonstrates how modern web technologies can create compelling, data-driven experiences that merge utility with artistic expression. We've transformed the humble weather forecast from static numbers into an immersive journey through atmospheric phenomena—where users don't just check the weather, they step inside it.

By combining React Three Fiber's declarative approach with advanced WebGL techniques, we've created a living world where every raindrop tells the story of a storm system hundreds of miles away, where lens flares dance with the intensity of real sunlight, and where tomorrow's weather lives behind shimmering portals waiting to be explored.

The project showcases several cutting-edge web graphics techniques:
- **Instanced particle systems** that render thousands of raindrops and snowflakes without compromising performance
- **Sophisticated atmospheric effects** using Three.js and Drei components for realistic lighting
- **Render-to-texture portals** that provide seamless transitions between different weather states
- **Real-time occlusion detection** that makes lens flares respond naturally to clouds and weather patterns
- **API-driven procedural generation** that transforms meteorological data into living 3D landscapes

The result is more than a weather app—it's a window into a living, breathing digital world where the boundary between data visualization and immersive experience dissolves, creating something that feels less like checking the weather and more like stepping through a portal into tomorrow's sky.

---

**Demo**: [Live Demo](#) | **Code**: [GitHub Repository](#)

*Built with React Three Fiber • Three.js • WebGL*