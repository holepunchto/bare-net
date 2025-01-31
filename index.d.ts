import EventEmitter, { EventMap } from 'bare-events'
import { Duplex, DuplexEvents } from 'bare-stream'
import {
  Pipe,
  Server as PipeServer,
  createConnection as createPipeConnection,
  createServer as createPipeServer
} from 'bare-pipe'
import {
  TCPSocket,
  TCPServer,
  createConnection as createTCPConnection,
  createServer as createTCPServer,
  isIP,
  isIPv4,
  isIPv6
} from 'bare-tcp'

declare const constants: {
  type: { TCP: 1; IPC: 2 }
  state: { UNREFED: number }
}

interface NetOptions {
  allowHalfOpen?: boolean
  readBufferSize?: number
}

interface NetSocketEvents extends DuplexEvents {
  connect: []
}

declare interface NetSocket<M extends NetSocketEvents = NetSocketEvents>
  extends Duplex<M> {
  readonly connecting: boolean
  readonly pending: boolean

  connect: Pipe['connect'] & TCPSocket['connect']

  ref(): void
  unref(): void
}

declare class NetSocket {
  constructor(opts?: NetOptions)
}

interface NetServerEvents extends EventMap {
  close: []
  connection: [socket: NetSocket]
  error: [err: Error]
  listening: []
}

declare interface NetServer<M extends NetServerEvents = NetServerEvents>
  extends EventEmitter<M> {
  readonly listening: boolean

  address(): (PipeServer['address'] & TCPServer['address']) | null

  listen: PipeServer['listen'] & TCPServer['listen']

  close(onclose: () => void): void

  ref(): void
  unref(): void
}

declare class NetServer {
  constructor(opts?: NetOptions, onconnection?: (socket: NetSocket) => void)
  constructor(onconnection: (socket: NetSocket) => void)
}

declare function createConnection(
  ...args: Parameters<typeof createPipeConnection & typeof createTCPConnection>
): NetSocket

declare function createServer(
  ...args: Parameters<typeof createPipeServer & typeof createTCPServer>
): NetServer

export {
  constants,
  NetSocket as Socket,
  NetServer as Server,
  isIP,
  isIPv4,
  isIPv6,
  createConnection,
  createConnection as connect,
  createServer
}

export type {
  NetOptions,
  NetSocketEvents,
  NetSocket,
  NetServerEvents,
  NetServer
}
