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
   * @returns {Promise<number>}
   */
  async skip(nbBytes) {
    let remaining = nbBytes;
    let skipped = 0;

    while (remaining > 0) {
      await this.ensure(1);
      if (this._bufferedLength === 0) {
        break;
      }

      const skippedThisRound = Math.min(remaining, this._bufferedLength);
      this.takeAvailable(skippedThisRound);
      remaining -= skippedThisRound;
      skipped += skippedThisRound;
    }

    return skipped;
  }

  /**
   * @returns {Promise<number>}
   */
  async skipUntilEnd() {
    let skipped = 0;

    while (true) {
      await this.ensure(1);
      if (this._bufferedLength === 0) {
        break;
      }
      const skippedThisRound = this._bufferedLength;
      this.takeAvailable(skippedThisRound);
      skipped += skippedThisRound;
    }

    return skipped;
  }

  /**
   * @returns {Promise<Uint8Array>}
   */
  async readUntilEnd() {
    /** @type {Uint8Array[]} */
    const chunks = [];
    let totalLength = 0;

    while (true) {
      await this.ensure(1);
      if (this._bufferedLength === 0) {
        break;
      }
      const chunk = this.takeAvailable(this._bufferedLength);
      chunks.push(chunk);
      totalLength += chunk.length;
    }

    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }

    return result;
  }
}
