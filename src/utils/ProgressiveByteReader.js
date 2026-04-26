export default class ProgressiveByteReader {
  /**
   * @param {AsyncIterator<Uint8Array>} iterator
   */
  constructor(iterator) {
    this._iterator = iterator;
    /** @type {Uint8Array[]} */
    this._buffers = [];
    this._bufferedLength = 0;
    this._done = false;
  }

  /**
   * @param {number} nbBytes
   * @returns {Promise<void>}
   */
  async ensure(nbBytes) {
    while (!this._done && this._bufferedLength < nbBytes) {
      const next = await this._iterator.next();
      if (next.done) {
        this._done = true;
        break;
      }

      if (next.value.length > 0) {
        this._buffers.push(next.value);
        this._bufferedLength += next.value.length;
      }
    }
  }

  /**
   * @returns {number}
   */
  getBufferedLength() {
    return this._bufferedLength;
  }

  /**
   * @returns {boolean}
   */
  isDone() {
    return this._done && this._bufferedLength === 0;
  }

  /**
   * @param {number} nbBytes
   * @returns {Uint8Array}
   */
  takeAvailable(nbBytes) {
    const size = Math.min(nbBytes, this._bufferedLength);
    const result = new Uint8Array(size);
    let resultOffset = 0;

    while (resultOffset < size) {
      const buffer = this._buffers[0];
      const copiedLength = Math.min(buffer.length, size - resultOffset);
      result.set(buffer.subarray(0, copiedLength), resultOffset);
      resultOffset += copiedLength;

      if (copiedLength === buffer.length) {
        this._buffers.shift();
      } else {
        this._buffers[0] = buffer.subarray(copiedLength);
      }
      this._bufferedLength -= copiedLength;
    }

    return result;
  }

  /**
   * @param {number} nbBytes
   * @returns {Promise<Uint8Array>}
   */
  async read(nbBytes) {
    await this.ensure(nbBytes);
    return this.takeAvailable(nbBytes);
  }

  /**
   * @param {number} nbBytes
   * @param {(chunk: Uint8Array) => void | Promise<void>} onChunk
   * @returns {Promise<Uint8Array>}
   */
  async readWithCallback(nbBytes, onChunk) {
    return this._readConsumed(nbBytes, onChunk);
  }

  /**
   * @param {number} nbBytes
   * @returns {Promise<number>}
   */
  async skip(nbBytes) {
    return this._skipConsumed(nbBytes);
  }

  /**
   * @param {number} nbBytes
   * @param {(chunk: Uint8Array) => void | Promise<void>} onChunk
   * @returns {Promise<number>}
   */
  async skipWithCallback(nbBytes, onChunk) {
    return this._skipConsumed(nbBytes, onChunk);
  }

  /**
   * @returns {Promise<number>}
   */
  async skipUntilEnd() {
    return this._skipConsumed(undefined);
  }

  /**
   * @param {(chunk: Uint8Array) => void | Promise<void>} onChunk
   * @returns {Promise<number>}
   */
  async skipUntilEndWithCallback(onChunk) {
    return this._skipConsumed(undefined, onChunk);
  }

  /**
   * @returns {Promise<Uint8Array>}
   */
  async readUntilEnd() {
    return this._readConsumed(undefined);
  }

  /**
   * @param {(chunk: Uint8Array) => void | Promise<void>} onChunk
   * @returns {Promise<Uint8Array>}
   */
  async readUntilEndWithCallback(onChunk) {
    return this._readConsumed(undefined, onChunk);
  }

  /**
   * @param {number | undefined} nbBytes
   * @param {((chunk: Uint8Array) => void | Promise<void>)=} onChunk
   * @returns {Promise<number>}
   */
  async _skipConsumed(nbBytes, onChunk) {
    return this._consume(nbBytes, onChunk, false);
  }

  /**
   * @param {number | undefined} nbBytes
   * @param {((chunk: Uint8Array) => void | Promise<void>)=} onChunk
   * @returns {Promise<Uint8Array>}
   */
  async _readConsumed(nbBytes, onChunk) {
    return this._consume(nbBytes, onChunk, true);
  }

  /**
   * @param {number | undefined} nbBytes
   * @param {((chunk: Uint8Array) => void | Promise<void>) | undefined} onChunk
   * @param {boolean} collect
   * @returns {Promise<any>}
   */
  async _consume(nbBytes, onChunk, collect) {
    let remaining = nbBytes;
    let consumed = 0;
    /** @type {Uint8Array[]} */
    const chunks = [];

    while (remaining === undefined || remaining > 0) {
      await this.ensure(1);
      if (this._bufferedLength === 0) {
        break;
      }

      const chunkLength =
        remaining === undefined
          ? this._bufferedLength
          : Math.min(remaining, this._bufferedLength);
      const chunk = this.takeAvailable(chunkLength);
      consumed += chunk.length;
      if (remaining !== undefined) {
        remaining -= chunk.length;
      }
      if (collect) {
        chunks.push(chunk);
      }
      await onChunk?.(chunk);
    }

    if (!collect) {
      return consumed;
    }

    const result = new Uint8Array(consumed);
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }
    return result;
  }
}
