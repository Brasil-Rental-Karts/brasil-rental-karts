import { render } from '@testing-library/react';
import Metrics from './index';
import MicrosoftClarity from './MicrosoftClarity';

// Mock do componente MicrosoftClarity
jest.mock('./MicrosoftClarity', () => {
  return jest.fn(() => <div data-testid="mock-clarity" />);
});

describe('Metrics Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renderiza o componente MicrosoftClarity', () => {
    render(<Metrics />);
    expect(MicrosoftClarity).toHaveBeenCalled();
  });
}); 