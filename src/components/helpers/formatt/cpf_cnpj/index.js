export function cleanCpfCnpj(str){

    if(str)
        return str.replace(/['/''.'-]/g, "");
}