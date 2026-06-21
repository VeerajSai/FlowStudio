import { useState, useCallback, useRef } from 'react';
import { ThemeProvider } from './components/ThemeToggle';
import { ToastProvider } from './components/Toaster';
import TopBar from './components/TopBar';
import SubmitButton from './components/SubmitButton';
import ThemeToggle from './components/ThemeToggle';
import PipelineActions from './components/PipelineActions';
import ToolbarRail from './components/ToolbarRail';
import CommandPalette from './components/CommandPalette';
import StatusBar from './components/StatusBar';
import { PipelineUI } from './ui';
import useKeyboardShortcuts from './hooks/useKeyboardShortcuts';

function AppInner() {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const pipelineRef = useRef(null);

  const togglePalette = useCallback(() => setPaletteOpen((p) => !p), []);

  useKeyboardShortcuts({ onTogglePalette: togglePalette });

  const handleSelectNode = useCallback((type) => {
    pipelineRef.current?.addNodeAtCenter(type);
  }, []);

  return (
    <div className="flex flex-col h-screen bg-canvas">
      <TopBar>
        <PipelineActions />
        <ThemeToggle />
        <SubmitButton />
      </TopBar>
      <div className="flex flex-1 overflow-hidden">
        <ToolbarRail onAdd={handleSelectNode} />
        <PipelineUI ref={pipelineRef} />
      </div>
      <StatusBar />
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onSelectNode={handleSelectNode}
      />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AppInner />
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
