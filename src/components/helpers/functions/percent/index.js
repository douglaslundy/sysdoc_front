import { setCurrency } from "../../formatt/currency";

export const summedPercentage = (cost_value, sale_value) => {

    const result = (((sale_value - cost_value) / cost_value) * 100).toFixed(2);
    return result >= 0 ? result : 0;

}

export const discountPercentage = (actual_value, discounted_value) => {

    const result = (((actual_value - discounted_value) / actual_value) * 100).toFixed(2);
    return result >= 0 ? result : 0;

}

export const valueSaleSummedFromPercent = (cost_value, percent_value) => {
    return (setCurrency(cost_value) + (setCurrency(cost_value) * (parseFloat(percent_value.replace(',', '')) / 100))) / 100;
} 