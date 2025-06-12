import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  webpack: (config, { isServer, dev }) => {
    config.experiments = {
      asyncWebAssembly: true,
      layers: true,
    };

    // 只在服务器端处理 nodejieba
    if (isServer) {
      // 添加 nodejieba 到外部模块列表
      config.externals = [...(config.externals || []), 'nodejieba'];
    } else {
      // 在客户端，将 nodejieba 替换为空模块
      config.resolve.alias = {
        ...config.resolve.alias,
        nodejieba: false,
      };
    }

    return config;
  },
};

export default nextConfig;
