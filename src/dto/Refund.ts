/**
 * Represents a refund object with details of the refund transaction.
 *
 * @interface Refund
 *
 * @property {number} chainId - The identifier of the blockchain network where the refund transaction occurs.
 * @property {string} tx - The concatenation of the time stamp and the hash of the associated `Transfer` object.
 * @property {string} signedTx - The solver service signature of the `tx` property.
 */
interface Refund {
    chainId: number;
    tx: string;
    signedTx: string;
}

export {Refund};
