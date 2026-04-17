import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { UIConfirmDialog } from '../ConfirmDialog';

describe('UIConfirmDialog', () => {
  it('calls onCancel and onConfirm when clicking action buttons', () => {
    const onCancel = vi.fn();
    const onConfirm = vi.fn();

    render(
      <UIConfirmDialog
        open
        title="Delete item"
        description="This action cannot be undone"
        onCancel={onCancel}
        onConfirm={onConfirm}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('disables action buttons when confirmLoading is true', () => {
    render(
      <UIConfirmDialog
        open
        title="Delete item"
        onCancel={() => undefined}
        onConfirm={() => undefined}
        confirmLoading
      />
    );

    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeDisabled();
  });
});
