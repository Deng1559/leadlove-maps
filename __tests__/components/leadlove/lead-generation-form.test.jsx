import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LeadGenerationForm } from '../../../src/components/leadlove/lead-generation-form';
import { mockUser, mockLeadGenerationResponse } from '../../utils/mockData';

// Mock the providers
const mockUseAuth = jest.fn();
const mockUseCredits = jest.fn();
const mockToast = jest.fn();

jest.mock('../../../src/components/providers', () => ({
  useAuth: () => mockUseAuth(),
  useCredits: () => mockUseCredits(),
}));

jest.mock('../../../src/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

// Mock fetch
global.fetch = jest.fn();

describe('LeadGenerationForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseAuth.mockReturnValue({
      profile: mockUser,
    });
    
    mockUseCredits.mockReturnValue({
      credits: 100,
      refreshCredits: jest.fn(),
    });
    
    global.fetch.mockClear();
  });

  test('renders form with all required fields', () => {
    render(<LeadGenerationForm />);

    expect(screen.getByLabelText(/business type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/location/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/service offering/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/country/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/max results/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /generate leads/i })).toBeInTheDocument();
  });

  test('displays credit cost and available balance', () => {
    render(<LeadGenerationForm />);

    expect(screen.getByText(/credit cost:/i)).toBeInTheDocument();
    expect(screen.getByText(/available: 100 credits/i)).toBeInTheDocument();
    expect(screen.getByText(/3 credits/i)).toBeInTheDocument(); // Default cost for 20 results
  });

  test('updates credit cost when max results change', async () => {
    render(<LeadGenerationForm />);

    const maxResultsSelect = screen.getByLabelText(/max results/i);
    
    // Change to 50 results (should cost 8 credits)
    fireEvent.change(maxResultsSelect, { target: { value: '50' } });

    await waitFor(() => {
      expect(screen.getByText(/8 credits/i)).toBeInTheDocument();
    });
  });

  test('shows insufficient credits warning when balance is too low', () => {
    mockUseCredits.mockReturnValue({
      credits: 1, // Less than required 3 credits
      refreshCredits: jest.fn(),
    });

    render(<LeadGenerationForm />);

    expect(screen.getByText(/insufficient credits/i)).toBeInTheDocument();
    expect(screen.getByText(/you need 3 credits but only have 1 available/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /purchase more credits/i })).toBeInTheDocument();
  });

  test('disables submit button when credits are insufficient', () => {
    mockUseCredits.mockReturnValue({
      credits: 1,
      refreshCredits: jest.fn(),
    });

    render(<LeadGenerationForm />);

    const submitButton = screen.getByRole('button', { name: /generate leads/i });
    expect(submitButton).toBeDisabled();
  });

  test('disables submit button when required fields are empty', () => {
    render(<LeadGenerationForm />);

    const submitButton = screen.getByRole('button', { name: /generate leads/i });
    
    // Initially disabled because businessType and location are empty
    expect(submitButton).toBeDisabled();
  });

  test('enables submit button when all required fields are filled and credits are sufficient', async () => {
    render(<LeadGenerationForm />);

    const businessTypeSelect = screen.getByLabelText(/business type/i);
    const locationInput = screen.getByLabelText(/location/i);
    
    fireEvent.change(businessTypeSelect, { target: { value: 'restaurants' } });
    fireEvent.change(locationInput, { target: { value: 'Miami Beach, FL' } });

    await waitFor(() => {
      const submitButton = screen.getByRole('button', { name: /generate leads/i });
      expect(submitButton).not.toBeDisabled();
    });
  });

  test('successfully submits form and shows success message', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockLeadGenerationResponse),
    });

    const mockRefreshCredits = jest.fn();
    mockUseCredits.mockReturnValue({
      credits: 100,
      refreshCredits: mockRefreshCredits,
    });

    render(<LeadGenerationForm />);

    const businessTypeSelect = screen.getByLabelText(/business type/i);
    const locationInput = screen.getByLabelText(/location/i);
    const submitButton = screen.getByRole('button', { name: /generate leads/i });

    fireEvent.change(businessTypeSelect, { target: { value: 'restaurants' } });
    fireEvent.change(locationInput, { target: { value: 'Miami Beach, FL' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Lead Generation Started',
        description: expect.stringContaining('Processing restaurants businesses in Miami Beach, FL'),
        variant: 'success',
      });
    });

    expect(mockRefreshCredits).toHaveBeenCalled();
    expect(screen.getByText(/lead generation started/i)).toBeInTheDocument();
  });

  test('handles insufficient credits error from API', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 402,
      json: () => Promise.resolve({
        error: 'Insufficient credits',
        message: 'You do not have enough credits for this operation.',
      }),
    });

    render(<LeadGenerationForm />);

    const businessTypeSelect = screen.getByLabelText(/business type/i);
    const locationInput = screen.getByLabelText(/location/i);
    const submitButton = screen.getByRole('button', { name: /generate leads/i });

    fireEvent.change(businessTypeSelect, { target: { value: 'restaurants' } });
    fireEvent.change(locationInput, { target: { value: 'Miami Beach, FL' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Insufficient Credits',
        description: 'You do not have enough credits for this operation.',
        variant: 'destructive',
      });
    });
  });

  test('handles API errors gracefully', async () => {
    global.fetch.mockRejectedValue(new Error('Network error'));

    const mockRefreshCredits = jest.fn();
    mockUseCredits.mockReturnValue({
      credits: 100,
      refreshCredits: mockRefreshCredits,
    });

    render(<LeadGenerationForm />);

    const businessTypeSelect = screen.getByLabelText(/business type/i);
    const locationInput = screen.getByLabelText(/location/i);
    const submitButton = screen.getByRole('button', { name: /generate leads/i });

    fireEvent.change(businessTypeSelect, { target: { value: 'restaurants' } });
    fireEvent.change(locationInput, { target: { value: 'Miami Beach, FL' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Generation Failed',
        description: 'Network error',
        variant: 'destructive',
      });
    });

    expect(mockRefreshCredits).toHaveBeenCalled(); // Should refresh in case of refund
    expect(screen.getByText(/generation failed/i)).toBeInTheDocument();
  });

  test('shows loading state during submission', async () => {
    global.fetch.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(<LeadGenerationForm />);

    const businessTypeSelect = screen.getByLabelText(/business type/i);
    const locationInput = screen.getByLabelText(/location/i);
    const submitButton = screen.getByRole('button', { name: /generate leads/i });

    fireEvent.change(businessTypeSelect, { target: { value: 'restaurants' } });
    fireEvent.change(locationInput, { target: { value: 'Miami Beach, FL' } });
    fireEvent.click(submitButton);

    expect(screen.getByText(/generating leads.../i)).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  test('displays workflow ID and credit information on success', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockLeadGenerationResponse),
    });

    render(<LeadGenerationForm />);

    const businessTypeSelect = screen.getByLabelText(/business type/i);
    const locationInput = screen.getByLabelText(/location/i);
    const submitButton = screen.getByRole('button', { name: /generate leads/i });

    fireEvent.change(businessTypeSelect, { target: { value: 'restaurants' } });
    fireEvent.change(locationInput, { target: { value: 'Miami Beach, FL' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/workflow id: wf-12345/i)).toBeInTheDocument();
      expect(screen.getByText(/credits consumed: 3/i)).toBeInTheDocument();
      expect(screen.getByText(/remaining: 97/i)).toBeInTheDocument();
    });
  });
});