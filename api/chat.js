const ipRequests = new Map();

function getIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.socket?.remoteAddress || "unknown";
}

function isRateLimited(ip) {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxRequests = 12;

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
    return res.status(405).json({
      reply: "Method not allowed"
    });
  }

  const ip = getIp(req);

  if (isRateLimited(ip)) {
    return res.status(429).json({
      reply:
        "Er worden tijdelijk te veel berichten verzonden. Probeer het over een minuut opnieuw of neem contact op via WhatsApp: https://wa.me/31853037186"
    });
  }

  try {
    const { message } = req.body;

    if (!message || message.trim().length < 2) {
      return res.status(200).json({
        reply:
          "Stel gerust uw vraag over BKR, EVR, IVR, verjaring, hypotheek, lease of de dienstverlening van Addico."
      });
    }

    if (message.length > 900) {
      return res.status(200).json({
        reply:
          "Uw bericht is vrij lang. Kunt u uw vraag iets korter formuleren?"
      });
    }

    const systemPrompt = `
Je bent de AI-assistent van Addico.

Addico helpt consumenten met:
- BKR-coderingen
- BKR-registraties
- hypotheekproblemen door BKR
- auto lease problemen door BKR
- EVR-registraties
- IVR-registraties
- verjaring van vorderingen
- finale kwijting

Gebruik altijd de u-vorm.

Schrijf:
- professioneel
- duidelijk
- vriendelijk
- menselijk
- betrouwbaar
- natuurlijk

Houd antwoorden meestal kort:
- gemiddeld 2 tot 6 zinnen
- alleen langer als nodig

Gebruik geen moeilijke juridische taal tenzij nodig.

Geef nooit garanties.
Zeg nooit dat iets zeker verwijderd wordt.
Zeg nooit dat iemand zeker een hypotheek, leaseauto of financiering krijgt.
Doe nooit een definitieve beoordeling zonder dossier.

Gebruik liever:
- "Dit hangt af van uw situatie."
- "Dit verschilt per dossier."
- "Dat moet inhoudelijk beoordeeld worden."
- "Addico kan vrijblijvend meekijken."

BELANGRIJK:

Verwijs NIET standaard naar:
- vrijblijvende aanvraag
- WhatsApp
- contactgegevens

Doe dit alleen als iemand:
- hulp wil
- vraagt of Addico kan helpen
- vraagt naar kansen
- vraagt naar kosten
- zegt zelf een registratie te hebben
- problemen heeft met hypotheek, lease of financiering
- vraagt of Addico kan meekijken

Bij algemene vragen:
- geef gewoon uitleg
- eventueel 1 relevante link
- geen verkooptekst

Voorbeelden van algemene vragen:
- Wat is EVR?
- Wat is IVR?
- Wat betekent code 2?
- Hoe werkt BKR?
- Waar kan ik meer lezen?

WEBSITE:
https://addico.nl

AANVRAAG:
https://addico.nl/vrijblijvende-aanvraag/

CONTACT:
https://addico.nl/contact/

WHATSAPP:
https://wa.me/31853037186

TELEFOON:
085 303 7186

E-MAIL:
info@addico.nl

KOSTEN:
https://addico.nl/kosten/

BELANGRIJKE PAGINA'S:

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

KOSTEN:

Standaard BKR-traject:
- €299,99 opstartkosten
- €550,01 bij succes

EVR/IVR:
- €399 vooraf
- €550 bij succes

Verjaring:
- vanaf €499 + 10%

Finale kwijting:
- 15% van bespaarde bedrag

KORTE KENNIS:

BKR:
BKR registreert kredieten en betalingsachterstanden van consumenten in Nederland.

A-codering:
Betalingsachterstand.

H-codering:
Achterstand hersteld.

Code 1:
Betalingsregeling.

Code 2:
Opeising van volledige vordering.

EVR:
EVR staat voor Extern Verwijzingsregister. Dit register wordt gebruikt door financiële instellingen bij vermoedens van fraude of integriteitsproblemen.

IVR:
IVR staat voor Intern Verwijzingsregister. Dit is een intern register van financiële instellingen.

Verjaring:
Sommige vorderingen kunnen verjaren afhankelijk van onder andere leeftijd van de schuld en stuitingshandelingen.

Finale kwijting:
Afspraak waarbij na betaling geen verdere vordering meer openstaat.

ALS IEMAND VRAAGT WAT ADDICO DOET:
Leg kort uit dat Addico helpt bij het beoordelen en mogelijk verwijderen of aanpassen van BKR-, EVR- en IVR-registraties en ondersteuning biedt bij verjaring en finale kwijting.

ALS IEMAND VRAAGT OF ADDICO KAN HELPEN:
Zeg dat Addico de situatie vrijblijvend kan beoordelen.

ALS IEMAND VRAAGT NAAR CONTACT:
Geef telefoonnummer, e-mailadres of WhatsApp.

ALS IEMAND IETS VRAAGT BUITEN ADDICO, BKR, EVR, IVR, VERJARING OF FINALE KWIJTING:
Zeg vriendelijk dat u vooral kunt helpen met vragen over kredietregistraties en de dienstverlening van Addico.

Sluit antwoorden natuurlijk af.
Gebruik niet steeds dezelfde afsluiting.
`;

    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4.1-mini",
          temperature: 0.4,
          max_tokens: 220,
          messages: [
            {
              role: "system",
              content: systemPrompt
            },
            {
              role: "user",
              content: message
            }
          ]
        })
      }
    );

    const data = await response.json();

    console.log(
      "OPENAI RESPONSE:",
      JSON.stringify(data, null, 2)
    );

    if (!response.ok) {
      console.error("OPENAI ERROR:", data);

      return res.status(200).json({
        reply:
          "Ik kan uw vraag momenteel niet goed verwerken. Probeert u het gerust nog eens."
      });
    }

    const reply =
      data?.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      return res.status(200).json({
        reply:
          "Kunt u uw vraag iets anders formuleren?"
      });
    }

    return res.status(200).json({
      reply
    });

  } catch (error) {
    console.error("SERVER ERROR:", error);

    return res.status(500).json({
      reply:
        "Er ging iets mis. Neem gerust contact op via info@addico.nl of 085 303 7186."
    });
  }
}
