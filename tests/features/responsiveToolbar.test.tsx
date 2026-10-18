import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Toolbar } from '../../src/features/toolbar/Toolbar';
import '../../src/i18n';

describe('Responsive Toolbar', () => {
  it('renders brand and toggle buttons', () => {
    const onTogglePalette = vi.fn();
    const onTogglePanel = vi.fn();

    render(
      <Toolbar
        fps={60}
        drawCalls={15}
        isPaletteOpen={false}
        onTogglePalette={onTogglePalette}
        isPanelOpen={false}
        onTogglePanel={onTogglePanel}
        violationsCount={2}
      />
    );

    // Equipment toggle button
    const paletteBtn = screen.getByLabelText('Toggle Equipment Palette');
    expect(paletteBtn).toBeInTheDocument();
    fireEvent.click(paletteBtn);
    expect(onTogglePalette).toHaveBeenCalledTimes(1);

    // Workspace panel toggle button
    const panelBtn = screen.getByLabelText('Toggle Workspace Panel');
    expect(panelBtn).toBeInTheDocument();
    fireEvent.click(panelBtn);
    expect(onTogglePanel).toHaveBeenCalledTimes(1);

    // Check violations badge is rendered
    expect(screen.getByText('2')).toBeInTheDocument();

    // Check FPS is rendered
    expect(screen.getByText('60')).toBeInTheDocument();
  });

  it('opens and closes responsive actions menu on smaller viewports', () => {
    const onOpenEmbedModal = vi.fn();

    render(
      <Toolbar
        fps={58}
        drawCalls={20}
        onOpenEmbedModal={onOpenEmbedModal}
      />
    );

    const actionsBtn = screen.getByTitle('Scene and Project Actions');
    expect(actionsBtn).toBeInTheDocument();

    // Dropdown initially closed
    expect(screen.queryByText(/Export Scene JSON/i)).not.toBeInTheDocument();

    // Click to open actions dropdown
    fireEvent.click(actionsBtn);
    expect(screen.getByText(/Export Scene JSON/i)).toBeInTheDocument();
    expect(screen.getByText(/Import Scene JSON/i)).toBeInTheDocument();

    // Click Host Embed simulation option
    const embedBtn = screen.getByText(/Host Embed Simulator/i);
    fireEvent.click(embedBtn);
    expect(onOpenEmbedModal).toHaveBeenCalledTimes(1);

    // Menu should close after action
    expect(screen.queryByText(/Export Scene JSON/i)).not.toBeInTheDocument();
  });

  it('renders language switcher and equipment shortcut inside actions dropdown for mobile', () => {
    const onTogglePalette = vi.fn();

    render(
      <Toolbar
        fps={60}
        drawCalls={10}
        onTogglePalette={onTogglePalette}
      />
    );

    const actionsBtn = screen.getByTitle('Scene and Project Actions');
    fireEvent.click(actionsBtn);

    // Language switcher in mobile actions dropdown
    expect(screen.getByText('Language')).toBeInTheDocument();

    // Equipment shortcut in mobile actions dropdown
    const paletteOption = screen.getByText(/Open Equipment Palette/i);
    expect(paletteOption).toBeInTheDocument();
    fireEvent.click(paletteOption);
    expect(onTogglePalette).toHaveBeenCalledTimes(1);
  });
});

