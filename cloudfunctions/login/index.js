const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  try {
    const wxContext = cloud.getWXContext()
    const openid = wxContext.OPENID
    const users = db.collection('users')
    const { data } = await users.where({ _openid: openid }).get()
    let userInfo
    if (data.length === 0) {
      const res = await users.add({ data: { openid, nickname: '良人', avatar: '', coupleId: '', createTime: db.serverDate() } })
      userInfo = { _id: res._id, openid, nickname: '良人', avatar: '', coupleId: '' }
    } else {
      userInfo = data[0]
    }
    console.info('[login] success:', openid)
    return { code: 0, message: 'success', data: { openid, userInfo } }
  } catch (err) {
    console.error('[login] error:', err)
    return { code: -1, message: err.message || '登录失败', data: null }
  }
}