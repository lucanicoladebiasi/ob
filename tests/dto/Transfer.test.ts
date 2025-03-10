import {isValidTransfer, Transfer} from "../../src/dto";

describe('Transfer interface tests', () => {

    describe('isValidTransfer', () => {

        test('false <- missing signature', () => {
            const transfer = {
                sender: '0x095182ADDea1Dd59221D1750D95f78b0c15B0e1C',
                token: {
                    address: '0xF0CACC1A',
                    amount: 16
                },
                targetChain: {
                    chainId: 42, // The Hitchhiker's Guide to the Galaxy final value answer.
                    receiver: '0x5965c1C60b5191bd270d385589355503f575a136'
                },
            };
            expect(isValidTransfer(transfer)).toBeFalsy();
        })

        test('true <- valid', () => {
            const transfer = {
                sender: '0x095182ADDea1Dd59221D1750D95f78b0c15B0e1C',
                token: {
                    address: '0xF0CACC1A',
                    amount: 16
                },
                targetChain: {
                    chainId: 42, // The Hitchhiker's Guide to the Galaxy final value answer.
                    receiver: '0x5965c1C60b5191bd270d385589355503f575a136'
                },
                signature: 'UNSIGNED'
            } satisfies Transfer
            expect(isValidTransfer(transfer)).toBeTruthy();
        })

    })
})
