const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  try {
    const wxContext = cloud.getWXContext()
    const openid = wxContext.OPENID
    const { taskId } = event

    if (!taskId) {
      return { code: -1, message: '缺少任务 ID', data: null }
    }

    const { data: users } = await db.collection('users').where({ _openid: openid }).get()
    if (users.length === 0) return { code: -1, message: '用户不存在', data: null }
    const coupleId = users[0].coupleId
    if (!coupleId) return { code: -1, message: '未绑定关系', data: null }

    const { data: task } = await db.collection('tasks').doc(taskId).get()
    if (!task) return { code: -1, message: '任务不存在', data: null }
    // 数据隔离校验
    if (task.coupleId !== coupleId) return { code: -1, message: '无权操作此任务', data: null }

    // v1.1：禁止删除已完成任务，仅可归档
    if (task.status === 'done') {
      return { code: -1, message: '已降服的妖兽不可删除，仅可归档', data: null }
    }

    await db.collection('tasks').doc(taskId).remove()

    console.info('[deleteTask] success:', taskId)
    return { code: 0, message: 'success', data: { ok: true } }
  } catch (err) {
    console.error('[deleteTask] error:', err)
    return { code: -1, message: err.message || '删除失败', data: null }
  }
}
