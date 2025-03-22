import { render } from '@testing-library/react';
import Metrics from './index';
import MicrosoftClarity from './MicrosoftClarity';

// Mock do componente MicrosoftClarity
jest.mock('./MicrosoftClarity', () => {
  return jest.fn(() => null);
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