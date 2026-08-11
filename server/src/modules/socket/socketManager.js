/**
 * socketManager.js — Socket.IO singleton
 * Allows any backend module to emit events without needing a req reference.
 * Usage: import { getIO } from '../../socket/socketManager.js';
 */

let _io = null;

export const initIO = (io) => {
  _io = io;
};

export const getIO = () => {
  if (!_io) {
    throw new Error('[SocketManager] Socket.IO not initialised — call initIO(io) in server.js first.');
  }
  return _io;
};
