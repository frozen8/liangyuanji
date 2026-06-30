const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  try {
    const wxContext = cloud.getWXContext()
    const openid = wxContext.OPENID
    const { data: users } = await db.collection('users').where({ _openid: openid }).get()
    if (users.length === 0) return { code: 0, message: 'success', data: { achievements: [] } }
    const coupleId = users[0].coupleId
    const { data: achievements } = await db.collection('achievements').where({ coupleId }).get()
    const achievementsWithId = achievements.map((a) => ({ ...a, id: a._id }))
    console.info('[getAchievements] success:', achievementsWithId.length)
    return { code: 0, message: 'success', data: { achievements: achievementsWithId } }
  } catch (err) {
    console.error('[getAchievements] error:', err)
    return { code: -1, message: err.message || '获取失败', data: null }
  }
}