/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 * 
 * The purpose of the enrollAdmin.js is to enroll the admin
 * To accomplish this, it requires a CA and a wallet.
 * The CA comes from fabric-ca-client, and the wallet comes from fabric-network.
 */

'use strict';

// We import all of fabric-ca-client and only Wallets from fabric-network.
const FabricCAServices = require('fabric-ca-client');
const { Wallets } = require('fabric-network');

const fs = require('fs');
const path = require('path');

// This is a Node.js command-line application, so we have a main function 
// that executes all the application logic.
// This will come in handy when we look at the Fabcar UI, which we ported Fabcar to
async function main() {
    try {
        // ======  load the network configuration ======
        // First, the filesystem path to the connection profile for organization 1 is assembled and read.
        const ccpPath = path.resolve(
            __dirname, '..', '..', 'test-network', 'organizations',
            'peerOrganizations','org1.example.com', 'connection-org1.json');
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8')); // load connection profile

        // ====== Create a new CA client for interacting with the CA. ======
        // Once the connection profile is loaded, the certificate authority info 
        // and certificate authority TLS certificate are set.
        const caInfo = ccp.certificateAuthorities['ca.org1.example.com']; // CA
        const caTLSCACerts = caInfo.tlsCACerts.pem;
        // Using the CA information and TLS certificate, the CA object is created.
        // We are using self-signed certificates, so we set the verify parameter to false.
        const ca = new FabricCAServices(caInfo.url, { trustedRoots: caTLSCACerts, verify: false }, caInfo.caName);

        // ====== Create a new file system based wallet for managing identities. ======
        //First, we create a path.The code is using the current path, 
        // which should be where our fabric-samples/fabcar/javascript subdirectory is located.
        // The code appends to the path wallet.This is the wallet subdirectory in our 
        // fabric-samples/fabcar/javascript subdirec‐ tory.Using the full path as an argument to the 
        // Wallets.newFileSystemWallet func‐ tion, we create a wallet object that we will use to store identities.
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // ===== Check to see if we've already enrolled the admin user. ======
        const identity = await wallet.get('admin');
        if (identity) {
            console.log('An identity for the admin user "admin" already exists in the wallet');
            return;
        }

        // ===== Enroll the admin user, and import the new identity into the wallet. ======
        // The CA we created is now used to execute the enroll function.
        // We can see it takes the user ID and password for our admin as the enrollmentID and enrollmentSecret.
        const enrollment = await ca.enroll({ 
            enrollmentID: 'admin', 
            enrollmentSecret: 'adminpw' 
        });
        // Then we create an x509Identity object by using the enrollment object we just created.
        // We are creating an x509Identity that contains the credentials—an object containing the certificate and private key,
        // both of which were created and returned by the CA enroll function.
        // Here x509Identity indicates a certif‐ icate containing a public key paired with a private key.
        const x509Identity = { 
            credentials: {
                certificate: enrollment.certificate,
                privateKey: enrollment.key.toBytes(),
            },
            // Along with the credentials, we add object metadata that identifies the organization
            // this identity belongs to and the type of identity.
            mspId: 'Org1MSP',
            type: 'X.509',
        };
        // With the identity created, we pass it to the wallet we created, which will store it.
        await wallet.put('admin', x509Identity);
        console.log('Successfully enrolled admin user "admin" and imported it into the wallet');

    } catch (error) {
        console.error(`Failed to enroll admin user "admin": ${error}`);
        process.exit(1);
    }
}

main();
