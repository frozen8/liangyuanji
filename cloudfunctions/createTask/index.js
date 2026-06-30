const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  try {
    const wxContext = cloud.getWXContext()
    const openid = wxContext.OPENID
    const { title, category, difficulty, deadline, note, assigneeName, budgetStones } = event

    // v1.1：预算灵石必填
    if (!budgetStones || budgetStones <= 0) {
      return { code: -1, message: '请填写预算灵石', data: null }
    }
    if (!title || !title.trim()) {
      return { code: -1, message: '请输入任务标题', data: null }
    }

    const { data: users } = await db.collection('users').where({ _openid: openid }).get()
    if (users.length === 0) return { code: -1, message: '用户不存在', data: null }
    const coupleId = users[0].coupleId
    if (!coupleId) return { code: -1, message: '未绑定关系', data: null }

    const diff = difficulty || 1
    // 重构后 reward 仅基础修为（难度×35），无 spirit
    const reward = { cultivation: diff * 35, moodBonus: 0, savedBonus: 0 }

    const taskRes = await db.collection('tasks').add({
      data: {
        coupleId,
        title: title.trim(),
        category: category || 'other',
        difficulty: diff,
        deadline: deadline || '2026-12-31',
        status: 'pending',
        assignee: openid,
        assigneeName: assigneeName || users[0].nickname || '',
        budgetStones,
        note: note || '',
        reward,
        createTime: db.serverDate()
      }
    })

    console.info('[createTask] success:', taskRes._id)
    return {
      code: 0,
      message: 'success',
      data: {
        task: {
          id: taskRes._id,
          coupleId,
          title: title.trim(),
          category: category || 'other',
          difficulty: diff,
          deadline: deadline || '2026-12-31',
          status: 'pending',
          assigneeName: assigneeName || users[0].nickname || '',
          budgetStones,
          note: note || '',
          reward
        }
      }
    }
  } catch (err) {
    console.error('[createTask] error:', err)
    return { code: -1, message: err.message || '创建失败', data: null }
  }
}
