import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

interface LogoProps {
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  style?: any;
}

const Logo: React.FC<LogoProps> = ({ size = 'medium', style }) => {
  const sizes = {
    small: 40,
    medium: 60,
    large: 100,
    xlarge: 150,
  };

  const logoSize = sizes[size];

  return (
    <View style={[styles.container, style]}>
      <Image
        source={require('../assets/images/logo.jpeg')}
        style={[styles.logo, { width: logoSize, height: logoSize }]}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    aspectRatio: 1,
  },
});

export default Logo;
