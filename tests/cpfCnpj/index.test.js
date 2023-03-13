import { cleanCpfCnpj } from "../../src/components/helpers/formatt/cpf_cnpj";

describe('Testing cleaner CPF', () => {
    it('should clean CPF and removing . and -  ', () => {
        expect(cleanCpfCnpj('084.492.226-99')).toBe('08449222699');
    });
});

describe('Testing cleaner CNPJ', () => {
    it('should clean CNPJ and removing . and - and /  ', () => {
        expect(cleanCpfCnpj('73.949.300/0001-95')).toBe('73949300000195');
    });
});