const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  try {
    const wxContext = cloud.getWXContext()
    const openid = wxContext.OPENID
    const { inviteCode, nickname } = event
    console.info('[bindCouple] start, openid:', openid, 'inviteCode:', inviteCode)

    const { data: couples } = await db.collection('couples').where({ inviteCode }).get()
    if (couples.length === 0) return { code: -1, message: '邀请码无效', data: null }
    const couple = couples[0]
    if (couple.members.length >= 2) return { code: -1, message: '该邀请码已绑定', data: null }

    // 更新 couples 的 members
    await db.collection('couples').doc(couple._id).update({
      data: { members: db.command.addToSet(openid) }
    })
    console.info('[bindCouple] couples.members 更新成功')

    // 更新 users 的 coupleId 和 nickname
    const updateRes = await db.collection('users').where({ _openid: openid }).update({
      data: { coupleId: couple._id, nickname: nickname || '良人' }
    })
    console.info('[bindCouple] users 更新结果:', JSON.stringify(updateRes))

    // 如果 update 匹配 0 条，尝试创建 user 文档（兜底）
    if (updateRes.stats.updated === 0) {
      console.warn('[bindCouple] users 未匹配到文档，尝试创建')
      await db.collection('users').add({
        data: { _openid: openid, openid, nickname: nickname || '良人', avatar: '', coupleId: couple._id, createTime: db.serverDate() }
      })
      console.info('[bindCouple] users 文档已创建')
    }

    const { data: beasts } = await db.collection('beasts').where({ coupleId: couple._id }).get()
    console.info('[bindCouple] success:', couple._id)
    return {
      code: 0,
      message: 'success',
      data: {
        coupleId: couple._id,
        beast: beasts[0] || null,
        openid
      }
    }
  } catch (err) {
    console.error('[bindCouple] error:', err)
    return { code: -1, message: err.message || '绑定失败', data: null }
  }
}
