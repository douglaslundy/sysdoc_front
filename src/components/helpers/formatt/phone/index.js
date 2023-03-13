export function cleanPhone(str){
    if(str)
        return str.replace(/[()-/' ']/g, '');
}