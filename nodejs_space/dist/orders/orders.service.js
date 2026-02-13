"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var OrdersService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrdersService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
let OrdersService = OrdersService_1 = class OrdersService {
    logger = new common_1.Logger(OrdersService_1.name);
    async create(userId, createOrderDto) {
        try {
            const inventoryItemIds = createOrderDto.items.map(item => item.inventoryItemId);
            const inventoryItems = await prisma.inventoryitem.findMany({
                where: { id: { in: inventoryItemIds } },
            });
            if (inventoryItems.length !== inventoryItemIds.length) {
                throw new common_1.BadRequestException('One or more inventory items not found');
            }
            const itemMap = new Map(inventoryItems.map(item => [item.id, item]));
            for (const orderItem of createOrderDto.items) {
                if (orderItem.quantity < 1) {
                    throw new common_1.BadRequestException('Quantity must be at least 1');
                }
            }
            const order = await prisma.order.create({
                data: {
                    userId,
                    status: 'pending',
                    items: {
                        create: createOrderDto.items.map(item => ({
                            inventoryItemId: item.inventoryItemId,
                            itemName: itemMap.get(item.inventoryItemId).name,
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
        }
        catch (error) {
            this.logger.error(`Error creating order: ${error.message}`);
            throw error;
        }
    }
    async findMyOrders(userId) {
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
        }
        catch (error) {
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
        }
        catch (error) {
            this.logger.error(`Error fetching pending orders: ${error.message}`);
            throw error;
        }
    }
    async approveOrder(id) {
        try {
            const existingOrder = await prisma.order.findUnique({
                where: { id },
                include: { items: true },
            });
            if (!existingOrder) {
                throw new common_1.NotFoundException(`Order with ID ${id} not found`);
            }
            if (existingOrder.status === 'approved') {
                throw new common_1.BadRequestException('Order is already approved');
            }
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
        }
        catch (error) {
            this.logger.error(`Error approving order: ${error.message}`);
            throw error;
        }
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = OrdersService_1 = __decorate([
    (0, common_1.Injectable)()
], OrdersService);
//# sourceMappingURL=orders.service.js.map