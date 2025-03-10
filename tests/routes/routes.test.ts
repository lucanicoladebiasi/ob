import {describe, expect, test} from "@jest/globals";
import {Balance, SignedTransfer, Transfer} from "../../src/dto";
import {Hex} from "viem";

function verifyBalance(balance: Balance) {
    expect(balance.address).toBeDefined();
    expect(balance.token).toBeDefined();
    expect(balance.amount).toBeDefined();
    const amount: number = Number(balance.amount);
    expect(amount).toBeGreaterThanOrEqual(0);
}

describe('routes tests', () => {

    const baseURL = 'http://localhost:3000/api/v1';

    const address = '0x5965c1C60b5191bd270d385589355503f575a136';

    const missing = '0xDEADC0DE';

    const token = '0xF0CACC1A';

    describe('GET /balances', () => {

        test('OK <- GET /balances', async () => {
            const request = new Request(
                `${baseURL}/balances`
            );
            const response = await fetch(request);
            expect(response.status).toBe(200);
            const balances = (await response.json()) as Balance[];
            expect(balances.length).toBeGreaterThanOrEqual(1);
            balances.forEach(balance => {
                verifyBalance(balance);
            });
        })
    })

    describe('GET /balances/:address', () => {

        test(`OK <- GET /balances/<address>`, async () => {
            const request = new Request(
                `${baseURL}/balances/${address}`
            );
            const response = await fetch(request);
            expect(response.status).toBe(200);
            const balances = (await response.json()) as Balance[];
            expect(balances.length).toBeGreaterThanOrEqual(1);
            balances.forEach(balance => {
                verifyBalance(balance);
            });
        })

        test(`404 <- GET /balances/<missing>`, async () => {
            const request = new Request(
                `${baseURL}/balances/${missing}`
            );
            const response = await fetch(request);
            expect(response.status).toBe(404);
        })
    })

    describe('GET /balances/:address/:token', () => {
        test(`OK <- GET /balances/<address>/<token>`, async () => {
            const request = new Request(
                `${baseURL}/balances/${address}/${token}`
            );
            const response = await fetch(request);
            expect(response.status).toBe(200);
            const balance = (await response.json()) as Balance;
            verifyBalance(balance);
        });

        test(`404 <- GET /balances/<missing>/<token>`, async () => {
            const request = new Request(
                `${baseURL}/balances/<${missing}>/${token}`
            );
            const response = await fetch(request);
            expect(response.status).toBe(404);
        });

        test(`404 <- GET /balances/<address>/<missing>`, async () => {
            const request = new Request(
                `${baseURL}/balances/<${missing}>/${token}`
            );
            const response = await fetch(request);
            expect(response.status).toBe(404);
        });
    })

    describe('POST /transfer', () => {

        const receiver = {
            address: '0x5965c1C60b5191bd270d385589355503f575a136',
            private: '0xf0d297cce44d996fd032d9a8d69bd459958cb121db23c2ab47733653bba0a428' // Used to test forge signature.
        };

        // This account doesn't exist.
        const nemo = {
            address: '0x28bA0b5B62F4426EFe51253b3d2e1B46664933f1',
            private: '0x98a4f534a834f1232a82c4515a1060308362a2d2f6eabf1a1fad6ff4c690f59f'
        }

        const sender = {
            address: '0x095182ADDea1Dd59221D1750D95f78b0c15B0e1C',
            private: '0x48d406c92700d07721f6d094d52d14b59348300569c0090dad07b814cc6ae1a6'
        }

        const token = '0xF0CACC1A';

        test('400 <- Invalid transfer request', async () => {
            const invalid = {
                sender: sender.address,
                token: {
                    address: token,
                    amount: 16
                },
                targetChain: {
                    chainId: 42, // The Hitchhiker's Guide to the Galaxy final value answer.
                    receiver: receiver.address,
                },
            }
            const request = new Request(
                `${baseURL}/transfer`,
                {
                    method: 'POST',
                    body: JSON.stringify(invalid),
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            )
            const response = await fetch(request);
            expect(response.status).toBe(400);
        })

        test('403 <- Invalid signature', async () => {
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
            const signed = await SignedTransfer.sign(unsigned, sender.private as Hex)
            signed.signature = (await SignedTransfer.sign(unsigned, receiver.private as Hex)).signature;
            const request = new Request(
                `${baseURL}/transfer`,
                {
                    method: 'POST',
                    body: JSON.stringify(signed),
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            )
            const response = await fetch(request);
            expect(response.status).toBe(403);
        })

        test('404 <- No sender balance found', async () => {
            const unsigned = {
                sender: nemo.address,
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
            const signed = await SignedTransfer.sign(unsigned, nemo.private as Hex)
            const request = new Request(
                `${baseURL}/transfer`,
                {
                    method: 'POST',
                    body: JSON.stringify(signed),
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            )
            const response = await fetch(request);
            expect(response.status).toBe(404);
        })

        test('404 <- No receiver balance found', async () => {
            const unsigned = {
                sender: sender.address,
                token: {
                    address: token,
                    amount: 16
                },
                targetChain: {
                    chainId: 42, // The Hitchhiker's Guide to the Galaxy final value answer.
                    receiver: nemo.address,
                },
                signature: 'UNSIGNED'
            } satisfies Transfer
            const signed = await SignedTransfer.sign(unsigned, sender.private as Hex)
            const request = new Request(
                `${baseURL}/transfer`,
                {
                    method: 'POST',
                    body: JSON.stringify(signed),
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            )
            const response = await fetch(request);
            expect(response.status).toBe(404);
        })

        test('403 <- Insufficient funds', async () => {
            const unsigned = {
                sender: sender.address,
                token: {
                    address: token,
                    amount: 1024 * 1024
                },
                targetChain: {
                    chainId: 42, // The Hitchhiker's Guide to the Galaxy final value answer.
                    receiver: receiver.address,
                },
                signature: 'UNSIGNED'
            } satisfies Transfer
            const signed = await SignedTransfer.sign(unsigned, sender.private as Hex)
            const request = new Request(
                `${baseURL}/transfer`,
                {
                    method: 'POST',
                    body: JSON.stringify(signed),
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            )
            const response = await fetch(request);
            expect(response.status).toBe(403);
        })

        test('OK <- ', async () => {
            const unsigned = {
                sender: sender.address,
                token: {
                    address: token,
                    amount: 4
                },
                targetChain: {
                    chainId: 42, // The Hitchhiker's Guide to the Galaxy final value answer.
                    receiver: receiver.address,
                },
                signature: 'UNSIGNED'
            } satisfies Transfer
            const signed = await SignedTransfer.sign(unsigned, sender.private as Hex)
            const request = new Request(
                `${baseURL}/transfer`,
                {
                    method: 'POST',
                    body: JSON.stringify(signed),
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            )
            const response = await fetch(request);
            expect(response.status).toBe(200);
            // Uncomment following lines to print the result seen from the REST client.
            const json = await response.json();
            console.log(json);
        })
    })

})

