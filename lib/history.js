export function formatEntry(fields, values) {
  return fields.map(field => `${field.rotulo}:\n${values[field.id]}`).join("\n\n");
}

export function formatHistoryDate(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "Data indisponível";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}
