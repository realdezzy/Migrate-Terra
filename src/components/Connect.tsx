import { useWallet, WalletStatus } from '@terra-money/wallet-provider';
import { createStyles, makeStyles, Button, AppBar, Toolbar } from "@material-ui/core";

const useStyles = makeStyles(() => createStyles({
  container : {
    backgroundColor: "transparent",
    textAlign : "center"
  },
  button : {
    margin:"20px auto",
    color: '#ffffff',
    backgroundColor: '#0366ff',
    marginRight: '4px',
    border: "1px",
  },
  disconnectBtn: {
    maxWidth: " 300px",
    margin: "0 auto",

  },
  buttonGroup: {
    textAlign: "center",
    maxWidth: "600px",
    margin: "6px auto" 
  }
}));

export default function Connect() {

  const classes = useStyles();


  const {
    status,
    network,
    wallets,
    availableConnectTypes,
    connect,
    disconnect,
  } = useWallet();

  console.log("status: ", status);
  return (
    <>
    <AppBar elevation={0} position="static" className={classes.container}>
          <Toolbar>
          {status === WalletStatus.WALLET_NOT_CONNECTED && (
            <div className={classes.buttonGroup}>
                {availableConnectTypes.map((connectType) => (
                    <Button
                      key={"connect-" + connectType}
                      onClick={() => connect(connectType)}
                      className={classes.button}
                    >
                      Connect {connectType}
                    </Button>
                ))}
              </div>
            )}
          </Toolbar>
        {status === WalletStatus.WALLET_CONNECTED && (
          <Button className={classes.button} onClick={() => disconnect()}>Disconnect</Button>
        )}
        
    </AppBar>
    </>
  );
}