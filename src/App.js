import React, { useState, useEffect } from "react";
import "./styles.css";
import { Magic } from "magic-sdk";
import { AlgorandExtension } from "@magic-ext/algorand";
const algosdk = require('algosdk');

const magic = new Magic("pk_test_D524AFA65D9F4E81", {
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
  const [userMetadata, setUserMetadata] = useState({});
  const [txHash, setTxHash] = useState("");
  const [sendingTransaction, setSendingTransaction] = useState(false);

  useEffect(() => {
    magic.user.isLoggedIn().then(async (magicIsLoggedIn) => {
      setIsLoggedIn(magicIsLoggedIn);
      if (magicIsLoggedIn) {
        const metadata = await magic.user.getMetadata();
        setPublicAddress(metadata.publicAddress);
        setUserMetadata(metadata);
      }
    });
  }, [isLoggedIn]);

  const login = async () => {
    await magic.auth.loginWithMagicLink({ email });
    setIsLoggedIn(true);
  };

  const logout = async () => {
    await magic.user.logout();
    setIsLoggedIn(false);
  };

  const handlerSendTransaction = async () => {
    setSendingTransaction(true);
    const txn = {
      to: destinationAddress,
      fee: 10,
      amount: parseInt(sendAmount),
      firstRound: 51,
      lastRound: 61,
      genesisID: "devnet-v33.0",
      genesisHash: "JgsgCaCTqIaLeVhyL6XlRu3n7Rfk2FxMeK+wRSaQ7dI=",
      closeRemainderTo:
        "IDUTJEUIEVSMXTU4LGTJWZ2UE2E6TIODUKU6UW3FU3UKIQQ77RLUBBBFLA",
      note: new Uint8Array(Buffer.from("6gAVR0Nsv5Y=", "base64"))
    };

    const signedTX = await magic.algorand.signTransaction(txn);

    setSendingTransaction(false);
    setTxHash(signedTX.txID);

    console.log("send transaction", signedTX);
  };

  let client = null;
  async function setupClient() {
    if( client == null){
      const token = {
        "x-api-key": "10f233c1b6dec945648e2ac830913549349a1742c865b940bd1fdf2fc6b98b60"
      };
      const server = "https://hk.bsngate.com/api/1859c58d7f216e31dfb9b8ce95ca51f9e7672b1c0e11b2d76647b1b7d019292e/Algorand-Testnet/algodrest";
      const port = '';
      let algodClient = new algosdk.Algodv2(token, server, port);
      client = algodClient;
    } else {
      return client;
    }
    return client;
  }

  const handleSignGroupTransaction = async () => {

    let algodClient = await setupClient();

    let params = await algodClient.getTransactionParams().do();

    const txns = [{
      from: publicAddress,
      to: 'OFHW3Z3T2RML7J2S6KYGHPAMO6IQH76PE2HSCAIN5U5NBGXAIPBOY7DCHI',
      amount: 1000000,
      closeRemainderTo: undefined,
      note: undefined,
      suggestedParams: params,
    },
      {
        from: publicAddress,
        to: 'XRKQBEV7FINQ66SYAFY33UYHOC4GRAICWI3V6V2TXLCQMPJBGGRHLG2E74',
        amount: 1000000,
        closeRemainderTo: undefined,
        note: undefined,
        suggestedParams: params,
      }
    ]

    const signedTX = await magic.algorand.signGroupTransaction(txns);

    console.log("signedTX", signedTX);

  }

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
            <div className="info">{publicAddress}</div>
          </div>
          <div className="container">
            <h1>Sign Algorand Transaction</h1>
            {txHash ? (
              <div>
                <div>Send transaction success</div>
                <div className="info">{txHash}</div>
              </div>
            ) : sendingTransaction ? (
              <div className="sending-status">Signing transaction</div>
            ) : (
              <div />
            )}
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
            <button id="btn-send-txn" onClick={handlerSendTransaction}>
              Sign Transaction
            </button>
          </div>
          <div className="container">
            <h1>Sign Group Transaction</h1>
            <button onClick={handleSignGroupTransaction}>Sign Group Transaction</button>
          </div>
        </div>
      )}
    </div>
  );
}
