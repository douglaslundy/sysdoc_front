import { convertStock } from "../../src/components/helpers/stock";

describe('testing convertStock is working correctly', () => {
    it('should remove characters mask divide stock to reason and convert to int ', () => {
        expect(convertStock('1000', '9')).toBe(111);
    });

    it('should remove characters mask divide stock to reason and convert to int ', () => {
        expect(convertStock('1000.00', '9.00')).toBe(111);
    });
})