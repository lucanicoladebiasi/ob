/**
 * Represents a balance in a cryptocurrency or token account.
 *
 * This interface defines the structure for keeping track of the balance
 * associated with a specific account address and token.
 *
 * @interface Balance
 * @property {string} address - The blockchain address of the account.
 * @property {string} token - The identifier or symbol of the token.
 * @property {number} amount - The amount of the token held by the account.
 */
interface Balance {
    address: string;
    token: string;
    amount: number;
}

export { Balance };
