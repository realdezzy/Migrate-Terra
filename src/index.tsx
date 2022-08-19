import { getChainOptions, WalletProvider } from '@terra-money/wallet-provider';
import Connect from 'components/Connect';
import Form from './components/Form';
import Info from './components/Info'
import ReactDOM from 'react-dom';
import './style.css';

function App() {
  return (
    <div id='canvas'>
      <main
        style={{ justifyContent: 'center', margin: 10, display: 'flex', flexDirection: 'column', gap: 20 }}
      >
        <Connect />
        <Form />
        <Info />
        {/* <TxSample /> */}
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
