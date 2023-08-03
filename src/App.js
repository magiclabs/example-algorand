import React, { useState, useEffect } from "react";
import "./styles.css";
import { Magic } from "magic-sdk";
import { AlgorandExtension } from "@magic-ext/algorand";
const algosdk = require("algosdk");

const magic = new Magic("pk_live_D17FD8D89621B5F3", {
  extensions: {
    algorand: new AlgorandExtension({
      rpcUrl: ""
    })
  }
});

export default function App() {
  const [email, setEmail] = useState("");
  const [publicAddress, setPublicAddress] = useState("");
  const [destinationAddress, setDestinationAddress] = useState("");
  const [sendAmount, setSendAmount] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [balance, setBalance] = useState("0");
  const [userMetadata, setUserMetadata] = useState({});
  const [disabled, setDisabled] = useState(false);

  useEffect(() => {
    magic.user.isLoggedIn().then(async (magicIsLoggedIn) => {
      setIsLoggedIn(magicIsLoggedIn);
      if (magicIsLoggedIn) {
        const metadata = await magic.user.getMetadata();
        setPublicAddress(metadata.publicAddress);
        setUserMetadata(metadata);
        getBalance(metadata.publicAddress);
      }
    });
  }, [isLoggedIn]);

  const login = async () => {
    await magic.auth.loginWithEmailOTP({ email });
    setIsLoggedIn(true);
  };

  const logout = async () => {
    await magic.user.logout();
    setIsLoggedIn(false);
  };

  const getBalance = async (publicAddress) => {
    let algodClient = await setupClient();
    algodClient
      .accountInformation(publicAddress)
      .do()
      .then((res) => {
        setBalance(res.amount / 1000000);
      });
  };

  let client = null;
  async function setupClient() {
    if (client == null) {
      const token = {
        "x-api-key": "yay5jiXMXr88Bi8nsG1Af9E1X3JfwGOC2F7222r3"
      };
      const server = "https://testnet-algorand.api.purestake.io/ps2";
      const port = "";
      let algodClient = new algosdk.Algodv2(token, server, port);
      client = algodClient;
    } else {
      return client;
    }
    return client;
  }

  const handlerSendTransaction = async () => {
    setDisabled(true);
    let algodClient = await setupClient();
    let params = await algodClient.getTransactionParams().do();
    const enc = new TextEncoder();
    let note = enc.encode("Hello World");
    let txn = algosdk.makePaymentTxnWithSuggestedParams(
      publicAddress, // from
      destinationAddress, // to
      parseInt(sendAmount) * 1000000, // amount
      undefined, // closeRemainderTo
      note,
      params
    );
    console.log("txn", txn);

    // Sign Payload
    let encodedTxn = algosdk.encodeObj(txn.get_obj_for_encoding());
    const signedTxn = await magic.algorand.signTransaction(encodedTxn);
    // Broadcast Tx
    const txHash = await client.sendRawTransaction(signedTxn.blob).do();
    console.log("hash", txHash);
    // Wait for confirmation
    const receipt = await waitForConfirmation(client, txHash.txId, 4);
    console.log("receipt", receipt);

    setDisabled(false);
  };

  const handlerSendAssetConfigTransaction = async () => {
    setDisabled(true);
    let algodClient = await setupClient();
    let params = await algodClient.getTransactionParams().do();
    let txn = algosdk.makeAssetCreateTxnWithSuggestedParams(
      publicAddress, // from
      undefined, // note
      1000, // total supply
      0, // decimals
      false, // default frozen
      publicAddress, // manager
      publicAddress, // reserve
      publicAddress, // freeze
      publicAddress, // clawback
      "LATINUM", // unit name
      "latinum", // asset name
      "http://someurl", // asset URL
      "16efaa3924a6fd9d3a4824799a4ac65d", // asset metadata hash
      params
    );
    console.log("txn", txn);

    // Sign Payload
    let encodedTxn = algosdk.encodeObj(txn.get_obj_for_encoding());
    const signedTxn = await magic.algorand.signTransaction(encodedTxn);
    // Broadcast Tx
    const txHash = await client.sendRawTransaction(signedTxn.blob).do();
    console.log("hash", txHash);
    // Wait for confirmation
    const receipt = await waitForConfirmation(client, txHash.txId, 4);
    console.log("receipt", receipt);

    setDisabled(false);
  };

  const handlerSendAssetTransferTransaction = async () => {
    setDisabled(true);
    let algodClient = await setupClient();
    let params = await algodClient.getTransactionParams().do();
    let txn = algosdk.makeAssetTransferTxnWithSuggestedParams(
      publicAddress, // from
      publicAddress, // to
      undefined, // closeRemainderTo
      undefined, // revocationTarget
      0, // amount
      undefined, // note
      265134396, // asset-index (get from `receipt` of acfg tx)
      params // suggested params
    );
    console.log("txn", txn);

    // Sign Payload
    let encodedTxn = algosdk.encodeObj(txn.get_obj_for_encoding());
    const signedTxn = await magic.algorand.signTransaction(encodedTxn);
    // Broadcast Tx
    const txHash = await client.sendRawTransaction(signedTxn.blob).do();
    console.log("hash", txHash);
    // Wait for confirmation
    const receipt = await waitForConfirmation(client, txHash.txId, 4);
    console.log("receipt", receipt);

    setDisabled(false);
  };

  const handleSignGroupTransaction = async () => {
    setDisabled(true);
    let algodClient = await setupClient();
    let params = await algodClient.getTransactionParams().do();

    const txns = [
      {
        from: publicAddress,
        to: "OFHW3Z3T2RML7J2S6KYGHPAMO6IQH76PE2HSCAIN5U5NBGXAIPBOY7DCHI",
        amount: 1000000,
        closeRemainderTo: undefined,
        note: undefined,
        suggestedParams: params
      },
      {
        from: publicAddress,
        to: "XRKQBEV7FINQ66SYAFY33UYHOC4GRAICWI3V6V2TXLCQMPJBGGRHLG2E74",
        amount: 1000000,
        closeRemainderTo: undefined,
        note: undefined,
        suggestedParams: params
      }
    ];

    const signedTX = await magic.algorand.signGroupTransaction(txns);
    console.log("signedTX", signedTX);
    setDisabled(false);
  };

  const handleSignGroupTransactionV2 = async () => {
    setDisabled(true);
    let algodClient = await setupClient();
    let suggestedParams = await algodClient.getTransactionParams().do();

    const txn1 = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      from: publicAddress,
      to: "OFHW3Z3T2RML7J2S6KYGHPAMO6IQH76PE2HSCAIN5U5NBGXAIPBOY7DCHI",
      amount: 1000,
      suggestedParams
    });

    const txn2 = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      from: publicAddress,
      to: "XRKQBEV7FINQ66SYAFY33UYHOC4GRAICWI3V6V2TXLCQMPJBGGRHLG2E74",
      amount: 2000,
      suggestedParams
    });

    const txs = [txn1, txn2];
    algosdk.assignGroupID(txs);

    const txn1B64 = Buffer.from(txn1.toByte()).toString("base64");
    const txn2B64 = Buffer.from(txn2.toByte()).toString("base64");

    const txn = [{ txn: txn1B64 }, { txn: txn2B64 }];

    const signedTX = await magic.algorand.signGroupTransactionV2(txn);

    console.log("sign group transaction v2", signedTX);
    setDisabled(false);
  };

  const waitForConfirmation = async function (algodClient, txId, timeout) {
    if (algodClient == null || txId == null || timeout < 0) {
      throw new Error("Bad arguments");
    }

    const status = await algodClient.status().do();
    if (status === undefined) {
      throw new Error("Unable to get node status");
    }

    const startround = status["last-round"] + 1;
    let currentround = startround;

    while (currentround < startround + timeout) {
      const pendingInfo = await algodClient
        .pendingTransactionInformation(txId)
        .do();
      if (pendingInfo !== undefined) {
        if (
          pendingInfo["confirmed-round"] !== null &&
          pendingInfo["confirmed-round"] > 0
        ) {
          //Got the completed Transaction
          return pendingInfo;
        } else {
          if (
            pendingInfo["pool-error"] != null &&
            pendingInfo["pool-error"].length > 0
          ) {
            // If there was a pool error, then the transaction has been rejected!
            throw new Error(
              "Transaction " +
                txId +
                " rejected - pool error: " +
                pendingInfo["pool-error"]
            );
          }
        }
      }
      await algodClient.statusAfterBlock(currentround).do();
      currentround++;
    }

    throw new Error(
      "Transaction " + txId + " not confirmed after " + timeout + " rounds!"
    );
  };

  return (
    <div className="App">
      {!isLoggedIn ? (
        <div className="container">
          <h1>Please sign up or login</h1>
          <input
            type="email"
            name="email"
            required="required"
            placeholder="Enter your email"
            onChange={(event) => {
              setEmail(event.target.value);
            }}
          />
          <button onClick={login}>Send</button>
        </div>
      ) : (
        <div>
          <div className="container">
            <h1>Current user: {userMetadata.email}</h1>
            <button onClick={logout}>Logout</button>
          </div>
          <div className="container">
            <h1>Algorand address</h1>
            <div className="info">
              <a
                target="_blank"
                rel="noopener noreferrer"
                href={`https://testnet.algoexplorer.io/address/${userMetadata.publicAddress}`}
              >
                {publicAddress}
              </a>
            </div>
            <div className="info">Balance: {balance} ALGO</div>
            <button>
              <a href="https://bank.testnet.algorand.network/" target="_blank" rel="noopener noreferrer">
                Faucet
              </a>
            </button>
          </div>
          <div className="container">
            <h1>Send Algorand Transaction</h1>
            <input
              type="text"
              name="destination"
              className="full-width"
              required="required"
              placeholder="Destination address"
              onChange={(event) => {
                setDestinationAddress(event.target.value);
              }}
            />
            <input
              type="text"
              name="amount"
              className="full-width"
              required="required"
              placeholder="Amount in Algorand"
              onChange={(event) => {
                setSendAmount(event.target.value);
              }}
            />
            <button
              disabled={disabled}
              id="btn-send-txn"
              onClick={handlerSendTransaction}
            >
              Send Payment Transaction
            </button>
          </div>
          <div className="container">
            <h1>Send Asset Config Transaction</h1>
            <button
              disabled={disabled}
              onClick={handlerSendAssetConfigTransaction}
            >
              Send ACFG Transaction
            </button>
          </div>
          <div className="container">
            <h1>Send Asset Transfer Transaction</h1>
            <button
              disabled={disabled}
              onClick={handlerSendAssetTransferTransaction}
            >
              Send AXFER Transaction
            </button>
          </div>
          <div className="container">
            <h1>Sign Group Transaction</h1>
            <button disabled={disabled} onClick={handleSignGroupTransaction}>
              Sign Group Transaction
            </button>
          </div>
          <div className="container">
            <h1>Sign Group Transaction V2</h1>
            <button disabled={disabled} onClick={handleSignGroupTransactionV2}>
              Sign Group Transaction V2
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
