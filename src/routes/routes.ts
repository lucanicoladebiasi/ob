import {DB} from "../db";
import {Hex} from "viem";
import {Pool} from 'pg';
import {Request, Response, Router} from 'express';
import {ThreadSafeMap} from "../synch";
import {isValidTransfer, SignedTransfer, Transfer} from "../dto";

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

/**
 * Returns all the transactions representing executed transfers,
 * sorted chronologically, yhe most recent first,
 * reverted and not reverted.
 */
router.get('/transactions', async (_req: Request, res: Response): Promise<void> => {
    try {
        const transactions = await db.getTransactions();
        res.status(200).json(transactions);
    } catch (error) {
        console.error("Error fetching transactions:", error);
        res.status(500).json({message: "Internal Server Error"});
    }
})

/**
 * Execute a transfer order adjusting balances of sender and receiver addresses.
 *
 * * Check the `Transfer` body is valid;
 * * verify the sender signature;
 * * fill the `Refund` data and sign as "solver" service;
 * * lock the involved balances;
 * * check the sender has sufficient funds in the designated token;
 * * delegate the DB layer to update balances;
 * * return the result of the operation to the client.
 */
router.post('/transfer', async (req: Request, res: Response): Promise<void> => {
        try {
            const body = req.body
            if (isValidTransfer(body)) {
                const transfer = body as Transfer;
                const isVerified = await SignedTransfer.verify(transfer);
                if (isVerified) {
                    transfer.refund = await SignedTransfer.signForRefund(transfer, solver.private as Hex);
                    const tx = transfer.refund.tx.split(':');
                    const tx_ts = tx[0]; // time stamp
                    const tx_id = tx[1]; // tx identifier
                    const lockKey = `${transfer.sender}:${transfer.targetChain.receiver}:${transfer.token.address}`;
                    const isFree = await LOCK_MAP.compareAndSetValue(lockKey, true, (lock) => !lock);
                    if (isFree) {
                        let senderBalances = await db.getBalancesForAddressAndToken(transfer.sender, transfer.token.address);
                        if (senderBalances.length > 0) {
                            const senderBalance = senderBalances[0];
                            let receiverBalances = await db.getBalancesForAddressAndToken(transfer.targetChain.receiver, transfer.token.address)
                            if (receiverBalances.length > 0) {
                                const receiverBalance = receiverBalances[0];
                                let transfer_token_amount: number = Number(transfer.token.amount.toString());
                                let senderBalance_amount: number = Number(senderBalance.amount.toString());
                                let receiverBalance_amount: number = Number(receiverBalance.amount.toString());
                                if (transfer_token_amount < senderBalance_amount) {
                                    senderBalance_amount -= transfer_token_amount;
                                    receiverBalance_amount += transfer_token_amount;
                                    const balances = await db.transfer(
                                        tx_ts,
                                        tx_id,
                                        senderBalance.address,
                                        receiverBalance.address,
                                        transfer_token_amount,
                                        transfer.token.address,
                                        senderBalance_amount,
                                        receiverBalance_amount
                                    );
                                    res.status(200).json({
                                        transfer: transfer,
                                        sender: balances.sender,
                                        receiver: balances.receiver,
                                    });
                                } else {
                                    res.status(403).json({message: 'Insufficient funds.'});
                                }
                            } else {
                                res.status(404).json({message: 'No receiver balance found.'});
                            }
                        } else {
                            res.status(404).json({message: 'No sender balance found.'});
                        }
                        await LOCK_MAP.delete(lockKey);
                    } else {
                        res.status(409).json({message: 'Transaction already in progress.'});
                    }
                } else {
                    res.status(403).json({message: 'Invalid signature.'});
                }
            } else {
                res.status(400).json({message: 'Invalid transfer request.'});
            }
        } catch
            (error) {
            console.error("Error transferring tokens:", error);
            res.status(500).json({message: 'Internal Server Error.'});
        }
    }
)

export default router;



