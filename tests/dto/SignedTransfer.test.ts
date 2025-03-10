import {describe, expect, test} from "@jest/globals";
import {SignedTransfer, Transfer} from "../../src/dto";
import {Hex} from "viem";

describe('SignedTransfer class tests', () => {

    const receiver = {
        address: '0x5965c1C60b5191bd270d385589355503f575a136',
        private: '0xf0d297cce44d996fd032d9a8d69bd459958cb121db23c2ab47733653bba0a428' // Used to test forge signature.
    };

    const sender = {
        address: '0x095182ADDea1Dd59221D1750D95f78b0c15B0e1C',
        private: '0x48d406c92700d07721f6d094d52d14b59348300569c0090dad07b814cc6ae1a6'
    }

    const token = '0xF0CACC1A';

    const unsigned = {
        sender: sender.address,
        token: {
            address: token,
            amount: 16
        },
        targetChain: {
            chainId: 42, // The Hitchhiker's Guide to the Galaxy final value answer.
            receiver: receiver.address,
        },
        signature: 'UNSIGNED'
    } satisfies Transfer

    describe('sign(...) and verify(...)', () => {

        test('true <- valid', async () => {
            const signed = await SignedTransfer.sign(unsigned, sender.private as Hex)
            expect(signed.signature).not.toBe(unsigned.signature);
            const isVerified = await SignedTransfer.verify(signed);
            expect(isVerified).toBeTruthy();
        })

        test('false <- forged signature', async () => {
            const signed = await SignedTransfer.sign(unsigned, sender.private as Hex)
            signed.signature = (await SignedTransfer.sign(unsigned, receiver.private as Hex)).signature;
            const isVerified = await SignedTransfer.verify(signed);
            expect(isVerified).toBeFalsy();
        })

        test('false <- forged content (the sender)', async () => {
            const signed = await SignedTransfer.sign(unsigned, sender.private as Hex)
            signed.sender = receiver.address;
            const isVerified = await SignedTransfer.verify(signed);
            expect(isVerified).toBeFalsy();
        })

    })

    describe('signForRefund(...) and verifyRefound(...)', () => {

        const solver = {
            address: '0x4c066bAC41dC11b7029D06826093202154280709',
            private: '0x2feb4c1dcc3d4de880c585f988ee711baa54bddf1c59c84af3efaab2d248ec6f'
        }

        test('true <- valid', async () => {
            const signed = await SignedTransfer.sign(unsigned, sender.private as Hex);
            const refund = await SignedTransfer.signForRefund(signed, solver.private as Hex);
            const isVerified = await SignedTransfer.verifyRefund(refund, solver.address as Hex);
            expect(isVerified).toBeTruthy();
        })

        test('true <- forged refund', async () => {
            const signed = await SignedTransfer.sign(unsigned, sender.private as Hex);
            const refund = await SignedTransfer.signForRefund(signed, solver.private as Hex);
            refund.tx = '0x4B1D';
            const isVerified = await  SignedTransfer.verifyRefund(refund, solver.address as Hex);
            expect(isVerified).toBeFalsy();
        })
    })
})
