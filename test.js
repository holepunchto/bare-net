const test = require('brittle')
const net = require('.')

const isWindows = Bare.platform === 'win32'

test('tcp', (t) => {
  t.plan(10)

  const server = net.createServer((socket) => {
    t.ok(socket instanceof net.Socket)

    socket
      .on('data', (data) => t.alike(data, Buffer.from('hello client'), 'server received data'))
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
      .on('data', (data) => t.alike(data, Buffer.from('hello server'), 'client received data'))
      .on('end', () => t.pass('client socket ended'))
      .on('close', () => t.pass('client socket closed'))
      .connect(server.address().port, () => {
        t.pass('connected')
        socket.end('hello client')
      })
  })
})

test('tcp, destroy server socket', (t) => {
  t.plan(5)

  const server = net.createServer((socket) => {
    socket
      .on('close', () => {
        t.pass('server socket closed')
        server.close(() => t.pass('server closed'))
      })
      .destroy()
  })

  server.listen(0, () => {
    t.pass('listening')

    const socket = new net.Socket()
    socket
      .on('close', () => t.pass('client socket closed'))
      .connect(server.address().port, () => {
        t.pass('connected')
      })
  })
})

test('tcp, destroy client socket', (t) => {
  t.plan(5)

  const server = net.createServer((socket) => {
    socket.on('close', () => {
      t.pass('server socket closed')
      server.close(() => t.pass('server closed'))
    })
  })

  server.listen(0, () => {
    t.pass('listening')

    const socket = new net.Socket()
    socket
      .on('close', () => t.pass('client socket closed'))
      .connect(server.address().port, () => {
        t.pass('connected')
        socket.destroy()
      })
  })
})

test('ipc', (t) => {
  t.plan(10)

  const server = net.createServer((socket) => {
    t.ok(socket instanceof net.Socket)

    socket
      .on('data', (data) => t.alike(data, Buffer.from('hello client'), 'server received data'))
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
      .on('data', (data) => t.alike(data, Buffer.from('hello server'), 'client received data'))
      .on('end', () => t.pass('client socket ended'))
      .on('close', () => t.pass('client socket closed'))
      .connect(server.address(), () => {
        t.pass('connected')
        socket.end('hello client')
      })
  })
})

test('tcp, listen while listening', (t) => {
  t.plan(4)

  const server = net.createServer()

  server.listen(0, () => {
    t.pass('listening')

    const { port } = server.address()

    t.exception(() => server.listen(0), { code: 'SERVER_ALREADY_LISTENING' })
    t.is(server.address().port, port, 'still bound to the same port')

    server.close(() => t.pass('server closed'))
  })
})

test('ipc, listen while listening', (t) => {
  t.plan(4)

  const server = net.createServer()
  const path = name()

  server.listen(path, () => {
    t.pass('listening')

    t.exception(() => server.listen(name()), { code: 'SERVER_ALREADY_LISTENING' })
    t.is(server.address(), path, 'still bound to the same path')

    server.close(() => t.pass('server closed'))
  })
})

test('tcp, listen after close', (t) => {
  t.plan(5)

  const server = net.createServer()

  server.listen(0, () => {
    t.pass('listening')

    server.close(() => {
      t.pass('server closed')
      t.absent(server.listening, 'not listening')

      server.listen(0, () => {
        t.pass('listening again')

        server.close(() => t.pass('server closed again'))
      })
    })
  })
})

test('tcp, listen after failed listen', (t) => {
  t.plan(4)

  const first = net.createServer()

  first.listen(0, () => {
    const server = net.createServer()

    server.on('error', (err) => {
      t.is(err.code, 'EADDRINUSE', 'address in use')
      t.absent(server.listening, 'not listening')

      server.listen(0, () => {
        t.pass('listening')

        server.close(() => first.close(() => t.pass('servers closed')))
      })
    })

    server.listen(first.address().port)
  })
})

function name() {
  const name =
    'bare-pipe-' + Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2)
  return isWindows ? '\\\\.\\pipe\\' + name : '/tmp/' + name + '.sock'
}
