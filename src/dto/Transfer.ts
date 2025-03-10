import {Refund} from "./Refund";

/**
 * Represents a transfer operation including sender information, token details, target chain details, refund, and signature.
 */
interface Transfer {
    sender: string;
    token: {
        address: string;
        amount: number;
    },
    targetChain: {
        chainId: number;
        receiver: string;
    }
    refund?: Refund
    signature: string;
}

/**
 * Determines whether the provided object adheres to the structure of a valid Transfer object.
 *
 * `.refund` property is computed by the solver service hence not considered for validation when
 * the `Transfer` object is accepted.
 *
 * @param {any} obj - The object to be validated.
 * @return {boolean} Returns true if the object meets the criteria for a Transfer object, otherwise false.
 */
function isValidTransfer(obj: any): obj is Transfer {
    return (
        typeof obj === 'object' &&
        obj !== null &&
        typeof obj.sender === 'string' &&
        typeof obj.token.address === 'string' &&
        typeof obj.token.amount === 'number' &&
        typeof obj.targetChain.receiver === 'string' &&
        typeof obj.signature === 'string'
    );
}


export {isValidTransfer, Transfer};
