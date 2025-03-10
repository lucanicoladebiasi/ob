/**
 * Represents a cryptocurrency transaction with all relevant details.
 *
 * @interface Transaction
 *
 * @property {string} tx_ts - Timestamp of the transaction in ISO 8601 format.
 * @property {string} tx_id - Unique identifier for the transaction.
 * @property {string} sender - Address or identifier of the transaction sender.
 * @property {string} receiver - Address or identifier of the transaction receiver.
 * @property {string} token - Identifier for the token being transacted.
 * @property {number} amount - Number of tokens transferred in the transaction.
 * @property {boolean} reverted - Indicates whether the transaction was reverted or failed.
 */
interface Transaction {
    tx_ts: string;
    tx_id: string;
    sender: string;
    receiver: string;
    token: string;
    amount: number;
    reverted: boolean;
}

export {Transaction};
