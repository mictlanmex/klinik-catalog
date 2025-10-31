# 🧾 Product Requirements Document (PRD)
## Proyecto: Catálogo Clínico Interactivo Haut Boutique
**Versión:** 1.0  
**Fecha:** 27 de octubre de 2025  
**Responsable:** Christian Alan López Gehrke  
**Colaboradores técnicos:** ChatGPT (co-desarrollo técnico)

---

## 🧩 1. Contexto y Antecedentes
Una de las sucursales de Haut Boutique se encuentra dentro de una clínica dermatológica.  
El personal médico y los doctores prescriben productos dermocosméticos y tratamientos capilares que deben recomendarse directamente a los pacientes.  
Actualmente existe un problema operativo: los doctores recomiendan productos que no siempre están disponibles en esa ubicación.

Este proyecto nace para resolver eso, mediante una herramienta web que:

- Permita consultar en tiempo real la disponibilidad de productos en una sucursal específica (la clínica).  
- Muestre los productos filtrables por marca (vendor) y problema dermatológico (acné, rosácea, resequedad, arrugas, prurito, etc.).  
- Destaque visualmente los productos marcados con el tag `topdoctores`, que son los más recomendados.

---

## 🎯 2. Objetivos
### 2.1 Objetivo general
Construir un catálogo web filtrable con información actualizada de inventario proveniente directamente de Shopify.

### 2.2 Objetivos específicos
- Mostrar disponibilidad en tiempo real usando la API GraphQL de Shopify.
- Filtrar por vendor y tags.
- Mostrar solo productos con stock disponible en una ubicación específica.
- Destacar visualmente productos con el tag `topdoctores`.
- Permitir cambiar ubicación (futuro).
- Controlar acceso a través de Microsoft 365 / Azure.

---

## 🏗️ 3. Alcance de la versión actual (MVP)
Incluye:
- Backend en Azure Function App con endpoint `/api/products`.
- Integración con Shopify GraphQL API.
- Frontend con Vite + React.
- Filtros por texto, marca y tags.
- Badge visual para `topdoctores`.
- CORS habilitado para `localhost:5173`.

No incluye:
- Cambio dinámico de ubicación.
- Autenticación Microsoft 365.
- Branding Haut Boutique.
- Métricas ni analítica.

---

## ⚙️ 4. Arquitectura técnica
**Frontend:** React + Vite  
**Backend/API:** Azure Function App (Node.js 20)  
**Fuente de datos:** Shopify GraphQL API  
**Hosting:** Azure Function App + Static Web App (futuro)  
**Autenticación (futura):** Microsoft Entra ID

---

## 🧱 5. Infraestructura Azure
| Elemento | Nombre | Estado |
|-----------|---------|--------|
| Resource Group | hb-catalogo-rg | ✅ |
| Storage Account | hbcatalogstor7856 | ✅ |
| Function App | hb-catalog-api-7856 | ✅ |
| Application Insights | hb-catalog-api-7856 | ✅ |
| CORS | http://localhost:5173 | ✅ |

Variables de entorno:
```
SHOPIFY_SHOP=haut-boutique-6907.myshopify.com
SHOPIFY_TOKEN=shpat_xxxxxxxxxxxxxxxxxxxxxxx
CLINIC_LOCATION_ID=gid://shopify/Location/78561935661
FEATURE_TOPDOCTORS_TAG=topdoctores
```

---

## 💻 6. Estructura del código
### Backend (Azure Function App)
- `src/products.js` → `/api/products`
- `src/health.js` → `/api/health`
- Consulta GraphQL optimizada para inventario y tags.

### Frontend (React + Vite)
- `index.html`, `src/main.jsx`, `src/App.jsx`, `src/index.css`
- `.env` → `VITE_API_BASE=http://localhost:7071`
- Diseño responsive con tema claro.
- Filtrado y paginación.

---

## 🎨 7. Diseño visual
Tema claro y profesional.
Colores:
- Fondo: #fff
- Tarjeta: #fafafa
- Texto: #111
- Acento: #1693D2 (azul Haut)

---

## 🔐 8. Seguridad (Planeado)
- Integrar autenticación Microsoft Entra ID.
- Permitir acceso solo a personal autorizado.
- Restringir por IP o dominio si es necesario.

---

## 🚀 9. Plan de desarrollo
| Fase | Objetivo | Estado |
|------|-----------|--------|
| MVP | Catálogo en tiempo real | ✅ |
| 2 | Autenticación + despliegue interno | ⏳ |
| 3 | Cambio dinámico de ubicación | ⏳ |
| 4 | Branding final | ⏳ |
| 5 | Dashboard Power BI | ⏳ |

---

## 🧰 10. Dependencias
| Componente | Versión |
|-------------|----------|
| Node.js | 20.x |
| Vite | 7.x |
| React | 18.x |
| Azure CLI | ≥2.64 |
| Shopify GraphQL API | 2024-07 |

---

## 🧾 11. Notas
- Los problemas se leen de los `tags` de Shopify.
- Los vendors provienen de `product.vendor`.
- Shopify es la única fuente de verdad.
- `availableQuantity > 0` define disponibilidad.

---

## 📦 12. Entornos
| Entorno | URL | Estado |
|----------|-----|--------|
| Local | http://127.0.0.1:5173 | ✅ |
| Backend Prod | https://hb-catalog-api-7856.azurewebsites.net | ✅ |
| Frontend Prod | (planeado) https://catalogo.haut.mx | ⏳ |

---

## 🧭 13. Próximos pasos
1. Publicar frontend en Azure Static Web Apps.
2. Integrar autenticación M365.
3. Aplicar branding final.
4. Añadir dashboard Power BI.

---

## 📚 14. Referencias
- [Shopify GraphQL Admin API](https://shopify.dev/docs/api/admin-graphql)
- [Azure Functions Node.js](https://learn.microsoft.com/azure/azure-functions/functions-reference-node)
- [Vite](https://vitejs.dev/)
- [React](https://react.dev/)
