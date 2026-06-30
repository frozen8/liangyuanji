export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/quest/index',
    'pages/ledger/index',
    'pages/cultivate/index',
    'pages/mine/index',
    'pages/task-detail/index',
    'pages/task-create/index',
    'pages/ledger-detail/index',
    'pages/ledger-create/index',
    'pages/ledger-stats/index',
    'pages/cultivate-history/index',
    'pages/beast-pedia/index',
    'pages/achievement/index',
    'pages/invite/index',
    'pages/wedding-day/index',
    'pages/budget-edit/index',
    'pages/settings/index'
  ],
  window: {
    backgroundTextStyle: 'dark',
    navigationBarBackgroundColor: '#fff8f3',
    navigationBarTitleText: '良缘纪',
    navigationBarTextStyle: 'black',
    backgroundColor: '#fff8f3'
  },
  tabBar: {
    custom: true,
    color: '#A89AAC',
    selectedColor: '#FF6B9D',
    backgroundColor: '#FFFFFF',
    borderStyle: 'white',
    list: [
      { pagePath: 'pages/home/index', text: '灵兽窝' },
      { pagePath: 'pages/quest/index', text: '降妖录' },
      { pagePath: 'pages/ledger/index', text: '灵石簿' },
      { pagePath: 'pages/cultivate/index', text: '修炼阁' },
      { pagePath: 'pages/mine/index', text: '仙府' }
    ]
  }
})
