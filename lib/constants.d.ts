/** Connection type and internal state flags used by sockets and servers. */
declare const constants: {
  type: { TCP: 1; IPC: 2 }
  state: { UNREFED: number; BINDING: number; BOUND: number }
}

export = constants
