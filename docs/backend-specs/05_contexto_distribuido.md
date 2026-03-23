# Contexto Distribuido — Implicaciones para los Endpoints

## Distribución de nodos

| Nodo | Infraestructura | Criterio | SGBD |
|---|---|---|---|
| Nodo A | Laptop / VM | `customer_id % 3 = 0` | PostgreSQL 16 |
| Nodo B | Laptop / VM | `customer_id % 3 = 1` | PostgreSQL 16 |
| Nodo C | Supabase | `customer_id % 3 = 2` | PostgreSQL (Supabase) |

Cada nodo ejecuta el mismo DDL (`00_ddl_base.sql`) y almacena solo los datos de sus clientes propietarios.

**Cliente de demo (Natalia, id=27):** `27 % 3 = 0` → **Nodo A**.

---

## Tablas por nodo

Las 6 tablas se replican en estructura en cada nodo, pero solo con los datos del fragmento:

1. `customers`
2. `customer_accounts`
3. `accounts`
4. `cards`
5. `transactions`
6. `transaction_log`

---

## Impacto en los endpoints del frontend

### Endpoints de lectura (queries locales al nodo)

Estos endpoints consultan **solo el nodo propietario** del cliente autenticado:

| Endpoint | Nodo consultado |
|---|---|
| GET /customers/:id/profile | Nodo del cliente (determinado por `customer_id % 3`) |
| GET /customers/:id/cards | Mismo nodo |
| GET /accounts/:id/transactions | Mismo nodo |
| GET /transactions/:uuid | Nodo del cliente (puede requerir JOIN cross-nodo para log events) |

El backend NestJS actúa como **router**: al recibir una request, determina el nodo propietario y ejecuta la query ahí.

### Endpoints de escritura (potencialmente cross-nodo)

| Endpoint | Escenario intra-nodo | Escenario cross-nodo |
|---|---|---|
| PATCH /cards/:id/toggle | UPDATE local | Siempre local (tarjeta pertenece al cliente) |
| POST /transfers | Ambas cuentas en el mismo nodo → transacción local | Cuentas en nodos distintos → SAGA |

### Transferencia cross-nodo — flujo SAGA

```
Frontend                    Backend (coordinador)           Nodo A          Nodo B
   │                              │                          │                │
   ├─ POST /transfers ──────────▶ │                          │                │
   │                              ├── INITIATED ───────────▶ │                │
   │                              ├── DEBIT_APPLIED ───────▶ │                │
   │                              ├── CREDIT_APPLIED ──────────────────────▶ │
   │                              ├── COMPLETED ──────────▶  │                │
   │  ◀── { status: COMPLETED } ──┤                          │                │
```

Si falla en Nodo B:
```
   │                              ├── FAILED ──────────────────────────────▶ │
   │                              ├── COMPENSATED ─────────▶ │                │
   │  ◀── { status: ROLLED_BACK } ┤                          │                │
```

Si la respuesta cross-nodo tarda:
```
   │  ◀── { status: PENDING } ────┤  (respuesta inmediata)
   │                              │  ... procesamiento async ...
```

---

## Schema VIP — `distribank_vip_customers` en Nodo C

### Propósito
Réplica de datos de clientes VIP para failover y consultas agregadas.

### Criterio VIP
`SUM(week_transactions)` de todas las cuentas `ACTIVE` del cliente ≥ 3.

### Relevancia para el frontend
- El frontend usa `accounts.week_transactions` directamente (del nodo primario)
- NO consulta el schema VIP
- El badge VIP se calcula en el frontend: `week_transactions >= 3`
- El backend debe asegurar que `week_transactions` esté actualizado en el nodo primario

### Sincronización
- Frecuencia: cada 6-8 horas
- Clientes VIP replicados: sus 6 tablas se copian al schema `distribank_vip_customers`
- Si el nodo primario cae → failover lee del schema VIP en Nodo C

---

## FK inter-nodo

La FK `fk_transactions_to_account` (`to_account_id → accounts.id`) **debe eliminarse o deferirse** para transacciones cross-nodo, ya que la cuenta destino vive en otro nodo.

El DDL base incluye esta nota:
```sql
-- NOTA DISTRIBUIDA: La FK fk_transactions_to_account sobre to_account_id
-- se mantiene aquí porque los datos de seed son intra-nodo.
-- En producción, las transacciones cross-nodo requieren eliminar o
-- deferir esta FK, delegando la integridad referencial al coordinador
-- de transacciones distribuidas (2PC/SAGA).
```

---

## Determinación de nodo en el backend

El backend necesita una función routing:

```typescript
function getNodeForCustomer(customerId: number): 'nodo-a' | 'nodo-b' | 'nodo-c' {
  const mod = customerId % 3;
  if (mod === 0) return 'nodo-a';
  if (mod === 1) return 'nodo-b';
  return 'nodo-c';
}
```

Para transfers, también necesita resolver el nodo de la cuenta destino:
1. Buscar `to_account_number` en los 3 nodos (o tener un catálogo global de account_number → nodo)
2. Si `nodo_origen === nodo_destino` → transacción local
3. Si difieren → orquestar SAGA cross-nodo

---

## Conexiones de BD

El backend NestJS necesita **3 conexiones Prisma** (o 3 pools pg):

```typescript
// Ejemplo con pg pools
const pools = {
  'nodo-a': new Pool({ connectionString: process.env.NODE_A_URL }),
  'nodo-b': new Pool({ connectionString: process.env.NODE_B_URL }),
  'nodo-c': new Pool({ connectionString: process.env.NODE_C_URL }),
};
```

Para Prisma, se pueden usar múltiples instancias con diferentes `datasource url`.
