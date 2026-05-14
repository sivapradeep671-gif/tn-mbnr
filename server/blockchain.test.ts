import { describe, it, expect } from 'vitest';
import { Blockchain, Block } from './blockchain.cjs';

describe('Blockchain', () => {
    it('should create a genesis block on initialization', () => {
        const bc = new Blockchain();
        expect(bc.chain.length).toBe(1);
        expect(bc.chain[0].data).toBe('Genesis Block');
    });

    it('should correctly add a new block', () => {
        const bc = new Blockchain();
        bc.addBlock(new Block(new Date().toISOString(), { amount: 100 }));
        expect(bc.chain.length).toBe(2);
        expect(bc.getLatestBlock().data.amount).toBe(100);
    });

    it('should link blocks together correctly', () => {
        const bc = new Blockchain();
        bc.addBlock(new Block(new Date().toISOString(), { b1: 1 }));
        bc.addBlock(new Block(new Date().toISOString(), { b2: 2 }));
        expect(bc.chain[2].previousHash).toBe(bc.chain[1].hash);
    });

    it('should validate an untampered chain', () => {
        const bc = new Blockchain();
        bc.addBlock(new Block(new Date().toISOString(), { amount: 50 }));
        bc.addBlock(new Block(new Date().toISOString(), { amount: 100 }));
        expect(bc.isChainValid()).toBe(true);
    });

    it('should detect a tampered block hash', () => {
        const bc = new Blockchain();
        bc.addBlock(new Block(new Date().toISOString(), { amount: 50 }));
        bc.chain[1].data = { amount: 5000 };
        // The hash won't match the new data
        expect(bc.isChainValid()).toBe(false);
    });

    it('should detect a broken link between blocks', () => {
        const bc = new Blockchain();
        bc.addBlock(new Block(new Date().toISOString(), { b1: 1 }));
        bc.addBlock(new Block(new Date().toISOString(), { b2: 2 }));
        bc.chain[1].hash = 'fake-hash';
        expect(bc.isChainValid()).toBe(false);
    });
});
