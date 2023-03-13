import { discountPercentage, summedPercentage, valueSaleSummedFromPercent } from "../../src/components/helpers/functions/percent";

describe("Test if function SUMMED PERCENTAGE is function correctly ", () => {

    it('should to calculate summed percentage and return the correct value ', () => {        
        expect(summedPercentage(10000, 13000)).toBe("30.00");
    });

    it('should to calculate summed percentage and return the correct value ', () => {        
        expect(summedPercentage(8000, 11200)).toBe("40.00");
    });

    it('should to calculate summed percentage and return the incorrect value ', () => {        
        expect(summedPercentage(8000, 11200)).not.toBe("40.01");
    });

});

describe("Test if function DISCOUNT PERCENTAGE is function correctly ", () => {

    it('should to calculate summed percentage and return the correct value ', () => {        
        expect(discountPercentage(13000, 9100 )).toBe("30.00");
    });

    it('should to calculate DISCOUNT percentage and return the correct value ', () => {        
        expect(discountPercentage(13000, 8000)).toBe("38.46");
    });

    it('should to calculate DISCOUNT percentage and return the correct value ', () => {        
        expect(discountPercentage(185000, 100455)).toBe("45.70");
    });

    it('should to calculate DISCOUNT percentage and return the incorrect value ', () => {        
        expect(discountPercentage(185000, 100455)).not.toBe("44.70");
    });

});


describe("Test if function VALUE SALE SUMMED FROM PERCENT is function correctly ", () => {

    it('should to calculate value Sale Summed From Percent and return the correct value ', () => {        
        expect(valueSaleSummedFromPercent("13000", "30" )).toBe(16900);
    });

    it('should to calculate value Sale Summed From Percent and return the correct value ', () => {        
        expect(valueSaleSummedFromPercent("10000", "30" )).toBe(13000);
    });
    
    it('should to calculate value Sale Summed From Percent and return the incorrect value ', () => {        
        expect(valueSaleSummedFromPercent("10000", "30" )).not.toBe(14000);
    });
});