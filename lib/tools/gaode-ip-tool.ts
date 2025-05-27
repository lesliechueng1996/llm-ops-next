/**
 * 高德地图IP定位工具
 *
 * 该模块提供了一个工具，用于根据IP地址获取对应的地理位置信息（省份和城市）。
 * 使用高德地图的IP定位API服务，需要配置GAODE_API_KEY和GAODE_BASE_URL环境变量。
 */

import { log } from '@/lib/logger';
import { tool } from '@langchain/core/tools';
import { z } from 'zod';

/**
 * 根据IP地址获取城市信息
 * @param params - 包含IP地址的参数对象
 * @returns 返回省份和城市信息，如果省份和城市相同则只返回城市
 */
const getCityByIp = async (params: z.infer<typeof gaodeIpToolSchema>) => {
  const { ip } = params;
  log.info('根据IP: %s 获取城市信息', ip);

  const gaodeApiKey = process.env.GAODE_API_KEY;
  const apiBaseUrl = process.env.GAODE_BASE_URL;
  if (!gaodeApiKey) {
    return '请先配置高德地图的API Key';
  }
  if (!apiBaseUrl) {
    return '请先配置高德地图的API Base URL';
  }

  try {
    const response = await fetch(
      `${apiBaseUrl}/ip?ip=${ip}&key=${gaodeApiKey}`,
    );
    if (!response.ok) {
      throw new Error(`获取城市失败, status: ${response.status}`);
    }

    const data = await response.json();
    if (data.info !== 'OK') {
      throw new Error(`获取城市失败, data info: ${data.info}`);
    }

    const province = data.province;
    const city = data.city;

    log.info('根据IP: %s 获取城市信息, 省份: %s, 城市: %s', ip, province, city);
    if (province === city) {
      return city;
    }

    return `${province}${city}`;
  } catch (error) {
    log.error('根据IP: %s 获取城市失败, error: %o', ip, error);
    return `获取${ip}所在地失败`;
  }
};

/**
 * IP参数描述文本
 */
const ipParamDescription = '需要查询所在地的IP地址, 例如: 114.247.50.2';

/**
 * 高德IP工具定义
 * 包含工具的名称、描述、输入参数等信息
 */
export const gaodeIpToolDefination = {
  name: 'gaode_ip',
  description: '一个用于根据IP获取城市信息的工具',
  inputs: [
    {
      name: 'ip',
      description: ipParamDescription,
      required: true,
      type: 'string' as const,
    },
  ],
  label: '根据IP获取城市信息',
  params: [],
  createdAt: 1722498386,
};

/**
 * 高德IP工具的参数验证模式
 */
const gaodeIpToolSchema = z.object({
  ip: z.string().describe(ipParamDescription),
});

/**
 * 创建高德IP工具实例
 * @returns 返回配置好的高德IP工具实例
 */
export const createGaodeIpTool = () => {
  return tool(getCityByIp, {
    name: gaodeIpToolDefination.name,
    description: gaodeIpToolDefination.description,
    schema: gaodeIpToolSchema,
  });
};
