type PixPayloadInput = {
  pixKey: string;
  merchantName: string;
  merchantCity?: string;
  amountCents: number;
  txid: string;
};

function removeDiacritics(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function sanitizeText(value: string, maxLength: number) {
  return removeDiacritics(value)
    .replace(/[^\w\s.,:;@+\-/]/g, "")
    .trim()
    .slice(0, maxLength)
    .toUpperCase();
}

function sanitizeTxid(value: string) {
  return removeDiacritics(value)
    .replace(/[^A-Za-z0-9]/g, "")
    .slice(0, 25)
    .toUpperCase() || "EVERAFTER";
}

function emvField(id: string, value: string) {
  const length = String(value.length).padStart(2, "0");
  return `${id}${length}${value}`;
}

function crc16(payload: string) {
  let crc = 0xffff;

  for (let index = 0; index < payload.length; index += 1) {
    crc ^= payload.charCodeAt(index) << 8;

    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export function buildPixPayload({
  pixKey,
  merchantName,
  merchantCity = "SAO PAULO",
  amountCents,
  txid
}: PixPayloadInput) {
  const amount = (amountCents / 100).toFixed(2);
  const merchantAccountInfo = [
    emvField("00", "BR.GOV.BCB.PIX"),
    emvField("01", pixKey.trim())
  ].join("");
  const additionalData = emvField("05", sanitizeTxid(txid));
  const payloadWithoutCrc = [
    emvField("00", "01"),
    emvField("26", merchantAccountInfo),
    emvField("52", "0000"),
    emvField("53", "986"),
    emvField("54", amount),
    emvField("58", "BR"),
    emvField("59", sanitizeText(merchantName, 25) || "EVERAFTER"),
    emvField("60", sanitizeText(merchantCity, 15) || "SAO PAULO"),
    emvField("62", additionalData),
    "6304"
  ].join("");

  return `${payloadWithoutCrc}${crc16(payloadWithoutCrc)}`;
}
