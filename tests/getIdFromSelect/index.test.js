import { getId } from '../../src/components/helpers/formatt/getIdFromSelect';

describe('testing if funciton getIdFromSelect can extract id correctly from input select', () => {

    it('should split string and extract id from select value', () => {
        expect(getId("1 - ferragens")).toBe(1);
    });

    it('should split string and extract id from select value with two "-" characters ', () => {
        expect(getId("2 - metais - parafusos, unidade")).toBe(2);
    });

    it('should split string and extract id from select value that id has two characters', () => {
        expect(getId("21 - ferragens")).toBe(21);
    });

    it('should split string and extract id from select value that id has two numbers but only the first is the ID ', () => {
        expect(getId("3 - 5 - ferragens")).toBe(3);
    });

});