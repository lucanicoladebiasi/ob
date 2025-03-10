import {Hex, keccak256, stringToHex} from "viem";
import {Refund} from "./Refund";
import {Transfer} from "./Transfer";
import {sign as crypto_sign, verify as crypto_verify} from "../crypto";

/**
 * Represents a signed transfer, including the sender, token details, target chain information
 * as well as an optional refund and a cryptographic signature.
 *
 * This class implements the Transfer interface and provides methods for signing, verifying,
 * and handling refunds for a cross-chain transfer transaction.
 */
class SignedTransfer implements Transfer {
    /**
     * Represents the sender of a message or communication.
     * This variable typically contains the identifier, name, or address
     * of the entity that has originated the message.
     */
    sender: string;

    /**
     * Represents a token with an associated address and amount.
     *
     * @typedef {Object} token
     * @property {string} address - The address associated with the token.
     * @property {number} amount - The amount of the token.
     */
    token: { address: string; amount: number; };

    /**
     * Represents the target chain information in a blockchain interaction.
     *
     * @typedef {Object} targetChain
     * @property {number} chainId - The unique identifier of the blockchain network.
     * @property {string} receiver - The address of the receiver on the target chain.
     */
    targetChain: { chainId: number; receiver: string; };

    /**
     * Represents an optional property `refund` describing a refund object.
     * This property is used to store the details of a refund and may or may not be defined.
     *
     * @type {Refund|undefined}
     */
    refund?: Refund;

    /**
     * Represents the sender signature.
     */
    signature: string;

    /**
     * Initializes a new instance of the class with the given transfer details.
     *
     * @param {Transfer} transfer - The transfer object containing details such as sender, token, target chain, refund, and signature.
     * @return {void}
     */
    constructor(transfer: Transfer) {
        this.sender = transfer.sender;
        this.token = transfer.token;
        this.targetChain = transfer.targetChain;
        this.refund = transfer.refund;
        this.signature = transfer.signature;
    }

    /**
     * Signs a transfer object with the provided sender's private key.
     *
     * @param {Transfer} transfer - The transfer object containing the transaction details.
     * @param {Hex} senderPrivateKey - The private key of the sender used to sign the transfer.
     * @return {Promise<SignedTransfer>} A promise that resolves to a signed transfer object including the signature and other details.
     */
    static async sign(transfer: Transfer, senderPrivateKey: Hex): Promise<SignedTransfer> {
        const sensitiveInfo = {...transfer, refund: undefined, signature: undefined};
        const json = JSON.stringify(sensitiveInfo);
        const hex = stringToHex(json);
        const signature = await crypto_sign(senderPrivateKey, hex);
        return new SignedTransfer({...sensitiveInfo, refund: transfer.refund, signature: signature});
    }

    /**
     * Signs a refund transaction based on the provided transfer details and private key.
     *
     * @param {Transfer} transfer - The transfer object containing details of the transaction to be refunded.
     * @param {Hex} solverServicePrivateKey - The private key used to sign the refund transaction.
     * @return {Promise<Refund>} A promise that resolves to the Refund object containing chainId, tx, and signedTx.
     */
    static async signForRefund(transfer: Transfer, solverServicePrivateKey: Hex): Promise<Refund> {
        const now = Date.now();
        const sensitiveInfo = {...transfer, refund: undefined};
        const json = JSON.stringify(sensitiveInfo);
        const hex = stringToHex(json);
        const hash = keccak256(hex);
        const tx = `${now}:${hash}`;
        const signedTx = await crypto_sign(solverServicePrivateKey, stringToHex(tx),);
        return {
            chainId: transfer.targetChain.chainId,
            tx: tx,
            signedTx: signedTx
        } satisfies Refund;
    }

    /**
     * Verifies the authenticity of the given transfer object by checking the sender's signature
     * against the hashed transfer data.
     *
     * @param {Transfer} transfer - The transfer object containing sender, signature, and other data.
     *                              The refund and signature fields are excluded from the data used for verification.
     * @return {Promise<boolean>} A promise that resolves to a boolean indicating whether the verification was successful.
     */
    static async verify(transfer: Transfer): Promise<boolean> {
        const sensitiveInfo = {...transfer, refund: undefined, signature: undefined};
        const json = JSON.stringify(sensitiveInfo);
        const hex = stringToHex(json);
        const sender: Hex = transfer.sender as Hex;
        const signature: Hex = transfer.signature as Hex;
        return await crypto_verify(sender, signature, hex);
    }

    /**
     * Verifies the validity of a refund transaction by utilizing the provided Sover service address.
     *
     * @param {Refund} refund - The refund object containing details of the transaction to be verified.
     * @param {Hex} soverServiceAddress - The hexadecimal address of the Sover service used for verification.
     * @return {Promise<boolean>} A promise that resolves to a boolean indicating whether the refund transaction is valid.
     */
    static async verifyRefund(refund: Refund, soverServiceAddress: Hex): Promise<boolean> {
        return await crypto_verify(soverServiceAddress, refund.signedTx as Hex, stringToHex(refund.tx));
    }

}

export {SignedTransfer};
