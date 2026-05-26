export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({
      reply: "Method not allowed"
    });
  }

  try {

    const { message } = req.body;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {

      method: "POST",

      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },

      body: JSON.stringify({

        model: "gpt-4.1-mini",

        messages: [

          {
            role: "system",
            content: `
Je bent de AI assistent van Addico.

Addico helpt mensen met:
- BKR-coderingen
- Hypotheken met BKR
- IVR-registraties
- EVR-registraties
- Kredietregistraties

Geef nette professionele antwoorden in het Nederlands.
Geef nooit garanties.
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

    res.status(200).json({
      reply: data.choices[0].message.content
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      reply: "Er ging iets mis."
    });

  }

}
