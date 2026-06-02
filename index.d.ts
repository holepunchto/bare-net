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

export { constants, isIP, isIPv4, isIPv6 }

export interface NetOptions {
  allowHalfOpen?: boolean
  eagerOpen?: boolean
  readBufferSize?: number
}

export interface NetSocketEvents extends DuplexEvents {
  connect: []
}

export interface NetSocketConnectOptions extends PipeConnectOptions, TCPSocketConnectOptions {}

interface NetSocket<M extends NetSocketEvents = NetSocketEvents> extends Duplex<M> {
  readonly connecting: boolean
  readonly pending: boolean
  readonly timeout?: number
  readonly readyState: 'open' | 'readOnly' | 'writeOnly' | 'opening'
  readonly localAddress?: string
  readonly localPort?: number
  readonly localFamily?: string
  readonly remoteAddress?: string
  readonly remotePort?: number
  readonly remoteFamily?: string

  connect(path: string, opts?: PipeConnectOptions, onconnect?: () => void): this
  connect(path: string, onconnect: () => void): this
  connect(port: number, host?: string, opts?: TCPSocketConnectOptions, onconnect?: () => void): this
  connect(port: number, host: string, onconnect: () => void): this
  connect(port: number, onconnect: () => void): this
  connect(opts: NetSocketConnectOptions, onconnect?: () => void): this

  setKeepAlive(enable?: boolean, delay?: number): this
  setKeepAlive(delay: number): this

  setNoDelay(enable?: boolean): this

  setTimeout(ms: number, ontimeout?: () => void): this

  ref(): this
  unref(): this
}

declare class NetSocket {
  constructor(opts?: NetOptions)
}

export { type NetSocket, NetSocket as Socket }

export interface NetServerEvents extends EventMap {
  close: []
  connection: [socket: NetSocket]
  error: [err: Error]
  listening: []
}

export interface NetServerListenOptions extends PipeServerListenOptions, TCPServerListenOptions {}

interface NetServer<M extends NetServerEvents = NetServerEvents> extends EventEmitter<M> {
  readonly listening: boolean

  address(): string | TCPSocketAddress | null

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

  close(onclose: (err?: Error) => void): this

  ref(): this
  unref(): this
}

declare class NetServer {
  constructor(opts?: NetOptions, onconnection?: (socket: NetSocket) => void)
  constructor(onconnection: (socket: NetSocket) => void)
}

export { type NetServer, NetServer as Server }

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

export function createServer(
  opts?: NetOptions,
  onconnection?: (socket: NetSocket) => void
): NetServer

export function createServer(onconnection: (socket: NetSocket) => void): NetServer
