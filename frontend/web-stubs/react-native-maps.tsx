/**
 * Web-only stub for `react-native-maps`.
 *
 * `react-native-maps` relies on `codegenNativeComponent`, which
 * `react-native-web` does not implement, so importing it breaks the web
 * bundle. This stub is resolved ONLY for the web platform (see the resolver
 * in metro.config.js); native builds continue to use the real library and are
 * completely unaffected.
 *
 * It renders a simple placeholder so screens that embed a map still mount on
 * web instead of crashing the whole app.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const PROVIDER_GOOGLE = 'google';
export const PROVIDER_DEFAULT = undefined;

const MapView = ({ style, children }: any) => (
  <View style={[styles.map, style]}>
    <Text style={styles.text}>Map preview is available on iOS and Android.</Text>
    {children}
  </View>
);

export const Marker = (_props: any) => null;
export const Polyline = (_props: any) => null;
export const Polygon = (_props: any) => null;
export const Circle = (_props: any) => null;
export const Callout = (_props: any) => null;
export const Overlay = (_props: any) => null;

const styles = StyleSheet.create({
  map: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e9eef2',
    minHeight: 200,
  },
  text: {
    color: '#5b6770',
    fontSize: 14,
    padding: 16,
    textAlign: 'center',
  },
});

export default MapView;
