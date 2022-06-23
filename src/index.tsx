import { getChainOptions, WalletProvider } from '@terra-money/wallet-provider';
import Connect from 'components/Connect';
import Form from './components/Form';
import {SignBytesSample} from './components/SignBytesSample'
import dotenv from 'dotenv';
dotenv.config();

import React from 'react';
import ReactDOM from 'react-dom';
import './style.css';

function App() {
  return (
    <div id='canvas'>
      <main
        style={{ margin: 20, display: 'flex', flexDirection: 'column', gap: 40 }}
      >
        <Connect />
        <Form />
        {/* <TxSample /> */}
        <SignBytesSample />
      </main>
      </div>
  );
}

getChainOptions().then((chainOptions) => {
  ReactDOM.render(
    <WalletProvider {...chainOptions}>
      <App />
    </WalletProvider>,
    document.getElementById('root'),
  );
});
