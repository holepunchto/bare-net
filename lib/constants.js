module.exports = {
  type: {
    TCP: 1,
    IPC: 2
  },
  state: {
    UNREFED: 0x1,
    BINDING: 0x2,
    BOUND: 0x4
  }
}
