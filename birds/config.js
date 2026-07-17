/**
 * 羽迹·深湾 — 全局配置
 * 所有可调参数集中于此，便于部署与二次开发。
 */
(function (global) {
  'use strict';

  const CONFIG = {
    // ── 高德地图 JS API Key ──────────────────────────
    // 申请地址: https://lbs.amap.com/  (需「Web端(JS API)」类型 key)
    // 留空时将自动降级为「示意地图」，其余功能（信息卡/问答/留言/AI/商城）不受影响。
    AMAP_KEY: '',

    // ── AI 助手 / 照片识别 接入方式 ──────────────────
    // 模式:
    //   'local'  → 内置知识库匹配引擎（无需任何密钥，离线可用，覆盖常见提问）
    //   'llm'    → 调用兼容 OpenAI 的 Chat/Vision 接口（需下方 LLM_* 配置）
    AI_MODE: 'local',
    LLM: {
      BASE_URL: 'https://api.openai.com/v1',
      API_KEY: '',                 // 生产环境请通过后端代理，切勿前端明文暴露
      CHAT_MODEL: 'gpt-4o-mini',
      VISION_MODEL: 'gpt-4o-mini',
    },

    // ── 数据聚合（沿用原 bird-data-layer 思路）─────────
    DATA_SOURCES: {
      inaturalist: true,
      gbif: true,
      ebird: false, // 需有效 eBird key，默认关闭
    },
    EBIRD_KEY: '',

    // ── 存储命名空间 ─────────────────────────────────
    STORAGE_PREFIX: 'yujishenwan:',
  };

  global.APP_CONFIG = CONFIG;
})(window);
