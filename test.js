const test = require('brittle')
const net = require('.')

const isWindows = Bare.platform === 'win32'

test('tcp', (t) => {
  t.plan(10)

  const server = net.createServer((socket) => {
    t.ok(socket instanceof net.Socket)

    socket
      .on('data', (data) =>
        t.alike(data, Buffer.from('hello client'), 'server received data')
      )
      .on('end', () => t.pass('server socket ended'))
      .on('close', () => {
        t.pass('server socket closed')
        server.close(() => t.pass('server closed'))
      })
      .end('hello server')
  })

  server.listen(0, () => {
    t.pass('listening')

    const socket = new net.Socket()
    socket
      .on('data', (data) =>
        t.alike(data, Buffer.from('hello server'), 'client received data')
      )
      .on('end', () => t.pass('client socket ended'))
      .on('close', () => t.pass('client socket closed'))
      .connect(server.address().port, () => {
        t.pass('connected')
        socket.end('hello client')
      })
  })
})

test('ipc', (t) => {
  t.plan(10)

  const server = net.createServer((socket) => {
    t.ok(socket instanceof net.Socket)

    socket
      .on('data', (data) =>
        t.alike(data, Buffer.from('hello client'), 'server received data')
      )
      .on('end', () => t.pass('server socket ended'))
      .on('close', () => {
        t.pass('server socket closed')
        server.close(() => t.pass('server closed'))
      })
      .end('hello server')
  })

  server.listen(name(), () => {
    t.pass('listening')

    const socket = new net.Socket()
    socket
      .on('data', (data) =>
        t.alike(data, Buffer.from('hello server'), 'client received data')
      )
      .on('end', () => t.pass('client socket ended'))
      .on('close', () => t.pass('client socket closed'))
      .connect(server.address(), () => {
        t.pass('connected')
        socket.end('hello client')
      })
  })
})

function name() {
  const name =
    'bare-pipe-' +
    Math.random().toString(16).slice(2) +
    Math.random().toString(16).slice(2)
  return isWindows ? '\\\\.\\pipe\\' + name : '/tmp/' + name + '.sock'
}
