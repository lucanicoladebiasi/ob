import {DB} from "../db";
import {Pool} from 'pg';
import {Request, Response, Router} from 'express';
import {ThreadSafeMap} from "../synch";

/**
 * A thread-safe map instance designed to store lock states for specific keys.
 * The keys are strings, and the values are boolean indicating the lock status.
 *
 * This map can be used in concurrent environments to manage and track
 * locking states associated with particular resources or operations.
 *
 * - `true`: Indicates that the key/resource is locked.
 * - `false`: Indicates that the key/resource is unlocked or available.
 *
 * The underlying implementation ensures thread-safety to prevent race
 * conditions or inconsistent state when accessed by multiple threads.
 *
 * Type: `ThreadSafeMap<string, boolean>`
 */
export const LOCK_MAP = new ThreadSafeMap<string, boolean>()

/**
 * Represents a connection pool to a PostgreSQL database.
 * The pool manages multiple client connections to optimize database operations.
 *
 * @type {Pool}
 * @property {string} user - The username used to authenticate with the database.
 * @property {string} host - The host name of the database server.
 * @property {string} database - The name of the database to connect to.
 * @property {string} password - The password used to authenticate the user with the database.
 * @property {number} port - The port number on which the database server is running.
 */
const pool = new Pool({
    user: 'ob',
    host: 'localhost',
    database: 'ob',
    password: 'ob',
    port: 5432
});

/**
 * The `solver` object contains blockchain-related credentials including an address and a private key.
 * This could be used for cryptographic operations, authentication, or contract interactions on the blockchain.
 *
 * @property {string} address - The public address associated with the `solver`, used for sending or receiving transactions.
 * @property {string} private - The private key associated with the `solver`, used for signing transactions or encrypting data.
 *                              Should be handled securely to prevent unauthorized access.
 */
const solver = {
    address: '0x4c066bAC41dC11b7029D06826093202154280709',
    private: '0x2feb4c1dcc3d4de880c585f988ee711baa54bddf1c59c84af3efaab2d248ec6f'
}

/**
 * Represents a database connection manager.
 *
 * @class DB
 * @param {Object} pool - The connection pool used to manage database connections.
 *
 * @description
 * Provides methods to interact with a database using a specified connection pool.
 * Facilitates executing queries, managing transactions, and other database operations.
 */
const db = new DB(pool);

/**
 * Represents the main router instance used for defining and handling application routes.
 * This object is typically utilized to map URL paths to specific request handlers
 * or middleware functions in a web application.
 *
 * The `router` variable is an instance of the `Router` class, allowing you to:
 * - Define route-specific middleware for enhanced request/response processing.
 * - Assign handlers for HTTP methods (GET, POST, PUT, DELETE, etc.) at specified paths.
 * - Group and nest routes for better modularity and organization of route handling.
 * - Implement middleware functions applicable to specific subsets of your application's requests.
 *
 * It is primarily used as a foundational component in HTTP-based servers or applications.
 */
const router: Router = Router();

/**
 * Returns the list of all the balances of addressed stakeholder.
 */
router.get('/balances', async (_req: Request, res: Response): Promise<void> => {
    try {
        const balances = await db.getAllBalances();
        res.status(200).json(balances);
    } catch (error) {
        console.error("Error fetching all balances:", error);
        res.status(500).json({message: "Internal Server Error"});
    }
})

/**
 * Returns the list of all the balances of a specific stakeholder identified by its address.
 */
router.get('/balances/:address', async (req: Request, res: Response): Promise<void> => {
    const {address} = req.params;
    try {
        const balances = await db.getBalancesForAddress(address);
        if (balances.length > 0) {
            res.status(200).json(balances);
        } else {
            res.status(404).json({message: 'No balances found.'});
        }
    } catch (error) {
        console.error('Error fetching balance for address:', error);
        res.status(500).json({message: 'Internal Server Error.'});
    }
})

/**
 * Returns the balance of token of a specific stakeholder identified by its address.
 */
router.get('/balances/:address/:token', async (req: Request, res: Response): Promise<void> => {
    const {address, token} = req.params;
    try {
        const balances = await db.getBalancesForAddressAndToken(address, token);
        if (balances.length > 0) {
            res.status(200).json(balances[0]);
        } else {
            res.status(404).json({message: `No balances found`});
        }
    } catch (error) {
        console.error('Error fetching balances for address and token:', error);
        res.status(500).json({message: 'Internal Server Error.'});
    }
})

export default router;



