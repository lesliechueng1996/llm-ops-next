type Params = { params: Promise<{ id: string }> };

/**
 * @swagger
 * /api/openapi/api-keys/{id}:
 *   delete:
 *     tags:
 *       - OpenAPI
 *     summary: 删除指定的 API 秘钥
 *     description: 该接口用于在后端删除指定的 API 秘钥信息，删除后该秘钥接口无法使用
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 需要删除的 API 秘钥 id
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
 *                 message:
 *                   type: string
 *                   example: 删除API秘钥成功
 */
export async function DELETE(request: Request, { params }: Params) {}

/**
 * @swagger
 * /api/openapi/api-keys/{id}:
 *   patch:
 *     tags:
 *       - OpenAPI
 *     summary: 修改指定的 API 秘钥
 *     description: 该接口用于修改指定 API 秘钥的基础信息，涵盖是否激活和备注信息
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 需要修改的 API 秘钥 id
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
 *                 description: 秘钥是否激活
 *               remark:
 *                 type: string
 *                 maxLength: 100
 *                 description: 接口备注信息
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
 *                 message:
 *                   type: string
 *                   example: 修改API秘钥成功
 */
export async function PATCH(request: Request, { params }: Params) {}
