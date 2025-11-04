import { useState, useEffect } from 'react';

export interface ResponsiveConfig {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  width: number;
  height: number;
  isPortrait: boolean;
  isLandscape: boolean;
  isLowEndDevice: boolean;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  cameraFOV: number;
  particleCount: number;
  modelScale: [number, number, number];
  pixelRatio: number;
  isIOS: boolean;
  isAndroid: boolean;
}

export function useResponsive(): ResponsiveConfig {
  const [config, setConfig] = useState<ResponsiveConfig>(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const isMobile = width < 768;
    const isTablet = width >= 768 && width < 1024;
    const isDesktop = width >= 1024;
    const isPortrait = height > width;
    const isLandscape = width > height;
    const isLowEndDevice = navigator.hardwareConcurrency ? navigator.hardwareConcurrency <= 4 : false;
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);

    // Dynamic device type
    let deviceType: 'mobile' | 'tablet' | 'desktop';
    if (isMobile) deviceType = 'mobile';
    else if (isTablet) deviceType = 'tablet';
    else deviceType = 'desktop';

    // Dynamic camera FOV based on device and orientation
    let cameraFOV: number;
    if (isMobile && isPortrait) cameraFOV = 75;
    else if (isMobile && isLandscape) cameraFOV = 60;
    else if (isTablet) cameraFOV = 60;
    else cameraFOV = 55;

    // Dynamic particle count based on performance
    let particleCount: number;
    if (isMobile) particleCount = 500;
    else if (isLowEndDevice) particleCount = 1000;
    else particleCount = 2000;

    // Dynamic model scale
    let modelScale: [number, number, number];
    if (isMobile) modelScale = [1.5, 1.5, 1.5];
    else modelScale = [2, 2, 2];

    // Pixel ratio optimization
    const pixelRatio = Math.min(window.devicePixelRatio, 2);

    return {
      isMobile,
      isTablet,
      isDesktop,
      width,
      height,
      isPortrait,
      isLandscape,
      isLowEndDevice,
      deviceType,
      cameraFOV,
      particleCount,
      modelScale,
      pixelRatio,
      isIOS,
      isAndroid,
    };
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isMobile = width < 768;
      const isTablet = width >= 768 && width < 1024;
      const isDesktop = width >= 1024;
      const isPortrait = height > width;
      const isLandscape = width > height;
      const isLowEndDevice = navigator.hardwareConcurrency ? navigator.hardwareConcurrency <= 4 : false;
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isAndroid = /Android/.test(navigator.userAgent);

      let deviceType: 'mobile' | 'tablet' | 'desktop';
      if (isMobile) deviceType = 'mobile';
      else if (isTablet) deviceType = 'tablet';
      else deviceType = 'desktop';

      let cameraFOV: number;
      if (isMobile && isPortrait) cameraFOV = 75;
      else if (isMobile && isLandscape) cameraFOV = 60;
      else if (isTablet) cameraFOV = 60;
      else cameraFOV = 55;

      let particleCount: number;
      if (isMobile) particleCount = 500;
      else if (isLowEndDevice) particleCount = 1000;
      else particleCount = 2000;

      let modelScale: [number, number, number];
      if (isMobile) modelScale = [1.5, 1.5, 1.5];
      else modelScale = [2, 2, 2];

      const pixelRatio = Math.min(window.devicePixelRatio, 2);

      setConfig({
        isMobile,
        isTablet,
        isDesktop,
        width,
        height,
        isPortrait,
        isLandscape,
        isLowEndDevice,
        deviceType,
        cameraFOV,
        particleCount,
        modelScale,
        pixelRatio,
        isIOS,
        isAndroid,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Prevent elastic scrolling on iOS
  useEffect(() => {
    if (config.isIOS) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.height = '100%';
    }
  }, [config.isIOS]);

  return config;
}
