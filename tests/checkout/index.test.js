import { getTotal } from "../../src/components/helpers/checkout";
const data = [
    {
        "qtd": 300,
        "product": {
            sale_value: 3202
        }
    },
    {

        "qtd": 300,
        "product": {
            sale_value: 3202
        }
    }
]

describe('Testing getTotal´s checkout function', () => {
    it('should sum and return total of products on cart ', () => {
        expect(getTotal(data)).toBe('192,12');
    });
});
