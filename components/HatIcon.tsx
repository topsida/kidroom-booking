import { Image } from 'react-native';

export function HatIcon({ size = 28 }: { size?: number }) {
  return (
    <Image
      source={require('../assets/adaptive-icon.png')}
      style={{ width: size, height: size }}
      resizeMode="contain"
    />
  );
}
