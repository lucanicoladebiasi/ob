import {Pool} from "pg";
import {Balance, Transaction} from "../dto";

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

}

export {DB}


