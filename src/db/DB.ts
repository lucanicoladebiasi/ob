import {Pool} from "pg";
import {Balance} from "../dto";

/**
 * The DB class provides methods to interact with a database to manage and retrieve balances.
 */
class DB {
    /**
     * Represents a connection pool for managing and reusing database connections.
     * The pool facilitates efficient management of database connections by
     * limiting the total number of simultaneous connections and reusing them
     * whenever possible. It helps improve performance and manage resource usage
     * effectively in applications that require frequent database interaction.
     *
     * @typedef {Object} Pool
     */
    private readonly pool: Pool;

    /**
     * Constructs an instance of the class with a specified database pool.
     *
     * @param {Pool} pool - The database connection pool to be used by the instance.
     * @return {void} - Does not return a value.
     */
    constructor(pool: Pool) {
        this.pool = pool;
    }

    /**
     * Retrieves all balances from the database.
     *
     * @return {Promise<Balance[]>} A promise that resolves to an array of balance objects, where each balance object contains address, token, and amount properties.
     */
    async getAllBalances(): Promise<Balance[]> {
        const result = await this.pool.query('SELECT address, token, amount FROM balances');
        return result.rows.map((row: { address: string; token: string; amount: number; }) => ({
            address: row.address,
            token: row.token,
            amount: row.amount,
        } satisfies Balance));
    }

    /**
     * Retrieves the balances associated with a specific address from the database.
     *
     * @param {string} address - The address for which the balances should be fetched.
     * @return {Promise<Balance[]>} A promise that resolves to an array of balance objects containing the address, token, and amount.
     */
    async getBalancesForAddress(address: string): Promise<Balance[]> {
        const result = await this.pool.query('SELECT address, token, amount FROM balances WHERE address = $1', [address]);
        return result.rows.map((row: { address: string; token: string; amount: number; }) => ({
            address: row.address,
            token: row.token,
            amount: row.amount,
        } satisfies Balance));
    }

    /**
     * Fetches balance information for a specific address and token.
     *
     * @param {string} address - The address for which to retrieve balances.
     * @param {string} token - The token for which to retrieve balances.
     * @return {Promise<Balance[]>} A promise that resolves to an array of Balance objects containing address, token, and amount details.
     */
    async getBalancesForAddressAndToken(address: string, token: string): Promise<Balance[]> {
        const result = await this.pool.query('SELECT address, token, amount FROM balances WHERE address = $1 AND token = $2', [address, token]);
        return result.rows.map((row: { address: string; token: string; amount: number; }) => ({
            address: row.address,
            token: row.token,
            amount: row.amount,
        } satisfies Balance))
    }

    /**
     * Updates the balance for a specific address and token to a given amount.
     *
     * @param {string} address - The address whose balance is to be updated.
     * @param {string} token - The token for which the balance is to be updated.
     * @param {number} amount - The new balance amount to be set.
     * @return {Promise<Balance[]>} - A promise that resolves to the updated list of balances for the given address and token.
     */
    async setBalance(address: string, token: string, amount: number): Promise<Balance[]> {
        await this.pool.query('UPDATE balances SET amount = $3 WHERE address = $1 AND token = $2', [address, token, amount]);
        return this.getBalancesForAddressAndToken(address, token);
    }

    /**
     * Transfers a specified amount of tokens from a sender to a receiver and updates the balances in the database.
     *
     * @param {string} tx_ts - The timestamp of the transaction.
     * @param {string} tx_id - The unique identifier for the transaction.
     * @param {string} tx_sender - The address of the sender.
     * @param {string} tx_receiver - The address of the receiver.
     * @param {number} tx_amount - The amount of tokens to transfer.
     * @param {string} token - The type of token being transferred.
     * @param {number} senderAmount - The updated balance for the sender after the transfer.
     * @param {number} receiverAmount - The updated balance for the receiver after the transfer.
     * @return {Promise<{sender: Balance, receiver: Balance}>} A promise that resolves with the updated balances for both the sender and receiver.
     */
    async transfer(
        tx_ts: string,
        tx_id: string,
        tx_sender: string,
        tx_receiver: string,
        tx_amount: number,
        token: string,
        senderAmount: number,
        receiverAmount: number
    ): Promise<{ sender: Balance, receiver: Balance }> {
        await this.pool.query('BEGIN');
        await this.pool.query(
            'INSERT INTO transactions (tx_ts, tx_id, sender, receiver, token, amount, reverted) VALUES ($1, $2, $3, $4, $5, $6, false)',
            [tx_ts, tx_id, tx_sender, tx_receiver, token, tx_amount]
        );
        await this.pool.query('UPDATE balances SET amount = $3 WHERE address = $1 AND token = $2', [tx_sender, token, senderAmount]);
        await this.pool.query('UPDATE balances SET amount = $3 WHERE address = $1 AND token = $2', [tx_receiver, token, receiverAmount]);
        await this.pool.query('COMMIT');
        const senderBalances = await this.getBalancesForAddressAndToken(tx_sender, token);
        const receiverBalances = await this.getBalancesForAddressAndToken(tx_receiver, token);
        return {sender: senderBalances[0], receiver: receiverBalances[0]};
    }

}

export {DB}


