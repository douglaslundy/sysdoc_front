import { cleanPhone } from "../../src/components/helpers/formatt/phone";

describe('testing cleaner phone function if remove correctly characters mask', () =>{
    it('should remove characters mask removing ( and ) and -', () => {
        expect(cleanPhone('(35)98429-7193')).toBe('35984297193');
    });
})