const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  try {
    const wxContext = cloud.getWXContext()
    const openid = wxContext.OPENID
    const { totalBudget, categoryBudget, stoneRate } = event
    let { coupleId } = event

    // v1.1 确认：stoneRate 一经设定不可修改
    if (stoneRate !== undefined) {
      return { code: -1, message: '灵石人民币换算比例创建后不可修改', data: null }
    }

    // 兼容 coupleId 参数（优先 event.coupleId，否则查 users）
    if (!coupleId) {
      const { data: users } = await db.collection('users').where({ _openid: openid }).get()
      if (users.length === 0) return { code: -1, message: '用户不存在', data: null }
      coupleId = users[0].coupleId
      if (!coupleId) return { code: -1, message: '未绑定关系', data: null }
    }

    const updateData = { updateTime: db.serverDate() }
    if (totalBudget !== undefined) updateData.totalBudget = totalBudget
    if (categoryBudget !== undefined) updateData.categoryBudget = categoryBudget

    const { data: budgets } = await db.collection('budgets').where({ coupleId }).get()
    if (budgets.length === 0) {
      await db.collection('budgets').add({
        data: {
          coupleId,
          totalBudget: totalBudget || 80000,
          stoneRate: 1,
          categoryBudget: categoryBudget || {},
          updateTime: db.serverDate()
        }
      })
    } else {
      await db.collection('budgets').doc(budgets[0]._id).update({ data: updateData })
    }

    // 返回最新预算 + 已花信息
    const { data: latest } = await db.collection('budgets').where({ coupleId }).get()
    const budget = latest[0]
    const { data: ledgers } = await db.collection('ledgers').where({ coupleId }).get()
    const spent = ledgers.reduce((s, l) => s + (l.amount || 0), 0)
    const remain = (budget.totalBudget || 0) - spent
    const rate = budget.stoneRate || 1

    console.info('[updateBudget] success')
    return {
      code: 0,
      message: 'success',
      data: {
        budget: {
          coupleId,
          totalBudget: budget.totalBudget,
          stoneRate: rate,
          categoryBudget: budget.categoryBudget || {},
          updateTime: budget.updateTime || ''
        },
        spent,
        remain,
        remainRmb: remain * rate,
        spentRmb: spent * rate
      }
    }
  } catch (err) {
    console.error('[updateBudget] error:', err)
    return { code: -1, message: err.message || '更新失败', data: null }
  }
}
