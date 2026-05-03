import client from './client';

export const runArimaPrediction = async (data) => {
  // PENTING: Pakai /predictions/arima (dengan 's')
  // Sesuaikan dengan route di backend: app.use('/api/predictions', predictionRoutes)
  const response = await client.post('/predictions/arima', data);
  return response.data;
};  