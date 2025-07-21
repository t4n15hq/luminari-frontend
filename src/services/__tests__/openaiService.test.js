import openaiService from '../openaiService';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios;

describe('OpenAI Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset environment variables
    process.env.REACT_APP_OPENAI_API_URL = 'http://localhost:5000';
  });

  describe('queryAssistant', () => {
    test('sends POST request to correct endpoint with question only', async () => {
      const mockResponse = {
        data: {
          answer: 'This is a test response from the AI assistant.'
        }
      };
      mockedAxios.post.mockResolvedValue(mockResponse);

      const params = {
        question: 'What is a clinical trial?'
      };

      const result = await openaiService.queryAssistant(params);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:5000/api/query',
        {
          question: 'What is a clinical trial?',
          disease_context: undefined
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      expect(result).toEqual({
        answer: 'This is a test response from the AI assistant.'
      });
    });

    test('sends POST request with disease context when provided', async () => {
      const mockResponse = {
        data: {
          answer: 'Response with disease context.'
        }
      };
      mockedAxios.post.mockResolvedValue(mockResponse);

      const params = {
        question: 'What are the treatment options?',
        disease_context: 'Melanoma'
      };

      const result = await openaiService.queryAssistant(params);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:5000/api/query',
        {
          question: 'What are the treatment options?',
          disease_context: 'Melanoma'
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      expect(result).toEqual({
        answer: 'Response with disease context.'
      });
    });

    test('handles missing question parameter', async () => {
      const params = {
        disease_context: 'Melanoma'
      };

      await expect(openaiService.queryAssistant(params)).rejects.toThrow('Question is required');
    });

    test('handles empty question parameter', async () => {
      const params = {
        question: '',
        disease_context: 'Melanoma'
      };

      await expect(openaiService.queryAssistant(params)).rejects.toThrow('Question is required');
    });

    test('handles network error gracefully', async () => {
      mockedAxios.post.mockRejectedValue(new Error('Network Error'));

      const params = {
        question: 'What is a clinical trial?'
      };

      await expect(openaiService.queryAssistant(params)).rejects.toThrow('Network Error');
    });

    test('handles API error response gracefully', async () => {
      const errorResponse = {
        response: {
          status: 500,
          data: {
            error: 'Internal Server Error'
          }
        }
      };
      mockedAxios.post.mockRejectedValue(errorResponse);

      const params = {
        question: 'What is a clinical trial?'
      };

      await expect(openaiService.queryAssistant(params)).rejects.toEqual(errorResponse);
    });

    test('handles API timeout', async () => {
      mockedAxios.post.mockRejectedValue({ code: 'ECONNABORTED' });

      const params = {
        question: 'What is a clinical trial?'
      };

      await expect(openaiService.queryAssistant(params)).rejects.toEqual({ code: 'ECONNABORTED' });
    });

    test('handles malformed response data', async () => {
      const mockResponse = {
        data: null
      };
      mockedAxios.post.mockResolvedValue(mockResponse);

      const params = {
        question: 'What is a clinical trial?'
      };

      const result = await openaiService.queryAssistant(params);
      expect(result).toBeNull();
    });

    test('handles response without answer field', async () => {
      const mockResponse = {
        data: {
          status: 'success',
          // missing answer field
        }
      };
      mockedAxios.post.mockResolvedValue(mockResponse);

      const params = {
        question: 'What is a clinical trial?'
      };

      const result = await openaiService.queryAssistant(params);
      expect(result).toEqual({
        status: 'success'
      });
    });

    test('uses environment variable for API URL', async () => {
      process.env.REACT_APP_OPENAI_API_URL = 'https://custom-api.example.com';
      
      const mockResponse = {
        data: {
          answer: 'Response from custom API'
        }
      };
      mockedAxios.post.mockResolvedValue(mockResponse);

      const params = {
        question: 'Test question'
      };

      await openaiService.queryAssistant(params);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://custom-api.example.com/api/query',
        expect.any(Object),
        expect.any(Object)
      );
    });

    test('handles undefined disease_context correctly', async () => {
      const mockResponse = {
        data: {
          answer: 'Response without context'
        }
      };
      mockedAxios.post.mockResolvedValue(mockResponse);

      const params = {
        question: 'What is a clinical trial?',
        disease_context: undefined
      };

      await openaiService.queryAssistant(params);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:5000/api/query',
        {
          question: 'What is a clinical trial?',
          disease_context: undefined
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    });

    test('trims whitespace from question', async () => {
      const mockResponse = {
        data: {
          answer: 'Trimmed response'
        }
      };
      mockedAxios.post.mockResolvedValue(mockResponse);

      const params = {
        question: '  What is a clinical trial?  '
      };

      await openaiService.queryAssistant(params);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:5000/api/query',
        {
          question: '  What is a clinical trial?  ',
          disease_context: undefined
        },
        expect.any(Object)
      );
    });

    test('handles long questions correctly', async () => {
      const longQuestion = 'This is a very long question that contains multiple sentences and detailed information about clinical trials, regulatory requirements, patient safety, efficacy endpoints, and various other medical research topics that might be asked in a real clinical research setting.';
      
      const mockResponse = {
        data: {
          answer: 'Response to long question'
        }
      };
      mockedAxios.post.mockResolvedValue(mockResponse);

      const params = {
        question: longQuestion
      };

      await openaiService.queryAssistant(params);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:5000/api/query',
        {
          question: longQuestion,
          disease_context: undefined
        },
        expect.any(Object)
      );
    });

    test('handles special characters in question', async () => {
      const questionWithSpecialChars = 'What about α-blockers & β-agonists? Can they be used for COVID-19 patients (>65 years)?';
      
      const mockResponse = {
        data: {
          answer: 'Response with special characters'
        }
      };
      mockedAxios.post.mockResolvedValue(mockResponse);

      const params = {
        question: questionWithSpecialChars
      };

      await openaiService.queryAssistant(params);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:5000/api/query',
        {
          question: questionWithSpecialChars,
          disease_context: undefined
        },
        expect.any(Object)
      );
    });
  });
});