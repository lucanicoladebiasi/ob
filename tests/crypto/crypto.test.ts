import {describe, expect, test} from "@jest/globals";
import {createAddresses, sign, verify} from "../../src/crypto";
import {ByteArray, bytesToHex, Hex, stringToHex} from "viem";

describe('crypto tests', () => {

    describe('createAddresses(...)', () => {

        test('OK <- known secret', () => {
            const expected = [
                {
                    address: '0x4c066bAC41dC11b7029D06826093202154280709',
                    private: '0x2feb4c1dcc3d4de880c585f988ee711baa54bddf1c59c84af3efaab2d248ec6f',
                    public: '0x020d0a1137fc59d6c4c10fa053c7804f5c43a33eb259ffe01541bf6a3a55006327'
                }
                ,
                {
                    address: '0x095182ADDea1Dd59221D1750D95f78b0c15B0e1C',
                    private: '0x48d406c92700d07721f6d094d52d14b59348300569c0090dad07b814cc6ae1a6',
                    public: '0x02988a6717c6828a3df1a2ab129ab08e2a4e819bef845595a9ad52b67539ef7bf9'
                }
                ,
                {
                    address: '0x9D3860f1Fab70216Db9a2bcAb63EE9576da0d926',
                    private: '0xfdb48c472288d64d6f6cba0c28257638974a97b186090533bc845ebbdcdca47b',
                    public: '0x03c3a15415cfd56f33ac5e460485d74d08a028ac883af23557be23cb9a207ac07c'
                }
                ,
                {
                    address: '0x5965c1C60b5191bd270d385589355503f575a136',
                    private: '0xf0d297cce44d996fd032d9a8d69bd459958cb121db23c2ab47733653bba0a428',
                    public: '0x025120c1e227f6822910092838fe330637780d641f278997695a17b7abcddb0660'
                }
                ,
            ];
            const actual = createAddresses(
                expected.length,
                'sweet attitude face lyrics resemble put pattern face impact fat honey runway'
            );
            expect(actual.length).toBe(expected.length);
            for (let i = 0; i < expected.length; i++) {
                expect(actual[i].address).toBe(expected[i].address);
                expect(bytesToHex(<ByteArray>actual[i].getHdKey().privateKey)).toBe(expected[i].private);
                expect(bytesToHex(<ByteArray>actual[i].getHdKey().publicKey)).toBe(expected[i].public);
            }

        })

        test('OK <- unknown secret', () => {
            const expected = 4;
            const hdAcconts = createAddresses(expected);
            expect(hdAcconts.length).toBe(expected);
        })
    })

    describe('sign(...) and verify(...)', () => {

        const forged = {
            address: '0x095182ADDea1Dd59221D1750D95f78b0c15B0e1C',
            private: '0x48d406c92700d07721f6d094d52d14b59348300569c0090dad07b814cc6ae1a6'
        }

        const legit = {
            address: '0x4c066bAC41dC11b7029D06826093202154280709',
            private: '0x2feb4c1dcc3d4de880c585f988ee711baa54bddf1c59c84af3efaab2d248ec6f'
        }

        const message = stringToHex('The Hitchhiker\'s Guide to the Galaxy');


        test('true <- legit', async () => {
            const signature = await sign(legit.private as Hex, message);
            let actual = await verify(legit.address as Hex, signature, message);
            expect(actual).toBeTruthy();
        })

        test('false <- forged address', async () => {
            const signature = await sign(legit.private as Hex, message);
            let actual = await verify(forged.address as Hex, signature, message);
            expect(actual).toBeFalsy();
        })

        test('false <- forged signature', async () => {
            const signature = await sign(forged.private as Hex, message);
            let actual = await verify(legit.address as Hex, signature, message);
            expect(actual).toBeFalsy();
        })

        test('false <- forged message', async () => {
            const signature = await sign(forged.private as Hex, message);
            let actual = await verify(legit.address as Hex, signature, stringToHex('The Protocols of the Elders of Zion'));
            expect(actual).toBeFalsy();
        })
    })
})
