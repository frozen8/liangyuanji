import Taro from '@tarojs/taro'

const isWeapp = process.env.TARO_ENV === 'weapp'

export async function callFunction<T = any>(
  name: string,
  data?: Record<string, any>
): Promise<T> {
  if (!isWeapp) {
    const mockModule = await import(`../data/${name}`)
    return mockModule.default(data) as T
  }
  try {
    const res = await Taro.cloud.callFunction({ name, data, config: { timeout: 15000 } })
    const result = res.result as { code: number; message: string; data: T }
    if (result.code !== 0) {
      console.error(`[Cloud] ${name} failed:`, result.message)
      throw new Error(result.message || '请求失败')
    }
    return result.data
  } catch (err: any) {
    if (err.errMsg && err.errMsg.includes('timeout')) {
      console.warn(`[Cloud] ${name} 超时，请检查网络`)
      throw new Error('网络超时，请重试')
    }
    throw err
  }
}

export function getDatabase() {
  if (!isWeapp) {
    return null
  }
  return Taro.cloud.database()
}
