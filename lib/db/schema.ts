import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified')
    .$defaultFn(() => false)
    .notNull(),
  image: text('image'),
  createdAt: timestamp('created_at')
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: timestamp('updated_at')
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
});

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
});

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').$defaultFn(
    () => /* @__PURE__ */ new Date(),
  ),
  updatedAt: timestamp('updated_at').$defaultFn(
    () => /* @__PURE__ */ new Date(),
  ),
});

export const apikey = pgTable('apikey', {
  id: text('id').primaryKey(),
  name: text('name'),
  start: text('start'),
  prefix: text('prefix'),
  key: text('key').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  refillInterval: integer('refill_interval'),
  refillAmount: integer('refill_amount'),
  lastRefillAt: timestamp('last_refill_at'),
  enabled: boolean('enabled').default(true),
  rateLimitEnabled: boolean('rate_limit_enabled').default(true),
  rateLimitTimeWindow: integer('rate_limit_time_window').default(86400000),
  rateLimitMax: integer('rate_limit_max').default(10),
  requestCount: integer('request_count'),
  remaining: integer('remaining'),
  lastRequest: timestamp('last_request'),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
  permissions: text('permissions'),
  metadata: text('metadata'),
});

export const uploadFile = pgTable(
  'upload_file',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    name: text('name').notNull().default(''),
    key: text('key').notNull().default(''),
    size: integer('size').notNull().default(0),
    extension: text('extension').notNull().default(''),
    mimeType: text('mime_type').notNull().default(''),
    hash: text('hash').notNull().default(''),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
  },
  (table) => [index('idx_upload_file_user_id').on(table.userId)],
);

export const apiToolProvider = pgTable(
  'api_tool_provider',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    name: text('name').notNull().default(''),
    icon: text('icon').notNull().default(''),
    description: text('description').notNull().default(''),
    openapiSchema: text('openapi_schema').notNull().default(''),
    headers: jsonb('headers').notNull().default('{}'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
  },
  (table) => [
    index('idx_api_tool_provider_user_id').on(table.userId),
    unique('uq_api_tool_provider_user_id_name').on(table.userId, table.name),
  ],
);

export const apiTool = pgTable(
  'api_tool',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    providerId: uuid('provider_id')
      .notNull()
      .references(() => apiToolProvider.id, { onDelete: 'cascade' }),
    name: text('name').notNull().default(''),
    description: text('description').notNull().default(''),
    url: text('url').notNull().default(''),
    method: text('method').notNull().default(''),
    parameters: jsonb('parameters').notNull().default('[]'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
  },
  (table) => [
    index('idx_api_tool_user_id').on(table.userId),
    unique('uq_api_tool_provider_id_name').on(table.providerId, table.name),
  ],
);

export const dataset = pgTable(
  'dataset',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    name: text('name').notNull().default(''),
    icon: text('icon').notNull().default(''),
    description: text('description').notNull().default(''),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
  },
  (table) => [
    index('idx_dataset_user_id').on(table.userId),
    unique('uq_dataset_user_id_name').on(table.userId, table.name),
  ],
);

export const processRule = pgTable(
  'process_rule',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    datasetId: uuid('dataset_id')
      .notNull()
      .references(() => dataset.id, { onDelete: 'cascade' }),
    mode: text('mode').notNull().default(''),
    rule: jsonb('rule').notNull().default('{}'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
  },
  (table) => [
    index('idx_process_rule_user_id_dataset_id').on(
      table.userId,
      table.datasetId,
    ),
  ],
);

export const document = pgTable(
  'document',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    datasetId: uuid('dataset_id')
      .notNull()
      .references(() => dataset.id, { onDelete: 'cascade' }),
    uploadFileId: uuid('upload_file_id')
      .notNull()
      .references(() => uploadFile.id, { onDelete: 'cascade' }),
    processRuleId: uuid('process_rule_id')
      .notNull()
      .references(() => processRule.id, { onDelete: 'cascade' }),
    batch: text('batch').notNull().default(''),
    name: text('name').notNull().default(''),
    position: integer('position').notNull().default(1),
    characterCount: integer('character_count').notNull().default(0),
    tokenCount: integer('token_count').notNull().default(0),
    processingStartedAt: timestamp('processing_started_at'),
    parsingCompletedAt: timestamp('parsing_completed_at'),
    splittingCompletedAt: timestamp('splitting_completed_at'),
    indexingCompletedAt: timestamp('indexing_completed_at'),
    completedAt: timestamp('completed_at'),
    stoppedAt: timestamp('stopped_at'),
    error: text('error'),
    enabled: boolean('enabled').notNull().default(false),
    disabledAt: timestamp('disabled_at'),
    status: text('status').notNull().default(''),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
  },
  (table) => [
    index('idx_document_user_id_dataset_id').on(table.userId, table.datasetId),
  ],
);

export const segment = pgTable(
  'segment',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    datasetId: uuid('dataset_id')
      .notNull()
      .references(() => dataset.id, { onDelete: 'cascade' }),
    documentId: uuid('document_id')
      .notNull()
      .references(() => document.id, { onDelete: 'cascade' }),
    nodeId: text('node_id'),
    position: integer('position').notNull().default(1),
    content: text('content').notNull().default(''),
    characterCount: integer('character_count').notNull().default(0),
    tokenCount: integer('token_count').notNull().default(0),
    keywords: jsonb('keywords').notNull().default('[]'),
    hash: text('hash').notNull().default(''),
    hitCount: integer('hit_count').notNull().default(0),
    enabled: boolean('enabled').notNull().default(false),
    disabledAt: timestamp('disabled_at'),
    processingStartedAt: timestamp('processing_started_at'),
    indexingCompletedAt: timestamp('indexing_completed_at'),
    completedAt: timestamp('completed_at'),
    stoppedAt: timestamp('stopped_at'),
    error: text('error'),
    status: text('status').notNull().default(''),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
  },
  (table) => [
    index('idx_segment_user_id_dataset_id_document_id').on(
      table.userId,
      table.datasetId,
      table.documentId,
    ),
  ],
);

export const keywordTable = pgTable(
  'keyword_table',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    datasetId: uuid('dataset_id')
      .notNull()
      .references(() => dataset.id, { onDelete: 'cascade' }),
    keywords: jsonb('keywords').notNull().default('[]'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
  },
  (table) => [unique('uq_keyword_table_dataset_id').on(table.datasetId)],
);
