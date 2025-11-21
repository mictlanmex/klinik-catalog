# 🧾 Product Requirements Document (PRD)
## Proyecto: Catálogo Clínico Interactivo Haut Boutique
**Versión:** 2.0  
**Fecha:** 21 de Noviembre de 2025  
**Responsable:** Christian Alan López Gehrke  
**Colaboradores técnicos:** Cline (troubleshooting, configuración de despliegue, y optimizaciones)

---

## 🧩 1. Contexto y Antecedentes
Una de las sucursales de Haut Boutique se encuentra dentro de una clínica dermatológica. El personal médico prescribe productos que no siempre están disponibles en esa ubicación. Este proyecto resuelve ese problema mediante una herramienta web para consultar en tiempo real la disponibilidad de productos.

---

## 🎯 2. Objetivos
### 2.1 Objetivo general
Construir un catálogo web filtrable con información actualizada de inventario proveniente directamente de Shopify, con acceso controlado mediante Azure AD.

### 2.2 Objetivos específicos
- Mostrar disponibilidad en tiempo real usando la API GraphQL de Shopify.
- Filtrar por vendor, tags y texto con búsqueda flexible.
- Mostrar solo productos con stock disponible en una ubicación específica.
- Destacar visualmente productos con el tag `topdoctores`.
- **✅ IMPLEMENTADO:** Controlar acceso a través de Microsoft Entra ID (Azure AD).
- Priorizar productos "Top Doctores" en la vista inicial.
- Excluir automáticamente productos del proveedor PLV.
- Proporcionar búsqueda intuitiva con coincidencias parciales y sin acentos.

---

## 🏗️ 3. Alcance de la versión actual (2.0)

### ✅ Características implementadas:
- **Backend:** Azure Function App con endpoints `/api/products` y `/api/health`
- **Frontend:** React + Vite desplegado en Azure Static Web Apps
- **CI/CD:** Despliegue automatizado con GitHub Actions para frontend y backend
- **Autenticación:** Microsoft Entra ID (Azure AD) con MSAL.js
  - Login redirect flow
  - Token de acceso automático en llamadas API
  - Protección de endpoints con Azure AD
- **Búsqueda avanzada:**
  - Coincidencias parciales (ej: "acn" encuentra "acne")
  - Insensible a acentos ("acne" = "acné")
  - Búsqueda en título, vendor y tags
  - Multi-término con lógica AND
- **Filtros inteligentes:**
  - Exclusión automática de productos PLV
  - Vista inicial con productos "topdoctores"
  - 50 productos por página (optimizado)
- **UI/UX:**
  - Badge visual ⭐ para productos Top Doctores
  - Búsqueda en tiempo real con Enter
  - Paginación con botón "Cargar más"
  - Indicadores de stock disponible

### ❌ Fuera de alcance (v2.0):
- Cambio dinámico de ubicación
- Branding completo Haut Boutique
- Métricas y analítica avanzada
- Edición de inventario
- Carrito de compras

---

## ⚙️ 4. Arquitectura técnica
**Frontend:** React + Vite  
**Backend/API:** Azure Function App (Node.js 20, v4 model)  
**Fuente de datos:** Shopify GraphQL API  
**Hosting:** Azure Static Web App (UI) y Azure Function App (API)  
**CI/CD:** GitHub Actions

---

## 🧱 5. Infraestructura Azure

### 5.1 Recursos principales
| Elemento | Nombre | Estado |
|-----------|---------|--------|
| Resource Group | hb-catalogo-rg | ✅ |
| Storage Account | hbcatalogstor7856 | ✅ |
| Function App | hb-catalog-api-7856 | ✅ |
| Static Web App | hb-catalog-ui-7856 | ✅ |
| Application Insights | hb-catalog-api-7856 | ✅ |
| App Registration (API) | HB Catalog API | ✅ |
| App Registration (SPA) | HB Catalog UI | ✅ |

### 5.2 Azure AD Configuration

**API App Registration (2b18b55b-cf19-41e3-ae23-c17aa8411e75):**
- **Exposed API:** `api://2b18b55b-cf19-41e3-ae23-c17aa8411e75`
- **Scope:** `access_as_user` (Admins and users)
- **Authorized client:** 763dfb3f-4c23-4b49-aa28-9cf7d78b6c4a (SPA)

**SPA App Registration (763dfb3f-4c23-4b49-aa28-9cf7d78b6c4a):**
- **Platform:** Single-page application
- **Redirect URIs:**
  - `http://localhost:5173` (desarrollo)
  - `https://{swa-url}.azurestaticapps.net` (producción)
- **API Permissions:** 
  - API de HB Catalog: `access_as_user` (delegated)
  - Microsoft Graph: `User.Read` (delegated)

**Function App Authentication:**
- **Identity Provider:** Microsoft
- **Require authentication:** Yes
- **Unauthenticated requests:** HTTP 401
- **Token store:** Enabled
- **Allowed token audiences:** `api://2b18b55b-cf19-41e3-ae23-c17aa8411e75`
- **Client application requirement:** Allow requests from specific client applications
  - Allowed client: `763dfb3f-4c23-4b49-aa28-9cf7d78b6c4a`

### 5.3 Variables de entorno

**Function App:**
```bash
SHOPIFY_SHOP=haut-boutique-6907.myshopify.com
SHOPIFY_TOKEN=shpat_xxxxxxxxxxxxxxxxxxxxxxx
CLINIC_LOCATION_ID=gid://shopify/Location/78561935661
FEATURE_TOPDOCTORS_TAG=topdoctores
```

**Frontend (GitHub Actions / .env):**
```bash
VITE_API_BASE=https://hb-catalog-api-7856.azurewebsites.net
VITE_AZURE_CLIENT_ID=763dfb3f-4c23-4b49-aa28-9cf7d78b6c4a
VITE_AZURE_TENANT_ID={tenant-id}
VITE_AZURE_API_SCOPE=api://2b18b55b-cf19-41e3-ae23-c17aa8411e75/access_as_user
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

## 🔐 8. Seguridad (✅ IMPLEMENTADO)

### 8.1 Autenticación con Microsoft Entra ID
La aplicación implementa autenticación completa mediante Azure AD (Microsoft Entra ID):

**Flujo de autenticación:**
1. Usuario accede a la aplicación
2. MSAL.js detecta ausencia de sesión activa
3. Redirect automático a login de Microsoft
4. Usuario ingresa credenciales corporativas
5. Azure AD valida y emite tokens
6. Redirect de vuelta a la aplicación
7. MSAL.js obtiene y almacena tokens en memoria
8. Todas las llamadas API incluyen token Bearer automáticamente

**Solución al error 403:**
El problema se resolvió configurando correctamente el "Client application requirement" en el Function App:
- Cambiar de "Allow requests from any application" a "Allow requests from specific client applications"
- Agregar el Application ID del SPA como cliente autorizado
- Esto establece confianza explícita entre el frontend y backend

### 8.2 Seguridad de tokens
- **Tokens en memoria:** No se almacenan en localStorage/sessionStorage
- **Refresh automático:** MSAL.js maneja renovación de tokens
- **Validación backend:** Function App valida tokens en cada request
- **Audience validation:** Tokens deben coincidir con API ID exacto

### 8.3 Control de acceso
- **Nivel organizacional:** Solo usuarios del tenant de Azure AD
- **Sin roles personalizados:** Todos los usuarios autenticados tienen acceso
- **Futuro:** Implementar roles de Azure AD para permisos granulares

---

## 🎨 9. Características destacadas (v2.0)

### 9.1 Búsqueda inteligente
**Problema resuelto:** Búsqueda rígida que requería ortografía exacta

**Solución implementada:**
- Normalización de texto (remove accents, lowercase)
- Coincidencias parciales en cualquier parte del texto
- Búsqueda multi-campo (título, vendor, tags)
- Sanitización de caracteres especiales

**Ejemplos de uso:**
```
"acn" → Encuentra: "Acne", "Acné", "Anti-acnéico"
"la roche" → Encuentra: "La Roche-Posay"
"vitamina c" → Debe tener ambos términos
```

### 9.2 Filtros automáticos
**PLV Provider Exclusion:**
- Productos del proveedor "PLV" se excluyen automáticamente
- Filtrado en backend para optimizar performance
- Insensible a mayúsculas y acentos

**Top Doctores Priority:**
- Vista inicial muestra solo productos "topdoctores"
- Badge visual ⭐ para identificación rápida
- Mantiene búsqueda normal después del primer filtro

### 9.3 Optimizaciones UX
**Paginación mejorada:**
- 50 productos por página (vs 20 original)
- 60% menos clicks para ver inventario completo
- Botón "Cargar más" solo cuando hay más resultados

**Búsqueda en tiempo real:**
- Enter key para buscar
- Indicador de carga visual
- Mensajes de error claros

---

## 🧭 10. Próximos pasos
1. **Corto plazo:**
   - Aplicar branding visual completo Haut Boutique
   - Agregar logo y colores corporativos
   - Mejorar diseño responsive mobile

2. **Mediano plazo:**
   - Dashboard Power BI integrado
   - Reportes de consultas frecuentes
   - Analítica de productos más buscados

3. **Largo plazo:**
   - Roles de usuario (Admin, Doctor, Vendedor)
   - Selector de ubicación dinámica
   - Notificaciones de stock bajo
   - Integración con sistema POS

---

## 📚 11. Referencias

### Documentación oficial
- [Shopify GraphQL Admin API](https://shopify.dev/docs/api/admin-graphql)
- [Azure Functions Node.js v4 model](https://learn.microsoft.com/azure/azure-functions/functions-reference-node)
- [Azure Static Web Apps](https://learn.microsoft.com/azure/static-web-apps/)
- [Microsoft Authentication Library (MSAL.js)](https://learn.microsoft.com/azure/active-directory/develop/msal-overview)
- [Microsoft Entra ID (Azure AD)](https://learn.microsoft.com/azure/active-directory/fundamentals/)

### Documentación del proyecto
- **PRD:** `PRD_HB_Catalogo_Clinica.md` - Product Requirements Document
- **Developer Guide:** `DEVELOPER_GUIDE.md` - Guía completa para desarrolladores
- **Environment Template:** `hb-catalog-ui/.env.example` - Plantilla de variables de entorno

### Recursos Azure
- **Portal:** https://portal.azure.com
- **Resource Group:** hb-catalogo-rg
- **Function App:** https://hb-catalog-api-7856.azurewebsites.net
- **Static Web App:** https://{swa-url}.azurestaticapps.net

### Repositorio
- **GitHub:** https://github.com/mictlanmex/klinik-catalog
- **Actions:** Workflows de CI/CD automatizados

### Shopify
- **Admin Panel:** https://haut-boutique-6907.myshopify.com/admin
- **GraphQL Explorer:** https://haut-boutique-6907.myshopify.com/admin/api/graphql.json
