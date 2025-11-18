import React, { useEffect, useRef } from 'react';
import { LogEntry } from '../../types';

export const LogConsole: React.FC<{ logs: LogEntry[] }> = ({ logs }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="bg-slate-950 border border-slate-800 h-48 rounded p-3 overflow-y-auto font-mono text-sm shadow-inner">
      {logs.length === 0 && <div className="text-slate-600 italic">Awaiting input...</div>}
      
      <div className="flex flex-col-reverse justify-end min-h-full">
          {/* We map normally, but flex-col-reverse keeps visual continuity while allowing us to keep the array history logic simple */}
          {logs.slice().reverse().map((log) => (
            <div key={log.id} className="mb-1 animate-in fade-in slide-in-from-left-2 duration-300">
                <span className="text-slate-600 text-xs mr-2">[{log.timestamp}]</span>
                <span className={`
                    ${log.type === 'SYSTEM' ? 'text-cyan-500 font-bold' : ''}
                    ${log.type === 'INFO' ? 'text-slate-300' : ''}
                    ${log.type === 'DIALOGUE' ? 'text-amber-300 italic' : ''}
                    ${log.type === 'COMBAT' ? 'text-red-400 font-bold' : ''}
                `}>
                    {log.type === 'SYSTEM' && '> '}
                    {log.message}
                </span>
            </div>
          ))}
          <div ref={bottomRef} />
      </div>
    </div>
  );
};
