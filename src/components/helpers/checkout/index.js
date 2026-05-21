import { getCurrency } from "../formatt/currency";

export const getTotal = dados => {
    var initial = 0;
    dados.forEach( (data, d) => {
        initial += data.product.sale_value * data.qtd / 100;
    })
    return getCurrency(initial);
}
