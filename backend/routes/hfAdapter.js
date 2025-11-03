// server/routes/hfAdapter.js
import express from 'express';
import fetch from 'node-fetch';
const router = express.Router();

router.post('/career-objective', async (req, res) => {
  try {
    const { messages } = req.body;
    if (!Array.isArray(messages)) return res.status(400).json({ error: 'messages array required' });

    // Build optimized prompt for resume writing
    const userContent = messages.map(m => `${m.role}: ${m.content}`).join('\n');
    const prompt = `You are an expert resume writer and career coach. Create a professional 3-4 sentence career summary based on this conversation:\n\n${userContent}\n\nProfessional Summary:`;

    const response = await fetch(
      'https://api-inference.huggingface.co/models/HuggingFaceTB/SmolLM3-3B-Instruct',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.HF_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: 150,
            temperature: 0.7,
            do_sample: true,
            return_full_text: false
          }
        })
      }
    );

    if (!response.ok) {
      const err = await response.text();
      console.error('HF error', err);
      // Handle model loading time
      if (response.status === 503) {
        return res.status(503).json({ 
          error: 'Model is loading, please try again in 20-30 seconds' 
        });
      }
      return res.status(response.status).json({ error: err });
    }

    const data = await response.json();
    
    // Extract generated text from response
    let generatedText = '';
    if (Array.isArray(data) && data[0] && data[0].generated_text) {
      generatedText = data[0].generated_text;
    } else if (data.generated_text) {
      generatedText = data.generated_text;
    } else {
      generatedText = JSON.stringify(data);
    }

    // Clean up the response (remove the prompt if it's included)
    const cleanSummary = generatedText.replace(prompt, '').trim();
    
    return res.json({ 
      success: true, 
      summary: cleanSummary,
      model: 'SmolLM3-3B-Instruct'
    });
  } catch (err) {
    console.error('HF route error:', err);
    res.status(500).json({ error: 'AI service temporarily unavailable' });
  }
});

export default router;