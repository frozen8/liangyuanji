const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  try {
    const wxContext = cloud.getWXContext()
    const openid = wxContext.OPENID
    const { ledgerId } = event

    if (!ledgerId) {
      return { code: -1, message: '缺少账单 ID', data: null }
    }

    const { data: users } = await db.collection('users').where({ _openid: openid }).get()
    if (users.length === 0) return { code: -1, message: '用户不存在', data: null }
    const coupleId = users[0].coupleId
    if (!coupleId) return { code: -1, message: '未绑定关系', data: null }

    const { data: ledger } = await db.collection('ledgers').doc(ledgerId).get()
    if (!ledger) return { code: -1, message: '账单不存在', data: null }
    // 数据隔离校验
    if (ledger.coupleId !== coupleId) return { code: -1, message: '无权操作此账单', data: null }

    // v1.1：降妖任务账单禁止删除（需通过任务管理，但任务已完成时也无法删，等同于账单永久保留）
    if (ledger.sourceType === 'task') {
      return { code: -1, message: '降妖任务账单不可删除，请通过任务管理', data: null }
    }

    await db.collection('ledgers').doc(ledgerId).remove()

    console.info('[deleteLedger] success:', ledgerId)
    return { code: 0, message: 'success', data: { ok: true } }
  } catch (err) {
    console.error('[deleteLedger] error:', err)
    return { code: -1, message: err.message || '删除失败', data: null }
  }
}
