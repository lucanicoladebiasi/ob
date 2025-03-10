import {ThreadSafeMap} from '../../src/synch';

describe('ThreadSafeMap', () => {
    let threadSafeMap: ThreadSafeMap<string, number>;

    beforeEach(() => {
        threadSafeMap = new ThreadSafeMap<string, number>();
    });

    test('should set and get values correctly', async () => {
        await threadSafeMap.set('key1', 1);
        const value = await threadSafeMap.get('key1');
        expect(value).toBe(1);
    });

    test('should check the existence of a key', async () => {
        await threadSafeMap.set('key1', 1);
        expect(await threadSafeMap.has('key1')).toBe(true);
        expect(await threadSafeMap.has('key2')).toBe(false);
    });

    test('should delete a key successfully', async () => {
        await threadSafeMap.set('key1', 1);
        const deleted = await threadSafeMap.delete('key1');
        expect(deleted).toBe(true);
        expect(await threadSafeMap.has('key1')).toBe(false);
    });

    test('should return the correct size', async () => {
        await threadSafeMap.set('key1', 1);
        await threadSafeMap.set('key2', 2);
        expect(await threadSafeMap.size()).toBe(2);
        await threadSafeMap.delete('key1');
        expect(await threadSafeMap.size()).toBe(1);
    });

    test('should update value if compare function returns true', async () => {
        await threadSafeMap.set('key1', 5);

        const updated = await threadSafeMap.compareAndSetValue('key1', 10, (oldValue) => oldValue > 0);
        expect(updated).toBe(true);
        expect(await threadSafeMap.get('key1')).toBe(10);
    });

    test('should not update value if compare function returns false', async () => {
        await threadSafeMap.set('key1', 5);

        const updated = await threadSafeMap.compareAndSetValue('key1', 10, (oldValue) => oldValue < 0);
        expect(updated).toBe(false);
        expect(await threadSafeMap.get('key1')).toBe(5);
    });

    test('should set value if key does not exist in compareAndSetValue', async () => {
        const added = await threadSafeMap.compareAndSetValue('key1', 10, () => true);
        expect(added).toBe(true);
        expect(await threadSafeMap.get('key1')).toBe(10);
    });
});
