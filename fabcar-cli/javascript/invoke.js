/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

// The Gateway from fabric-network is our means to connect to the network
// The Wallets from fabric-network is our means to validate the identities before transactions
const { Gateway, Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');
const { buildCcp, buildWallet } = require('./util');

async function main() {
    try {
        // step-1:  load the network configuration
        const ccp= buildCcp('test-network', 'org1.example.com', 'connection-org1.json');
        
        // step-2: Create a new file system based wallet for managing identities.
        const wallet = await buildWallet(process.cwd());

        // step-3: Check to see if we've already enrolled the user.
        const identity = await wallet.get('appUser');
        if (!identity) {
            console.log('An identity for the user "appUser" does not exist in the wallet');
            console.log('Run the registerUser.js application before retrying');
            return;
        }

        // step-4: Create a new gateway for connecting to our peer node.
        // To connect to the network, we use the Gateway we imported from fabric-network 
        // to create a gateway object and use it to connect.
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: 'appUser', discovery: { enabled: true, asLocalhost: true } });

        // step-5: Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork('mychannel');

        // step-6: Get the contract from the network.
        const contract = network.getContract('fabcar');

        // step-7: Submit the specified transaction.
        // createCar transaction - requires 5 argument, ex: ('createCar', 'CAR12', 'Honda', 'Accord', 'Black', 'Tom')
        // changeCarOwner transaction - requires 2 args , ex: ('changeCarOwner', 'CAR12', 'Dave')
        await contract.submitTransaction('createCar', 'CAR12', 'Honda', 'Accord', 'Black', 'Tom');
        console.log('Transaction has been submitted');

        // step-8: Disconnect from the gateway.
        await gateway.disconnect();

    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        process.exit(1);
    }
}

main();
