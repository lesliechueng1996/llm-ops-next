/**
 * 应用管理服务
 *
 * 该模块提供了应用的基本管理功能，包括：
 * - 应用的创建、删除、复制
 * - 应用列表的分页查询
 * - 应用基本信息的获取和更新
 * - 应用配置的管理
 */

import { NotFoundException } from '@/exceptions';
import { db } from '@/lib/db';
import { app, appConfig, appConfigVersion } from '@/lib/db/schema';
import {
  AppConfigType,
  AppStatus,
  DEFAULT_APP_CONFIG,
  type ModelConfig,
} from '@/lib/entity';
import { log } from '@/lib/logger';
import { calculatePagination, paginationResult } from '@/lib/paginator';
import type { CreateAppReq, UpdateAppReq } from '@/schemas/app-schema';
import type { SearchPageReq } from '@/schemas/common-schema';
import { and, count, desc, eq, inArray, like } from 'drizzle-orm';

/**
 * 获取应用记录，如果不存在则抛出异常
 * @param appId - 应用ID
 * @param userId - 用户ID
 * @returns 应用记录
 * @throws NotFoundException 当应用不存在时
 */
const getAppOrThrow = async (appId: string, userId: string) => {
  const appRecords = await db
    .select()
    .from(app)
    .where(and(eq(app.id, appId), eq(app.userId, userId)));

  if (appRecords.length === 0) {
    throw new NotFoundException('应用不存在');
  }

  return appRecords[0];
};

/**
 * 获取应用的基本信息
 * 如果应用没有草稿配置，会自动创建一个
 * @param appId - 应用ID
 * @param userId - 用户ID
 * @returns 应用的基本信息，包括ID、名称、图标、描述等
 */
export const getAppBasicInfo = async (appId: string, userId: string) => {
  const appRecord = await getAppOrThrow(appId, userId);

  const draftAppConfigId = appRecord.draftAppConfigId;
  let draftAppConfigRecord: typeof appConfigVersion.$inferSelect | null = null;

  if (draftAppConfigId) {
    const appConfigVersionRecords = await db
      .select()
      .from(appConfigVersion)
      .where(
        and(
          eq(appConfigVersion.id, draftAppConfigId),
          eq(appConfigVersion.configType, AppConfigType.DRAFT),
        ),
      );
    draftAppConfigRecord =
      appConfigVersionRecords.length === 0 ? null : appConfigVersionRecords[0];
  }

  if (draftAppConfigRecord === null) {
    log.info('App %s has no draft app config, start to create one', appId);
    draftAppConfigRecord = await db.transaction(async (tx) => {
      const draftAppConfigRecords = await tx
        .insert(appConfigVersion)
        .values({
          appId,
          version: 0,
          configType: AppConfigType.DRAFT,
          ...DEFAULT_APP_CONFIG,
        })
        .returning();

      await tx
        .update(app)
        .set({
          draftAppConfigId: draftAppConfigRecords[0].id,
        })
        .where(eq(app.id, appId));

      return draftAppConfigRecords[0];
    });
  }

  return {
    id: appRecord.id,
    debugConversationId: appRecord.debugConversationId,
    name: appRecord.name,
    icon: appRecord.icon,
    description: appRecord.description,
    status: appRecord.status,
    draftUpdatedAt: draftAppConfigRecord.updatedAt.getTime(),
    updatedAt: appRecord.updatedAt.getTime(),
    createdAt: appRecord.createdAt.getTime(),
  };
};

/**
 * 创建新应用
 * 创建应用时会同时创建一个初始的草稿配置
 * @param userId - 用户ID
 * @param req - 创建应用的请求参数
 * @returns 新创建的应用ID
 */
export const createApp = async (userId: string, req: CreateAppReq) => {
  return await db.transaction(async (tx) => {
    const appRecords = await tx
      .insert(app)
      .values({
        userId,
        name: req.name,
        icon: req.icon,
        description: req.description ?? '',
        status: AppStatus.DRAFT,
      })
      .returning();

    const appRecord = appRecords[0];
    const appConfigVersionRecords = await tx
      .insert(appConfigVersion)
      .values({
        appId: appRecord.id,
        version: 0,
        configType: AppConfigType.DRAFT,
        ...DEFAULT_APP_CONFIG,
      })
      .returning();

    await tx
      .update(app)
      .set({
        draftAppConfigId: appConfigVersionRecords[0].id,
      })
      .where(eq(app.id, appRecord.id));

    return appRecord.id;
  });
};

/**
 * 删除应用
 * @param appId - 应用ID
 * @param userId - 用户ID
 * @throws NotFoundException 当应用不存在时
 */
export const deleteApp = async (appId: string, userId: string) => {
  await getAppOrThrow(appId, userId);
  await db.delete(app).where(eq(app.id, appId));
};

/**
 * 分页获取应用列表
 * 支持按应用名称搜索
 * @param userId - 用户ID
 * @param pageReq - 分页和搜索参数
 * @returns 分页后的应用列表和总数
 */
export const listAppsByPage = async (
  userId: string,
  pageReq: SearchPageReq,
) => {
  const conditions = [eq(app.userId, userId)];
  if (pageReq.searchWord) {
    conditions.push(like(app.name, `%${pageReq.searchWord}%`));
  }

  const where = and(...conditions);

  const { offset, limit } = calculatePagination(pageReq);

  // 查询文档列表
  const listQuery = db
    .select()
    .from(app)
    .where(where)
    .orderBy(desc(app.createdAt))
    .limit(limit)
    .offset(offset);

  // 查询总数
  const totalQuery = db.select({ count: count() }).from(app).where(where);

  const [list, total] = await Promise.all([listQuery, totalQuery]);

  const appConfigIds = list
    .filter((item) => item.status === AppStatus.PUBLISHED)
    .map((item) => item.appConfigId)
    .filter((item) => item !== null);

  const draftAppConfigIds = list
    .filter((item) => item.status === AppStatus.DRAFT && item.draftAppConfigId)
    .map((item) => item.draftAppConfigId)
    .filter((item) => item !== null);

  const appConfigQuery = db
    .select()
    .from(appConfig)
    .where(inArray(appConfig.id, appConfigIds));

  const draftAppConfigQuery = db
    .select()
    .from(appConfigVersion)
    .where(inArray(appConfigVersion.id, draftAppConfigIds));

  const [appConfigRecords, draftAppConfigRecords] = await Promise.all([
    appConfigQuery,
    draftAppConfigQuery,
  ]);

  const appConfigMap = new Map(appConfigRecords.map((item) => [item.id, item]));
  const draftAppConfigMap = new Map(
    draftAppConfigRecords.map((item) => [item.id, item]),
  );

  const getConfig = (appRecord: typeof app.$inferSelect) => {
    if (appRecord.appConfigId && appRecord.status === AppStatus.PUBLISHED) {
      return appConfigMap.get(appRecord.appConfigId);
    }
    return draftAppConfigMap.get(appRecord.draftAppConfigId ?? '');
  };

  // 格式化返回结果，统一时间戳格式
  const formattedList = list.map((item) => ({
    id: item.id,
    name: item.name,
    icon: item.icon,
    description: item.description,
    presetPrompt: getConfig(item)?.presetPrompt,
    modelConfig: {
      provider: (getConfig(item)?.modelConfig as ModelConfig)?.provider,
      model: (getConfig(item)?.modelConfig as ModelConfig)?.model,
    },
    status: item.status,
    createdAt: item.createdAt.getTime(),
    updatedAt: item.updatedAt.getTime(),
  }));

  return paginationResult(formattedList, total[0].count, pageReq);
};

/**
 * 复制应用
 * 创建一个新应用，复制原应用的所有配置
 * @param userId - 用户ID
 * @param appId - 要复制的应用ID
 * @returns 新创建的应用ID
 * @throws NotFoundException 当原应用或配置不存在时
 */
export const copyApp = async (userId: string, appId: string) => {
  const appRecord = await getAppOrThrow(appId, userId);

  const appConfigVersionRecords = await db
    .select()
    .from(appConfigVersion)
    .where(eq(appConfigVersion.id, appRecord.draftAppConfigId ?? ''));

  if (appConfigVersionRecords.length === 0) {
    throw new NotFoundException('应用配置不存在');
  }

  const draftAppConfig = appConfigVersionRecords[0];

  return await db.transaction(async (tx) => {
    const newAppRecords = await tx
      .insert(app)
      .values({
        userId,
        name: `${appRecord.name} 副本`,
        icon: appRecord.icon,
        description: appRecord.description,
        status: AppStatus.DRAFT,
      })
      .returning();

    const newApp = newAppRecords[0];
    const newAppConfigVersionRecords = await tx
      .insert(appConfigVersion)
      .values({
        appId: newApp.id,
        modelConfig: draftAppConfig.modelConfig,
        dialogRound: draftAppConfig.dialogRound,
        presetPrompt: draftAppConfig.presetPrompt,
        tools: draftAppConfig.tools,
        workflows: draftAppConfig.workflows,
        datasets: draftAppConfig.datasets,
        retrievalConfig: draftAppConfig.retrievalConfig,
        longTermMemory: draftAppConfig.longTermMemory,
        openingStatement: draftAppConfig.openingStatement,
        openingQuestions: draftAppConfig.openingQuestions,
        speechToText: draftAppConfig.speechToText,
        textToSpeech: draftAppConfig.textToSpeech,
        suggestedAfterAnswer: draftAppConfig.suggestedAfterAnswer,
        reviewConfig: draftAppConfig.reviewConfig,
        version: 0,
        configType: AppConfigType.DRAFT,
      })
      .returning();

    await tx
      .update(app)
      .set({
        draftAppConfigId: newAppConfigVersionRecords[0].id,
      })
      .where(eq(app.id, newApp.id));

    return newApp.id;
  });
};

/**
 * 更新应用的基本信息
 * @param appId - 应用ID
 * @param userId - 用户ID
 * @param req - 更新应用的请求参数
 * @throws NotFoundException 当应用不存在时
 */
export const updateAppBasicInfo = async (
  appId: string,
  userId: string,
  req: UpdateAppReq,
) => {
  await getAppOrThrow(appId, userId);
  await db
    .update(app)
    .set({
      name: req.name,
      icon: req.icon,
      description: req.description ?? '',
    })
    .where(eq(app.id, appId));
};
