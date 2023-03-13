import { setCurrency, getCurrency, convertToBrlCurrency } from '../../src/components/helpers/formatt/currency'

describe('testing  currency formatt with setCurrency function', () => {
    it('should remove characteres from mask with , and return number of cents converted', () => {
        expect(setCurrency('R$ 1.000,50')).toBe(100050);
    });

    it('should remove characteres from mask without , and return number of cents converted', () => {
        expect(setCurrency('R$ 1.000')).toBe(100000);
    });

    it('should remove characteres from mask without R$ and return number of cents converted', () => {
        expect(setCurrency('1.000,50')).toBe(100050);
    });

    it('should remove characteres from mask and return number of cents converted whitout number after , ', () => {
        expect(setCurrency('1.000,')).toBe(100000);
    });

    it('should remove characteres from mask without R$ and return number of cents converted with only 1 number after ,', () => {
        expect(setCurrency('R$ 1.000,0')).toBe(100000);
    });

});


describe('testing  currency formatt  with getCurrency function', () => {
    
    it('should split number per 100 and return to currency  ', () => {
        expect(getCurrency('100055')).toBe('1000,55');
    });

    it('should split number per 100 and return to currency  ', () => {
        expect(getCurrency('100000')).toBe('1000');
    });

    it('should split number per 100 and return to currency  ', () => {
        expect(getCurrency('100005')).toBe('1000,05');
    });

    it('should split number per 100 and return to currency  ', () => {
        expect(getCurrency('100050')).toBe('1000,5');
    });

});



// describe('testing  currency formatt  with convertToBrCurrency function', () => {
    
//     it('should convert number to Br Currency  ', () => {
//         expect(convertToBrlCurrency('100055')).toBe("R$ 100.055,00");
//     });

// });