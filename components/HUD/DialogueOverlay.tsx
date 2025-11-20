
import React, { useEffect, useState } from 'react';
import { ActiveDialogueState } from '../../types';
import { MessageSquare, User } from 'lucide-react';

interface DialogueOverlayProps {
  activeDialogue: ActiveDialogueState;
  onSelectOption: (nextId: string | null) => void;
}

export const DialogueOverlay: React.FC<DialogueOverlayProps> = ({ activeDialogue, onSelectOption }) => {
  const { currentNode } = activeDialogue;
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  // Typewriter Effect
  useEffect(() => {
    setDisplayedText('');
    setIsTyping(true);
    let index = 0;
    const speed = 30; // ms per char

    const interval = setInterval(() => {
      if (index < currentNode.text.length) {
        setDisplayedText((prev) => prev + currentNode.text.charAt(index));
        index++;
      } else {
        setIsTyping(false);
        clearInterval(interval);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [currentNode.id, currentNode.text]);

  const completeTyping = () => {
      setDisplayedText(currentNode.text);
      setIsTyping(false);
  };

  return (
    <div className="absolute inset-x-0 bottom-0 z-50 p-4 lg:p-8 animate-in slide-in-from-bottom-10 duration-300">
      <div className="w-full max-w-4xl mx-auto bg-slate-950 border-2 border-cyan-500/50 rounded-lg shadow-[0_0_50px_rgba(34,211,238,0.2)] flex flex-col md:flex-row overflow-hidden">
        
        {/* Portrait / Speaker Area */}
        <div className="w-full md:w-48 bg-slate-900 p-6 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-800">
            <div className="w-20 h-20 rounded-full bg-slate-800 border-2 border-cyan-400 mb-3 flex items-center justify-center overflow-hidden relative">
                <User size={48} className="text-cyan-200 relative z-10" />
                <div className="absolute inset-0 bg-cyan-500/20 animate-pulse"></div>
            </div>
            <h3 className="text-cyan-400 font-bold text-sm text-center tracking-widest uppercase">
                {currentNode.speaker}
            </h3>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 flex flex-col justify-between min-h-[200px]">
            <div 
                className={`mb-6 relative ${isTyping ? 'cursor-pointer' : ''}`}
                onClick={isTyping ? completeTyping : undefined}
                title={isTyping ? "Click to skip" : undefined}
            >
                <MessageSquare size={16} className="absolute -left-5 top-1 text-slate-600" />
                <p className="text-lg text-slate-200 font-mono leading-relaxed select-none">
                    {displayedText}
                    {isTyping && <span className="inline-block w-2 h-4 ml-1 bg-cyan-400 animate-pulse align-middle"></span>}
                </p>
            </div>

            {/* Options */}
            {!isTyping && (
                <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-left-4 duration-300">
                    {currentNode.options.map((opt, idx) => (
                        <button
                            key={idx}
                            onClick={() => onSelectOption(opt.nextId)}
                            className="text-left px-4 py-2 bg-slate-900 border border-slate-700 hover:border-cyan-400 hover:bg-slate-800 text-slate-300 hover:text-cyan-400 transition-all rounded group"
                        >
                            <span className="text-cyan-600 font-bold mr-3 group-hover:text-cyan-400">[{idx + 1}]</span>
                            {opt.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
