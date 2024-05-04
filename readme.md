# P2P distributed exchange

### Features

- Each client will have local instance of the orderbook.
- These orderbooks are maintained on market level, like BTC, ETH, SOL etc. There will be unique instance of orderbook for each market.
- Each client has a function to submit order, and those orders are sent to RPC server via RPC call.
- RPC server will process the order and will do the order matching.
- RPC server has the basic implementation for order matching. 
- RPC server has a queue implemented to process orders in sequence to avoid any race conditions.
- After order processing, RPC server will publish an event on topic with latest orderbook state.
- All clients are subscribed to this topic and will update their local orderbook instances. 

### Libraries Used

- grenache-nodejs-http
- grenache-nodejs-ws
- grenache-nodejs-link
- async

### Assumptions

- As all order updates are communicated to all connected clients, then all of them will have same orderbook but locally each client will maintain their own copy. 
- Client will be keeping copy of the orderbook and won't be processing the orders, as we can have multiple clients and order execution can be in single service.
- Server will be responsible for executing the orders and then distribute updated state of the orderbooks across the clients.
- Once clients get the updated orderbook state updates then clients should update their local orderbooks.

By implementing above we are making sure that orders are processed at single place so that we can handle concurrency and state can be consistent. 

### Improvements

- We can also send orderbook updates in certain interval to make sure all clients always have latest data.
- Orderbook logic is simple one so there maybe some scenarios in which it may break so for that we can add tests to make sure we did not miss anything. 

### Running Locally

**Setting up the DHT**

```
npm i -g grenache-grape
```

```
# boot two grape servers

grape --dp 20001 --aph 30001 --bn '127.0.0.1:20002'
grape --dp 20002 --aph 40001 --bn '127.0.0.1:20001'
```

**Install dependancies**

```
npm i
```

**Start Server**
```
node server.js
```

**Starting Clients**

```
node client1.js
node client2.js
node client3.js
```
