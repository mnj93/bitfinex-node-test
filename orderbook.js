class Order {
    constructor(market, type, price, quantity) {
        this.type = type; // "buy" or "sell"
        this.price = price;
        this.quantity = quantity;
        this.market = market;
    }
}

class OrderBook {
    constructor() {
        this.buyOrders = [];
        this.sellOrders = [];
    }

    addOrder(order) {
        let orders = order.type === "buy" ? this.buyOrders : this.sellOrders;
        let existingOrder = orders.find(o => o.price === order.price);
        if(existingOrder) {
            existingOrder.quantity += order.quantity;
        }else {
            // Add new order and sort
            orders.push(order);
            orders.sort((a, b) => order.type === "buy" ? b.price - a.price : a.price - b.price);
        }

        const remainingOrder = this.matchOrder(order, order.type === "buy" ? this.sellOrders : this.buyOrders);        
        console.log("remainingOrder : ", remainingOrder);
        if(!remainingOrder?.quantity) {
            // remove this price level from orderbook
            if(remainingOrder.type === "buy") {
                this.buyOrders = this.buyOrders.filter(order => order.quantity > 0);
            } else if(remainingOrder.type === "sell") {
                this.sellOrders = this.sellOrders.filter(order => order.quantity > 0)
            }
        }
        return remainingOrder;
    }

    matchOrder(lastOrder, oppositeOrders) {
        console.log("lastOrder before match : ", lastOrder);
        let remainingQuantity = lastOrder.quantity;

        while (remainingQuantity > 0 && oppositeOrders.length > 0) {
            let matchOrder = oppositeOrders[0];

            if ((lastOrder.type === "buy" && lastOrder.price >= matchOrder.price) ||
                (lastOrder.type === "sell" && lastOrder.price <= matchOrder.price)) {

                let matchedQuantity = Math.min(remainingQuantity, matchOrder.quantity);
                remainingQuantity -= matchedQuantity;
                matchOrder.quantity -= matchedQuantity;

                console.log(`Matched ${matchedQuantity} units at ${matchOrder.price}`);

                if (matchOrder.quantity === 0) {
                    oppositeOrders.shift(); // Remove matched order
                }
            } else {
                // No match
                break;
            }
        }

        lastOrder.quantity = remainingQuantity;
        console.log("lastOrder : ", lastOrder);
        return lastOrder;
    }
}

module.exports = {
    Order,
    OrderBook
};