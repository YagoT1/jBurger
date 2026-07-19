# Troubleshooting

## Node no puede conectar a Supabase: `UNABLE_TO_VERIFY_LEAF_SIGNATURE`

**Síntoma.** Cualquier `fetch` desde Node hacia `*.supabase.co` falla con `TypeError: fetch failed` y causa `UNABLE_TO_VERIFY_LEAF_SIGNATURE`, mientras el mismo dominio funciona en el navegador. Puede alternar con `getaddrinfo ENOTFOUND` según el estado del filtro local.

**Causa raíz.** Un interceptor TLS local (antivirus con inspección HTTPS, proxy o filtro de red) re-firma los certificados de dominios inspeccionados. Su CA raíz está instalada en el almacén de certificados de Windows (los navegadores la aceptan), pero Node usa por defecto el bundle de CAs de Mozilla, donde esa CA no existe.

**Diagnóstico.**

1. Reproducir fuera del proyecto: `node -e "fetch('https://<proyecto>.supabase.co/rest/v1/').then(r => console.log(r.status)).catch(console.error)"`. Si falla igual, el proyecto queda descartado como causa.
2. Inspeccionar la cadena que llega realmente a la máquina (ver script en el historial del incidente): si el `issuer` es el antivirus/proxy, la interceptación queda confirmada.
3. Verificar el endpoint desde una red independiente (otro equipo/red móvil) para descartar al servidor.

**Resolución (sin deshabilitar validación TLS).**

- Recomendado: `NODE_OPTIONS=--use-system-ca` (Node ≥ 22.15). Agrega el almacén del sistema operativo como fuente de confianza adicional. Persistente por usuario: `[Environment]::SetEnvironmentVariable('NODE_OPTIONS','--use-system-ca','User')`.
- Alternativa: excluir `*.supabase.co` de la inspección HTTPS del antivirus/proxy.
- Alternativa: exportar la CA del interceptor a PEM y usar `NODE_EXTRA_CA_CERTS=<ruta>`.

**Prohibido:** `NODE_TLS_REJECT_UNAUTHORIZED=0` o cualquier deshabilitación de la validación TLS.

**Registro.** Incidente ocurrido durante el Acceptance Test del módulo Catalog (2026-07-16/17), cerrado con `--use-system-ca` y sin cambios en el código del proyecto. Ver ADR-020.
