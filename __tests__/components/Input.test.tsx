/**
 * Input Component Tests
 */

import { render, screen } from '@testing-library/react';
import { Input } from '../components/ui/Input';

describe('Input', () => {
  it('renders with label', () => {
    render(<Input label="Email" />);
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('shows error message', () => {
    render(<Input error="Invalid email" />);
    expect(screen.getByText('Invalid email')).toBeInTheDocument();
  });

  it('applies error styling', () => {
    const { container } = render(<Input error="Error" />);
    expect(container.querySelector('input')).toHaveClass('border-red-500');
  });
});

