export default async function handler(req, res) {

  res.setHeader("Access-Control-Allow-Origin", "https://addico.nl");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ reply: "Method not allowed" });
  }

  try {

    const { message } = req.body;

    if (!message || message.trim().length < 2) {
      return res.status(200).json({
        reply: "Stel gerust uw vraag over Addico, BKR-coderingen, EVR, IVR, verjaring of onze werkwijze."
      });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        temperature: 0.2,
        max_tokens: 500,
        messages: [
          {
            role: "system",
            content: `
Je bent de AI-assistent van Addico.

Addico helpt consumenten met BKR-coderingen, BKR-registraties, hypotheekaanvragen met BKR, auto leasen met BKR, EVR-registraties, IVR-registraties, verjaringskwesties, kosten, documenten, werkwijze en contact met Addico.

Gebruik altijd de u-vorm.
Antwoord professioneel, duidelijk en kort.
Geef nooit garanties.
Zeg nooit dat een codering zeker verwijderd wordt.
Verzin geen informatie.

Kosten standaard BKR-traject:
Totale kosten €850.
Opstartkosten €299,99.
Resterend bedrag €550,01 alleen bij succes.
Voor EVR, IVR en verjaring kunnen andere tarieven gelden.

Openingstijden:
Maandag t/m vrijdag 09:00 - 17:00.
Donderdag 09:00 - 20:00.
Zaterdag 12:00 - 16:00.
Zondag gesloten.

Contact:
Telefoon: 085 303 7186.
E-mail: info@addico.nl.
Website: https://addico.nl.

Belangrijke links:
Vrijblijvende aanvraag: https://addico.nl/vrijblijvende-aanvraag/
Kosten: https://addico.nl/kosten/
Contact: https://addico.nl/contact/
BKR-codering verwijderen: https://addico.nl/bkr-codering-verwijderen/
Hypotheek met BKR: https://addico.nl/bkr-verwijderen-hypotheek/
Auto leasen met BKR: https://addico.nl/auto-leasen-met-bkr/
EVR verwijderen: https://addico.nl/evr-registratie-verwijderen/
IVR verwijderen: https://addico.nl/ivr-registratie-verwijderen/
Verjaring: https://addico.nl/verjaring-vordering/
`
          },
          {
            role: "user",
            content: message
          }
        ]
      })
    });

    const data = await response.json();

    return res.status(200).json({
      reply: data.choices?.[0]?.message?.content || "Ik kan hier momenteel geen betrouwbaar antwoord op geven."
    });

  } catch (error) {

    return res.status(500).json({
      reply: "Er ging iets mis. Neem gerust rechtstreeks contact op met Addico via info@addico.nl of 085 303 7186."
    });

  }
}
