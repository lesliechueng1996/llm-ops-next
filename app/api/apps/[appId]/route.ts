/**
 * 应用管理 API 路由处理模块
 *
 * 该模块提供了应用相关的 API 端点，包括：
 * - 获取应用基础信息 (GET)
 * - 删除应用 (DELETE)
 * - 更新应用基础信息 (PATCH)
 *
 * 所有接口都需要通过 API Key 进行认证
 */

import { verifyApiKey } from '@/lib/auth/dal';
import { handleRouteError, successResult } from '@/lib/route-common';
import { updateAppReqSchema } from '@/schemas/app-schema';
import { deleteApp, getAppBasicInfo, updateAppBasicInfo } from '@/services/app';

// 定义路由参数类型，用于处理动态路由中的 appId
type Params = { params: Promise<{ appId: string }> };

/**
 * @swagger
 * /api/apps/{appId}:
 *   get:
 *     tags:
 *       - Apps
 *     summary: 获取应用基础信息
 *     description: 传递对应的应用 id，获取当前应用的基础信息
 *     parameters:
 *       - in: path
 *         name: appId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 需要获取的应用 id，类型为 uuid
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
 *                     id:
 *                       type: string
 *                       format: uuid
 *                       description: 应用 id，类型为 uuid
 *                     debugConversationId:
 *                       type: string
 *                       format: uuid
 *                       description: 调试会话 id，类型为 uuid，如果没有则为空
 *                     name:
 *                       type: string
 *                       description: 应用名称
 *                     icon:
 *                       type: string
 *                       description: 应用图标
 *                     description:
 *                       type: string
 *                       description: 应用描述
 *                     status:
 *                       type: string
 *                       description: 应用的状态，支持 published(已发布) 和 draft(草稿)
 *                     draftUpdatedAt:
 *                       type: integer
 *                       description: 应用草稿的更新时间，类型为时间戳，单位为毫秒
 *                     updatedAt:
 *                       type: integer
 *                       description: 应用的更新时间，类型为时间戳，单位为毫秒
 *                     createdAt:
 *                       type: integer
 *                       description: 应用的创建时间，类型为时间戳，单位为毫秒
 *                 message:
 *                   type: string
 *                   example: ""
 */
export async function GET(_: Request, { params }: Params) {
  try {
    // 并行验证 API Key 和获取路由参数，提高性能
    const [{ userId }, { appId }] = await Promise.all([verifyApiKey(), params]);
    const appBasicInfo = await getAppBasicInfo(appId, userId);
    return successResult(appBasicInfo);
  } catch (error) {
    return handleRouteError(error);
  }
}

/**
 * @swagger
 * /api/apps/{appId}:
 *   delete:
 *     tags:
 *       - Apps
 *     summary: 删除指定的应用
 *     description: 该接口用于删除指定的 Agent 智能体应用，删除之后，应用无法进行复原与调试，也无法使用开放 API 进行调试、用户无法访问该应用产生的所有会话信息等内容
 *     parameters:
 *       - in: path
 *         name: appId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 需要删除的应用 id，类型为 uuid
 *     responses:
 *       200:
 *         description: 删除成功
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
 *                   description: 空对象
 *                 message:
 *                   type: string
 *                   example: 删除应用成功
 */
export async function DELETE(_: Request, { params }: Params) {
  try {
    // 并行验证 API Key 和获取路由参数，提高性能
    const [{ userId }, { appId }] = await Promise.all([verifyApiKey(), params]);
    await deleteApp(appId, userId);
    return successResult(null, 200, '删除应用成功');
  } catch (error) {
    return handleRouteError(error);
  }
}

/**
 * @swagger
 * /api/apps/{appId}:
 *   patch:
 *     tags:
 *       - Apps
 *     summary: 修改应用基础信息
 *     description: 该接口用于修改指定应用的基础信息，只能修改应用的名字、icon、描述信息
 *     parameters:
 *       - in: path
 *         name: appId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 需要修改的应用 id，类型为 uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: 应用名称，长度不超过 40 个字符
 *               icon:
 *                 type: string
 *                 description: 应用图标 URL 地址
 *               description:
 *                 type: string
 *                 description: 应用描述信息，长度不超过 800 个字符
 *     responses:
 *       200:
 *         description: 修改成功
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
 *                   description: 空对象
 *                 message:
 *                   type: string
 *                   example: 更新应用成功
 */
export async function PATCH(request: Request, { params }: Params) {
  try {
    // 并行处理：验证 API Key、获取路由参数、解析请求体，提高性能
    const [{ userId }, { appId }, body] = await Promise.all([
      verifyApiKey(),
      params,
      request.json(),
    ]);
    // 验证并解析请求数据，确保数据格式正确
    const req = updateAppReqSchema.parse(body);
    await updateAppBasicInfo(appId, userId, req);
    return successResult(null, 200, '更新应用成功');
  } catch (error) {
    return handleRouteError(error);
  }
}
