import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Notification from '../../../components/common/Notification';

describe('Notification Component', () => {
  it('renders success notification correctly', () => {
    const message = 'Operation successful';
    render(<Notification type="success" message={message} onClose={() => {}} />);
    
    expect(screen.getByText(message)).toBeInTheDocument();
    expect(screen.getByText(message).parentElement).toHaveClass('text-green-700');
  });

  it('renders error notification correctly', () => {
    const message = 'Operation failed';
    render(<Notification type="error" message={message} onClose={() => {}} />);
    
    expect(screen.getByText(message)).toBeInTheDocument();
    expect(screen.getByText(message).parentElement).toHaveClass('text-red-700');
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = jest.fn();
    render(<Notification type="success" message="Test" onClose={onClose} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
}); 