import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import BarcodeScanner from './BarcodeScanner';

const startMock = vi.fn();
const stopMock = vi.fn();

vi.mock('html5-qrcode', () => ({
  Html5Qrcode: vi.fn(function Html5Qrcode() {
    return {
      start: startMock,
      stop: stopMock,
    };
  }),
}));

describe('BarcodeScanner', () => {
  it('renders the scanner modal and starts camera scanner', async () => {
    startMock.mockResolvedValue(undefined);
    stopMock.mockResolvedValue(undefined);

    render(<BarcodeScanner onScan={vi.fn()} onClose={vi.fn()} />);

    expect(screen.getByText('Scan Barcode / QR Code')).toBeInTheDocument();
    expect(screen.getByText('Membuka kamera...')).toBeInTheDocument();
    await waitFor(() => expect(startMock).toHaveBeenCalled());
  });

  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn();
    startMock.mockResolvedValue(undefined);
    stopMock.mockResolvedValue(undefined);

    render(<BarcodeScanner onScan={vi.fn()} onClose={onClose} />);

    await userEvent.click(screen.getByRole('button'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
