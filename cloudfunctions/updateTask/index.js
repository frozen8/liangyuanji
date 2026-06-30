const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

// 降妖任务类型 → 灵石簿分类映射（来自 src/types/ledger.ts TASK_TO_LEDGER_CATEGORY）
const TASK_TO_LEDGER_CATEGORY = {
  dress: 'dress',
  hotel: 'hotel',
  banquet: 'catering',
  invitation: 'decoration',
  gift: 'gift',
  shopping: 'other',
  other: 'other'
}

// 境界阈值表（与 finishCultivate 和前端 REALM_LIST 保持一致）
const REALM_THRESHOLDS = [
  { level: 'mortal', min: 0, max: 500 },
  { level: 'qiRefining', min: 500, max: 2000 },
  { level: 'foundation', min: 2000, max: 5000 },
  { level: 'goldenCore', min: 5000, max: 12000 },
  { level: 'nascentSoul', min: 12000, max: 25000 },
  { level: 'spiritSevering', min: 25000, max: 999999 }
]

const REALM_TO_STAGE = {
  mortal: 'egg',
  qiRefining: 'baby',
  foundation: 'baby',
  goldenCore: 'adult',
  nascentSoul: 'adult',
  spiritSevering: 'divine',
  ascension: 'divine'
}

function calcRealm(cultivation) {
  for (const r of REALM_THRESHOLDS) {
    if (cultivation >= r.min && cultivation < r.max) return r.level
  }
  return 'spiritSevering'
}

exports.main = async (event, context) => {
  try {
    const wxContext = cloud.getWXContext()
    const openid = wxContext.OPENID
    const { taskId, status, actualStones, budgetStones } = event

    // v1.1：预算灵石创建后不可修改
    if (budgetStones !== undefined) {
      return { code: -1, message: '预算灵石创建后不可修改', data: null }
    }

    const { data: users } = await db.collection('users').where({ _openid: openid }).get()
    if (users.length === 0) return { code: -1, message: '用户不存在', data: null }
    const coupleId = users[0].coupleId
    if (!coupleId) return { code: -1, message: '未绑定关系', data: null }

    const { data: task } = await db.collection('tasks').doc(taskId).get()
    if (!task) return { code: -1, message: '任务不存在', data: null }
    // 数据隔离校验
    if (task.coupleId !== coupleId) return { code: -1, message: '无权操作此任务', data: null }
    // 幂等性校验：已完成任务不可再次完成（防重复降服）
    if (status === 'done' && task.status === 'done') {
      return { code: -1, message: '该妖兽已降服，无需重复操作', data: null }
    }

    const updateData = {}
    if (status) updateData.status = status

    // 完成任务：必须填写实际花费
    if (status === 'done') {
      if (actualStones === undefined || actualStones < 0) {
        return { code: -1, message: '请填写实际花费灵石', data: null }
      }

      const budget = task.budgetStones || 0
      const savedStones = budget - actualStones // 正=节省，负=超支

      // 计算基础修为
      const baseCultivation = (task.difficulty || 1) * 35
      // 节省奖励修为：每节省100灵石=10修为
      const savedBonus = savedStones > 0 ? Math.floor(savedStones / 100) * 10 : 0
      // 心情变化
      let moodBonus = 0
      if (savedStones > 0) {
        moodBonus = Math.min(Math.floor((savedStones / 200) * 3), 15)
      } else if (savedStones < 0) {
        moodBonus = -Math.min(Math.floor((-savedStones / 200) * 5), 20)
      }

      const reward = {
        cultivation: baseCultivation + savedBonus,
        moodBonus,
        savedBonus
      }

      updateData.actualStones = actualStones
      updateData.savedStones = savedStones
      updateData.reward = reward
      updateData.completeTime = db.serverDate()
      updateData.completer = openid
      updateData.completerName = users[0].nickname || '良人'

      await db.collection('tasks').doc(taskId).update({ data: updateData })

      // 自动生成账单
      const ledgerCategory = TASK_TO_LEDGER_CATEGORY[task.category] || 'other'
      const today = new Date().toISOString().slice(0, 10)
      const ledgerRes = await db.collection('ledgers').add({
        data: {
          coupleId,
          amount: actualStones,
          category: ledgerCategory,
          note: `降妖·${task.title}`,
          date: today,
          recorder: openid,
          recorderName: users[0].nickname || '良人',
          recorderAvatar: users[0].avatar || '',
          createTime: db.serverDate(),
          sourceType: 'task',
          taskId,
          taskTitle: task.title
        }
      })

      // 更新灵兽修为 + 心情 + 境界突破 + 宠物进化
      const { data: beasts } = await db.collection('beasts').where({ coupleId }).get()
      let breakthrough = null
      if (beasts.length > 0) {
        const beast = beasts[0]
        const oldCultivation = beast.cultivation || 0
        const newCultivation = oldCultivation + reward.cultivation
        const oldRealm = beast.realm || 'mortal'
        const newRealm = calcRealm(newCultivation)
        const oldStage = beast.stage || 'egg'
        const newStage = REALM_TO_STAGE[newRealm] || 'egg'

        const beastUpdate = {
          cultivation: _.inc(reward.cultivation),
          stats: {
            satiety: Math.min(100, (beast.stats?.satiety || 60) + 10),
            mood: Math.max(0, Math.min(100, (beast.stats?.mood || 60) + moodBonus)),
            spirit: beast.stats?.spirit || 0,
            affinity: beast.stats?.affinity || 0
          }
        }

        if (newRealm !== oldRealm) {
          beastUpdate.realm = newRealm
          breakthrough = { type: 'realm', from: oldRealm, to: newRealm }
        }
        if (newStage !== oldStage) {
          beastUpdate.stage = newStage
          beastUpdate.evolveTime = db.serverDate()
          breakthrough = breakthrough
            ? { ...breakthrough, type: 'both', fromStage: oldStage, toStage: newStage }
            : { type: 'stage', from: oldStage, to: newStage }
        }

        await db.collection('beasts').doc(beast._id).update({ data: beastUpdate })

        if (breakthrough) {
          console.info('[updateTask] breakthrough:', JSON.stringify(breakthrough), 'newCultivation:', newCultivation)
        }
      }

      // 计算最新预算状态
      const { data: budgets } = await db.collection('budgets').where({ coupleId }).get()
      const budgetDoc = budgets[0] || { totalBudget: 0, stoneRate: 1 }
      const { data: ledgers } = await db.collection('ledgers').where({ coupleId }).get()
      const spent = ledgers.reduce((s, l) => s + (l.amount || 0), 0)
      const totalBudget = budgetDoc.totalBudget || 0
      const stoneRate = budgetDoc.stoneRate || 1
      const remain = totalBudget - spent
      const budgetStatus = {
        total: totalBudget,
        spent,
        remain,
        spentPercent: totalBudget > 0 ? Math.round((spent / totalBudget) * 100) : 0,
        isOverBudget: spent > totalBudget,
        stoneRate,
        remainRmb: remain * stoneRate,
        spentRmb: spent * stoneRate
      }

      // 返回最新任务（含 _id→id 映射）
      const { data: latestTask } = await db.collection('tasks').doc(taskId).get()
      const taskResult = { ...latestTask, id: latestTask._id }

      console.info('[updateTask] done success:', taskId, 'saved:', savedStones)
      return {
        code: 0,
        message: 'success',
        data: {
          task: taskResult,
          reward,
          breakthrough,
          ledger: { id: ledgerRes._id, coupleId, amount: actualStones, category: ledgerCategory, note: `降妖·${task.title}`, date: today, sourceType: 'task', taskId, taskTitle: task.title },
          budgetStatus
        }
      }
    }

    // 非完成态：仅更新状态
    if (Object.keys(updateData).length > 0) {
      await db.collection('tasks').doc(taskId).update({ data: updateData })
    }
    const { data: latestTask } = await db.collection('tasks').doc(taskId).get()
    const taskResult = { ...latestTask, id: latestTask._id }

    console.info('[updateTask] success:', taskId, status)
    return {
      code: 0,
      message: 'success',
      data: { task: taskResult, reward: task.reward }
    }
  } catch (err) {
    console.error('[updateTask] error:', err)
    return { code: -1, message: err.message || '更新失败', data: null }
  }
}
