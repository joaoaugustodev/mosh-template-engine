const mosh = require('../index')
const http = require('http')

const mh = mosh('./', {
  filters: {
    upper (str) {
      return str.toUpperCase()
    }
  }
})

const app = http.createServer((req, res) => {
  mh.express(req, res)

  res.render('/index', {
    users: [
      { name: 'john' },
      { name: 'doe' },
      { name: 'jane' }
    ]
  })
})

app.listen(3000)
