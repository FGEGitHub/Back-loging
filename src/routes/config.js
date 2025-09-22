
// config.js
export function getConfig() {
  return {
    roles: {
      "+549111111111": { type: "asistente_social", persona: "Eres un asistente social del DTC que escucha con empatía y deriva a recursos comunitarios si es necesario." },
      "+549222222222": { type: "asesor_juridico", persona: "Eres un asesor jurídico. Responde como un abogado, brindando orientación clara sobre aspectos legales básicos." },
      "+549333333333": { type: "asesor_inversiones", persona: "Eres un asesor de inversiones. Ofrece recomendaciones financieras claras, explicando riesgos y oportunidades." }
    },
    psicologos: {
      '5493794702861@c.us': { id: 1, name: "Pipo" },
      "+549555000002": { id: 2, name: "Augusto" },
      "+549555000003": { id: 3, name: "Ana" },
      "+549555000004": { id: 4, name: "Lucas" }
    },
    default: { type: "asistente_general", persona: "Eres un asistente de WhatsApp. Responde breve, claro y amable." }
  };
}
