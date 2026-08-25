# bare-net

TCP and IPC servers and clients for JavaScript.

```
npm i bare-net
```

## Usage

```js
const net = require('bare-net')

const server = net.createServer()
server.on('connection', (socket) => socket.on('data', console.log))
server.listen(() => console.log('server is up'))

const { port } = server.address()
const socket = net.createConnection(port)
socket.write('hello world')
```

## API

See the [`bare-net` reference](https://docs.pears.com/reference/bare/modules/bare-net).

## License

Apache-2.0
