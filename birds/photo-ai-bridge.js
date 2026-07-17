import OpenAI from 'openai';

const BASE_URL = 'https://ark.cn-beijing.volces.com/api/v3';
const MODEL_ID = 'doubao-seed-1-6-vision-250815';

const PROMPT = `你是腾讯Mini鹅科创营“红树林与候鸟”项目的候鸟识别专家。
请识别图片中的鸟，优先考虑深圳湾和红树林常见候鸟，例如黑脸琵鹭、红脚鹬、白鹭、苍鹭、反嘴鹬、鸬鹚等。
请根据喙形、腿部颜色、羽毛、体型和栖息环境判断；无法确定时降低 confidence，禁止编造。
只返回以下 JSON，不要输出 Markdown 或其他文字：
{"species":"鸟种中文名（不确定时写最可能的鸟种）","description":"简要说明可见识别特征","protectionTips":"给公众的一条简短保护小贴士","confidence":0到100之间的数字}`;

function getClient() {
  const apiKey = process.env.ARK_API_KEY;
  if (!apiKey) throw new Error('缺少环境变量 ARK_API_KEY');
  return new OpenAI({ apiKey, baseURL: BASE_URL });
}

function normalizeImage(base64Image) {
  if (typeof base64Image !== 'string' || !base64Image.trim()) throw new TypeError('base64Image 必须是非空字符串');
  const value = base64Image.trim();
  if (value.startsWith('data:image/')) return value;
  if (!/^[A-Za-z0-9+/=\r\n]+$/.test(value)) throw new TypeError('base64Image 格式无效');
  return `data:image/jpeg;base64,${value.replace(/\s/g, '')}`;
}

function parseResult(text) {
  const cleaned = String(text || '').replace(/^```(?:json)?\s*|\s*```$/gi, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('模型未返回有效 JSON');
  const data = JSON.parse(cleaned.slice(start, end + 1));
  return {
    species: String(data.species || '无法确定'),
    description: String(data.description || '图片特征不足，建议补充清晰近照。'),
    protectionTips: String(data.protectionTips || '请保持距离观察，不投喂、不惊扰候鸟。'),
    confidence: Math.max(0, Math.min(100, Number(data.confidence) || 0))
  };
}

/**
 * 使用豆包视觉模型识别候鸟照片。
 * @param {string} base64Image data URL 或纯 base64 图片字符串
 * @returns {Promise<{species:string,description:string,protectionTips:string,confidence:number}>}
 */
export async function recognizeBird(base64Image) {
  const startedAt = Date.now();
  console.info('[bird-ai] recognition started');
  try {
    const response = await getClient().responses.create({
      model: MODEL_ID,
      input: [{
        role: 'user',
        content: [
          { type: 'input_image', image_url: normalizeImage(base64Image) },
          { type: 'input_text', text: PROMPT }
        ]
      }]
    });
    const result = parseResult(response.output_text);
    console.info(`[bird-ai] recognition completed species=${result.species} confidence=${result.confidence} durationMs=${Date.now() - startedAt}`);
    return result;
  } catch (error) {
    const status = error?.status || error?.response?.status;
    console.error('[bird-ai] recognition failed', { status, message: error?.message, durationMs: Date.now() - startedAt });
    if (status === 401) throw new Error('豆包 API Key 无效或已过期');
    if (status === 413) throw new Error('图片过大，请压缩后重试');
    if (status === 429) throw new Error('识别请求过多，请稍后重试');
    throw new Error(error?.message || '候鸟识别服务暂时不可用');
  }
}

export default recognizeBird;
