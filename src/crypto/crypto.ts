import {english, generateMnemonic, HDAccount, mnemonicToAccount, privateKeyToAccount} from 'viem/accounts'
import {bytesToHex, Hex, verifyMessage} from 'viem';

/**
 * Generates a specified number of HD accounts (Hierarchical Deterministic accounts)
 * using a mnemonic phrase. A secret mnemonic can be optionally provided; otherwise,
 * a new mnemonic is generated.
 *
 * @param {number} n - The number of HD accounts to generate.
 * @param {string} [secret] - An optional secret mnemonic phrase to use for generating accounts. If not provided, a new mnemonic is created.
 * @return {HDAccount[]} An array of generated HD accounts.
 */
function createAddresses(n: number, secret?: string): HDAccount[] {
    const hdAccounts: HDAccount[] = [];
    try {
        // Step 1: Generate a mnemonic (or use an existing secret one)
        const mnemonic = secret ? secret : generateMnemonic(english);
        console.log('Secret Mnemonic:', mnemonic);
        // Step 2: Derive three HDKey instances using different derivation paths
        for (let i = 0; i < n; i++) {
            const hdAccount = mnemonicToAccount(mnemonic, {path: `m/44'/60'/0'/0/${i}`});
            hdAccounts.push(hdAccount);
            const hdKey = hdAccount.getHdKey();
            const privateKey = hdKey.privateKey ? bytesToHex(hdKey.privateKey) : '0x';
            const publicKey = hdKey.publicKey ? bytesToHex(hdKey.publicKey) : '0x';
            console.log(`Address ${i}:`, hdAccount.address, 'PRV:', privateKey, 'PUB:', publicKey);
        }
    } catch (error) {
        console.error('Error generating HDKeys:', error);
    }
    return hdAccounts;
}

/**
 * Signs a given message using the provided private key.
 *
 * @param {Hex} privateKey - The private key to be used for signing the message.
 * @param {Hex} message - The message to be signed.
 * @return {Promise<Hex>} A promise that resolves to the signed message in hexadecimal format.
 */
async function sign(privateKey: Hex, message: Hex): Promise<Hex> {
    const account = privateKeyToAccount(privateKey);
    return await account.signMessage({message});
}

/**
 * Verifies the authenticity of a message based on the provided address, signature, and message.
 *
 * @param {Hex} address - The public address associated with the signer of the message.
 * @param {Hex} signature - The cryptographic signature for the message.
 * @param {Hex} message - The message that was signed.
 * @return {Promise<boolean>} A promise that resolves to true if the verification is successful, otherwise false.
 */
async function verify(address: Hex, signature: Hex, message: Hex): Promise<boolean> {
    return await verifyMessage({address, signature, message});
}

export {createAddresses, sign, verify};
