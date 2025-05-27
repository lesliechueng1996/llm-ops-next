/**
 * 高德地图天气查询工具
 *
 * 该模块提供了一个基于高德地图API的天气查询工具，可以根据城市名称获取详细的天气信息。
 * 主要功能包括：
 * 1. 根据城市名称获取城市编码
 * 2. 使用城市编码查询详细的天气信息
 * 3. 返回格式化的天气数据
 */

import { log } from '@/lib/logger';
import { tool } from '@langchain/core/tools';
import { z } from 'zod';

/**
 * 根据城市名称获取天气信息
 * @param params - 包含城市名称的参数对象
 * @returns 返回天气信息的JSON字符串，如果发生错误则返回错误信息
 */
const getWeatherByCity = async (
  params: z.infer<typeof gaodeWeatherToolSchema>,
) => {
  const { city } = params;
  log.info('根据城市: %s 获取天气信息', city);

  const gaodeApiKey = process.env.GAODE_API_KEY;
  const apiBaseUrl = process.env.GAODE_BASE_URL;
  if (!gaodeApiKey) {
    return '请先配置高德地图的API Key';
  }
  if (!apiBaseUrl) {
    return '请先配置高德地图的API Base URL';
  }

  try {
    const cityResponse = await fetch(
      `${apiBaseUrl}/config/district?keywords=${city}&subdistrict=0&key=${gaodeApiKey}`,
    );
    if (!cityResponse.ok) {
      throw new Error(`获取城市信息失败, status: ${cityResponse.status}`);
    }
    const cityData = await cityResponse.json();
    if (cityData.info !== 'OK') {
      throw new Error(`获取城市信息失败, data info: ${cityData.info}`);
    }
    const cityAdcode = cityData.districts[0].adcode;
    log.info('根据城市: %s 获取城市信息, 城市编码: %s', city, cityAdcode);

    const weatherResponse = await fetch(
      `${apiBaseUrl}/weather/weatherInfo?city=${cityAdcode}&extensions=all&key=${gaodeApiKey}`,
    );
    if (!weatherResponse.ok) {
      throw new Error(`获取天气信息失败, status: ${weatherResponse.status}`);
    }
    const weatherData = await weatherResponse.json();
    if (weatherData.info !== 'OK') {
      throw new Error(`获取天气信息失败, data info: ${weatherData.info}`);
    }
    log.info('根据城市: %s 获取天气信息, 天气信息: %o', city, weatherData);
    return JSON.stringify(weatherData);
  } catch (error) {
    log.error('根据城市: %s 获取天气信息失败, error: %o', city, error);
    return `获取${city}的天气信息失败`;
  }
};

/**
 * 城市参数描述文本
 */
const cityParamDescription = '需要查询的城市的名称, 例如: 北京';

/**
 * 高德天气工具的定义配置
 * 包含工具名称、描述、输入参数等信息
 */
export const gaodeWeatherToolDefination = {
  name: 'gaode_weather',
  description: '当你想查询天气或者与天气相关的问题时可以使用的工具',
  inputs: [
    {
      name: 'city',
      description: cityParamDescription,
      required: true,
      type: 'string' as const,
    },
  ],
  label: '根据城市获取天气信息',
  params: [],
  createdAt: 1722498386,
};

/**
 * 高德天气工具的参数验证模式
 */
const gaodeWeatherToolSchema = z.object({
  city: z.string().describe(cityParamDescription),
});

/**
 * 创建高德天气查询工具实例
 * @returns 返回配置好的天气查询工具
 */
export const createGaodeWeatherTool = () => {
  return tool(getWeatherByCity, {
    name: gaodeWeatherToolDefination.name,
    description: gaodeWeatherToolDefination.description,
    schema: gaodeWeatherToolSchema,
  });
};
