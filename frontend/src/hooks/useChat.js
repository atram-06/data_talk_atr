import { useState, useCallback } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

export function useChat() {
  const [messages, setMessages] = useState([]);
  const [charts, setCharts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const sendMessage = useCallback(async (question) => {
    if (!question.trim()) return;

    const userMsg = { role: 'user', content: question, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);
    setError(null);

    try {
      const history = messages.slice(-6).map(m => ({ role: m.role, content: m.content }));

      const res = await fetch(`${API_BASE}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, history })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error_message || errData.error || `Server error (${res.status})`);
      }

      const data = await res.json();

      const aiMsg = {
        role: 'assistant',
        content: data.insight || 'Here are the results.',
        sql_query: data.sql_query,
        can_answer: data.can_answer,
        chart_type: data.chart_type,
        title: data.title,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, aiMsg]);

      // Add all 4 chart types to dashboard if we got valid data
      if (data.can_answer && data.data && data.data.length > 0) {
        const chartTypes = ['bar', 'line', 'scatter', 'pie'];
        const newCharts = chartTypes.map((type, i) => ({
          id: Date.now() + i,
          chart_type: type,
          title: data.title || question,
          data: data.data,
          x_key: data.x_key,
          y_key: data.y_key,
          insight: data.insight,
          sql_query: data.sql_query
        }));
        setCharts(prev => [...newCharts, ...prev]);
      }
    } catch (err) {
      const errMsg = {
        role: 'assistant',
        content: err.message || 'An error occurred. Please try again.',
        isError: true,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errMsg]);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  const clearCharts = useCallback(() => setCharts([]), []);
  const clearMessages = useCallback(() => setMessages([]), []);

  return {
    messages,
    charts,
    isLoading,
    error,
    sendMessage,
    clearCharts,
    clearMessages
  };
}
