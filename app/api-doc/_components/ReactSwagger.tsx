'use client';

import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';

/**
 * ReactSwagger 组件用于渲染 Swagger UI 文档
 * @param {object} spec - Swagger/OpenAPI 规范对象
 * @returns {JSX.Element} 渲染的 Swagger UI 组件
 */
type Props = {
  /** Swagger/OpenAPI 规范对象 */
  spec: object;
};

const ReactSwagger = ({ spec }: Props) => {
  return (
    <SwaggerUI
      spec={spec}
      // 支持的 HTTP 方法
      supportedSubmitMethods={['get', 'post', 'put', 'delete', 'patch']}
      // 默认展开所有 API 端点
      docExpansion="list"
      // 默认折叠所有模型
      defaultModelsExpandDepth={-1}
      // 显示请求持续时间
      displayRequestDuration={true}
      // 启用过滤功能
      filter={true}
      // 保持授权状态
      persistAuthorization={true}
      // 启用深度链接
      deepLinking={true}
      // 默认启用 "Try it out" 功能
      tryItOutEnabled={true}
    />
  );
};

export default ReactSwagger;
