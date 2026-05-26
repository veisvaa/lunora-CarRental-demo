const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const SYSTEM_PROMPT = `You are a professional and premium WhatsApp customer service assistant for a car rental company in Malaysia. The company name, fleet details, and pricing will be provided in each request.

Rules:
- Always respond in the same language the customer uses (English or Bahasa Malaysia)
- Be warm, professional, and slightly premium in tone — this is a luxury car rental service
- Keep replies concise — this is WhatsApp, not email
- Use line breaks to keep messages readable on mobile
- Never guarantee vehicle availability without saying "subject to availability"
- Use relevant emojis sparingly (1-2 per message max)
- Never use markdown formatting — no bold (**text**), no asterisks, no dashes as bullet points. Plain text only.
- When taking a booking enquiry, always collect: full name, pickup date and time, return date and time, preferred vehicle, pickup location
- Generate booking reference numbers like #[COMPANY_CODE]-[4 random digits]
- If asked something you cannot confirm, say you will check with the team and get back shortly
- Never discuss competitor pricing
- Always mention that final rates are confirmed upon booking`;

app.get('/', (req, res) => {
  res.json({ status: 'R Global Car Rental Demo API is running' });
});

app.post('/chat', async (req, res) => {
  const { messages, rentalConfig } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid messages format' });
  }

  const rental = rentalConfig || {
    name: 'R Global Car Rental',
    hours: 'Daily 8am–8pm, Emergency line available 24/7',
    location: 'No. 5, Jalan Ampang, Kuala Lumpur City Centre, KL 50450',
    phone: '+60 3-2345 6789',
    code: 'RGC',
    fleet: [
      'Toyota Vios – from RM120/day',
      'Honda City – from RM130/day',
      'Toyota Camry – from RM220/day',
      'BMW 3 Series – from RM380/day',
      'Mercedes-Benz E-Class – from RM450/day',
      'Toyota Alphard – from RM550/day',
      'Honda CR-V – from RM200/day',
      'Toyota Fortuner – from RM280/day'
    ],
    deposit: 'RM500–RM2,000 refundable deposit depending on vehicle class',
    requirements: 'Valid driving licence (min. 2 years), MyKad or Passport, minimum age 23',
    payment: 'Cash, TNG eWallet, credit/debit card, bank transfer',
    extras: 'GPS navigation – RM15/day, Child seat – RM20/day, Full insurance coverage available'
  };

  const systemPrompt = `${SYSTEM_PROMPT}

COMPANY DETAILS:
- Name: ${rental.name}
- Operating Hours: ${rental.hours}
- Main Office: ${rental.location}
- Phone: ${rental.phone}
- Booking reference prefix: #${rental.code}
- Fleet & Rates: ${rental.fleet.join(', ')}
- Security Deposit: ${rental.deposit}
- Requirements: ${rental.requirements}
- Payment Methods: ${rental.payment}
- Add-ons: ${rental.extras}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1000,
        system: systemPrompt,
        messages: messages
      })
    });

    const data = await response.json();

    if (data.error) {
      return res.status(500).json({ error: data.error.message });
    }

    res.json({ reply: data.content[0].text });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: 'Failed to get response' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
