import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreateOrderDto } from './dto/create-order.dto';

const prisma = new PrismaClient();

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  async create(userId: string, createOrderDto: CreateOrderDto) {
    try {
      // Validate all inventory items exist and get their names
      const inventoryItemIds = createOrderDto.items.map(item => item.inventoryItemId);
      const inventoryItems = await prisma.inventoryitem.findMany({
        where: { id: { in: inventoryItemIds } },
      });

      if (inventoryItems.length !== inventoryItemIds.length) {
        throw new BadRequestException('One or more inventory items not found');
      }

      // Create a map for quick lookup
      const itemMap = new Map(inventoryItems.map(item => [item.id, item]));

      // Validate quantities
      for (const orderItem of createOrderDto.items) {
        if (orderItem.quantity < 1) {
          throw new BadRequestException('Quantity must be at least 1');
        }
      }

      // Create order with items
      const order = await prisma.order.create({
        data: {
          userId,
          status: 'pending',
          items: {
            create: createOrderDto.items.map(item => ({
              inventoryItemId: item.inventoryItemId,
              itemName: itemMap.get(item.inventoryItemId)!.name,
              quantity: item.quantity,
            })),
          },
        },
        include: {
          items: true,
        },
      });

      this.logger.log(`Order created: ${order.id} by user ${userId}`);

      return {
        id: order.id,
        userId: order.userId,
        status: order.status,
        items: order.items.map(item => ({
          id: item.id,
          inventoryItemId: item.inventoryItemId,
          itemName: item.itemName,
          quantity: item.quantity,
        })),
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
      };
    } catch (error) {
      this.logger.error(`Error creating order: ${error.message}`);
      throw error;
    }
  }

  async findMyOrders(userId: string) {
    try {
      const orders = await prisma.order.findMany({
        where: { userId },
        include: {
          items: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return orders.map(order => ({
        id: order.id,
        userId: order.userId,
        status: order.status,
        items: order.items.map(item => ({
          id: item.id,
          inventoryItemId: item.inventoryItemId,
          itemName: item.itemName,
          quantity: item.quantity,
        })),
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
      }));
    } catch (error) {
      this.logger.error(`Error fetching user orders: ${error.message}`);
      throw error;
    }
  }

  async findPendingOrders() {
    try {
      const orders = await prisma.order.findMany({
        where: { status: 'pending' },
        include: {
          items: true,
          user: {
            select: { username: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return orders.map(order => ({
        id: order.id,
        userId: order.userId,
        username: order.user.username,
        status: order.status,
        items: order.items.map(item => ({
          id: item.id,
          inventoryItemId: item.inventoryItemId,
          itemName: item.itemName,
          quantity: item.quantity,
        })),
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
      }));
    } catch (error) {
      this.logger.error(`Error fetching pending orders: ${error.message}`);
      throw error;
    }
  }

  async approveOrder(id: string) {
    try {
      // Check if order exists
      const existingOrder = await prisma.order.findUnique({
        where: { id },
        include: { items: true },
      });

      if (!existingOrder) {
        throw new NotFoundException(`Order with ID ${id} not found`);
      }

      if (existingOrder.status === 'approved') {
        throw new BadRequestException('Order is already approved');
      }

      // Update order status
      const order = await prisma.order.update({
        where: { id },
        data: { status: 'approved' },
        include: { items: true },
      });

      this.logger.log(`Order approved: ${order.id}`);

      return {
        id: order.id,
        userId: order.userId,
        status: order.status,
        items: order.items.map(item => ({
          id: item.id,
          inventoryItemId: item.inventoryItemId,
          itemName: item.itemName,
          quantity: item.quantity,
        })),
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
      };
    } catch (error) {
      this.logger.error(`Error approving order: ${error.message}`);
      throw error;
    }
  }
}
