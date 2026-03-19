const EventEmitter = require('bare-events')
const { Duplex } = require('bare-stream')
const tcp = require('bare-tcp')
const pipe = require('bare-pipe')
const constants = require('./lib/constants')

const defaultReadBufferSize = 65536

exports.Socket = class NetSocket extends Duplex {
  constructor(opts = {}) {
    const {
      readBufferSize = defaultReadBufferSize,
      allowHalfOpen = false,
      eagerOpen = false
    } = opts

    super({ eagerOpen, allowHalfOpen })

    this._type = 0
    this._state = 0
    this._socket = null

    this._opts = { readBufferSize, allowHalfOpen, eagerOpen }

    this._pendingOpen = null
    this._pendingWrite = null
    this._pendingFinal = null
    this._pendingDestroy = null
  }

  get connecting() {
    return this._socket !== null && this._socket.connecting
  }

  get pending() {
    return this._socket === null || this._socket.pending
  }

  get timeout() {
    return this._socket === null ? undefined : this._socket.timeout
  }

  get readyState() {
    return this._socket === null ? 'opening' : this._socket.readyState
  }

  get localAddress() {
    return this._socket === null ? undefined : this._socket.localAddress
  }

  get localPort() {
    return this._socket === null ? undefined : this._socket.localPort
  }

  get localFamily() {
    return this._socket === null ? undefined : this._socket.localFamily
  }

  get remoteAddress() {
    return this._socket === null ? undefined : this._socket.remoteAddress
  }

  get remotePort() {
    return this._socket === null ? undefined : this._socket.remotePort
  }

  get remoteFamily() {
    return this._socket === null ? undefined : this._socket.remoteFamily
  }

  connect(...args) {
    let opts = {}
    let onconnect

    if (typeof args[0] === 'string') {
      // connect(path[, onconnect])
      opts.path = args[0]
      onconnect = args[1]
    } else if (typeof args[0] === 'number') {
      // connect(port[, host][, onconnect])
      opts.port = args[0]

      if (typeof args[1] === 'function') {
        onconnect = args[1]
      } else {
        opts.host = args[1]
        onconnect = args[2]
      }
    } else {
      // connect(opts[, onconnect])
      opts = args[0] || {}
      onconnect = args[1]
    }

    opts = { ...opts, ...this._opts }

    if (opts.path) {
      this._attach(constants.type.IPC, pipe.createConnection(opts))
    } else {
      this._attach(constants.type.TCP, tcp.createConnection(opts))
    }

    if (onconnect) this.once('connect', onconnect)

    return this
  }

  setKeepAlive(...args) {
    if (this._socket !== null) this._socket.setKeepAlive(...args)
    return this
  }

  setNoDelay(...args) {
    if (this._socket !== null) this._socket.setNoDelay(...args)
    return this
  }

  setTimeout(...args) {
    if (this._socket !== null) this._socket.setTimeout(...args)
    return this
  }

  ref() {
    this._state &= ~constants.state.UNREFED
    if (this._socket !== null) this._socket.ref()
    return this
  }

  unref() {
    this._state |= constants.state.UNREFED
    if (this._socket !== null) this._socket.unref()
    return this
  }

  _attach(type, socket) {
    this._type = type
    this._socket = socket

    this._socket
      .on('connect', this._onconnect.bind(this))
      .on('timeout', this._ontimeout.bind(this))
      .on('error', this._onerror.bind(this))
      .on('data', this._ondata.bind(this))
      .on('end', this._onend.bind(this))
      .on('finish', this._onfinish.bind(this))
      .on('drain', this._ondrain.bind(this))
      .on('close', this._onclose.bind(this))

    if (this._state & constants.state.UNREFED) this._socket.unref()

    this._continueOpen()

    return this
  }

  _open(cb) {
    if (this._socket !== null) return cb(null)
    this._pendingOpen = cb
  }

  _write(data, encoding, cb) {
    if (this._socket.write(data)) return cb(null)
    this._pendingWrite = cb
  }

  _final(cb) {
    this._socket.end()
    this._pendingFinal = cb
  }

  _destroy(err, cb) {
    if (this._socket === null || this._socket.destroyed) return cb(null)

    this._socket.destroy(err)
    this._pendingDestroy = cb
  }

  _onconnect() {
    this.emit('connect')
  }

  _ontimeout() {
    this.emit('timeout')
  }

  _onerror(err) {
    this.destroy(err)
  }

  _ondata(data) {
    this.push(data)
  }

  _onend() {
    this.push(null)
  }

  _onfinish() {
    this._continueFinal()
  }

  _ondrain() {
    this._continueWrite()
  }

  _onclose() {
    this._continueWrite()
    this._continueFinal()

    if (this._pendingDestroy) this._continueDestroy()
    else this.destroy()
  }

  _continueOpen() {
    if (this._pendingOpen === null) return
    const cb = this._pendingOpen
    this._pendingOpen = null
    cb(null)
  }

  _continueWrite() {
    if (this._pendingWrite === null) return
    const cb = this._pendingWrite
    this._pendingWrite = null
    cb(null)
  }

  _continueFinal() {
    if (this._pendingFinal === null) return
    const cb = this._pendingFinal
    this._pendingFinal = null
    cb(null)
  }

  _continueDestroy() {
    if (this._pendingDestroy === null) return
    const cb = this._pendingDestroy
    this._pendingDestroy = null
    cb(null)
  }
}

exports.Server = class NetServer extends EventEmitter {
  constructor(opts = {}, onconnection) {
    if (typeof opts === 'function') {
      onconnection = opts
      opts = {}
    }

    super()

    const {
      readBufferSize = defaultReadBufferSize,
      allowHalfOpen = false,
      pauseOnConnect = false
    } = opts

    this._type = 0
    this._state = 0
    this._server = null

    this._opts = { readBufferSize, allowHalfOpen, pauseOnConnect }

    if (onconnection) this.on('connection', onconnection)
  }

  get listening() {
    return this._server !== null && this._server.listening
  }

  address() {
    return this._server === null ? null : this._server.address()
  }

  listen(...args) {
    let opts = {}
    let onlistening

    if (typeof args[0] === 'string') {
      // listen(path[, backlog][, onlistening])
      opts.path = args[0]

      if (typeof args[1] === 'function') {
        onlistening = args[1]
      } else {
        opts.backlog = args[1]
        onlistening = args[2]
      }
    } else {
      // listen([port[, host[, backlog]]][, onlistening])
      if (typeof args[0] === 'function') {
        onlistening = args[0]
      } else {
        opts.port = args[0]

        if (typeof args[1] === 'function') {
          onlistening = args[1]
        } else {
          opts.host = args[1]

          if (typeof args[2] === 'function') {
            onlistening = args[2]
          } else {
            opts.backlog = args[2]
            onlistening = args[3]
          }
        }
      }
    }

    opts = { ...opts, ...this._opts }

    if (opts.path) {
      this._attach(constants.type.IPC, pipe.createServer(opts))
    } else {
      this._attach(constants.type.TCP, tcp.createServer(opts))
    }

    this._server.listen(opts)

    if (onlistening) this.once('listening', onlistening)

    return this
  }

  close(onclose) {
    if (onclose) this.once('close', onclose)
    this._server.close()
    return this
  }

  ref() {
    this._state &= ~constants.state.UNREFED
    if (this._server !== null) this._server.ref()
    return this
  }

  unref() {
    this._state |= constants.state.UNREFED
    if (this._server !== null) this._server.unref()
    return this
  }

  _attach(type, server) {
    this._type = type
    this._server = server

    this._server
      .on('listening', this._onlistening.bind(this))
      .on('connection', this._onconnection.bind(this))
      .on('error', this._onerror.bind(this))
      .on('close', this._onclose.bind(this))

    if (this._state & constants.state.UNREFED) this._server.unref()

    return this
  }

  _onlistening() {
    this.emit('listening')
  }

  _onconnection(socket) {
    this.emit('connection', new exports.Socket(this._opts)._attach(this._type, socket))
  }

  _onerror(err) {
    this.emit('error', err)
  }

  _onclose() {
    this.emit('close')
  }
}

exports.constants = constants

exports.isIP = tcp.isIP
exports.isIPv4 = tcp.isIPv4
exports.isIPv6 = tcp.isIPv6

exports.createConnection = function createConnection(...args) {
  let opts = {}
  let onconnect

  if (typeof args[0] === 'string') {
    // createConnection(path[, onconnect])
    opts.path = args[0]
    onconnect = args[1]
  } else if (typeof args[0] === 'number') {
    // createConnection(port[, host][, onconnect])
    opts.port = args[0]

    if (typeof args[1] === 'function') {
      onconnect = args[1]
    } else {
      opts.host = args[1]
      onconnect = args[2]
    }
  } else {
    // createConnection(opts[, onconnect])
    opts = args[0] || {}
    onconnect = args[1]
  }

  return new exports.Socket(opts).connect(opts, onconnect)
}

// For Node.js compatibility
exports.connect = exports.createConnection

exports.createServer = function createServer(opts, onconnection) {
  return new exports.Server(opts, onconnection)
}
