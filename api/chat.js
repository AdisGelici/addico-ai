const ipRequests = new Map();

function getIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.socket?.remoteAddress || "unknown";
}

function isRateLimited(ip) {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxRequests = 10;

  const current = ipRequests.get(ip) || [];
  const recent = current.filter((time) => now - time < windowMs);

  if (recent.length >= maxRequests) {
    ipRequests.set(ip, recent);
    return true;
  }

  recent.push(now);
  ipRequests.set(ip, recent);
  return false;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ reply: "Method not allowed" });
  }

  const ip = getIp(req);

  if (isRateLimited(ip)) {
    return res.status(429).json({
      reply: "Er worden tijdelijk te veel berichten verzonden. Probeer het over een minuut opnieuw of neem contact op via WhatsApp: https://wa.me/31686373818"
    });
  }

  try {
    const { message } = req.body;

    if (!message || message.trim().length < 2) {
      return res.status(200).json({
        reply: "Stel gerust uw vraag over Addico, BKR-coderingen, EVR, IVR, verjaring of onze werkwijze."
      });
    }

    if (message.length > 700) {
      return res.status(200).json({
        reply: "Uw bericht is vrij lang. Kunt u uw vraag korter stellen? Voor een volledige beoordeling kunt u ook een vrijblijvende aanvraag indienen: https://addico.nl/vrijblijvende-aanvraag/"
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
        max_tokens: 650,
        messages: [
          {
            role: "system",
            content: `
Je bent de AI-assistent van Addico.

Addico helpt consumenten met:

* BKR-coderingen
* EVR-registraties
* IVR-registraties
* verjaring
* finale kwijting
* problemen met hypotheek of lease door kredietregistraties

Gebruik altijd de u-vorm.

Antwoord:

* professioneel
* duidelijk
* menselijk
* behulpzaam
* kort maar informatief

Geef nooit garanties.
Zeg nooit dat iets “zeker verwijderd” wordt.
Doe nooit een definitieve beoordeling zonder dossier.

Gebruik liever formuleringen zoals:

* “dit hangt af van uw situatie”
* “dit verschilt per dossier”
* “Addico kan dit vrijblijvend beoordelen”

BELANGRIJK:

Verwijs niet standaard naar de vrijblijvende aanvraag.

Als iemand alleen een algemene vraag stelt, geef dan eerst gewoon uitleg.

Bijvoorbeeld bij vragen zoals:

* wat is EVR
* wat betekent code 2
* hoe werkt BKR
* waar kan ik meer lezen

Geef dan:

* een duidelijke uitleg
* eventueel één relevante link
* geen overdreven verkooptekst

Gebruik pas een aanvraag-CTA wanneer iemand:

* hulp wil
* vraagt naar kansen
* vraagt naar kosten
* aangeeft zelf een registratie te hebben
* problemen heeft met hypotheek of lease
* vraagt of Addico kan meekijken

Website:
https://addico.nl

Vrijblijvende aanvraag:
https://addico.nl/vrijblijvende-aanvraag/

Contact:
https://addico.nl/contact/

WhatsApp:
https://wa.me/31686373818

Telefoon:
085 303 7186

E-mail:
[info@addico.nl](mailto:info@addico.nl)

Belangrijke pagina’s:

BKR:
https://addico.nl/bkr-codering-verwijderen/

Hypotheek:
https://addico.nl/bkr-verwijderen-hypotheek/

Lease:
https://addico.nl/auto-leasen-met-bkr/

EVR:
https://addico.nl/evr-registratie-verwijderen/

IVR:
https://addico.nl/ivr-registratie-verwijderen/

Verjaring:
https://addico.nl/verjaring-vordering/

Kosten standaard BKR-traject:

* €299,99 opstartkosten
* €550,01 alleen bij succes

EVR/IVR:

* €399 vooraf
* €550 bij succes

Verjaring:

* vanaf €499 + 10% van verjaard bedrag

Finale kwijting:

* 15% van bespaarde bedrag

Als iemand iets vraagt buiten Addico, BKR, EVR, IVR, verjaring of kredietregistraties, zeg dan vriendelijk dat u alleen daarbij kunt helpen.
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
