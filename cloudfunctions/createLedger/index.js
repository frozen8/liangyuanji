const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  try {
    const wxContext = cloud.getWXContext()
    const openid = wxContext.OPENID
    const { amount, category, note, date, sourceType, taskId, taskTitle } = event

    if (!amount || amount <= 0) {
      return { code: -1, message: '请填写有效的支出灵石数', data: null }
    }

    const { data: users } = await db.collection('users').where({ _openid: openid }).get()
    if (users.length === 0) return { code: -1, message: '用户不存在', data: null }
    const user = users[0]
    const coupleId = user.coupleId
    if (!coupleId) return { code: -1, message: '未绑定关系', data: null }

    const ledgerRes = await db.collection('ledgers').add({
      data: {
        coupleId,
        amount,
        category: category || 'other', // v1.1：允许"其他"兜底
        note: note || '',
        date: date || new Date().toISOString().slice(0, 10),
        recorder: openid,
        recorderName: user.nickname || '良人',
        recorderAvatar: user.avatar || '',
        createTime: db.serverDate(),
        sourceType: sourceType || 'manual', // 默认独立记账
        taskId: taskId || null,
        taskTitle: taskTitle || ''
      }
    })

    // 返回最新预算状态
    const { data: budgets } = await db.collection('budgets').where({ coupleId }).get()
    const budgetDoc = budgets[0] || { totalBudget: 0, stoneRate: 1 }
    const { data: all } = await db.collection('ledgers').where({ coupleId }).get()
    const spent = all.reduce((s, l) => s + (l.amount || 0), 0)
    const totalBudget = budgetDoc.totalBudget || 0
    const stoneRate = budgetDoc.stoneRate || 1
    const remain = totalBudget - spent
    const budgetStatus = {
      spent,
      remain,
      isOverBudget: spent > totalBudget,
      stoneRate,
      remainRmb: remain * stoneRate
    }

    console.info('[createLedger] success:', ledgerRes._id)
    return {
      code: 0,
      message: 'success',
      data: {
        ledger: {
          id: ledgerRes._id,
          coupleId,
          amount,
          category: category || 'other',
          note: note || '',
          date: date || new Date().toISOString().slice(0, 10),
          recorder: openid,
          recorderName: user.nickname || '良人',
          recorderAvatar: user.avatar || '',
          sourceType: sourceType || 'manual',
          taskId: taskId || null,
          taskTitle: taskTitle || ''
        },
        budgetStatus
      }
    }
  } catch (err) {
    console.error('[createLedger] error:', err)
    return { code: -1, message: err.message || '记账失败', data: null }
  }
}
