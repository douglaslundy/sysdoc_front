export function getId(str){
    if(str && (typeof str === 'string'))
        return parseInt(str.split("-")[0]);
}