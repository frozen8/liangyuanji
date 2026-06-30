const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

// 批量删除某集合中指定 coupleId 的所有文档（云开发 where().remove() 单次上限 20 条，需循环）
async function purgeByCoupleId(collectionName, coupleId) {
  let removed = 0
  while (true) {
    const res = await db.collection(collectionName).where({ coupleId }).remove()
    const n = res.stats.removed
    removed += n
    if (n === 0) break
  }
  return removed
}

exports.main = async (event, context) => {
  try {
    const openid = cloud.getWXContext().OPENID
    const { action } = event
    let { coupleId } = event

    // 解析 coupleId（优先 event.coupleId，否则查 users）
    if (!coupleId) {
      const { data: users } = await db.collection('users').where({ _openid: openid }).get()
      if (users.length === 0) return { code: -1, message: '用户不存在', data: null }
      coupleId = users[0].coupleId
      if (!coupleId) return { code: -1, message: '未绑定关系', data: null }
    }

    // 查 couples 文档
    const { data: couples } = await db.collection('couples').where({ _id: coupleId }).get()
    if (couples.length === 0) return { code: -1, message: '关系不存在', data: null }
    const couple = couples[0]
    const members = couple.members || []
    const unbindRequest = couple.unbindRequest || null

    if (action === 'request') {
      if (members.length < 2) {
        return { code: -1, message: '对方尚未绑定，无需解除', data: null }
      }
      if (unbindRequest && unbindRequest.status === 'pending') {
        return { code: -1, message: '已有解绑请求进行中', data: null }
      }
      await db.collection('couples').doc(coupleId).update({
        data: {
          unbindRequest: {
            initiator: openid,
            status: 'pending',
            createTime: db.serverDate()
          }
        }
      })
      console.info('[unbindCouple] request created:', openid, 'couple:', coupleId)
      return { code: 0, message: 'success', data: { ok: true } }
    }

    if (action === 'confirm') {
      if (!unbindRequest || unbindRequest.status !== 'pending') {
        return { code: -1, message: '无解绑请求', data: null }
      }
      if (openid === unbindRequest.initiator) {
        return { code: -1, message: '不能同意自己的解绑请求，请使用撤销', data: null }
      }

      // 销毁所有业务数据（先删依赖项，beasts 最后）
      const purgeOrder = ['tasks', 'ledgers', 'cultivate_sessions', 'achievements', 'budgets', 'beasts']
      const purgeResult = {}
      for (const name of purgeOrder) {
        try {
          purgeResult[name] = await purgeByCoupleId(name, coupleId)
        } catch (err) {
          console.error('[unbindCouple] purge', name, 'error:', err)
          purgeResult[name] = -1
        }
      }

      // 清空 couples.members 和 unbindRequest（保留文档供审计）
      await db.collection('couples').doc(coupleId).update({
        data: {
          members: [],
          unbindRequest: null,
          unbindTime: db.serverDate()
        }
      })

      // 清空双方 users.coupleId
      if (members.length > 0) {
        await db.collection('users').where({ _openid: _.in(members) }).update({
          data: { coupleId: '' }
        })
      }

      console.info('[unbindCouple] confirm success:', coupleId, 'purge:', purgeResult)
      return { code: 0, message: 'success', data: { ok: true, purge: purgeResult } }
    }

    if (action === 'reject') {
      if (!unbindRequest || unbindRequest.status !== 'pending') {
        return { code: -1, message: '无解绑请求', data: null }
      }
      if (openid === unbindRequest.initiator) {
        return { code: -1, message: '不能拒绝自己的解绑请求，请使用撤销', data: null }
      }
      await db.collection('couples').doc(coupleId).update({
        data: { unbindRequest: null }
      })
      console.info('[unbindCouple] rejected:', openid, 'couple:', coupleId)
      return { code: 0, message: 'success', data: { ok: true } }
    }

    if (action === 'cancel') {
      if (!unbindRequest || unbindRequest.status !== 'pending') {
        return { code: -1, message: '无解绑请求', data: null }
      }
      if (openid !== unbindRequest.initiator) {
        return { code: -1, message: '只能撤销自己的解绑请求', data: null }
      }
      await db.collection('couples').doc(coupleId).update({
        data: { unbindRequest: null }
      })
      console.info('[unbindCouple] cancelled:', openid, 'couple:', coupleId)
      return { code: 0, message: 'success', data: { ok: true } }
    }

    return { code: -1, message: '请指定 action 参数（request/confirm/reject/cancel）', data: null }
  } catch (err) {
    console.error('[unbindCouple] error:', err)
    return { code: -1, message: err.message || '解绑失败', data: null }
  }
}
