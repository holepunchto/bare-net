module.exports = class NetError extends Error {
  constructor(msg, fn = NetError, code = fn.name) {
    super(`${code}: ${msg}`)

    this.code = code

    if (Error.captureStackTrace) Error.captureStackTrace(this, fn)
  }

  get name() {
    return 'NetError'
  }

  static SERVER_ALREADY_LISTENING(msg) {
    return new NetError(msg, NetError.SERVER_ALREADY_LISTENING)
  }
}
