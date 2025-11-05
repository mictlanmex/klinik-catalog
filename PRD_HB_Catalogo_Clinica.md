# 🧾 Product Requirements Document (PRD)
## Proyecto: Catálogo Clínico Interactivo Haut Boutique
**Versión:** 1.1  
**Fecha:** 04 de Noviembre de 2025  
**Responsable:** Christian Alan López Gehrke  
**Colaboradores técnicos:** Cline (troubleshooting y configuración de despliegue)

---

## 🧩 1. Contexto y Antecedentes
Una de las sucursales de Haut Boutique se encuentra dentro de una clínica dermatológica. El personal médico prescribe productos que no siempre están disponibles en esa ubicación. Este proyecto resuelve ese problema mediante una herramienta web para consultar en tiempo real la disponibilidad de productos.

---

## 🎯 2. Objetivos
### 2.1 Objetivo general
Construir un catálogo web filtrable con información actualizada de inventario proveniente directamente de Shopify.

### 2.2 Objetivos específicos
- Mostrar disponibilidad en tiempo real usando la API GraphQL de Shopify.
- Filtrar por vendor y tags.
- Mostrar solo productos con stock disponible en una ubicación específica.
- Destacar visualmente productos con el tag `topdoctores`.
- **(Revertido)** Controlar acceso a través de Microsoft 365 / Azure.

---

## 🏗️ 3. Alcance de la versión actual (1.1)
Incluye:
- Backend en Azure Function App con endpoints `/api/products` y `/api/health`.
- Frontend con Vite + React desplegado en Azure Static Web Apps.
- Despliegue automatizado con GitHub Actions para frontend y backend.
- Filtros por texto, marca y tags.
- Badge visual para `topdoctores`.
- CORS habilitado para la URL de producción del frontend.

No incluye:
- Autenticación con Microsoft 365 (revertido por complejidad técnica).
- Cambio dinámico de ubicación.
- Branding Haut Boutique.
- Métricas ni analítica.

---

## ⚙️ 4. Arquitectura técnica
**Frontend:** React + Vite  
**Backend/API:** Azure Function App (Node.js 20, v4 model)  
**Fuente de datos:** Shopify GraphQL API  
**Hosting:** Azure Static Web App (UI) y Azure Function App (API)  
**CI/CD:** GitHub Actions

---

## 🧱 5. Infraestructura Azure
| Elemento | Nombre | Estado |
|-----------|---------|--------|
| Resource Group | hb-catalogo-rg | ✅ |
| Storage Account | hbcatalogstor7856 | ✅ |
| Function App | hb-catalog-api-7856 | ✅ |
| Static Web App | hb-catalog-ui-7856 | ✅ |
| Application Insights | hb-catalog-api-7856 | ✅ |

Variables de entorno (Function App):
```
SHOPIFY_SHOP=haut-boutique-6907.myshopify.com
SHOPIFY_TOKEN=shpat_xxxxxxxxxxxxxxxxxxxxxxx
CLINIC_LOCATION_ID=gid://shopify/Location/78561935661
FEATURE_TOPDOCTORS_TAG=topdoctores
```

Variables de entorno (GitHub Actions para SWA):
```
VITE_API_BASE=https://hb-catalog-api-7856.azurewebsites.net
```

---

## 💻 6. Estructura del código
### Backend (Azure Function App)
- `index.js` → Punto de entrada que carga las funciones.
- `products.js` → Lógica para `/api/products`.
- `health.js` → Lógica para `/api/health`.

### Frontend (React + Vite)
- `index.html`, `src/main.jsx`, `src/App.jsx`
- La URL del API se inyecta en tiempo de build a través de la variable `VITE_API_BASE`.

---

## 🚀 7. Despliegue (CI/CD)
El proyecto utiliza dos workflows de GitHub Actions:
1.  **`deploy-function.yml`:** Despliega el backend.
    *   Corre en un agente de `windows-latest` para asegurar compatibilidad.
    *   Instala dependencias de producción (`npm install --production`).
    *   Despliega el paquete completo, incluyendo `node_modules`.
2.  **`deploy-swa.yml`:** Despliega el frontend.
    *   Inyecta la URL del API de producción en la variable de entorno `VITE_API_BASE` durante el build.
    *   Despliega a Azure Static Web Apps.

---

## 🔐 8. Seguridad (Revertido)
Se intentó implementar autenticación con Azure AD para restringir el acceso a usuarios de la organización. Este esfuerzo fue revertido debido a persistentes errores 401 y 403 que no pudieron ser resueltos a pesar de una configuración exhaustiva.

**Resumen de los intentos de autenticación:**
- Se configuró AAD en la Function App y la Static Web App.
- Se intentaron arquitecturas de 1 y 2 App Registrations.
- Se configuraron scopes de API, permisos, audiencias, issuers y redirect URIs.
- Se investigó el sistema de roles de la SWA, identificando un conflicto con el proveedor de identidad de GitHub.
- A pesar de resolver múltiples problemas de configuración, la conexión segura entre el frontend y el backend nunca se logró establecer con éxito.

**Estado actual:** La aplicación es pública. Para retomar la securización, se recomienda empezar desde cero con un nuevo plan, posiblemente consultando a soporte de Azure, ya que la configuración parecía correcta.

---

## 🧭 9. Próximos pasos
1. Aplicar branding final.
2. Añadir dashboard Power BI.
3. **(Re-evaluar)** Integrar autenticación M365.

---

## 📚 10. Referencias
- [Shopify GraphQL Admin API](https://shopify.dev/docs/api/admin-graphql)
- [Azure Functions Node.js v4 model](https://learn.microsoft.com/azure/azure-functions/functions-reference-node)
- [Azure Static Web Apps](https://learn.microsoft.com/azure/static-web-apps/)
