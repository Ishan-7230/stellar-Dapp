import React, { useState, useEffect } from 'react';
import { 
  connectWallet, 
  fetchTasks, 
  addOrUpdateTask, 
  deleteTask, 
  fundAccount, 
  checkAccountExists 
} from './stellar';

function App() {
  const [publicKey, setPublicKey] = useState('');
  const [tasks, setTasks] = useState([]);
  const [newTaskText, setNewTaskText] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null); 
  const [accountExists, setAccountExists] = useState(true);
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    checkConnection();
  }, []);

  const showStatus = (msg, duration = 3000) => {
    setStatusMsg(msg);
    if (duration) {
      setTimeout(() => setStatusMsg(''), duration);
    }
  };

  const checkConnection = async () => {
    try {
      const address = await connectWallet();
      if (address) {
        setPublicKey(address);
        await refreshViewState(address);
      }
    } catch (err) {
      console.log('Freighter not connected');
    }
  };

  const refreshViewState = async (address) => {
    setLoading(true);
    const exists = await checkAccountExists(address);
    setAccountExists(exists);
    if (exists) {
      const data = await fetchTasks(address);
      setTasks(data);
    } else {
      setTasks([]);
    }
    setLoading(false);
  };

  const handleConnect = async () => {
    try {
      const address = await connectWallet();
      if (address) {
        setPublicKey(address);
        await refreshViewState(address);
        showStatus('NEURAL LINK ESTABLISHED');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleFundAccount = async () => {
    setActionLoading('funding');
    showStatus('REQUESTING CREDITS FROM FRIENDBOT...');
    try {
      await fundAccount(publicKey);
      await refreshViewState(publicKey);
      showStatus('ACCOUNT INITIALIZED SUCCESSFULLY');
    } catch (err) {
      alert(err.message);
    }
    setActionLoading(null);
  };

  const handleAddTask = async () => {
    if (!newTaskText.trim()) return;
    setActionLoading('new');
    showStatus('UPLOADING DATA TO CHAIN...');
    try {
      // Pass 'new' to indicate a new entry for Soroban
      await addOrUpdateTask(publicKey, 'new', newTaskText, false);
      setNewTaskText('');
      await refreshViewState(publicKey);
      showStatus('TASK SYNCED');
    } catch (err) {
      alert('Transaction failed: ' + err.message);
    }
    setActionLoading(null);
  };

  const toggleTaskStatus = async (task) => {
    setActionLoading(task.id);
    showStatus('UPDATING STATE...');
    try {
      await addOrUpdateTask(publicKey, task.id, task.text, !task.completed);
      await refreshViewState(publicKey);
      showStatus('STATE UPDATED');
    } catch (err) {
      alert('Transaction failed: ' + err.message);
    }
    setActionLoading(null);
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Permanent deletion from blockchain?')) return;
    setActionLoading(taskId);
    showStatus('TERMINATING DATA ENTRY...');
    try {
      await deleteTask(publicKey, taskId);
      await refreshViewState(publicKey);
      showStatus('ENTRY DELETED');
    } catch (err) {
      alert('Transaction failed: ' + err.message);
    }
    setActionLoading(null);
  };

  return (
    <div className="app-container">
      <header>
        <h1>Stellar Node</h1>
        <p className="subtitle">DECENTRALIZED WORKFLOW ENGINE</p>
      </header>

      <div className="wallet-auth">
        {!publicKey ? (
          <button className="connect-btn" onClick={handleConnect}>
            INITIALIZE NEURAL LINK (FREIGHTER)
          </button>
        ) : (
          <div className="connected-status">
            NODE ACTIVE: {publicKey.substring(0, 6)}...{publicKey.substring(publicKey.length - 4)}
          </div>
        )}
      </div>

      {statusMsg && <div className="status-toast">{statusMsg}</div>}

      {publicKey && (
        <>
          {!accountExists ? (
            <div className="setup-container">
              <p>ACCOUNT NOT INITIALIZED ON TESTNET</p>
              <button 
                className="fund-btn" 
                onClick={handleFundAccount}
                disabled={actionLoading === 'funding'}
              >
                {actionLoading === 'funding' ? 'INITIALIZING...' : 'GENERATE 10,000 TESTNET XLM'}
              </button>
            </div>
          ) : (
            <>
              <div className="todo-input-container">
                <input
                  type="text"
                  placeholder="ENTER NEW TASK DATA..."
                  value={newTaskText}
                  onChange={(e) => setNewTaskText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
                  disabled={!!actionLoading}
                />
                <button 
                  className="add-btn" 
                  onClick={handleAddTask}
                  disabled={!!actionLoading}
                >
                  {actionLoading === 'new' ? '...' : 'UPLOAD'}
                </button>
              </div>

              {loading && !actionLoading ? (
                <div className="loader"></div>
              ) : (
                <ul className="todo-list">
                  {tasks.length === 0 ? (
                    <li className="empty-state">NO ACTIVE TASKS DETECTED ON CHAIN</li>
                  ) : (
                    tasks.map((task) => (
                      <li key={task.id} className={`todo-item ${task.completed ? 'completed' : ''}`}>
                        <div 
                          className={`todo-checkbox ${task.completed ? 'checked' : ''}`}
                          onClick={() => !actionLoading && toggleTaskStatus(task)}
                        >
                          {actionLoading === task.id ? '...' : (task.completed ? '✓' : '')}
                        </div>
                        <span className="todo-text">{task.text}</span>
                        <button 
                          className="terminate-btn"
                          onClick={() => !actionLoading && handleDeleteTask(task.id)}
                          disabled={!!actionLoading}
                        >
                          TERMINATE
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              )}
            </>
          )}
        </>
      )}

      <footer style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.7rem', color: 'rgba(255,255,255,0.2)' }}>
        POWERED BY STELLAR BLOCKCHAIN · TESTNET ONLY
      </footer>
    </div>
  );
}

export default App;

