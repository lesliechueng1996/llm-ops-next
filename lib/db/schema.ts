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
  numeric,
  real,
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
    unique('uq_segment_node_id').on(table.nodeId),
  ],
);

export const keywordTable = pgTable(
  'keyword_table',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    datasetId: uuid('dataset_id')
      .notNull()
      .references(() => dataset.id, { onDelete: 'cascade' }),
    keywords: jsonb('keywords').notNull().default('{}'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
  },
  (table) => [unique('uq_keyword_table_dataset_id').on(table.datasetId)],
);

export const app = pgTable(
  'app',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    name: text('name').notNull().default(''),
    icon: text('icon').notNull().default(''),
    description: text('description').notNull().default(''),
    status: text('status').notNull().default(''),
    appConfigId: text('app_config_id'),
    draftAppConfigId: text('draft_app_config_id'),
    debugConversationId: text('debug_conversation_id'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
  },
  (table) => [index('idx_app_user_id').on(table.userId)],
);

export const appDatasetJoin = pgTable(
  'app_dataset_join',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    appId: text('app_id').notNull(),
    datasetId: text('dataset_id').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
  },
  (table) => [
    index('idx_app_dataset_join_app_id').on(table.appId),
    index('idx_app_dataset_join_dataset_id').on(table.datasetId),
  ],
);

export const appConfig = pgTable(
  'app_config',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    appId: uuid('app_id')
      .notNull()
      .references(() => app.id, { onDelete: 'cascade' }),
    modelConfig: jsonb('model_config').notNull().default('{}'),
    dialogRound: integer('dialog_round').notNull().default(0),
    presetPrompt: text('preset_prompt').notNull().default(''),
    tools: jsonb('tools').notNull().default('[]'),
    workflows: jsonb('workflows').notNull().default('[]'),
    retrievalConfig: jsonb('retrieval_config').notNull().default('[]'),
    longTermMemory: jsonb('long_term_memory').notNull().default('{}'),
    openingStatement: text('opening_statement').notNull().default(''),
    openingQuestions: jsonb('opening_questions').notNull().default('[]'),
    speechToText: jsonb('speech_to_text').notNull().default('{}'),
    textToSpeech: jsonb('text_to_speech').notNull().default('{}'),
    suggestedAfterAnswer: jsonb('suggested_after_answer')
      .notNull()
      .default('{}'),
    reviewConfig: jsonb('review_config').notNull().default('{}'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
  },
  (table) => [index('idx_app_config_app_id').on(table.appId)],
);

export const appConfigVersion = pgTable(
  'app_config_version',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    appId: uuid('app_id')
      .notNull()
      .references(() => app.id, { onDelete: 'cascade' }),
    modelConfig: jsonb('model_config').notNull().default('{}'),
    dialogRound: integer('dialog_round').notNull().default(0),
    presetPrompt: text('preset_prompt').notNull().default(''),
    tools: jsonb('tools').notNull().default('[]'),
    workflows: jsonb('workflows').notNull().default('[]'),
    retrievalConfig: jsonb('retrieval_config').notNull().default('[]'),
    longTermMemory: jsonb('long_term_memory').notNull().default('{}'),
    openingStatement: text('opening_statement').notNull().default(''),
    openingQuestions: jsonb('opening_questions').notNull().default('[]'),
    speechToText: jsonb('speech_to_text').notNull().default('{}'),
    textToSpeech: jsonb('text_to_speech').notNull().default('{}'),
    suggestedAfterAnswer: jsonb('suggested_after_answer')
      .notNull()
      .default('{}'),
    reviewConfig: jsonb('review_config').notNull().default('{}'),
    version: integer('version').notNull().default(0),
    configType: text('config_type').notNull().default(''),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
  },
  (table) => [
    index('idx_app_config_version_app_id').on(table.appId),
    unique('uq_app_config_version_app_id_version').on(
      table.appId,
      table.version,
    ),
  ],
);

export const conversation = pgTable(
  'conversation',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    appId: uuid('app_id')
      .notNull()
      .references(() => app.id, { onDelete: 'cascade' }),
    name: text('name').notNull().default(''),
    summary: text('summary').notNull().default(''),
    isPinned: boolean('is_pinned').notNull().default(false),
    isDeleted: boolean('is_deleted').notNull().default(false),
    invokeFrom: text('invoke_from').notNull().default(''),
    createdBy: text('created_by').notNull().default(''),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
  },
  (table) => [index('idx_conversation_app_id').on(table.appId)],
);

export const message = pgTable(
  'message',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    appId: uuid('app_id')
      .notNull()
      .references(() => app.id, { onDelete: 'cascade' }),
    conversationId: uuid('conversation_id')
      .notNull()
      .references(() => conversation.id, { onDelete: 'cascade' }),
    invokeFrom: text('invoke_from').notNull().default(''),
    createdBy: text('created_by').notNull().default(''),
    query: text('query').notNull().default(''),
    message: jsonb('message').notNull().default('[]'),
    messageTokenCount: integer('message_token_count').notNull().default(0),
    messageUnitPrice: numeric('message_unit_price', {
      precision: 10,
      scale: 7,
    })
      .notNull()
      .default('0.0'),
    messagePriceUnit: numeric('message_price_unit', {
      precision: 10,
      scale: 4,
    })
      .notNull()
      .default('0.0'),
    answer: text('answer').notNull().default(''),
    answerTokenCount: integer('answer_token_count').notNull().default(0),
    answerUnitPrice: numeric('answer_unit_price', {
      precision: 10,
      scale: 7,
    })
      .notNull()
      .default('0.0'),
    answerPriceUnit: numeric('answer_price_unit', {
      precision: 10,
      scale: 4,
    })
      .notNull()
      .default('0.0'),
    latency: real('latency').notNull().default(0.0),
    isDeleted: boolean('is_deleted').notNull().default(false),
    status: text('status').notNull().default(''),
    error: text('error'),
    totalTokenCount: integer('total_token_count').notNull().default(0),
    totalPrice: numeric('total_price', {
      precision: 10,
      scale: 7,
    })
      .notNull()
      .default('0.0'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
  },
  (table) => [
    index('idx_message_app_id_conversation_id').on(
      table.appId,
      table.conversationId,
    ),
  ],
);

export const messageAgentThought = pgTable(
  'message_agent_thought',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    appId: uuid('app_id')
      .notNull()
      .references(() => app.id, { onDelete: 'cascade' }),
    conversationId: uuid('conversation_id')
      .notNull()
      .references(() => conversation.id, { onDelete: 'cascade' }),
    messageId: uuid('message_id')
      .notNull()
      .references(() => message.id, { onDelete: 'cascade' }),
    invokeFrom: text('invoke_from').notNull().default(''),
    createdBy: text('created_by').notNull().default(''),
    position: integer('position').notNull().default(0),
    event: text('event').notNull().default(''),
    thought: text('thought').notNull().default(''),
    observation: text('observation').notNull().default(''),
    tool: text('tool').notNull().default(''),
    toolInput: jsonb('tool_input').notNull().default('{}'),
    message: jsonb('message').notNull().default('[]'),
    messageTokenCount: integer('message_token_count').notNull().default(0),
    messageUnitPrice: numeric('message_unit_price', {
      precision: 10,
      scale: 7,
    })
      .notNull()
      .default('0.0'),
    messagePriceUnit: numeric('message_price_unit', {
      precision: 10,
      scale: 4,
    })
      .notNull()
      .default('0.0'),
    answer: text('answer').notNull().default(''),
    answerTokenCount: integer('answer_token_count').notNull().default(0),
    answerUnitPrice: numeric('answer_unit_price', {
      precision: 10,
      scale: 7,
    })
      .notNull()
      .default('0.0'),
    answerPriceUnit: numeric('answer_price_unit', {
      precision: 10,
      scale: 4,
    })
      .notNull()
      .default('0.0'),
    totalTokenCount: integer('total_token_count').notNull().default(0),
    totalPrice: numeric('total_price', {
      precision: 10,
      scale: 7,
    })
      .notNull()
      .default('0.0'),
    latency: real('latency').notNull().default(0.0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
  },
  (table) => [
    index('idx_message_agent_thought_app_id_conversation_id_message_id').on(
      table.appId,
      table.conversationId,
      table.messageId,
    ),
  ],
);
