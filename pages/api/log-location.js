export default async function handler(req, res) {
    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Método não permitido' });
    }
  
    const { uuid, latitude, longitude } = req.body;
  
    if (!uuid || !latitude || !longitude) {
      return res.status(400).json({ message: 'Dados incompletos' });
    }
  
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/queues/log-location`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // se precisar de token, adicione aqui ex:
          // 'Authorization': `Bearer ${process.env.LARAVEL_API_TOKEN}`
        },
        body: JSON.stringify({ uuid, latitude, longitude }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        return res.status(response.status).json({ message: 'Erro ao registrar log', error: errorData });
      }
  
      return res.status(200).json({ message: 'Log registrado com sucesso' });
    } catch (error) {
      console.error('Erro ao enviar log para o Laravel:', error);
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }
  