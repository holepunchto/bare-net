import EventEmitter, { EventMap } from 'bare-events'
import { Duplex, DuplexEvents } from 'bare-stream'
import { PipeConnectOptions, PipeServerListenOptions } from 'bare-pipe'
import {
  TCPSocketAddress,
  TCPSocketConnectOptions,
  TCPServerListenOptions,
  isIP,
  isIPv4,
  isIPv6
} from 'bare-tcp'
import constants from './lib/constants'
import errors from './lib/errors'

export { constants, errors, isIP, isIPv4, isIPv6 }

/** Options accepted when constructing a `NetSocket` or `NetServer`. */
export interface NetOptions {
  /** Keep the writable side of the socket open after the readable side ends. Defaults to `false`. */
  allowHalfOpen?: boolean
  /** Open the socket immediately instead of waiting for the first write. Defaults to `false`. */
  eagerOpen?: boolean
  /** Size, in bytes, of the socket's internal read buffer. Defaults to `65536`. */
  readBufferSize?: number
}

/** Events emitted by a `NetSocket`, extending the underlying duplex stream's events. */
export interface NetSocketEvents extends DuplexEvents {
  /** Emitted once the socket has connected. */
  connect: []
}

export interface NetSocketConnectOptions extends PipeConnectOptions, TCPSocketConnectOptions {}

interface NetSocket<M extends NetSocketEvents = NetSocketEvents> extends Duplex<M> {
  /** `true` while the underlying socket is in the process of connecting. */
  readonly connecting: boolean
  /** `true` if the socket hasn't been assigned an underlying TCP or IPC socket yet. */
  readonly pending: boolean
  /** The socket's current inactivity timeout, in milliseconds. */
  readonly timeout?: number
  /** Current connection state of the socket. */
  readonly readyState: 'open' | 'readOnly' | 'writeOnly' | 'opening'
  /** Local IP address the socket is connected on, if connected over TCP. */
  readonly localAddress?: string
  /** Local port the socket is connected on, if connected over TCP. */
  readonly localPort?: number
  /** Local IP address family, if connected over TCP. */
  readonly localFamily?: string
  /** Remote IP address the socket is connected to, if connected over TCP. */
  readonly remoteAddress?: string
  /** Remote port the socket is connected to, if connected over TCP. */
  readonly remotePort?: number
  /** Remote IP address family, if connected over TCP. */
  readonly remoteFamily?: string

  /**
   * Connect the socket to a `path` over IPC, or to a `port`/`host` over TCP.
   * @param path - The path to connect to over IPC.
   * @param opts - Connection options passed to the underlying socket; `path`, `port`, and `host` may be given here instead of as positional arguments.
   * @param onconnect - Called once when the socket emits `'connect'`.
   */
  connect(path: string, opts?: PipeConnectOptions, onconnect?: () => void): this
  connect(path: string, onconnect: () => void): this
  connect(port: number, host?: string, opts?: TCPSocketConnectOptions, onconnect?: () => void): this
  connect(port: number, host: string, onconnect: () => void): this
  connect(port: number, onconnect: () => void): this
  connect(opts: NetSocketConnectOptions, onconnect?: () => void): this

  /** Enable or disable TCP keep-alive on the underlying socket. */
  setKeepAlive(enable?: boolean, delay?: number): this
  setKeepAlive(delay: number): this

  /** Enable or disable Nagle's algorithm on the underlying socket. */
  setNoDelay(enable?: boolean): this

  /** Set the socket's inactivity timeout. */
  setTimeout(ms: number, ontimeout?: () => void): this

  /** Reference the socket, keeping the event loop alive while it is open. */
  ref(): this
  /** Unreference the socket, allowing the event loop to exit while it is open. */
  unref(): this
}

declare class NetSocket {
  /** Create a `NetSocket`. */
  constructor(opts?: NetOptions)
}

export { type NetSocket, NetSocket as Socket }

/** Events emitted by a `NetServer`. */
export interface NetServerEvents extends EventMap {
  /** Emitted once the server has closed. */
  close: []
  /** Emitted when a client connects, with the accepted `NetSocket`. */
  connection: [socket: NetSocket]
  /** Emitted when the server encounters an error. */
  error: [err: Error]
  /** Emitted once the server is listening. */
  listening: []
}

export interface NetServerListenOptions extends PipeServerListenOptions, TCPServerListenOptions {}

interface NetServer<M extends NetServerEvents = NetServerEvents> extends EventEmitter<M> {
  /** `true` if the server is currently listening for connections. */
  readonly listening: boolean

  /** Returns the address the server is listening on, or `null` if it isn't listening. */
  address(): string | TCPSocketAddress | null

  /**
   * Start the server listening on a `path` over IPC, or a `port`/`host` over TCP.
   * @param path - The path to listen on over IPC.
   * @param backlog - The maximum length of the queue of pending connections.
   * @param onlistening - Called once when the server emits `'listening'`.
   */
  listen(
    path: string,
    backlog?: number,
    opts?: PipeServerListenOptions,
    onlistening?: () => void
  ): this
  listen(path: string, backlog: number, onlistening: () => void): this
  listen(path: string, onlistening: () => void): this
  listen(
    port?: number,
    host?: string,
    backlog?: number,
    opts?: TCPServerListenOptions,
    onlistening?: () => void
  ): this
  listen(port: number, host: string, backlog: number, onlistening: () => void): this
  listen(port: number, host: string, onlistening: () => void): this
  listen(port: number, onlistening: () => void): this
  listen(onlistening: () => void): this
  listen(opts: NetServerListenOptions, onlistening?: () => void): this

  /**
   * Stop the server from accepting new connections.
   * @param onclose - Called once when the server emits `'close'`.
   */
  close(onclose: (err?: Error) => void): this

  /** Reference the server, keeping the event loop alive while it is listening. */
  ref(): this
  /** Unreference the server, allowing the event loop to exit while it is listening. */
  unref(): this
}

declare class NetServer {
  /** Create a `NetServer`, optionally registering a `connection` listener. */
  constructor(opts?: NetOptions, onconnection?: (socket: NetSocket) => void)
  constructor(onconnection: (socket: NetSocket) => void)
}

export { type NetServer, NetServer as Server }

/**
 * Create a `NetSocket` and connect it over IPC if a `path` is given, otherwise over TCP.
 * @param path - The path to connect to over IPC.
 * @param opts - Options for the socket and connection; if `path` is set the socket connects over IPC, otherwise over TCP.
 * @param onconnect - Called when the connection is established.
 */
export function createConnection(
  path: string,
  opts?: NetOptions & PipeConnectOptions,
  onconnect?: () => void
): NetSocket

export function createConnection(path: string, onconnect: () => void): NetSocket

export function createConnection(
  port: number,
  host?: string,
  opts?: NetOptions & TCPSocketConnectOptions,
  onconnect?: () => void
): NetSocket

export function createConnection(port: number, host: string, onconnect: () => void): NetSocket

export function createConnection(port: number, onconnect: () => void): NetSocket

export function createConnection(
  opts: NetOptions & NetSocketConnectOptions,
  onconnect?: () => void
): NetSocket

export { createConnection as connect }

/**
 * Create a `NetServer`, optionally registering a `connection` listener.
 * @param opts - Options applied to each accepted socket; `readBufferSize` defaults to `65536`, and `allowHalfOpen` and `pauseOnConnect` to `false`.
 * @param onconnection - Called on each `'connection'` event.
 */
export function createServer(
  opts?: NetOptions,
  onconnection?: (socket: NetSocket) => void
): NetServer

export function createServer(onconnection: (socket: NetSocket) => void): NetServer
