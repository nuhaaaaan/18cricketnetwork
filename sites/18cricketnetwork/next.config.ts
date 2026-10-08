import type { NextConfig } from "next";
import path from 'node:path';

const nextConfig: NextConfig = {
  typescript: {tsconfigPath:'tsconfig.vercel.json'},
  webpack(config,{webpack}) {
    config.plugins.push(new webpack.NormalModuleReplacementPlugin(/^cloudflare:workers$/,path.resolve(process.cwd(),'deployment/cloudflare-unavailable.mjs')));
    return config;
  },
};

export default nextConfig;
