const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  try {
    const wxContext = cloud.getWXContext()
    const openid = wxContext.OPENID
    const { status, category } = event || {}
    const { data: users } = await db.collection('users').where({ _openid: openid }).get()
    if (users.length === 0) return { code: 0, message: 'success', data: { tasks: [] } }
    const coupleId = users[0].coupleId
    if (!coupleId) return { code: 0, message: 'success', data: { tasks: [] } }

    const condition = { coupleId }
    if (status && status !== 'all') condition.status = status
    if (category && category !== 'all') condition.category = category

    const { data: tasks } = await db.collection('tasks').where(condition).orderBy('createTime', 'desc').get()

    // _id → id 映射，对齐前端类型
    const tasksWithId = tasks.map((t) => ({ ...t, id: t._id }))

    console.info('[getTasks] success:', tasksWithId.length)
    return { code: 0, message: 'success', data: { tasks: tasksWithId } }
  } catch (err) {
    console.error('[getTasks] error:', err)
    return { code: -1, message: err.message || '获取失败', data: null }
  }
}
