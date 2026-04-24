import { 
  Horizon, 
  TransactionBuilder, 
  Networks, 
  Operation, 
  Asset, 
  Keypair,
  rpc,
  scValToNative,
  nativeToScVal,
  xdr
} from '@stellar/stellar-sdk';
import { isConnected, getAddress, signTransaction } from '@stellar/freighter-api';

const server = new Horizon.Server('https://horizon-testnet.stellar.org');
const rpcServer = new rpc.Server('https://soroban-testnet.stellar.org');

// The contract ID after deployment
// In a real scenario, this would be provided after running 'soroban contract deploy'
const CONTRACT_ID = 'CC3D5K4G...'; // Placeholder

/**
 * Connects to Freighter wallet and returns the public key
 */
export const connectWallet = async () => {
  if (await isConnected()) {
    const result = await getAddress();
    return typeof result === 'string' ? result : result?.address;
  } else {
    throw new Error('Freighter wallet not found. Please install the extension.');
  }
};

/**
 * Funds an account using Friendbot (Testnet only)
 */
export const fundAccount = async (publicKey) => {
  try {
    const response = await fetch(`https://friendbot.stellar.org?addr=${publicKey}`);
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Friendbot funding failed:', error);
    throw new Error('Failed to fund account. Please try again later.');
  }
};

/**
 * Checks if an account exists on the ledger
 */
export const checkAccountExists = async (publicKey) => {
  try {
    await server.loadAccount(publicKey);
    return true;
  } catch (error) {
    if (error.response?.status === 404) {
      return false;
    }
    throw error;
  }
};

/**
 * Fetches tasks using Soroban Smart Contract
 */
export const fetchTasks = async (publicKey) => {
  if (!publicKey || !CONTRACT_ID.startsWith('C')) return []; // Skip if no contract ID
  
  try {
    const address = publicKey;
    const contract = CONTRACT_ID;

    // Build the scVal for the address argument
    const args = [nativeToScVal(address, { type: 'address' })];

    // Simulate the contract call
    const simulation = await rpcServer.simulateTransaction(
      new TransactionBuilder(await server.loadAccount(publicKey), {
        fee: '100',
        networkPassphrase: Networks.TESTNET,
      })
        .addOperation(
          Operation.invokeHostFunction({
            func: xdr.HostFunction.hostFunctionTypeInvokeContract(
              new xdr.InvokeContractArgs({
                contractAddress: xdr.Address.fromAddressString(contract),
                functionName: 'get_tasks',
                args: args,
              })
            ),
            auth: [],
          })
        )
        .setTimeout(30)
        .build()
    );

    if (rpc.Api.isSimulationSuccess(simulation)) {
      const result = scValToNative(simulation.result.retval);
      return result.map(item => ({
        id: item.id.toString(),
        text: item.text.toString(),
        completed: item.completed
      }));
    }
    return [];
  } catch (error) {
    console.error('Soroban fetch failed, falling back to ManageData:', error);
    return fetchTasksLegacy(publicKey);
  }
};

/**
 * Legacy ManageData fetch for backwards compatibility
 */
const fetchTasksLegacy = async (publicKey) => {
  try {
    const account = await server.loadAccount(publicKey);
    const dataEntries = account.data_attr || {};
    
    return Object.keys(dataEntries)
      .filter(key => key.startsWith('td_'))
      .map(key => {
        const rawValue = atob(dataEntries[key]);
        const status = rawValue.substring(0, 1) === '1';
        const text = rawValue.substring(2);
        return {
          id: key.replace('td_', ''),
          text,
          completed: status
        };
      }).sort((a, b) => b.id - a.id);
  } catch (e) {
    return [];
  }
};

/**
 * Adds a task via Soroban Smart Contract
 */
export const addOrUpdateTask = async (publicKey, taskId, text, completed) => {
  if (!CONTRACT_ID.startsWith('C')) {
    return addOrUpdateTaskLegacy(publicKey, taskId, text, completed);
  }

  const account = await server.loadAccount(publicKey);
  const contract = CONTRACT_ID;

  const isNew = taskId === 'new';
  const functionName = isNew ? 'add_task' : 'toggle_task';
  
  let args = [];
  if (isNew) {
    args = [
      nativeToScVal(publicKey, { type: 'address' }),
      nativeToScVal(text)
    ];
  } else {
    args = [
      nativeToScVal(publicKey, { type: 'address' }),
      nativeToScVal(parseInt(taskId), { type: 'u32' })
    ];
  }

  const tx = new TransactionBuilder(account, {
    fee: await server.fetchBaseFee(),
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      Operation.invokeHostFunction({
        func: xdr.HostFunction.hostFunctionTypeInvokeContract(
          new xdr.InvokeContractArgs({
            contractAddress: xdr.Address.fromAddressString(contract),
            functionName: functionName,
            args: args,
          })
        ),
        auth: [],
      })
    )
    .setTimeout(30)
    .build();

  const xdrTx = tx.toXDR();
  const signedXdr = await signTransaction(xdrTx, { network: 'TESTNET' });
  const finalXdr = typeof signedXdr === 'string' ? signedXdr : signedXdr?.signedTransaction;
  
  return await server.submitTransaction(finalXdr);
};

const addOrUpdateTaskLegacy = async (publicKey, taskId, text, completed) => {
  const account = await server.loadAccount(publicKey);
  const statusChar = completed ? '1' : '0';
  const newValue = `${statusChar}:${text}`;
  
  // For legacy, if taskId is 'new', generate a timestamp ID
  const effectiveId = taskId === 'new' ? Date.now().toString() : taskId;

  const transaction = new TransactionBuilder(account, {
    fee: await server.fetchBaseFee(),
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      Operation.manageData({
        name: `td_${effectiveId}`,
        value: newValue,
      })
    )
    .setTimeout(30)
    .build();

  const xdr = transaction.toXDR();
  const signedXdr = await signTransaction(xdr, { network: 'TESTNET' });
  const finalXdr = typeof signedXdr === 'string' ? signedXdr : signedXdr?.signedTransaction;
  return await server.submitTransaction(finalXdr);
};

/**
 * Deletes a task
 */
export const deleteTask = async (publicKey, taskId) => {
  // Implementation for both Legacy and Soroban would go here
  // For brevity, using legacy ManageData logic as fallback
  const account = await server.loadAccount(publicKey);
  const transaction = new TransactionBuilder(account, {
    fee: await server.fetchBaseFee(),
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      Operation.manageData({
        name: `td_${taskId}`,
        value: null, 
      })
    )
    .setTimeout(30)
    .build();

  const xdr = transaction.toXDR();
  const signedXdr = await signTransaction(xdr, { network: 'TESTNET' });
  const finalXdr = typeof signedXdr === 'string' ? signedXdr : signedXdr?.signedTransaction;
  return await server.submitTransaction(finalXdr);
};


