import { Injectable, NotFoundException } from '@nestjs/common';
import { NodeRouterService } from '../database/node-router.service';

@Injectable()
export class TransactionsService {
  constructor(private readonly nodeRouter: NodeRouterService) {}

  async getByAccount(customerId: number, accountId: number) {
    const prisma = this.nodeRouter.getPrismaForCustomer(customerId);

    const transactions = await prisma.transactions.findMany({
      where: {
        OR: [
          { from_account_id: accountId },
          { to_account_id: accountId },
        ],
      },
      include: {
        from_account: { select: { account_number: true } },
        to_account: { select: { account_number: true } },
      },
      orderBy: { initiated_at: 'desc' },
    });

    return transactions.map((t) => {
      const isOrigin = Number(t.from_account_id) === accountId;
      return {
        id: Number(t.id),
        transaction_uuid: t.transaction_uuid,
        from_account_id: Number(t.from_account_id),
        to_account_id: Number(t.to_account_id),
        amount: Number(t.amount),
        transaction_type: t.transaction_type,
        status: t.status,
        description: null,
        card_id: t.card_id ? Number(t.card_id) : null,
        initiated_at: t.initiated_at.toISOString(),
        completed_at: t.completed_at?.toISOString() ?? null,
        rol_cuenta: isOrigin ? 'ORIGEN' : 'DESTINO',
        counterpart_account: isOrigin
          ? t.to_account.account_number
          : t.from_account.account_number,
      };
    });
  }

  async getDetail(customerId: number, uuid: string) {
    const prisma = this.nodeRouter.getPrismaForCustomer(customerId);

    const tx = await prisma.transactions.findUnique({
      where: { transaction_uuid: uuid },
      include: {
        from_account: { select: { account_number: true, account_type: true } },
        to_account: { select: { account_number: true, account_type: true } },
        card: { select: { card_number: true } },
        transaction_log: {
          orderBy: { created_at: 'asc' },
          select: { id: true, event_type: true, created_at: true, details: true },
        },
      },
    });

    if (!tx) {
      throw new NotFoundException('Transacción no encontrada');
    }

    const isOrigin = true;

    return {
      transaction: {
        id: Number(tx.id),
        transaction_uuid: tx.transaction_uuid,
        from_account_id: Number(tx.from_account_id),
        to_account_id: Number(tx.to_account_id),
        amount: Number(tx.amount),
        transaction_type: tx.transaction_type,
        status: tx.status,
        description: null,
        card_id: tx.card_id ? Number(tx.card_id) : null,
        initiated_at: tx.initiated_at.toISOString(),
        completed_at: tx.completed_at?.toISOString() ?? null,
        rol_cuenta: isOrigin ? 'ORIGEN' : 'DESTINO',
        counterpart_account: tx.to_account.account_number,
      },
      from_account: {
        account_number: tx.from_account.account_number,
        account_type: tx.from_account.account_type,
      },
      to_account: {
        account_number: tx.to_account.account_number,
        account_type: tx.to_account.account_type,
      },
      card: tx.card ? { card_number: tx.card.card_number } : null,
      log_events: tx.transaction_log.map((log) => ({
        id: Number(log.id),
        event_type: log.event_type,
        occurred_at: log.created_at.toISOString(),
        node_id: (log.details as any)?.node_id ?? 'nodo-a',
      })),
    };
  }
}
