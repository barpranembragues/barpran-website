# Catálogo de Mercado Libre en BARPRAN

## Estado de la entrega

Código preparado. La activación requiere las credenciales de una aplicación de Mercado Libre, autorización del vendedor y un almacenamiento Redis REST privado. Hasta configurar el entorno, `/tienda` conserva su portal Payway y no muestra un catálogo vacío. No se incluye ninguna publicación, precio o credencial inventada.

## Configuración del alojamiento

Funciona con el servidor Next.js existente, tanto en Netlify como en Vercel. No necesita nuevas dependencias. Configurar estas variables privadas en el alojamiento, nunca con prefijo `NEXT_PUBLIC_`, nunca en GitHub:

| Variable | Contenido |
| --- | --- |
| `ML_APP_ID` | ID de la aplicación de Mercado Libre |
| `ML_APP_SECRET` | Secreto de esa aplicación |
| `ML_SELLER_ID` | ID numérico del vendedor BARPRAN; bloquea la conexión de otra cuenta |
| `ML_SITE_ORIGIN` | `https://barpran.com.ar`, dominio canónico observado en producción |
| `ML_ADMIN_SECRET` | Clave aleatoria privada de al menos 32 caracteres para conectar la cuenta y cifrar los tokens |
| `UPSTASH_REDIS_REST_URL` | URL HTTPS de una base Redis REST privada |
| `UPSTASH_REDIS_REST_TOKEN` | Token privado de lectura/escritura de esa base |

Usar una base Redis que conserve datos; no archivos temporales de funciones serverless. Verificar plan/costos antes de contratar infraestructura. Los tokens OAuth se guardan cifrados con AES-256-GCM. Rotar `ML_ADMIN_SECRET` requiere reconectar la cuenta, porque también cambia la clave de cifrado.

## Aplicación de Mercado Libre

Crear o reutilizar una aplicación de BARPRAN con acceso de lectura a publicaciones y precios. No se usan recursos de órdenes, compradores, mensajes ni escritura de publicaciones.

- Redirect URI exacto: `https://barpran.com.ar/api/mercadolibre/callback`.
- URL de notificaciones: `https://barpran.com.ar/api/mercadolibre/notificaciones`.
- Tópicos: `items` e `items_prices`. Seleccionar los equivalentes en DevCenter si su UI organiza permisos por entidades.
- Publicar el código y variables en el entorno de producción.
- Abrir `/tienda/conectar-mercadolibre` en el dominio canónico; ingresar la clave privada de la integración. La contraseña de Mercado Libre se ingresa solamente en Mercado Libre.
- Autorizar el vendedor cuyo ID coincide con `ML_SELLER_ID`.
- Abrir `/tienda` y verificar el total de publicaciones activas con la cuenta de vendedor.

Los permisos concretos ofrecidos por DevCenter deben revisarse antes de aceptar; usar los mínimos disponibles. No entregar contraseñas, códigos OAuth ni secretos por chat.

## Actualizaciones

1. Mercado Libre avisa de altas, bajas, pausas, cambios de producto y precio. El endpoint guarda una revisión pendiente antes de responder 200. Si falla el almacenamiento, devuelve 503 para solicitar reintento.
2. La siguiente lectura del catálogo detecta esa revisión, vuelve a consultar las publicaciones activas y el precio de venta de cada una, y reemplaza el catálogo completo de forma atómica. Se consulta `sale_price` con el contexto `channel_marketplace` para incluir el precio promocional cuando corresponda.
3. Una página visible consulta cada 60 segundos y también al volver a la pestaña. Los visitantes nuevos hacen la misma lectura al abrir la tienda.
4. Cada cinco minutos de antigüedad, una lectura fuerza una auditoría completa aunque no haya notificaciones. Esto recupera cambios si se pierde un aviso. No se necesita un proceso corriendo cuando no hay visitantes; la próxima visita actualiza el catálogo.
5. Ráfagas de notificaciones disparan como máximo una reconstrucción cada diez segundos. Una notificación que llega durante una reconstrucción sigue pendiente, porque la revisión guardada corresponde al inicio del proceso.

No se promete sincronización instantánea: normalmente el cambio aparece en la próxima consulta de la página (hasta aproximadamente un minuto más el tiempo de importación). Sin notificaciones, la recuperación depende de la próxima lectura después de cinco minutos. La publicación de Mercado Libre confirma siempre el precio y condiciones finales.

## Resiliencia y seguridad

- Renovación automática de OAuth con almacenamiento persistente y bloqueo distribuido para proteger el refresh token de un solo uso.
- Callback con estado de un solo uso y cookie HttpOnly/Secure/SameSite; se comprueba el vendedor antes de guardar tokens.
- Las notificaciones no prueban por sí mismas identidad de origen. Se validan vendedor, aplicación, tópico y formato de recurso; solo sirven como señal para volver a leer la API autorizada. Nunca se usan precios del mensaje ni se consulta una URL enviada por el webhook.
- Un bloqueo evita reconstrucciones concurrentes. Las escrituras comprueban que su propietario aún conserve el bloqueo. Si caduca, una ejecución vieja no puede sobrescribir el catálogo.
- Se usa paginación scan para obtener todas las publicaciones activas. Una importación incompleta o fallida nunca se publica como si estuviera completa.
- Un visitante concurrente puede recibir el último catálogo mientras otro lo refresca, hasta un máximo de diez minutos de antigüedad. Los errores de verificación ocultan los productos en esa lectura y muestran acceso a la tienda oficial.
- Se mantienen fotos sin recortes deformantes, precios argentinos, condición, SKU cuando existe y envío gratis solo si la publicación lo indica. No se inventan cuotas ni plazos de entrega.
- Las publicaciones de servicios también se incluyen si están activas; antes de comprar, se deben respetar las instrucciones de su publicación en Mercado Libre.
- Los cambios de un usuario/token revocado pueden requerir reconectar en el panel de administración.
- No se muestra el panel de conexión en la navegación pública y su metadata solicita no indexarlo.

## Verificación para activar

- Validar foto, título, precio normal/promocional y enlace en al menos tres publicaciones reales.
- Confirmar que una pausa desaparece y una nueva publicación se incorpora.
- Modificar un precio desde Mercado Libre y comprobar su actualización con una pestaña abierta y otra nueva.
- Renovar un token y comprobar que persiste el nuevo refresh token sin exponerlo.
- Confirmar que datos falsos del webhook nunca alteran precios y que un fallo de Redis devuelve 503.
- Probar móvil, búsqueda, ordenamiento y conservación del formulario Payway.

La prueba real de cuenta, publicaciones y cambios queda pendiente hasta disponer de autorización y configuración del alojamiento.

## Fuentes de integración

- https://developers.mercadolibre.com.ar/es_ar/items-y-busquedas
- https://developers.mercadolibre.com.ar/autenticacion-y-autorizacion
- https://developers.mercadolibre.com.ar/es_ar/productos-recibe-notificaciones/
- https://developers.mercadolibre.com.ar/es_ar/guia-para-producto/api-de-precios
- https://upstash.com/docs/redis/features/restapi
