import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DashboardContent, VerificationView } from '../App';

describe('DashboardContent Component', () => {
  test('renders actual dashboard content and no placeholder text', () => {
    render(<DashboardContent />);
    expect(screen.getByRole('heading', { name: /clinical assertion studio/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/type your medical query here/i)).toBeInTheDocument();
    expect(screen.queryByText(/dashboard content goes here/i)).not.toBeInTheDocument();
  });
});

describe('VerificationView Component', () => {
  test('renders actual verification view content and no placeholder text', () => {
    render(<VerificationView />);
    expect(screen.getByRole('heading', { name: /verification results/i })).toBeInTheDocument();
    expect(screen.getByText(/verification results will be displayed here/i)).toBeInTheDocument();
    expect(screen.queryByText(/verification view goes here/i)).not.toBeInTheDocument();
  });
});
