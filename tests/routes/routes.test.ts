import {describe, expect, test} from "@jest/globals";
import {Balance, SignedTransfer, Transfer} from "../../src/dto";
import {Hex} from "viem";
import {LOCK_MAP} from "../../src/routes";

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

})

