// client part to send updates 
const { PeerRPCClient }  = require('grenache-nodejs-http')
const { PeerSub } = require("grenache-nodejs-ws");
const Link = require('grenache-nodejs-link')
const { ORDERBOOK_UPDATES_TOPIC, ORDER_SUBMIT_RPC } = require("./constants");

// local orderbook object
const orderbooks = {};

const linkClient = new Link({
  grape: 'http://127.0.0.1:30001'
})
linkClient.start()

const peerClient = new PeerRPCClient(linkClient, {})
peerClient.init()

// init subscriber
const peerSub = new PeerSub(linkClient, {});
peerSub.init();

const order = {
    market: "SOL",
    type: "sell",
    quantity: 1,
    price: 30000
}

const submitOrder = (order) => {
    peerClient.request(
        ORDER_SUBMIT_RPC,
        { order },
        { timeout: 10000 },
        (err, data) => {
            if (err) {
                console.error(err);
            }
            console.log(data);
        }
    );
};

setTimeout(()=> {
    submitOrder(order);
}, 2000)


// subscribe to orderbook updates
peerSub.sub(ORDERBOOK_UPDATES_TOPIC, { timeout: 10000 });

peerSub.on("connected", () => {
    console.log("connected");
});

peerSub.on("disconnected", () => {
    console.log("disconnected");
});

peerSub.on("message", (msg) => {
    console.log("received orderbook updates : ", msg);
    updateOrderbook(msg);
});

// update local orderbook for market
const updateOrderbook = (updates) => {
    const parsedData = JSON.parse(updates);
    const {market, updatedOrderbook } = parsedData;
    orderbooks[market]  = updatedOrderbook;
    console.log(`orderbook after update for ${market}  : `,  orderbooks[market]);    
}