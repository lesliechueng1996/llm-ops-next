/**
 * API 密钥管理相关的路由处理
 * 提供创建和获取 API 密钥的功能
 * @module api/openapi/api-keys
 */

import { verifyApiKey } from '@/lib/auth/dal';
import { loadPageReqParams } from '@/lib/paginator';
import { handleRouteError, successResult } from '@/lib/route-common';
import {
  createApiKeyReqSchema,
  getApiKeyListReqSchema,
} from '@/schemas/openapi-schema';
import { createApiKey, listApiKeysByPage } from '@/services/openapi';

/**
 * @swagger
 * /api/openapi/api-keys:
 *   post:
 *     summary: 创建 API 秘钥
 *     description: 该接口主要用户在当前登录账号下创建 API 秘钥，API 秘钥可以用于在开放 API 中进行授权并对接 Agent 智能体应用。
 *     tags:
 *       - OpenAPI
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isActive
 *             properties:
 *               isActive:
 *                 type: boolean
 *                 description: 秘钥是否激活，只有激活的 API 秘钥才可以使用，否则抛出对应的错误
 *               remark:
 *                 type: string
 *                 maxLength: 100
 *                 description: 接口备注信息
 *     responses:
 *       200:
 *         description: 创建成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     key:
 *                       type: string
 *                       description: API 秘钥
 *                       example: llmops-v1/k6FINx4SHb1UdqQwprDDA7d52f03d56acae2ae3c69637ac351f5e983507b5
 *                     isActive:
 *                       type: boolean
 *                       description: 是否激活
 *                       example: true
 *                 message:
 *                   type: string
 *                   example: 创建API秘钥成功
 */
export async function POST(request: Request) {
  try {
    const { userId } = await verifyApiKey();
    const data = await request.json();
    const { isActive, remark } = createApiKeyReqSchema.parse(data);
    const apiKey = await createApiKey(userId, isActive, remark ?? '');
    return successResult(
      {
        key: apiKey.key,
        isActive: apiKey.enabled,
      },
      201,
      '创建API秘钥成功',
    );
  } catch (err) {
    return handleRouteError(err);
  }
}

/**
 * @swagger
 * /api/openapi/api-keys:
 *   get:
 *     summary: 获取 API 秘钥分页列表数据
 *     description: 该接口主要用于获取当前登录账号的 API 秘钥分页列表数据，接口支持分页。
 *     tags:
 *       - OpenAPI
 *     parameters:
 *       - in: query
 *         name: currentPage
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 当前页数
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 20
 *         description: 每页条数
 *     responses:
 *       200:
 *         description: 获取成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     list:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             description: API 秘钥对应的 id 数据
 *                             example: d400cec0-892f-49ab-8f72-821b88c1aaa9
 *                           apiKey:
 *                             type: string
 *                             description: API 秘钥
 *                             example: llmops-v1/k6FINx4SHb1UdqQwprDDA7d52f03d56acae2ae3c69637ac351f5e983507b5
 *                           isActive:
 *                             type: boolean
 *                             description: 是否激活，true 代表激活，false 代表禁用
 *                             example: true
 *                           remark:
 *                             type: string
 *                             description: API 秘钥备注信息
 *                             example: ""
 *                           updatedAt:
 *                             type: integer
 *                             description: 更新时间戳
 *                             example: 1721460914
 *                           createdAt:
 *                             type: integer
 *                             description: 创建时间戳
 *                             example: 1721460914
 *                     paginator:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: integer
 *                           description: 当前的页数
 *                           example: 1
 *                         pageSize:
 *                           type: integer
 *                           description: 每页的条数
 *                           example: 20
 *                         totalPage:
 *                           type: integer
 *                           description: 总页数
 *                           example: 1
 *                         totalRecord:
 *                           type: integer
 *                           description: 总记录条数
 *                           example: 1
 *                 message:
 *                   type: string
 *                   example: 获取API秘钥列表成功
 */
export async function GET(request: Request) {
  try {
    const { userId } = await verifyApiKey();
    const pageReq = getApiKeyListReqSchema.parse(loadPageReqParams(request));
    const result = await listApiKeysByPage(userId, pageReq);
    return successResult(result);
  } catch (err) {
    return handleRouteError(err);
  }
}
