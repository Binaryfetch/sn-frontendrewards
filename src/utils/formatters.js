export const formatNumber = (value = 0) =>
  Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });

export const buildCsvFile = (headers = [], values = {}, filename = "upload.csv") => {
  const headerLine = headers.join(",");
  const rowLine = headers
    .map((header) => {
      const raw = values[header] ?? "";
      const escaped = String(raw).replace(/"/g, '""');
      return `"${escaped}"`;
    })
    .join(",");

  const blob = new Blob([`${headerLine}\n${rowLine}`], { type: "text/csv" });
  return new File([blob], filename);
};

