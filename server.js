const { PeerRPCServer } = require("grenache-nodejs-http");
const Link = require("grenache-nodejs-link");
const { PeerPub } = require("grenache-nodejs-ws");
const async = require("async");
const { OrderBook, Order } = require("./orderbook");
const { ORDERBOOK_UPDATES_TOPIC, ORDER_SUBMIT_RPC } = require("./constants");

// create a queue for processing orders in queue to handle concurrency
const orderQueue = async.queue((task, done) => {
    const remainingOrder = processOrder(task.order);
    console.log("order processed");
    done(null, remainingOrder);
}, 1);

const availableMarkets = ["BTC", "ETH", "SOL"];
const orderBooksMap = {};

// initialize orderbooks for available markets
for (const market of availableMarkets) {
    orderBooksMap[market] = new OrderBook();
}

console.log("orderBooksMap : ", orderBooksMap);

const link = new Link({
    grape: "http://127.0.0.1:30001",
});

link.start();

const peer = new PeerRPCServer(link, {});
peer.init();

const service = peer.transport("server");
service.listen(1338);

setInterval(() => {
    link.announce(ORDER_SUBMIT_RPC, service.port, {});
}, 1000);

// init publisher for publishing orderbook updates
const peerPublisher = new PeerPub(link, {});
peerPublisher.init();

const wsService = peerPublisher.transport("server");
wsService.listen(1339);

setInterval(() => {
    // console.log(`Announcing topic ${ORDERBOOK_UPDATES_TOPIC} on port ${wsService.port}`);
    link.announce(ORDERBOOK_UPDATES_TOPIC, wsService.port, {});
}, 1000);

service.on("request", async (rid, key, payload, handler) => {
    try {
        console.log("order data : ", payload.order);
        const { order } = payload;
        if (!order) throw new Error("Invalid request body, order is required");
        // const remainingOrder = processOrder(order);

        // process the order via queue with concurrency 1 for race conditions
        const remainingOrder = await new Promise((resolve, reject) => {
            orderQueue.push({ order }, (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            });
        });
        //   const result = fibonacci(payload.order)
        handler.reply(null, { remainingOrder });
        publishOrderbookUpdate(remainingOrder);
    } catch (err) {
        console.error("error: ", err);
        handler.reply(new Error(err?.message), null);
    }
});

const processOrder = (order) => {
    validateOrder(order);
    const orderbook = orderBooksMap[order?.market];
    console.log("orderbook : ", orderbook);
    const remainingOrder = orderbook.addOrder(
        new Order(order.market, order.type, order.price, order.quantity)
    );
    return remainingOrder;
};

const validateOrder = (order) => {
    if (!order?.market || !order?.price || !order?.type || !order.quantity) {
        throw new Error("Invalid order data");
    }
    if (isNaN(order?.price) || Number(order.price) <= 0)
        throw new Error("Invalid price");
    if (isNaN(order.quantity) || Number(order.quantity) <= 0)
        throw new Error("Invalid quantity");
    if (!["buy", "sell"].includes(order?.type))
        throw new Error("Invalid order type");
    if (!availableMarkets.includes(order.market))
        throw new Error("Invalid market");
};

const publishOrderbookUpdate = async (updates) => {
    console.log("inside publishOrderbookUpdate : ", JSON.stringify(updates));
    const currentOrderbookState = orderBooksMap[updates.market];
    console.log("currentOrderbookState : ", JSON.stringify(currentOrderbookState));
    wsService.pub(JSON.stringify({updatedOrderbook: currentOrderbookState, market: updates.market}), (err) => {
        if (err) {
            console.error("error while publishing orderbook updates.");
            console.log("updates : ", updates);
        } else {
            console.log("updates : ", updates);
        }
    });
};

// we can push market wise orderbook updates from here on certain interval so that clients can have latest copy of it 
// setInterval(async()=> {
//     const orderbook = orderBooksMap["SOL"];
//     await publishOrderbookUpdate(orderbookData);
// }, 2000)
