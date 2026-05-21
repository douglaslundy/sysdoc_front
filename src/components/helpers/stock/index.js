import { setCurrency } from "../formatt/currency";

export function convertStock(stock, reason) {
    return parseInt(setCurrency(stock) / setCurrency(reason));
}