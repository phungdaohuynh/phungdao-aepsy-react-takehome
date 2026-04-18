import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { UIButton } from '../Button';
import { UIToastProvider, useUIToast } from '../ToastProvider';

function ToastConsumer() {
  const toast = useUIToast();

  return (
    <>
      <UIButton onClick={() => toast.showSuccess('Saved successfully')}>Success</UIButton>
      <UIButton onClick={() => toast.showError('Request failed')}>Error</UIButton>
    </>
  );
}

describe('UIToastProvider', () => {
  it('shows a success toast when showSuccess is called', async () => {
    render(
      <UIToastProvider>
        <ToastConsumer />
      </UIToastProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Success' }));

    expect(await screen.findByText('Saved successfully')).toBeInTheDocument();
  });

  it('throws if useUIToast is used outside provider', () => {
    function InvalidConsumer() {
      useUIToast();
      return null;
    }

    expect(() => render(<InvalidConsumer />)).toThrow(
      'useUIToast must be used within UIToastProvider',
    );
  });
});
