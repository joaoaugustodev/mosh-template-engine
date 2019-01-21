module.exports = {
  capitalize (str) {
    return str
      .split(' ')
      .map(item => item[0].toUpperCase() + item.slice(1).toLowerCase()).join(' ')
  },

  compose (...fns) {
    return fns.reduce((f, g) => (...args) => f(g(...args)))
  }
}
