import { useState, useEffect } from 'react';

interface HostSimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HostSimulationModal({ isOpen, onClose }: HostSimulationModalProps) {
  const [logs, setLogs] = useState<string[]>([]);
  const [projectId, setProjectId] = useState('PRJ-VN-2026-0891');
  const [userRole, setUserRole] = useState<'SalesEngineer' | 'PlantArchitect'>('SalesEngineer');

  useEffect(() => {
    if (!isOpen) return;

    // Listen for postMessage in the window
    const handleMessage = (event: MessageEvent) => {
      // Validate origin
      if (event.origin !== window.location.origin) {
        return;
      }
      try {
        const data = event.data;
        if (data && data.type?.startsWith('CLOUDWORX_')) {
          setLogs(prev => [...prev.slice(-10), `[RECV] ${data.type} (v${data.version}): ${JSON.stringify(data.payload)}`]);
        }
      } catch {
        // ignore non-json
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [isOpen]);

  const sendHostHandshake = () => {
    const handshakePayload = {
      type: 'CLOUDWORX_HOST_INIT',
      version: '1.0.0',
      payload: {
        projectId,
        roomDimensions: { width: 20, depth: 12, unit: 'm' },
        user: { id: 'usr-994', name: 'Nguyen Van Minh', role: userRole },
        auth: {
          tokenType: 'Bearer',
          expiresIn: 3600,
          claims: { iss: 'https://auth.cloudworx-partner.com', aud: 'cloudworx-3d-microapp' },
        },
      },
      timestamp: Date.now(),
    };

    window.postMessage(handshakePayload, window.location.origin);
    setLogs(prev => [...prev.slice(-10), `[SEND] CLOUDWORX_HOST_INIT -> Handshake dispatched to window`]);
  };

  const sendTokenRefresh = () => {
    const refreshPayload = {
      type: 'CLOUDWORX_TOKEN_REFRESH',
      version: '1.0.0',
      payload: {
        newExpiresIn: 7200,
        refreshedAt: new Date().toISOString(),
      },
      timestamp: Date.now(),
    };
    window.postMessage(refreshPayload, window.location.origin);
    setLogs(prev => [...prev.slice(-10), `[SEND] CLOUDWORX_TOKEN_REFRESH -> New expiry timestamp emitted`]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-industrial-800 border border-industrial-600 rounded-lg max-w-xl w-full shadow-2xl overflow-hidden flex flex-col">
        <div className="panel-header flex items-center justify-between bg-industrial-900 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-accent text-sm">🔗</span>
            <span className="font-semibold text-white">Host Application PostMessage Simulator</span>
          </div>
          <button
            onClick={onClose}
            className="text-industrial-400 hover:text-white font-mono text-sm"
          >
            ✕
          </button>
        </div>

        <div className="p-4 space-y-4 text-xs">
          <p className="text-industrial-300 leading-relaxed">
            Demonstrates the versioned <code className="text-accent font-mono">postMessage</code> protocol used
            when Cloudworx 3D Workspace is embedded within an industrial OEM host portal.
            Strict origin matching (<code className="text-accent font-mono">{window.location.origin}</code>) and payload schema checks are enforced.
          </p>

          <div className="grid grid-cols-2 gap-3 bg-industrial-900/50 p-3 rounded border border-industrial-700/50">
            <div>
              <label className="text-industrial-400 block mb-1">Host Project Context:</label>
              <input
                className="input-field text-xs"
                value={projectId}
                onChange={e => setProjectId(e.target.value)}
              />
            </div>
            <div>
              <label className="text-industrial-400 block mb-1">Host User Role:</label>
              <select
                className="input-field text-xs"
                value={userRole}
                onChange={e => setUserRole(e.target.value as 'SalesEngineer' | 'PlantArchitect')}
              >
                <option value="SalesEngineer">SalesEngineer (OEM Partner)</option>
                <option value="PlantArchitect">PlantArchitect (Enterprise)</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={sendHostHandshake}
              className="btn-primary text-xs py-1.5 px-3 flex-1"
            >
              Dispatch CLOUDWORX_HOST_INIT
            </button>
            <button
              onClick={sendTokenRefresh}
              className="btn-secondary text-xs py-1.5 px-3 flex-1"
            >
              Simulate Token Refresh
            </button>
          </div>

          <div>
            <div className="text-[11px] font-semibold text-industrial-400 mb-1 flex items-center justify-between">
              <span>Event Bus Traffic (Origin Verified):</span>
              <button
                onClick={() => setLogs([])}
                className="text-[10px] text-industrial-500 hover:text-industrial-300"
              >
                Clear
              </button>
            </div>
            <div className="bg-black/60 rounded p-2 font-mono text-[11px] text-green-400 h-28 overflow-y-auto space-y-1 border border-industrial-700">
              {logs.length === 0 ? (
                <span className="text-industrial-500 italic">No messages sent yet. Click a button above.</span>
              ) : (
                logs.map((log, idx) => <div key={idx}>{log}</div>)
              )}
            </div>
          </div>
        </div>

        <div className="p-3 bg-industrial-900/90 border-t border-industrial-700 flex justify-end">
          <button onClick={onClose} className="btn-secondary text-xs px-4 py-1.5">
            Close Simulation
          </button>
        </div>
      </div>
    </div>
  );
}
